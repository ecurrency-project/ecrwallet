import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  LayoutAnimation,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import A from '../../blue_modules/analytics';
import triggerHapticFeedback, { HapticFeedbackTypes } from '../../blue_modules/hapticFeedback';
import { BlueButtonLink, BlueFormLabel, BlueText, Styles } from '../../BlueComponents';
import { ECurrencyWallet, HDECurrencyWallet } from '../../class';
import presentAlert from '../../components/Alert';
import Button from '../../components/Button';
import { useTheme } from '../../components/themes';
import WalletButton from '../../components/WalletButton';
import loc from '../../loc';
import { Chain } from '../../models/bitcoinUnits';
import { useStorage } from '../../hooks/context/useStorage';
import { CommonToolTipActions } from '../../typings/CommonToolTipActions';
import { Action } from '../../components/types';
import HeaderMenuButton from '../../components/HeaderMenuButton';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AddWalletStackParamList } from '../../navigation/AddWalletStack';
import { RouteProp, useRoute } from '@react-navigation/native';
import SafeAreaScrollView from '../../components/SafeAreaScrollView';
import { BlueSpacing20, BlueSpacing40 } from '../../components/BlueSpacing';
import CrossIcon from '../../img/icons/CrossIcon.tsx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

enum ButtonSelected {
  // @ts-ignore: Return later to update
  ECURRENCY = Chain.ECURRENCY,
}

interface State {
  isLoading: boolean;
  selectedIndex: number;
  label: string;
  selectedWalletType: ButtonSelected;
}

const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_SELECTED_INDEX: 'SET_SELECTED_INDEX',
  SET_LABEL: 'SET_LABEL',
  SET_SELECTED_WALLET_TYPE: 'SET_SELECTED_WALLET_TYPE',
} as const;
type ActionTypes = (typeof ActionTypes)[keyof typeof ActionTypes];

interface TAction {
  type: ActionTypes;
  payload?: any;
}

const initialState: State = {
  isLoading: false,
  selectedIndex: 0,
  label: '',
  selectedWalletType: ButtonSelected.ECURRENCY,
};

const walletReducer = (state: State, action: TAction): State => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ActionTypes.SET_SELECTED_INDEX:
      return { ...state, selectedIndex: action.payload, selectedWalletType: ButtonSelected.ECURRENCY };
    case ActionTypes.SET_LABEL:
      return { ...state, label: action.payload };
    case ActionTypes.SET_SELECTED_WALLET_TYPE:
      return { ...state, selectedWalletType: action.payload };
    default:
      return state;
  }
};

type NavigationProps = NativeStackNavigationProp<AddWalletStackParamList, 'AddWallet'>;

type RouteProps = RouteProp<AddWalletStackParamList, 'AddWallet'>;

