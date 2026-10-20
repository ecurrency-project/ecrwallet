import BIP32Factory, { BIP32Interface } from 'bip32';
import { Psbt } from '@qbtc/bitcoinjs-lib';
import * as bitcoin from '@qbtc/bitcoinjs-lib';
import { CoinSelectReturnInput, CoinSelectTarget } from 'coinselect';

import * as BlueElectrum from '../../blue_modules/BlueElectrum';
import ecc from '../../blue_modules/noble_ecc';
import { BitcoinUnit, Chain } from '../../models/bitcoinUnits';
import { AbstractHDElectrumWallet } from './abstract-hd-electrum-wallet';
import { buildSignedEcrTxHex, ecrTxLike } from './ecurrency-tx';
import { CreateTransactionResult, CreateTransactionUtxo, Transaction } from './types';
import { network } from '../../models/ecurrencyNetwork';

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

/**
 * HD ECurrency wallet (BIP39 mnemonic, BIP44 derivation).
 *
 * Derivation path: m/44'/8128'/0' (coin_type=8128, SLIP44 ECurrency).
 *
 * Address encoding: hash160(P2PK_script(compressedPubkey)) with 2-byte addrMagic prefix [0x07, 0x6e].
 * ECurrency uses compressed (33-byte) public keys; bip32 nodes carry compressed keys in
 * hdNode.publicKey — used directly without conversion.
 *
 * Non-segwit (P2PK) inputs require nonWitnessUtxo (full previous tx hex) in PSBT.
 */
export class HDECurrencyWallet extends AbstractHDElectrumWallet {
  static readonly type = 'HDECurrency';
  static readonly typeReadable = 'HD ECurrency';
  // @ts-ignore: override
  public readonly type = HDECurrencyWallet.type;
  // @ts-ignore: override
  public readonly typeReadable = HDECurrencyWallet.typeReadable;
  static readonly derivationPath = "m/44'/8128'/0'";

  preferredBalanceUnit: BitcoinUnit = BitcoinUnit.ECR;
  chain = Chain.ECURRENCY;

  allowSend() {
    return true;
  }

  allowCosignPsbt() {
    return true;
  }

  allowMasterFingerprint() {
    return true;
  }

  allowXpub() {
    return true;
  }

  allowSignVerifyMessage(): boolean {
    return false; // ECurrency message signing format TBD
  }

  allowBIP47(): boolean {
    return false;
  }

  getXpub(): string {
    if (this._xpub) {
      return this._xpub; // cache hit
    }
    const seed = this._getSeed();
    const root = bip32.fromSeed(seed);

    const path = this.getDerivationPath();
    if (!path) {
      throw new Error('Internal error: no path');
    }
    const child = root.derivePath(path).neutered();
    this._xpub = child.toBase58();

    return this._xpub;
  }

  /**
   * Derives an ECurrency address from an HD node.
   *
   * ECurrency P2PK address is computed from the COMPRESSED public key (33 bytes).
   * bip32 nodes carry compressed keys in hdNode.publicKey — used directly.
   */
  _hdNodeToAddress(hdNode: BIP32Interface): string {
    // ECurrency uses compressed pubkeys; bip32 nodes already carry compressed keys
    const address = bitcoin.qbitcoinAddress.fromPublicKey(Buffer.from(hdNode.publicKey), network);
    if (!address) {
      throw new Error('HDECurrencyWallet: failed to derive ECurrency address from HD node');
    }
    return address;
  }

  /**
   * Check if this HD wallet has ever been used by probing the first external address.
   * Overrides AbstractHDElectrumWallet.wasEverUsed() which calls toOutputScript() —
   * that fails for ECurrency because the output script requires the pubkey, not just the address.
   */
  override async wasEverUsed(): Promise<boolean> {
    if (!this.secret) return false;
    // ECurrency Electrum server uses hash160(P2PK_script) as scripthash — same value stored in address.
    const address = this._getExternalAddressByIndex(0);
    const scriptHash = Buffer.from(bitcoin.qbitcoinAddress.toScriptHash(address, network)).toString('hex');
    try {
      const txs = await BlueElectrum.getTransactionsByScriptHash(scriptHash);
      return txs.length > 0;
    } catch {
      return false;
    }
  }

