import { fetch } from '../util/fetch';
// import untypedFiatUnit from './fiatUnits.json';
import defaultUnit from './defaultUnit.json';

export const FiatUnitSource = {
  Ecurrency: 'Ecurrency',
} as const;

const handleError = (source: string, ticker: string, error: Error) => {
  throw new Error(
    `Could not update rate for ${ticker} from ${source}\n: ${error.message}. ` +
      `\nMake sure the network you're on has access to ${source}.`,
  );
};

const fetchRate = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

interface ecurrency {
  currency_pairs: [
    {
      name: string;
      rate: number;
    },
  ];
}

const RateExtractors = {
  Ecurrency: async (ticker: string): Promise<number> => {
    try {
      const response = (await fetchRate('https://ecurrency.org/rates')) as ecurrency;
      const { currency_pairs } = response;

      return Number(currency_pairs.find(pair => pair.name === 'ECR/USDT')?.rate);
    } catch (e: any) {
      handleError('Ecurrency', ticker, e);
      return undefined as never;
    }
  },
} as const;

export type TFiatUnit = {
  endPointKey: string;
  symbol: string;
  locale: string;
  country: string;
  source: 'Ecurrency';
};

export type TFiatUnits = {
  [key: string]: TFiatUnit;
};

export const FiatUnit = defaultUnit as TFiatUnits;

export type FiatUnitType = {
  endPointKey: string;
  symbol: string;
  locale: string;
  country: string;
  source: keyof typeof FiatUnitSource;
};

export async function getFiatRate(ticker: string): Promise<number> {
  return await RateExtractors[FiatUnit[ticker].source](ticker);
}
