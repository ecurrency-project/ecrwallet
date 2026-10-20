import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { RouteProp, StackActions, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BN from 'bignumber.js';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { randomBytes } from '../../class/rng';
import { FContainer } from '../../components/FloatButtons';
import SafeArea from '../../components/SafeArea';
import { Tabs } from '../../components/Tabs';
import { BlueCurrentTheme, useTheme } from '../../components/themes';
import loc from '../../loc';
import { AddWalletStackParamList } from '../../navigation/AddWalletStack';
import ArrowLeftIcon from '../../img/icons/ArrowLeftIcon.tsx';
import { BlueText, Styles } from '../../BlueComponents';
import RadioButtonIcon from '../../img/icons/RadioButtonIcon.tsx';
import DiceIcon from '../../img/icons/DiceIcon.tsx';
import DiceDIcon from '../../img/icons/DiceDIcon.tsx';
import SaveIcon from '../../img/icons/SaveIcon.tsx';
import UndoIcon from '../../img/icons/UndoIcon.tsx';
import DiceOneIcon from '../../img/icons/DiceOneIcon.tsx';
import DiceTwoIcon from '../../img/icons/DiceTwoIcop.tsx';
import DiceThreeIcon from '../../img/icons/DiceThreeIcon.tsx';
import DiceFourIcon from '../../img/icons/DiceFourIcon.tsx';
import DiceFiveIcon from '../../img/icons/DiceFiveIcon.tsx';
import DiceSixIcon from '../../img/icons/DiceSixIcon.tsx';
import LogoIcon from '../../img/icons/LogoIcon.tsx';

type RouteProps = RouteProp<AddWalletStackParamList, 'ProvideEntropy'>;
type NavigationProp = NativeStackNavigationProp<AddWalletStackParamList, 'ProvideEntropy'>;

export enum EActionType {
  push = 'push',
  pop = 'pop',
  limit = 'limit',
  noop = 'noop',
}

type TEntropy = { value: number; bits: number };
type TState = { entropy: BN; bits: number; items: number[]; limit: number };
type TAction =
  | ({ type: EActionType.push } & TEntropy)
  | { type: EActionType.pop }
  | { type: EActionType.limit; limit: number }
  | { type: EActionType.noop };
type TPush = (v: TEntropy | null) => void;
type TPop = () => void;

const initialState: TState = {
  entropy: BN(0),
  bits: 0,
  items: [],
  limit: 256,
};

const shiftLeft = (value: BN, places: number) => value.multipliedBy(2 ** places);
const shiftRight = (value: BN, places: number) => value.div(2 ** places).dp(0, BN.ROUND_DOWN);

export const eReducer = (state: TState = initialState, action: TAction): TState => {
  switch (action.type) {
    case EActionType.noop:
      return state;

    case EActionType.push: {
      let value: number | BN = action.value;
      let bits: number = action.bits;

      if (value >= 2 ** bits) {
        throw new TypeError("Can't push value exceeding size in bits");
      }
      if (state.bits === state.limit) return state;
      if (state.bits + bits > state.limit) {
        value = shiftRight(BN(value), bits + state.bits - state.limit);
        bits = state.limit - state.bits;
      }
      const entropy = shiftLeft(state.entropy, bits).plus(value);
      const items = [...state.items, bits];
      return { ...state, entropy, bits: state.bits + bits, items };
    }

    case EActionType.pop: {
      if (state.bits === 0) return state;
      const bits = state.items.pop()!;
      const entropy = shiftRight(state.entropy, bits);
      return { ...state, entropy, bits: state.bits - bits, items: [...state.items] };
    }

    case EActionType.limit: {
      return { ...state, limit: action.limit };
    }

    default:
      return state;
  }
};

export const entropyToHex = ({ entropy, bits }: { entropy: BN; bits: number }): string => {
  if (bits === 0) return '0x';
  const hex = entropy.toString(16);
  const hexSize = Math.floor((bits - 1) / 4) + 1;
  return '0x' + '0'.repeat(hexSize - hex.length) + hex;
};

export const getEntropy = (number: number, base: number): TEntropy | null => {
  if (base === 1) return null;
  let maxPow = 1;
  while (2 ** (maxPow + 1) <= base) {
    maxPow += 1;
  }

  let bits = maxPow;
  let summ = 0;
  while (bits >= 1) {
    const block = 2 ** bits;
    if (summ + block > base) {
      bits -= 1;
      continue;
    }
    if (number < summ + block) {
      return { value: number - summ, bits };
    }
    summ += block;
    bits -= 1;
  }
  return null;
};

// cut entropy to bytes, convert to Buffer
export const convertToBuffer = ({ entropy, bits }: { entropy: BN; bits: number }): Buffer => {
  if (bits < 8) return Buffer.from([]);
  const bytes = Math.floor(bits / 8);

  // convert to byte array
  const arr: string[] = [];
  const ent = entropy.toString(16).split('').reverse();
  ent.forEach((v, index) => {
    if (index % 2 === 1) {
      arr[0] = v + arr[0];
    } else {
      arr.unshift(v);
    }
  });

  let arr2 = arr.map(i => parseInt(i, 16));

  if (arr.length > bytes) {
    arr2.shift();
  } else if (arr2.length < bytes) {
    const zeros = [...Array(bytes - arr2.length)].map(() => 0);
    arr2 = [...zeros, ...arr2];
  }
  return Buffer.from(arr2);
};

const Coin = ({ push }: { push: TPush }) => (
  <View style={styles.coinRoot}>
    <TouchableOpacity accessibilityRole="button" onPress={() => push(getEntropy(0, 2))} style={styles.coinBody}>
      <LogoIcon size={75} />
    </TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" onPress={() => push(getEntropy(1, 2))} style={styles.coinBody}>
      <Image style={styles.coinImage} source={require('../../img/USDT_Logo.png')} />
    </TouchableOpacity>
  </View>
);

const Dice = ({ push, sides }: { push: TPush; sides: number }) => {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const diceWidth = width / 5;
  const stylesHook = StyleSheet.create({
    dice: {
      borderColor: colors.feeText,
      backgroundColor: colors.elevated,
      width: diceWidth,
      height: diceWidth,
    },
    diceText: {
      color: colors.foregroundColor,
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.diceContainer}>
      {[...Array(sides)].map((_, i) => (
        <TouchableOpacity
          style={[styles.diceRoot, { width: diceWidth }]}
          accessibilityRole="button"
          key={i}
          onPress={() => push(getEntropy(i, sides))}
        >
          {sides === 6 ? (
            i === 0 ? (
              <DiceOneIcon size={diceWidth} color="grey" />
            ) : i === 1 ? (
              <DiceTwoIcon size={diceWidth} color="grey" />
            ) : i === 2 ? (
              <DiceThreeIcon size={diceWidth} color="grey" />
            ) : i === 3 ? (
              <DiceFourIcon size={diceWidth} color="grey" />
            ) : i === 4 ? (
              <DiceFiveIcon size={diceWidth} color="grey" />
            ) : i === 5 ? (
              <DiceSixIcon size={diceWidth} color="grey" />
            ) : null
          ) : (
            <View style={[styles.dice, stylesHook.dice]}>
              <BlueText style={[styles.diceText, stylesHook.diceText]}>{i + 1}</BlueText>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const Buttons = ({ pop, save, colors }: { pop: TPop; save: () => void; colors: any }) => (
  <FContainer>
    <TouchableOpacity style={[styles.scanButton, { backgroundColor: colors.buttonDisabledBackgroundColor }]} onPress={pop}>
      <UndoIcon color={colors.foregroundColor} />
      <BlueText>{loc.entropy.undo}</BlueText>
    </TouchableOpacity>

    <TouchableOpacity onPress={save} style={[styles.scanButton, { backgroundColor: colors.buttonDisabledBackgroundColor }]}>
      <SaveIcon color={colors.foregroundColor} size={24} />
      <BlueText>{loc.entropy.save}</BlueText>
    </TouchableOpacity>
  </FContainer>
);

const TollTab = ({ active }: { active: boolean }) => {
  const { colors } = useTheme();
  return <RadioButtonIcon color={active ? '#D53131' : colors.feeText} />;
};

const D6Tab = ({ active }: { active: boolean }) => {
  const { colors } = useTheme();
  return <DiceIcon color={active ? '#D53131' : colors.feeText} />;
};

const D20Tab = ({ active }: { active: boolean }) => {
  const { colors } = useTheme();
  return <DiceDIcon color={active ? '#D53131' : colors.feeText} />;
};

const ProvideEntropy = () => {
  const [entropy, dispatch] = useReducer(eReducer, initialState);
  const { words } = useRoute<RouteProps>().params;
  const navigation = useNavigation<NavigationProp>();
  const [tab, setTab] = useState(1);
  const [show, setShow] = useState(false);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const stylesHook = StyleSheet.create({
    entropy: {
      backgroundColor: colors.inputBackgroundColor,
    },
    entropyText: {
      color: colors.foregroundColor,
    },
    button: {
      backgroundColor: colors.lightButton,
    },
    root: {
      backgroundColor: colors.elevated,
      paddingTop: Platform.select({ ios: 16, android: insets.top + 8 }),
    },
  });

  const Header = useMemo(() => {
    return (
      <View style={[styles.headerContainer, stylesHook.root]}>
        <TouchableOpacity
          testID="NavigationCloseButton"
          accessibilityRole="button"
          style={[styles.buttonCross, stylesHook.button]}
          onPress={navigation.goBack}
        >
          <View style={styles.iconContainer}>
            <ArrowLeftIcon color={colors.foregroundColor} size={24} />
          </View>
        </TouchableOpacity>
        <BlueText style={styles.title}>{loc.entropy.title}</BlueText>
        <View style={styles.emptyBlock} />
      </View>
    );
  }, [colors.foregroundColor, navigation.goBack, stylesHook.button, stylesHook.root]);

  useEffect(() => {
    dispatch({ type: EActionType.limit, limit: words === 24 ? 256 : 128 });
  }, [dispatch, words]);

  useEffect(() => {
    navigation.setOptions({
      header: () => Header,
    });
  }, [navigation, Header]);

  const handlePush: TPush = v => {
    if (v === null) {
      dispatch({ type: EActionType.noop });
    } else {
      dispatch({ type: EActionType.push, value: v.value, bits: v.bits });
    }
  };

  const handlePop: TPop = () => {
    dispatch({ type: EActionType.pop });
  };

  const handleSave = async () => {
    let buf = convertToBuffer(entropy);
    const bufLength = words === 24 ? 32 : 16;
    const remaining = bufLength - buf.length;

    let entropyTitle = '';
    if (buf.length < bufLength) {
      entropyTitle = loc.formatString(loc.wallets.add_entropy_remain, {
        gen: buf.length,
        rem: remaining,
      });
    } else {
      entropyTitle = loc.formatString(loc.wallets.add_entropy_generated, {
        gen: buf.length,
      });
    }

    Alert.alert(
      loc.wallets.add_entropy,
      entropyTitle,
      [
        {
          text: loc._.cancel,
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: loc._.ok,
          onPress: async () => {
            if (remaining > 0) {
              const random = await randomBytes(remaining);
              buf = Buffer.concat([buf, random], bufLength);
            }

            /* Convert Buffer to hex string before navigating as React Navigation
              does not support passing Buffer objects between screens
            */

            const popTo = StackActions.popTo('AddWallet', { entropy: buf.toString('hex'), words }, { merge: true });

            navigation.dispatch(popTo);
          },
          style: 'default',
        },
      ],
      { cancelable: true },
    );
  };

  const hex = entropyToHex(entropy);
  let bits = entropy.bits.toString();
  bits = ' '.repeat(bits.length < 3 ? 3 - bits.length : 0) + bits;

  return (
    <SafeArea>
      <TouchableOpacity accessibilityRole="button" onPress={() => setShow(!show)}>
        <View style={[styles.entropy, stylesHook.entropy]}>
          <BlueText style={stylesHook.entropyText}>
            {show ? hex : loc.formatString(loc.entropy.amountOfEntropy, { bits, limit: entropy.limit })}
          </BlueText>
        </View>
      </TouchableOpacity>

      <Tabs active={tab} onSwitch={setTab} tabs={[TollTab, D6Tab, D20Tab]} />

      {tab === 0 && <Coin push={handlePush} />}
      {tab === 1 && <Dice sides={6} push={handlePush} />}
      {tab === 2 && <Dice sides={20} push={handlePush} />}

      <Buttons pop={handlePop} save={handleSave} colors={colors} />
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  entropy: {
    padding: 5,
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 9,
    minHeight: 49,
    paddingHorizontal: 8,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinRoot: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  coinBody: {
    flex: 0.33,
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: BlueCurrentTheme.colors.lightButton,
    margin: 10,
    padding: 10,
    maxWidth: 100,
    maxHeight: 100,
  },
  coinImage: {
    aspectRatio: 1,
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  diceContainer: {
    gap: 10,
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingBottom: 100,
    paddingTop: 20,
  },
  diceRoot: {
    minWidth: 80,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dice: {
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 1,
  },
  diceText: {
    ...Styles.fonts['P3 Bold'],
  },

  // Header styles
  emptyBlock: {
    width: 38,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  buttonCross: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignContent: 'center',
  },
  iconContainer: {
    alignSelf: 'center',
  },
  title: {
    ...Styles.fonts['P3 Bold'],
  },

  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    width: '47%',
    gap: 10,
    height: 52,
    marginHorizontal: 5,
  },
});

export default ProvideEntropy;