const WalletsAdd: React.FC = () => {
  const { colors } = useTheme();

  // State
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const isLoading = state.isLoading;
  const selectedIndex = state.selectedIndex;
  const label = state.label;
  const selectedWalletType = state.selectedWalletType;
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  //
  const { addWallet, saveToDisk } = useStorage();
  const { entropy: entropyHex, words } = useRoute<RouteProps>().params || {};
  const entropy = entropyHex ? Buffer.from(entropyHex, 'hex') : undefined;
  const { navigate, goBack, setOptions, setParams } = useExtendedNavigation<NavigationProps>();

  const stylesHook = StyleSheet.create({
    label: {
      borderColor: colors.formBorder,
      borderBottomColor: colors.formBorder,
      backgroundColor: colors.inputBackgroundColor,
    },
    root: {
      backgroundColor: colors.elevated,
    },
    inputText: {
      color: colors.foregroundColor,
    },
    header: {
      backgroundColor: colors.elevated,
      paddingTop: Platform.select({ ios: 16, android: insets.top + 8 }),
    },
  });

  const entropyButtonText = useMemo(() => {
    if (!entropy) {
      return loc.wallets.add_entropy_provide;
    }
    return loc.formatString(loc.wallets.add_entropy_bytes, {
      bytes: entropy?.length,
    });
  }, [entropy]);

  const confirmResetEntropy = useCallback(
    (newWalletType: ButtonSelected) => {
      if (entropy || words) {
        Alert.alert(
          loc.wallets.add_entropy_reset_title,
          loc.wallets.add_entropy_reset_message,
          [
            {
              text: loc._.cancel,
              style: 'cancel',
            },
            {
              text: loc._.ok,
              style: 'destructive',
              onPress: () => {
                setParams({ entropy: undefined, words: undefined });
                setSelectedWalletType(newWalletType);
              },
            },
          ],
          { cancelable: true },
        );
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedWalletType(newWalletType);
      }
    },
    [entropy, setParams, words],
  );

  const toolTipActions = useMemo(() => {
    const ecurrencySubactions: Action[] = [
      {
        id: HDECurrencyWallet.type,
        text: HDECurrencyWallet.typeReadable,
        subtitle: 'HD / BIP39',
        menuState: selectedIndex === 0,
      },
      {
        id: ECurrencyWallet.type,
        text: ECurrencyWallet.typeReadable,
        subtitle: 'Single-address / WIF',
        menuState: selectedIndex === 1,
      },
    ];

    const ecurrencyAction: Action = {
      id: 'ecurrency_wallets',
      text: loc.multisig.wallet_type,
      subactions: ecurrencySubactions,
      displayInline: true,
    };

    const entropySubActions: Action[] = [
      {
        id: '12_words',
        text: loc.wallets.add_wallet_seed_length_12,
        subtitle: loc.wallets.add_wallet_seed_length,
        menuState: words === 12,
      },
      {
        id: '24_words',
        text: loc.wallets.add_wallet_seed_length_24,
        subtitle: loc.wallets.add_wallet_seed_length,
        menuState: words === 24,
      },
      { ...CommonToolTipActions.ResetToDefault, hidden: !entropy },
    ];

    const entropyActions: Action = {
      ...CommonToolTipActions.Entropy,
      text: entropyButtonText,
      subactions: entropySubActions,
    };

    // HD ECurrency supports entropy; single-address does not
    return selectedIndex === 0 ? [ecurrencyAction, entropyActions] : [ecurrencyAction];
  }, [selectedIndex, entropy, words, entropyButtonText]);

  const Header = useMemo(
    () => (
      <View style={[styles.headerContainer, stylesHook.header]}>
        <TouchableOpacity style={[styles.buttonCross, { backgroundColor: colors.lightButton }]} onPress={goBack}>
          <View style={styles.iconContainer}>
            <CrossIcon color={colors.foregroundColor} size={28} />
          </View>
        </TouchableOpacity>
        <BlueText style={styles.title}>{loc.wallets.add_title}</BlueText>
        <HeaderMenuButton
          onPressMenuItem={(id: string) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            if (id === HDECurrencyWallet.type) {
              setSelectedIndex(0);
            } else if (id === ECurrencyWallet.type) {
              setSelectedIndex(1);
            } else if (id === '12_words') {
              navigate('ProvideEntropy', { words: 12, entropy: entropy?.toString('hex') });
            } else if (id === '24_words') {
              navigate('ProvideEntropy', { words: 24, entropy: entropy?.toString('hex') });
            } else if (id === CommonToolTipActions.ResetToDefault.id) {
              confirmResetEntropy(ButtonSelected.ECURRENCY);
            }
          }}
          actions={toolTipActions}
        />
      </View>
    ),
    [toolTipActions, entropy, confirmResetEntropy, navigate, colors, goBack, stylesHook],
  );

  useEffect(() => {
    setOptions({
      header: () => Header,
      statusBarStyle: Platform.select({ ios: 'light', default: colorScheme === 'dark' ? 'light' : 'dark' }),
    });
  }, [Header, colorScheme, colors.foregroundColor, setOptions, toolTipActions]);

  const setIsLoading = (value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: value });
  };

  const setSelectedIndex = (value: number) => {
    dispatch({ type: 'SET_SELECTED_INDEX', payload: value });
  };

  const setLabel = (value: string) => {
    dispatch({ type: 'SET_LABEL', payload: value });
  };

  const setSelectedWalletType = (value: ButtonSelected) => {
    dispatch({ type: 'SET_SELECTED_WALLET_TYPE', payload: value });
  };

  const createWallet = async () => {
    setIsLoading(true);

    // selectedIndex === 0: HD ECurrency (BIP39); selectedIndex === 1: single-address ECurrency (WIF)
    const w: HDECurrencyWallet | ECurrencyWallet = selectedIndex === 1 ? new ECurrencyWallet() : new HDECurrencyWallet();
    w.setLabel(label || loc.wallets.details_title);
    if (entropy) {
      try {
        await w.generateFromEntropy(entropy);
      } catch (e: any) {
        console.log(e.toString());
        presentAlert({ message: e.toString() });
        setIsLoading(false);
        return;
      }
    } else {
      await w.generate();
    }
    addWallet(w);
    await saveToDisk();
    A(A.ENUM.CREATED_WALLET);
    triggerHapticFeedback(HapticFeedbackTypes.NotificationSuccess);
    if (w instanceof HDECurrencyWallet) {
      navigate('PleaseBackup', { walletID: w.getID() });
    } else {
      goBack();
    }
  };

  const navigateToImportWallet = () => {
    navigate('ImportWallet');
  };

  const handleOnECurrencyButtonPressed = () => {
    Keyboard.dismiss();
    confirmResetEntropy(ButtonSelected.ECURRENCY);
  };

  return (
    <SafeAreaScrollView
      style={stylesHook.root}
      testID="ScrollView"
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustContentInsets
      automaticallyAdjustsScrollIndicatorInsets
    >
      <BlueSpacing20 />
      <BlueFormLabel>{loc.wallets.add_wallet_name}</BlueFormLabel>
      <View style={[styles.label, stylesHook.label]}>
        <TextInput
          testID="WalletNameInput"
          value={label}
          placeholderTextColor="#81868e"
          placeholder={loc.wallets.add_placeholder}
          onChangeText={setLabel}
          style={[styles.textInputCommon, stylesHook.inputText]}
          editable={!isLoading}
          underlineColorAndroid="transparent"
        />
      </View>
      <BlueFormLabel>{loc.wallets.add_wallet_type}</BlueFormLabel>
      <View style={styles.buttons}>
        <WalletButton
          buttonType="ECurrency"
          testID="ActivateECurrencyButton"
          active={selectedWalletType === ButtonSelected.ECURRENCY}
          onPress={handleOnECurrencyButtonPressed}
          size={styles.button}
        />
      </View>
      <View style={styles.advanced}>
        <BlueSpacing20 />
        {!isLoading ? (
          <>
            <Button testID="Create" title={loc.wallets.add_create} disabled={!selectedWalletType} onPress={createWallet} />

            <BlueButtonLink
              testID="ImportWallet"
              style={styles.import}
              title={loc.wallets.add_import_wallet}
              onPress={navigateToImportWallet}
            />
            <BlueSpacing40 />
          </>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    </SafeAreaScrollView>
  );
};

const styles = StyleSheet.create({
  label: {
    flexDirection: 'row',
    borderWidth: 1,
    minHeight: 44,
    height: 44,
    marginHorizontal: 20,
    alignItems: 'center',
    marginVertical: 8,

    borderRadius: 24,
  },
  textInputCommon: {
    ...Styles.fonts['P2 Regular'],
    flex: 1,
    marginHorizontal: 24,
    color: '#81868e',
  },
  buttons: {
    flexDirection: 'column',
    marginHorizontal: 20,
    marginTop: 8,
  },
  button: {
    width: '100%',
    height: 'auto',
  },
  advanced: {
    marginHorizontal: 20,
  },
  import: {
    marginVertical: 24,
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
});

export default WalletsAdd;
