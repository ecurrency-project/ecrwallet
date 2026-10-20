import * as bitcoin from '@qbtc/bitcoinjs-lib';

import ecc from '../../blue_modules/noble_ecc';
import { network } from '../../models/ecurrencyNetwork';

/**
 * Shared helper to build, canonically order, sign and serialize a STANDARD
 * ECurrency transaction via the @qbtc `qbitcoin*` API.
 *
 * ECR is NOT Bitcoin-compatible: there is no PSBT and no previous-tx parsing.
 * The sighash is a flat double-SHA256 over (tx_type, inputs[txid+vout],
 * outputs[value+scripthash+data]); each input gets a `[sighash][algo][DER]`
 * siglist + a P2PK redeem script.
 */

/** An input paired with the key material that unlocks it. */
export interface EcrSigningInput {
  /**
   * Funding txid (hex) in the byte order the ECR Electrum server returns it.
   * ECR txids are NOT byte-reversed (unlike Bitcoin), so they are used verbatim.
   * ⚠️ If the node rejects the first real broadcast, the txid byte order is the
   * prime suspect — reverse the bytes here and retry.
   */
  readonly txid: string;
  readonly vout: number;
  readonly privateKey: Uint8Array; // 32 bytes
  readonly publicKey: Uint8Array; // 33-byte compressed
}

export interface EcrOutput {
  readonly value: number; // atomic units (1 ECR = 1e8)
  readonly address: string;
}

const hexToBytes = (h: string): Uint8Array => Uint8Array.from(Buffer.from(h, 'hex'));
const bytesToHex = (u: Uint8Array): string => Buffer.from(u).toString('hex');

function compareBytes(a: Uint8Array, b: Uint8Array): number {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
}

/**
 * Returns the broadcast-ready transaction hex and its txid (both hex, no byte
 * reversal). Inputs are sorted into the node's canonical order (funding txid
 * bytes ascending, then vout) BEFORE signing — the node re-sorts and recomputes
 * the hash, so any other order is rejected.
 */
export function buildSignedEcrTxHex(inputs: readonly EcrSigningInput[], outputs: readonly EcrOutput[]): { hex: string; txid: string } {
  const { qbitcoinTransaction: qtx, qbitcoinSigner: qsig, qbitcoinAddress } = bitcoin;

  const paired = inputs
    .map(input => ({
      txidBytes: hexToBytes(input.txid),
      vout: input.vout,
      privateKey: input.privateKey,
      publicKey: input.publicKey,
    }))
    .sort((a, b) => {
      const c = compareBytes(a.txidBytes, b.txidBytes);
      return c !== 0 ? c : a.vout - b.vout;
    });

  const txInputs = paired.map(p => ({ txid: p.txidBytes, vout: p.vout }));
  const txOutputs = outputs.map(o => ({
    value: BigInt(Math.round(o.value)),
    scripthash: Uint8Array.from(qbitcoinAddress.toScriptHash(o.address, network)),
  }));
  const signers = paired.map((p, i) => ({
    inputIndex: i,
    privateKey: p.privateKey,
    publicKey: p.publicKey,
  }));

  const signed = qsig.signTransaction(
    { txType: qtx.TX_TYPE_STANDARD, inputs: txInputs, outputs: txOutputs },
    signers,
    (h: Uint8Array, d: Uint8Array) => Uint8Array.from(ecc.sign(h, d)),
  );

  return { hex: bytesToHex(qtx.serialize(signed)), txid: bytesToHex(qtx.txid(signed)) };
}

/**
 * Minimal tx-like object exposing the two methods the send flow calls on the
 * result of `createTransaction` (`tx.toHex()` and `tx.getId()`).
 */
export function ecrTxLike(hex: string, txid: string): { toHex(): string; getId(): string } {
  return { toHex: () => hex, getId: () => txid };
}
