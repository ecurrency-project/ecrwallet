import * as bitcoin from '@qbtc/bitcoinjs-lib';
import { CoinSelectTarget } from 'coinselect';
import { ECPairAPI, ECPairFactory } from '@qbtc/ecpair';

import * as BlueElectrum from '../../blue_modules/BlueElectrum';
import ecc from '../../blue_modules/noble_ecc';
import { BitcoinUnit, Chain } from '../../models/bitcoinUnits';
import { randomBytes } from '../rng';
import { LegacyWallet } from './legacy-wallet';
import { CreateTransactionResult, CreateTransactionUtxo } from './types';
import { network } from '../../models/ecurrencyNetwork.ts';
import { ECRTransaction } from '../../blue_modules/BlueElectrum';
import { buildSignedEcrTxHex, ecrTxLike } from './ecurrency-tx';

const ECPair: ECPairAPI = ECPairFactory(ecc);
bitcoin.initEccLib(ecc);

/**
 * Single-address ECurrency wallet (P2PK-style).
 *
 * Address encoding: hash160(P2PK_script(pubkey)) with 2-byte addrMagic prefix [0x07, 0x6e].
 * WIF prefix is 0x80 (same as Bitcoin mainnet) — ECurrency network must always be
 * passed explicitly to ECPair methods to avoid ambiguity.
 */
export class ECurrencyWallet extends LegacyWallet {
  static readonly type = 'ecurrency';
  static readonly typeReadable = 'ECurrency';
  // @ts-ignore: override
  public readonly type = ECurrencyWallet.type;
  // @ts-ignore: override
  public readonly typeReadable = ECurrencyWallet.typeReadable;

  preferredBalanceUnit: BitcoinUnit = BitcoinUnit.ECR;
  chain = Chain.ECURRENCY;

  async generate(): Promise<void> {
    const buf = await randomBytes(32);
    // Must pass network explicitly: ECurrency wif=0x80 collides with Bitcoin mainnet
    this.secret = ECPair.makeRandom({ rng: () => buf, network }).toWIF();
  }

  async generateFromEntropy(user: Buffer): Promise<void> {
    if (user.length !== 32) {
      throw new Error('Entropy should be 32 bytes');
    }
    this.secret = ECPair.fromPrivateKey(user, { network }).toWIF();
  }

  getAddress(): string | false {
    if (this._address) return this._address;
    try {
      // Must pass network explicitly — wif byte 0x80 is shared with Bitcoin
      const keyPair = ECPair.fromWIF(this.secret, network);
      // ECurrency always uses compressed pubkeys regardless of WIF compression flag
      // (5K... WIF has no compression byte → ECPair.compressed=false → 65-byte pubkey → wrong address)
      const compressedPubkey = ecc.pointFromScalar(keyPair.privateKey!, true);
      if (!compressedPubkey) return false;
      this._address = bitcoin.qbitcoinAddress.fromPublicKey(Buffer.from(compressedPubkey), network);
    } catch (_err) {
      return false;
    }
    return this._address;
  }

  /**
   * @inheritDoc
   */
  getAllExternalAddresses(): string[] {
    const address = this.getAddress();
    return address ? [address] : [];
  }

  isAddressValid(address: string): boolean {
    return bitcoin.qbitcoinAddress.validate(address, network);
  }

  /**
   * Compute the Electrum script hash for this wallet's address.
   * ECurrency Electrum server uses hash160(P2PK_script) as the scripthash identifier —
   * NOT the standard SHA256(script).reverse(). The hash160 is exactly the value stored
   * inside the address encoding, returned by ecurrencyAddress.toScriptHash().
   */
  private _getElectrumScriptHash(): string {
    const address = this.getAddress();
    if (!address) throw new Error('ECurrencyWallet: address not available');
    return Buffer.from(bitcoin.qbitcoinAddress.toScriptHash(address, network)).toString('hex');
  }

  /**
   * Fetches balance via Electrum.
   */
  async fetchBalance(): Promise<void> {
    try {
      const balance = await BlueElectrum.getBalanceByScriptHash(this._getElectrumScriptHash());
      this.balance = Number(balance.confirmed);
      this.unconfirmed_balance = Number(balance.unconfirmed);
      this._lastBalanceFetch = +new Date();
    } catch (error) {
      console.warn(error);
    }
  }

  /**
   * Fetches UTXOs. Also pre-fetches txhex for each UTXO — required by PSBT
   * for non-segwit (P2PK) inputs.
   */
  async fetchUtxo(): Promise<void> {
    try {
      const address = this.getAddress();
      if (!address) throw new Error('ECurrencyWallet: Invalid address');
      const rawUtxos = await BlueElectrum.getUtxoByScriptHash(this._getElectrumScriptHash());
      this._utxo = (rawUtxos || []).map((u: any) => ({
        ...u,
        address,
        txid: u.tx_hash ?? u.txid,
        vout: u.tx_pos ?? u.vout,
      }));

      // P2PK (non-segwit) inputs require full previous tx hex in PSBT
      const txhexes = await BlueElectrum.multiGetTransactionByTxid(
        this._utxo.map(u => u.txid),
        false,
      );

      for (const u of this._utxo) {
        if (txhexes[u.txid]) u.txhex = txhexes[u.txid];
      }
    } catch (error) {
      console.warn(error);
    }
  }