  isAddressValid(address: string): boolean {
    return bitcoin.qbitcoinAddress.validate(address, network);
  }

  /**
   * Fetches UTXOs and pre-fetches txhex for each — required by PSBT for
   * non-segwit (P2PK) inputs.
   */
  async fetchUtxo(): Promise<void> {
    await super.fetchUtxo();
    // P2PK (non-segwit) inputs require full previous tx hex in PSBT
    const txhexes = await BlueElectrum.multiGetTransactionByTxid(
      this.getUtxo().map((x: { txid: string }) => x.txid),
      false,
    );

    for (const u of this.getUtxo()) {
      if (txhexes[u.txid]) u.txhex = txhexes[u.txid];
    }
  }

  /**
   * Fetches transaction history for all addresses in the HD hierarchy.
   * Overrides AbstractHDElectrumWallet.fetchTransactions() which calls multiGetHistoryByAddress →
   * bitcoin.address.toOutputScript() — fails for ECurrency P2PK addresses.
   *
   * Uses multiGetHistoryByScriptHashMap with precomputed P2PK script hashes derived
   * from bip32 node public keys. BIP47 payment code logic is omitted (not supported).
   */
  override async fetchTransactions(): Promise<void> {
    // Snapshot indices to avoid race condition with _fetchBalance
    const next_free_address_index = this.next_free_address_index;
    const next_free_change_address_index = this.next_free_change_address_index;

    // Derive account-level xpub once; derive external (chain=0) and internal (chain=1) chains
    const accountNode = bip32.fromBase58(this.getXpub());
    const externalChainNode = accountNode.derive(0);
    const internalChainNode = accountNode.derive(1);

    // Build scriptHash → address maps for addresses that need refreshing
    const scriptHashToAddr: Record<string, string> = {};

    for (let c = 0; c < next_free_address_index + this.gap_limit; c++) {
      let hasUnconfirmed = false;
      this._txs_by_external_index[c] = this._txs_by_external_index[c] || [];
      for (const tx of this._txs_by_external_index[c]) hasUnconfirmed = hasUnconfirmed || !tx.confirmations || tx.confirmations < 7;

      if (hasUnconfirmed || this._txs_by_external_index[c].length === 0 || this._balances_by_external_index[c]?.u !== 0) {
        const address = this._getExternalAddressByIndex(c);
        // ECurrency Electrum uses hash160(P2PK_script) as scripthash — extracted directly from address
        scriptHashToAddr[Buffer.from(bitcoin.qbitcoinAddress.toScriptHash(address, network)).toString('hex')] = address;
      }
    }

    for (let c = 0; c < next_free_change_address_index + this.gap_limit; c++) {
      let hasUnconfirmed = false;
      this._txs_by_internal_index[c] = this._txs_by_internal_index[c] || [];
      for (const tx of this._txs_by_internal_index[c]) hasUnconfirmed = hasUnconfirmed || !tx.confirmations || tx.confirmations < 7;

      if (hasUnconfirmed || this._txs_by_internal_index[c].length === 0 || this._balances_by_internal_index[c]?.u !== 0) {
        const address = this._getInternalAddressByIndex(c);
        // ECurrency Electrum uses hash160(P2PK_script) as scripthash — extracted directly from address
        scriptHashToAddr[Buffer.from(bitcoin.qbitcoinAddress.toScriptHash(address, network)).toString('hex')] = address;
      }
    }

    // Batch fetch histories by script hash (avoids toOutputScript)
    const histories = await BlueElectrum.multiGetHistoryByScriptHashMap(scriptHashToAddr);
    const txs: Record<string, { tx_hash: string; height: number; address: string }> = {};
    for (const history of Object.values(histories)) {
      for (const tx of history) {
        txs[tx.tx_hash] = tx;
      }
    }

    // Batch fetch all involved transactions
    const txdatas = await BlueElectrum.multiGetTransactionByTxid(Object.keys(txs), true);

    // Fetch previous transactions to populate input addresses/values.
    // ECR verbose txs are ECRTransaction (fields `in`/`out`), NOT `vin`/`vout`.
    const vinTxids: string[] = [];
    for (const txdata of Object.values(txdatas)) {
      if (txdata.in.length > 99) continue;
      for (const vin of txdata.in) {
        if (vin.txid) vinTxids.push(vin.txid);
      }
    }
    const vintxdatas = await BlueElectrum.multiGetTransactionByTxid(vinTxids, true);

    // Combine input addresses/amounts from previous outputs.
    // ECR: input.num is the index of the spent output in the previous tx's `out` array.
    for (const txid of Object.keys(txdatas)) {
      for (let inpNum = 0; inpNum < txdatas[txid].in.length; inpNum++) {
        const vinItem: any = txdatas[txid].in[inpNum];
        const prevOut = vintxdatas[vinItem.txid]?.out?.[vinItem.num];
        if (prevOut) {
          vinItem.addresses = [prevOut.address];
          vinItem.value = prevOut.value;
        }
      }
    }

    // Purge unconfirmed txs (may have been evicted from mempool)
    for (let c = 0; c < next_free_address_index + this.gap_limit; c++) {
      this._txs_by_external_index[c] = (this._txs_by_external_index[c] || []).filter(tx => !!tx.confirmations);
    }
    for (let c = 0; c < next_free_change_address_index + this.gap_limit; c++) {
      this._txs_by_internal_index[c] = (this._txs_by_internal_index[c] || []).filter(tx => !!tx.confirmations);
    }

    // Assign transactions to external address indices
    for (let c = 0; c < next_free_address_index + this.gap_limit; c++) {
      const extAddr = this._getExternalAddressByIndex(c);
      for (const tx of Object.values(txdatas)) {
        const matchesVin = tx.in.some((vin: any) => vin.addresses?.includes(extAddr));
        const matchesVout = tx.out.some((vout: any) => vout.address === extAddr);
        if (!matchesVin && !matchesVout) continue;

        this._txs_by_external_index[c] = this._txs_by_external_index[c] || [];
        const { in: txIn, out: txOut, ...txRest } = tx;
        const clonedTx: Transaction = { ...txRest, inputs: txIn.slice(0), outputs: txOut.slice(0), timestamp: tx.blocktime || Math.floor(+new Date() / 1000) - 30 } as Transaction;

        const existing = this._txs_by_external_index[c].findIndex(t => t.txid === clonedTx.txid);
        if (existing >= 0) this._txs_by_external_index[c][existing] = clonedTx;
        else this._txs_by_external_index[c].push(clonedTx);
      }
    }

    // Assign transactions to internal (change) address indices
    for (let c = 0; c < next_free_change_address_index + this.gap_limit; c++) {
      const intAddr = this._getInternalAddressByIndex(c);
      for (const tx of Object.values(txdatas)) {
        const matchesVin = tx.in.some((vin: any) => vin.addresses?.includes(intAddr));
        const matchesVout = tx.out.some((vout: any) => vout.address === intAddr);
        if (!matchesVin && !matchesVout) continue;

        this._txs_by_internal_index[c] = this._txs_by_internal_index[c] || [];
        const { in: txIn, out: txOut, ...txRest } = tx;
        const clonedTx: Transaction = { ...txRest, inputs: txIn.slice(0), outputs: txOut.slice(0), timestamp: tx.blocktime || Math.floor(+new Date() / 1000) - 30 } as Transaction;

        const existing = this._txs_by_internal_index[c].findIndex(t => t.txid === clonedTx.txid);
        if (existing >= 0) this._txs_by_internal_index[c][existing] = clonedTx;
        else this._txs_by_internal_index[c].push(clonedTx);
      }
    }

    this._lastTxFetch = +new Date();
  }

