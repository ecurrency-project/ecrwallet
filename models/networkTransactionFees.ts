import * as BlueElectrum from '../blue_modules/BlueElectrum';

export enum NetworkTransactionFeeType {
  FAST = 'Fast',
  MEDIUM = 'MEDIUM',
  SLOW = 'SLOW',
  CUSTOM = 'CUSTOM',
}

// ECR has a flat, sub-1 sat/vByte fee market. This is the rate the ECurrency
// Electrum/Esplora report (10 sat/kB ÷ 1024 ≈ 0.0098 sat/vByte). Used as the default
// and as the fallback when the network fee can't be fetched.
export const ECR_FALLBACK_FEE_RATE = 0.009765625;

export class NetworkTransactionFee {
  static StorageKey = 'NetworkTransactionFee';

  public fastestFee: number;
  public mediumFee: number;
  public slowFee: number;

  constructor(fastestFee = ECR_FALLBACK_FEE_RATE, mediumFee = ECR_FALLBACK_FEE_RATE, slowFee = ECR_FALLBACK_FEE_RATE) {
    this.fastestFee = fastestFee;
    this.mediumFee = mediumFee;
    this.slowFee = slowFee;
  }
}

export default class NetworkTransactionFees {
  static async recommendedFees(): Promise<NetworkTransactionFee> {
    try {
      const isDisabled = await BlueElectrum.isDisabled();
      if (isDisabled) {
        throw new Error('Electrum is disabled. Dont attempt to fetch fees');
      }
      const response = await BlueElectrum.estimateFees();
      // ECR: use estimatefee rates as-is — no Bitcoin-era +5/+2 bumps.
      return new NetworkTransactionFee(response.fast, response.medium, response.slow);
    } catch (err) {
      console.warn(err);
      return new NetworkTransactionFee();
    }
  }
}