  /**
   * Creates a signed (or unsigned if skipSigning=true) ECurrency transaction.
   * ECR is NOT Bitcoin-compatible, so we build/sign/serialize via the @qbtc
   * `qbitcoin*` API (no PSBT, no nonWitnessUtxo). Single-address P2PK wallet →
   * one key (from WIF) signs every input. `sequence` is unused (ECR has no RBF).
   */
  createTransaction(
    utxos: CreateTransactionUtxo[],
    targets: CoinSelectTarget[],
    feeRate: number,
    changeAddress: string,
    sequence?: number,
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
      // Pass network explicitly — wif byte 0x80 is shared with Bitcoin mainnet.
      const keyPair = ECPair.fromWIF(this.secret, network);
      const privateKey = Uint8Array.from(keyPair.privateKey!);
      // ECurrency always uses compressed pubkeys, regardless of the WIF flag.
      const compressed = ecc.pointFromScalar(privateKey, true);
      if (!compressed) throw new Error('ECurrencyWallet: failed to derive public key');
      const publicKey = Uint8Array.from(compressed);

      const { hex, txid } = buildSignedEcrTxHex(
        inputs.map(input => ({ txid: input.txid, vout: input.vout, privateKey, publicKey })),
        sanitizedOutputs.map(o => ({ value: Number(o.value), address: o.address })),
      );
      tx = ecrTxLike(hex, txid) as unknown as bitcoin.Transaction;
    }

    // psbt is unused for ECR; return an empty one to satisfy the result type.
    return { tx, inputs, outputs: sanitizedOutputs, fee, psbt: new bitcoin.Psbt() };
  }

  /**
   * Checks whether a given address belongs to this wallet.
   */
  weOwnAddress(address: string): boolean {
    if (!address) return false;
    return this.getAddress() === address || this._address === address;
  }

  /**
   * Returns WIF for the given address if it belongs to this wallet.
   */
  _getWIFbyAddress(address: string): string | false {
    return this.getAddress() === address ? this.secret : false;
  }

  allowSignVerifyMessage(): boolean {
    return false; // ECurrency message signing format TBD
  }

  /**
   * Probes address for transactions.
   */
  async wasEverUsed(): Promise<boolean> {
    const address = this.getAddress();
    if (!address) return false;
    const txs = await BlueElectrum.getTransactionsByScriptHash(this._getElectrumScriptHash());
    return txs.length > 0;
  }

  /**
   * Fetches transaction history.
   * Overrides LegacyWallet.fetchTransactions() which uses multiGetHistoryByAddress →
   * bitcoin.address.toOutputScript() — that fails for ECurrency P2PK addresses.
   * Uses getTransactionsByScriptHash() instead: all returned txids belong to this wallet.
   */
  async fetchTransactions(): Promise<void> {
    const address = this.getAddress();
    if (!address) return;

    const history = await BlueElectrum.getTransactionsByScriptHash(this._getElectrumScriptHash());

    if (this.getTransactions().length === 0 && history.length > 1000)
      throw new Error('Addresses with history of > 1000 transactions are not supported');

    const txdatas = await BlueElectrum.multiGetTransactionByTxid(
      history.map((h: { tx_hash: string }) => h.tx_hash),
      true,
    );

    const transactions = Object.values(txdatas);

    // Fetch previous transactions to populate vin amounts
    const vinTxids: string[] = [];
    for (const txdata of transactions) {
      for (const vin of txdata.in) {
        if (vin.txid) {
          vinTxids.push(vin.txid);
        }
      }
    }
    const vintxdatas: Record<string, ECRTransaction> = await BlueElectrum.multiGetTransactionByTxid(vinTxids, true);

    // Combine input amounts from previous outputs
    const transactionsWithInputValue = transactions.map(tx => ({
      ...tx,
      in: tx.in.map((vin: any) => {
        if (vintxdatas[vin.txid]?.out[vin.num]) {
          return {
            ...vin,
            addresses: [vintxdatas[vin.txid].out[vin.num].address],
            value: vintxdatas[vin.txid].out[vin.num].value,
          };
        }
        return vin;
      }),
    }));

    const result = [];
    for (const tx of transactionsWithInputValue) {
      const { in: vin, out, ...txRest } = tx;
      result.push({
        ...txRest,
        inputs: [...vin],
        outputs: [...out],
        timestamp: tx.blocktime || Math.floor(+new Date() / 1000) - 30,
      });
    }

    this._txs_by_external_index = result;
    this._lastTxFetch = +new Date();
  }
}