  /**
   * Creates a signed ECurrency transaction. ECR is NOT Bitcoin-compatible, so
   * we build/sign/serialize via the @qbtc `qbitcoin*` API (no PSBT). Each
   * input is signed by the key of the address that owns it. `sequence` is unused
   * (ECR has no RBF).
   */
  override createTransaction(
    utxos: CreateTransactionUtxo[],
    targets: CoinSelectTarget[],
    feeRate: number,
    changeAddress: string,
    sequence: number,
    skipSigning = false,
  ): CreateTransactionResult {
    if (targets.length === 0) throw new Error('No destination provided');
    const { inputs, outputs, fee } = this.coinselect(utxos, targets, feeRate);

    const sanitizedOutputs = outputs.map(output => ({
      ...output,
      address: output.address ?? changeAddress,
    }));

    let tx;
    if (!skipSigning) {
      const keyByAddress = this._buildAddressKeyMap();
      const signingInputs = inputs.map(input => {
        const key = input.address ? keyByAddress[input.address] : undefined;
        if (!key) throw new Error(`HDECurrencyWallet: no signing key for input address ${input.address}`);
        return { txid: input.txid, vout: input.vout, privateKey: key.privateKey, publicKey: key.publicKey };
      });
      const { hex, txid } = buildSignedEcrTxHex(
        signingInputs,
        sanitizedOutputs.map(o => ({ value: Number(o.value), address: o.address })),
      );
      tx = ecrTxLike(hex, txid) as unknown as bitcoin.Transaction;
    }

    // psbt is unused for ECR; return an empty one to satisfy the result type.
    return { tx, inputs, outputs: sanitizedOutputs, fee, psbt: new bitcoin.Psbt() };
  }

