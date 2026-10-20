import { ECurrencyWallet, HDECurrencyWallet, WatchOnlyWallet } from '../../class';
import startImport from '../../class/wallet-import';

jest.mock('../../class', () => ({
  ECurrencyWallet: jest.fn(),
  HDECurrencyWallet: jest.fn(),
  WatchOnlyWallet: jest.fn(),
}));

jest.mock('../../loc', () => ({
  wallets: { import_passphrase_title: 'Passphrase', import_passphrase_message: 'Enter passphrase' },
}));

// These tests cover discovery orchestration; wallet classes own key validation.
const hdWallet = {
  getID: () => 'hd-wallet',
  setSecret: jest.fn(),
  setPassphrase: jest.fn(),
  validateMnemonic: jest.fn(),
  wasEverUsed: jest.fn(),
  fetchBalance: jest.fn(),
  fetchTransactions: jest.fn(),
};
const wifWallet = {
  getID: () => 'wif-wallet',
  setSecret: jest.fn(),
  getAddress: jest.fn(),
  fetchBalance: jest.fn(),
  fetchTransactions: jest.fn(),
};
const watchWallet = { setSecret: jest.fn(), valid: jest.fn() };

beforeEach(() => {
  jest.useFakeTimers();
  jest.resetAllMocks();
  jest.mocked(HDECurrencyWallet).mockImplementation(() => hdWallet as unknown as HDECurrencyWallet);
  jest.mocked(ECurrencyWallet).mockImplementation(() => wifWallet as unknown as ECurrencyWallet);
  jest.mocked(WatchOnlyWallet).mockImplementation(() => watchWallet as unknown as WatchOnlyWallet);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ECurrency import', () => {
  it.each([
    ['seed', false, 'pending'],
    ['seed', false, 'error'],
    ['seed', true, 'pending'],
    ['wif', false, 'pending'],
    ['wif', false, 'error'],
    ['wif', true, 'pending'],
  ] as const)('imports %s (offline=%s, network=%s) without waiting for Electrum', async (kind, offline, network) => {
    const wallet = kind === 'seed' ? hdWallet : wifWallet;
    hdWallet.validateMnemonic.mockReturnValue(kind === 'seed');
    wifWallet.getAddress.mockReturnValue(kind === 'wif' ? 'validated-address' : false);
    const networkMethods = [
      hdWallet.wasEverUsed,
      hdWallet.fetchBalance,
      hdWallet.fetchTransactions,
      wifWallet.fetchBalance,
      wifWallet.fetchTransactions,
    ];
    for (const method of networkMethods) {
      method.mockImplementation(() => {
        if (network === 'error') return Promise.reject(new Error('Electrum unavailable'));
        return new Promise(() => {});
      });
    }

    const onWallet = jest.fn();
    const onPassword = jest.fn();
    const task = startImport(` ${kind}-input `, false, false, offline, jest.fn(), onWallet, onPassword);
    const completed = jest.fn();
    const failed = jest.fn();
    task.promise.then(completed, failed);
    await jest.runAllTimersAsync();

    expect(failed).not.toHaveBeenCalled();
    expect(completed).toHaveBeenCalledWith({ cancelled: false, stopped: false, wallets: [wallet] });
    expect(wallet.setSecret).toHaveBeenCalledWith(`${kind}-input`);
    expect(onWallet).toHaveBeenCalledTimes(1);
    expect(onWallet).toHaveBeenCalledWith(wallet);
    expect(onPassword).not.toHaveBeenCalled();
    expect(hdWallet.wasEverUsed).not.toHaveBeenCalled();
    expect(wallet.fetchBalance).not.toHaveBeenCalled();
    expect(wallet.fetchTransactions).not.toHaveBeenCalled();
  });

  it('preserves the optional BIP39 passphrase', async () => {
    hdWallet.validateMnemonic.mockReturnValue(true);
    const onPassword = jest.fn().mockResolvedValue('test-passphrase');
    const task = startImport('seed-input', true, false, false, jest.fn(), jest.fn(), onPassword);
    await jest.runAllTimersAsync();

    expect((await task.promise).wallets).toEqual([hdWallet]);
    expect(onPassword).toHaveBeenCalledTimes(1);
    expect(hdWallet.setPassphrase).toHaveBeenCalledWith('test-passphrase');
  });

  it('does not import input rejected by all wallet validators', async () => {
    hdWallet.validateMnemonic.mockReturnValue(false);
    wifWallet.getAddress.mockReturnValue(false);
    watchWallet.valid.mockReturnValue(false);
    const onWallet = jest.fn();
    const task = startImport('invalid-input', false, false, false, jest.fn(), onWallet, jest.fn());
    await jest.runAllTimersAsync();

    expect((await task.promise).wallets).toEqual([]);
    expect(onWallet).not.toHaveBeenCalled();
  });

  it('can stop discovery before reporting a valid wallet', async () => {
    hdWallet.validateMnemonic.mockReturnValue(true);
    const onWallet = jest.fn();
    const task = startImport('seed-input', false, false, false, jest.fn(), onWallet, jest.fn());
    task.stop();
    await jest.runAllTimersAsync();

    expect(await task.promise).toEqual({ cancelled: false, stopped: true, wallets: [] });
    expect(onWallet).not.toHaveBeenCalled();
  });

  it('does not import when the passphrase prompt is cancelled', async () => {
    hdWallet.validateMnemonic.mockReturnValue(true);
    const onWallet = jest.fn();
    const onPassword = jest.fn().mockRejectedValue(new Error('Cancel Pressed'));
    const task = startImport('seed-input', true, false, false, jest.fn(), onWallet, onPassword);
    await jest.runAllTimersAsync();

    expect(await task.promise).toEqual({ cancelled: true, stopped: false, wallets: [] });
    expect(onWallet).not.toHaveBeenCalled();
  });
});
