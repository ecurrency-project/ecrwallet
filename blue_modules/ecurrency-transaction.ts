import BigNumber from 'bignumber.js';

/** Wallet history uses ECR amounts for inputs, outputs and fees. */
export type ECRTransaction = {
  block_height: number;
  block_pos: number;
  confirm_weight?: number;
  confirmations: number;
  fee: number;
  txid: string;
  hash: string;
  type: string;
  size: number;
  in: {
    txid: string;
    redeem_script: string;
    siglist: string[];
    num: number;
    addresses?: string[];
    value?: number;
  }[];
  out: {
    value: number;
    address: string;
    data: string;
  }[];
  blockhash: string;
  blocktime: number;
};

type QBitcoinOutput = {
  value: number;
  scripthash_address?: string;
  data?: string;
};

type QBitcoinCoreTransaction = {
  txid: string;
  tx_type: string;
  size: number;
  fee?: number;
  value?: number;
  confirmations?: number;
  blockhash?: string;
  blocktime?: number;
  status?: { block_height?: number; block_pos?: number; block_hash?: string; block_time?: number };
  vin: {
    txid: string;
    vout: number;
    redeem_script?: string;
    siglist?: string[];
    prevout?: QBitcoinOutput;
  }[];
  vout: QBitcoinOutput[];
};

const atomicToEcr = (value: number) => new BigNumber(value).dividedBy(100000000).toNumber();

/**
 * Adapt QBitcoinCore's vin/vout and atomic amounts to the wallet's in/out
 * format. Legacy ECR and Bitcoin responses pass through unchanged. Cached
 * transactions that have already been normalized must not be converted twice.
 */
export function normalizeECurrencyTransaction(tx: QBitcoinCoreTransaction): ECRTransaction;
export function normalizeECurrencyTransaction<T>(tx: T): T;
export function normalizeECurrencyTransaction(tx: unknown): unknown {
  if (!tx || typeof tx !== 'object' || !('tx_type' in tx)) return tx;
  if ('in' in tx && Array.isArray(tx.in) && 'out' in tx && Array.isArray(tx.out)) return tx;
  if (!('vin' in tx) || !Array.isArray(tx.vin) || !('vout' in tx) || !Array.isArray(tx.vout)) return tx;

  const raw = tx as QBitcoinCoreTransaction;
  const normalized: ECRTransaction = {
    ...raw,
    hash: raw.txid,
    type: raw.tx_type,
    block_height: raw.status?.block_height ?? 0,
    block_pos: raw.status?.block_pos ?? 0,
    blockhash: raw.blockhash ?? raw.status?.block_hash ?? '',
    blocktime: raw.blocktime ?? raw.status?.block_time ?? 0,
    confirmations: raw.confirmations ?? 0,
    fee: atomicToEcr(raw.fee ?? 0),
    ...(raw.value !== undefined ? { value: atomicToEcr(raw.value) } : {}),
    in: raw.vin.map(input => ({
      ...input,
      num: input.vout,
      redeem_script: input.redeem_script ?? '',
      siglist: input.siglist ?? [],
      ...(input.prevout
        ? {
            addresses: input.prevout.scripthash_address ? [input.prevout.scripthash_address] : [],
            value: atomicToEcr(input.prevout.value),
          }
        : {}),
    })),
    out: raw.vout.map(output => ({
      ...output,
      address: output.scripthash_address ?? '',
      value: atomicToEcr(output.value),
      data: output.data ?? '',
    })),
  };
  return normalized;
}
