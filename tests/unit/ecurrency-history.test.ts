import * as BlueElectrum from '../../blue_modules/BlueElectrum';
import { normalizeECurrencyTransaction } from '../../blue_modules/ecurrency-transaction';
import { ECurrencyWallet } from '../../class/wallets/ecurrency-wallet';
import { HDECurrencyWallet } from '../../class/wallets/hd-ecurrency-wallet';
import { transaction, previousTransaction } from './fixtures/ecurrency-electrum-transactions.json';

// Keep native storage and networking out of these tests, but exercise the real
// Electrum response/cache handling and the real wallet history methods.
jest.mock('../../class', () => ({
  get HDSegwitBech32Wallet() {
    return jest.requireActual('../../class/wallets/hd-segwit-bech32-wallet').HDSegwitBech32Wallet;
  },
}));
jest.mock('../../components/Alert', () => jest.fn());
jest.mock('../../loc', () => ({}));
jest.mock('../../blue_modules/currency', () => ({ GROUP_IO_BLUEWALLET: 'test' }));
jest.mock('../../blue_modules/hapticFeedback', () => ({ triggerWarningHapticFeedback: jest.fn() }));
jest.mock('silent-payments', () => ({}));
jest.mock('react-native-default-preference', () => ({
  setName: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(null),
}));
jest.mock('react-native-fs', () => ({ CachesDirectoryPath: 'mock-cache' }));
jest.mock('realm', () => ({
  open: jest.fn(async () => ({
    objectForPrimaryKey: (_schema: string, key: string) => {
      const value = mockCache.get(key);
      return value === undefined ? undefined : { cache_value: value };
    },
    write: (callback: () => void) => callback(),
    create: (_schema: string, item: { cache_key: string; cache_value: string }) => mockCache.set(item.cache_key, item.cache_value),
  })),
  UpdateMode: { Modified: 'modified' },
}));
jest.mock('electrum-client', () => jest.fn().mockImplementation(() => mockClient));

const mockCache = new Map<string, string>();
const mockClient = {
  initElectrum: jest.fn(),
  blockchainHeaders_subscribe: jest.fn(),
  blockchainScripthash_getHistory: jest.fn(),
  blockchainScripthash_getHistoryBatch: jest.fn(),
  blockchainTransaction_getBatch: jest.fn(),
  blockchainTransaction_get: jest.fn(),
  close: jest.fn(),
};

const address = 'ECYYTngjSgcUMJknHy1uNdXJ1FYDjsBvGge';
const scriptHash = '8b3c2e79fb526a4e28ef7072c1647450dd9a4b2d';
const history = [{ tx_hash: transaction.txid, height: transaction.status.block_height }];
const responses = { [transaction.txid]: transaction, [previousTransaction.txid]: previousTransaction };

beforeEach(async () => {
  jest.clearAllMocks();
  mockCache.clear();
  // This supported version also resets batching after the single-request test.
  mockClient.initElectrum.mockResolvedValue(['electrs 0.9.0', '1.4']);
  mockClient.blockchainHeaders_subscribe.mockResolvedValue({ height: transaction.status.block_height + 100 });
  mockClient.blockchainScripthash_getHistory.mockResolvedValue(history);
  mockClient.blockchainScripthash_getHistoryBatch.mockImplementation(async (hashes: string[]) =>
    hashes.map(param => ({ param, result: param === scriptHash ? history : [] })),
  );
  mockClient.blockchainTransaction_get.mockImplementation(async (txid: string, verbose: boolean) =>
    verbose ? JSON.parse(JSON.stringify(responses[txid])) : '0101abcd',
  );
  mockClient.blockchainTransaction_getBatch.mockImplementation(async (txids: string[], verbose: boolean) =>
    Promise.all(txids.map(async param => ({ param, result: await mockClient.blockchainTransaction_get(param, verbose) }))),
  );
  await BlueElectrum.connectMain();
});

afterAll(() => BlueElectrum.forceDisconnect());

