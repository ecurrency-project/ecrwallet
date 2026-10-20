import loc from '../loc';
import { ECurrencyWallet, HDECurrencyWallet, WatchOnlyWallet } from '.';
import type { TWallet } from './wallets/types';

// https://github.com/bitcoinjs/bip32/blob/master/ts-src/bip32.ts#L43
export const validateBip32 = (path: string) => path.match(/^(m\/)?(\d+'?\/)*\d+'?$/) !== null;

type TStatus = {
  cancelled: boolean;
  stopped: boolean;
  wallets: TWallet[];
};

export type TImport = {
  promise: Promise<TStatus>;
  stop: () => void;
};

/**
 * Function that starts wallet search and import process. It has async generator inside, so
 * that the process can be stoped at any time. It reporst all the progress through callbacks.
 *
 * @param askPassphrase {boolean} If true import process will call onPassword callback for wallet with optional password.
 * @param searchAccounts {boolean} If true import process will scan for all known derivation path from bip39_wallet_formats.json. If false it will use limited version.
 * @param onProgress {function} Callback to report scanning progress
 * @param onWallet {function} Callback to report wallet found
 * @param onPassword {function} Callback to ask for password if needed
 * @returns {{promise: Promise, stop: function}}
 */
const startImport = (
  importTextOrig: string,
  askPassphrase: boolean = false,
  searchAccounts: boolean = false,
  offline: boolean = false,
  onProgress: (name: string) => void,
  onWallet: (wallet: TWallet) => void,
  onPassword: (title: string, text: string) => Promise<string>,
): TImport => {
  // state
  let promiseResolve: (arg: TStatus) => void;
  let promiseReject: (reason?: any) => void;
  let running = true; // if you put it to false, internal generator stops
  const wallets: TWallet[] = [];
  const promise = new Promise<TStatus>((resolve, reject) => {
    promiseResolve = resolve;
    promiseReject = reject;
  });

  // helpers
  const fetch = async (wallet: TWallet, balance: boolean = false, transactions: boolean = false) => {
    if (offline) return;
    if (balance) await wallet.fetchBalance();
    if (transactions) await wallet.fetchTransactions();
  };

  // actions
  const reportProgress = (name: string) => {
    onProgress(name);
  };
  const reportFinish = (cancelled: boolean = false, stopped: boolean = false) => {
    promiseResolve({ cancelled, stopped, wallets });
  };
  const reportWallet = (wallet: TWallet) => {
    if (wallets.some(w => w.getID() === wallet.getID())) return; // do not add duplicates
    wallets.push(wallet);
    onWallet(wallet);
  };
  const stop = () => (running = false);

  async function* importGenerator() {
    // The plan:
    // 0. ask for password, if needed and validate it
    // 1. check if its HDECurrencyWallet (BIP39)
    // 2. check if its ECurrencyWallet
    // 3. check if its WatchOnlyWallet

    const text = importTextOrig.trim();
    let password;

    // 0. HD BIP39 wallet password is optinal
    const hd = new HDECurrencyWallet();
    hd.setSecret(text);
    if (askPassphrase && hd.validateMnemonic()) {
      password = await onPassword(loc.wallets.import_passphrase_title, loc.wallets.import_passphrase_message);
    }

    // 1. BIP39 mnemonic → HD ECurrency wallet
    const ecrHd = new HDECurrencyWallet();
    ecrHd.setSecret(text);
    if (password) ecrHd.setPassphrase(password);
    if (ecrHd.validateMnemonic()) {
      yield { progress: 'ecurrency hd' };
      yield { wallet: ecrHd };
      return;
    }

    // 2. WIF → single-address ECurrency wallet
    const ecrWif = new ECurrencyWallet();
    ecrWif.setSecret(text);
    if (ecrWif.getAddress()) {
      yield { progress: 'ecurrency wif' };
      yield { wallet: ecrWif };
      return;
    }

    // 3. xpub or ECurrency address → watch-only (key-free)
    const ecrWatch = new WatchOnlyWallet();
    ecrWatch.setSecret(text);
    if (ecrWatch.valid()) {
      yield { progress: 'ecurrency watch-only' };
      ecrWatch.init();
      await fetch(ecrWatch, true, true);
      yield { wallet: ecrWatch };
    }
  }

  // start
  (async () => {
    const generator = importGenerator();
    while (true) {
      const next = await generator.next();
      if (!running) throw new Error('Discovery stopped'); // break if stop() has been called
      if (next.value?.progress) reportProgress(next.value.progress);
      if (next.value?.wallet) reportWallet(next.value.wallet);
      if (next.done) break; // break if generator has been finished
      await new Promise(resolve => setTimeout(resolve, 1)); // try not to block the thread
    }
    reportFinish();
  })().catch(e => {
    if (e.message === 'Cancel Pressed') {
      reportFinish(true);
      return;
    } else if (e.message === 'Discovery stopped') {
      reportFinish(undefined, true);
      return;
    }
    promiseReject(e);
  });

  return { promise, stop };
};

export default startImport;
