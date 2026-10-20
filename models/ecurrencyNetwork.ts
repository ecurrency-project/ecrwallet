import type { QBitcoinNetwork } from '@qbtc/bitcoinjs-lib';
export const network = {
  messagePrefix: '\x1aECurrency Signed Message:\n', // 26 chars = \x1a
  bech32: '',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x076e,
  scriptHash: 0x076e,
  wif: 0x80,
  addrMagic: Uint8Array.from([0x07, 0x6e]),
  addressRegex: /^EC[1-9A-HJ-NP-Za-km-z]{33}$/,
} satisfies QBitcoinNetwork;