describe('ECurrency history from QBitcoinCore', () => {
  it.each(['network', 'cache'] as const)('loads a single-address wallet from %s and displays exactly 1 ECR', async source => {
    if (source === 'cache') {
      for (const tx of Object.values(responses)) mockCache.set(`${tx.txid}_verbose`, JSON.stringify(tx));
    }
    const wallet = new ECurrencyWallet();
    wallet._address = address; // A public address is sufficient to test history; no private key is needed.

    await wallet.fetchTransactions();
    const txs = wallet.getTransactions();

    expect(txs).toHaveLength(1);
    expect(txs[0]).toMatchObject({ txid: transaction.txid, value: 100000000, timestamp: transaction.blocktime });
    expect(txs[0].outputs[0]).toMatchObject({ address, value: 1 });
    expect(txs[0].inputs[0]).toMatchObject({
      num: 1,
      addresses: [previousTransaction.vout[1].scripthash_address],
      value: 2504197.68715542,
    });
    if (source === 'cache') expect(mockClient.blockchainTransaction_getBatch).not.toHaveBeenCalled();
  });

  it('loads the same transaction into an HD wallet', async () => {
    const wallet = new HDECurrencyWallet();
    wallet.setSecret('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
    wallet.gap_limit = 1;
    jest.spyOn(wallet, '_getExternalAddressByIndex').mockReturnValue(address);

    await wallet.fetchTransactions();

    expect(wallet.getTransactions()).toEqual([expect.objectContaining({ txid: transaction.txid, value: 100000000 })]);
  });

  it('calculates the outgoing amount from the previous output in atomic units', async () => {
    const wallet = new ECurrencyWallet();
    wallet._address = previousTransaction.vout[1].scripthash_address;

    await wallet.fetchTransactions();

    expect(wallet.getTransactions()[0].value).toBe(-250419768715542);
  });

  it('converts fees and prevout amounts, and does not convert cached amounts twice', async () => {
    const first = (await BlueElectrum.multiGetTransactionByTxid([transaction.txid], true))[transaction.txid];
    expect(first.fee).toBe(0.00000003);
    expect(first.in[0]).toMatchObject({ num: 1, value: 2504197.68715542 });
    expect(first.out[0]).toMatchObject({ address, value: 1 });
    expect(first.block_height).toBe(transaction.status.block_height);

    mockClient.blockchainTransaction_getBatch.mockClear();
    const cached = (await BlueElectrum.multiGetTransactionByTxid([transaction.txid], true))[transaction.txid];
    expect(cached).toEqual(first);
    expect(mockClient.blockchainTransaction_getBatch).not.toHaveBeenCalled();
  });

  it('preserves legacy cached transactions already using in/out and ECR amounts', async () => {
    const legacy = { txid: 'legacy', confirmations: 10, fee: 0.00000003, in: [], out: [{ address, value: 1, data: '' }] };
    mockCache.set('legacy_verbose', JSON.stringify(legacy));

    expect((await BlueElectrum.multiGetTransactionByTxid(['legacy'], true)).legacy).toEqual(legacy);
    expect(mockClient.blockchainTransaction_getBatch).not.toHaveBeenCalled();
  });

  it('normalizes single-request responses when batching is disabled', async () => {
    mockClient.initElectrum.mockResolvedValue(['ElectrumPersonalServer 0.2', '1.4']);
    await BlueElectrum.connectMain();

    const result = await BlueElectrum.multiGetTransactionByTxid([transaction.txid], true);

    expect(result[transaction.txid].out[0]).toMatchObject({ address, value: 1 });
    expect(mockClient.blockchainTransaction_getBatch).not.toHaveBeenCalled();
  });

  it('preserves raw transaction hex for non-verbose requests and cache hits', async () => {
    expect((await BlueElectrum.multiGetTransactionByTxid([transaction.txid], false))[transaction.txid]).toBe('0101abcd');
    mockClient.blockchainTransaction_getBatch.mockClear();
    expect((await BlueElectrum.multiGetTransactionByTxid([transaction.txid], false))[transaction.txid]).toBe('0101abcd');
    expect(mockClient.blockchainTransaction_getBatch).not.toHaveBeenCalled();
  });

  it('accepts an unconfirmed transaction without block metadata or embedded previous outputs', () => {
    const normalized = normalizeECurrencyTransaction({
      txid: 'unconfirmed',
      tx_type: 'standard',
      size: 100,
      vin: [{ txid: 'previous', vout: 0 }],
      vout: [{ value: 1, scripthash_address: address }],
    });

    expect(normalized).toMatchObject({
      confirmations: 0,
      blocktime: 0,
      blockhash: '',
      in: [{ txid: 'previous', num: 0 }],
      out: [{ address, value: 0.00000001 }],
    });
    expect(normalized.in[0].value).toBeUndefined();
  });

  it('accepts a coinbase transaction with no inputs', () => {
    const normalized = normalizeECurrencyTransaction({
      txid: 'coinbase',
      tx_type: 'coinbase',
      size: 100,
      vin: [],
      vout: [{ value: 100000000, scripthash_address: address }],
    });

    expect(normalized.in).toEqual([]);
    expect(normalized.out[0].value).toBe(1);
  });

  it('leaves Bitcoin vin/vout responses unchanged', () => {
    const bitcoinTx = { txid: 'bitcoin', vin: [], vout: [{ value: 1, scriptPubKey: { addresses: ['bitcoin-address'] } }] };
    expect(normalizeECurrencyTransaction(bitcoinTx)).toBe(bitcoinTx);
  });
});