  /**
   * Derives { privateKey, publicKey } for every in-range external/internal
   * address, keyed by address — so each selected input is signed by its owning
   * key. Keys come straight from the bip32 nodes (compressed pubkeys).
   */
  private _buildAddressKeyMap(): Record<string, { privateKey: Uint8Array; publicKey: Uint8Array }> {
    const path = this.getDerivationPath();
    if (!path) throw new Error('HDECurrencyWallet: no derivation path');
    const account = bip32.fromSeed(this._getSeed()).derivePath(path);
    const externalChain = account.derive(0);
    const internalChain = account.derive(1);
    const map: Record<string, { privateKey: Uint8Array; publicKey: Uint8Array }> = {};

    for (let c = 0; c < this.next_free_address_index + this.gap_limit; c++) {
      const node = externalChain.derive(c);
      if (node.privateKey) {
        map[this._getExternalAddressByIndex(c)] = {
          privateKey: Uint8Array.from(node.privateKey),
          publicKey: Uint8Array.from(node.publicKey),
        };
      }
    }
    for (let c = 0; c < this.next_free_change_address_index + this.gap_limit; c++) {
      const node = internalChain.derive(c);
      if (node.privateKey) {
        map[this._getInternalAddressByIndex(c)] = {
          privateKey: Uint8Array.from(node.privateKey),
          publicKey: Uint8Array.from(node.publicKey),
        };
      }
    }
    return map;
  }

  /**
   * Adds a P2PK (non-segwit) input to the PSBT.
   * Must supply nonWitnessUtxo (full previous tx hex) — same requirement as
   * HDLegacyP2PKHWallet.
   */
  _addPsbtInput(psbt: Psbt, input: CoinSelectReturnInput, sequence: number, masterFingerprintBuffer: Buffer) {
    if (!input.address) {
      throw new Error('Internal error: no address on Utxo during _addPsbtInput()');
    }
    const pubkey = this._getPubkeyByAddress(input.address);
    const path = this._getDerivationPathByAddress(input.address);
    if (!pubkey || !path) {
      throw new Error('Internal error: pubkey or path are invalid');
    }

    if (!input.txhex) {
      throw new Error('UTXO is missing txhex of the input, which is required by PSBT for non-segwit input');
    }

    psbt.addInput({
      hash: input.txid,
      index: input.vout,
      sequence,
      bip32Derivation: [
        {
          masterFingerprint: masterFingerprintBuffer,
          path,
          pubkey,
        },
      ],
      // ECurrency P2PK is non-segwit — must provide full previous tx
      nonWitnessUtxo: Buffer.from(input.txhex, 'hex'),
    });

    return psbt;
  }
}
