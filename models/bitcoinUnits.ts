export const BitcoinUnit = {
  SATS: 'sats',
  LOCAL_CURRENCY: 'local_currency',
  MAX: 'MAX',
  ECR: 'ECR',
} as const;
export type BitcoinUnit = (typeof BitcoinUnit)[keyof typeof BitcoinUnit];

export const Chain = {
  ONCHAIN: 'ONCHAIN',
  OFFCHAIN: 'OFFCHAIN',
  ECURRENCY: 'ECURRENCY',
} as const;
export type Chain = (typeof Chain)[keyof typeof Chain];
