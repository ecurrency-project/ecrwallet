import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { ActivityIndicator, FlatList, TouchableOpacity, StyleSheet, Switch, View, Platform } from 'react-native';
import { Text } from '@rneui/themed';
import { PayjoinClient } from 'payjoin-client';
import BigNumber from 'bignumber.js';
import * as bitcoin from '@qbtc/bitcoinjs-lib';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlueText, BlueCard, Styles } from '../../BlueComponents';
import { BitcoinUnit, Chain } from '../../models/bitcoinUnits';
import loc, { formatBalance, formatBalanceWithoutSuffix } from '../../loc';
import { useRoute, RouteProp } from '@react-navigation/native';
import presentAlert from '../../components/Alert';
import { useTheme } from '../../components/themes';
import Button from '../../components/Button';
import triggerHapticFeedback, { HapticFeedbackTypes } from '../../blue_modules/hapticFeedback';
import SafeArea from '../../components/SafeArea';
import { satoshiToBTC, satoshiToLocalCurrency } from '../../blue_modules/currency';
import * as BlueElectrum from '../../blue_modules/BlueElectrum';
import { unlockWithBiometrics, useBiometrics } from '../../hooks/useBiometrics';
import { TWallet, CreateTransactionTarget } from '../../class/wallets/types';
import PayjoinTransaction from '../../class/payjoin-transaction';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SendDetailsStackParamList } from '../../navigation/SendDetailsStackParamList';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { ContactList } from '../../class/contact-list';
import { useStorage } from '../../hooks/context/useStorage';
import { HDECurrencyWallet } from '../../class';
import { useSettings } from '../../hooks/context/useSettings';
import { majorTomToGroundControl } from '../../blue_modules/notifications';
import { uint8ArrayToHex } from '../../blue_modules/uint8array-extras';
import { network } from '../../models/ecurrencyNetwork.ts';
import ArrowLeftIcon from '../../img/icons/ArrowLeftIcon.tsx';

enum ActionType {
  SET_LOADING = 'SET_LOADING',
  SET_PAYJOIN_ENABLED = 'SET_PAYJOIN_ENABLED',
  SET_BUTTON_DISABLED = 'SET_BUTTON_DISABLED',
}

type Action =
  | { type: ActionType.SET_LOADING; payload: boolean }
  | { type: ActionType.SET_PAYJOIN_ENABLED; payload: boolean }
  | { type: ActionType.SET_BUTTON_DISABLED; payload: boolean };

interface State {
  isLoading: boolean;
  isPayjoinEnabled: boolean;
  isButtonDisabled: boolean;
}

const initialState: State = {
  isLoading: false,
  isPayjoinEnabled: false,
  isButtonDisabled: false,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case ActionType.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ActionType.SET_PAYJOIN_ENABLED:
      return { ...state, isPayjoinEnabled: action.payload };
    case ActionType.SET_BUTTON_DISABLED:
      return { ...state, isButtonDisabled: action.payload };
    default:
      return state;
  }
};

type ConfirmRouteProp = RouteProp<SendDetailsStackParamList, 'Confirm'>;
type ConfirmNavigationProp = NativeStackNavigationProp<SendDetailsStackParamList, 'Confirm'>;

const Confirm: React.FC = () => {
  const { wallets, fetchAndSaveWalletTransactions, counterpartyMetadata } = useStorage();
  const { isElectrumDisabled } = useSettings();
  const { isBiometricUseCapableAndEnabled } = useBiometrics();
  const navigation = useExtendedNavigation<ConfirmNavigationProp>();
  const route = useRoute<ConfirmRouteProp>(); // Get the route and its params
  const { recipients, targets, walletID, fee, memo, tx, satoshiPerByte, psbt, payjoinUrl } = route.params; // Destructure params

  const [state, dispatch] = useReducer(reducer, initialState);
  const { navigate, setOptions, goBack } = navigation;
  const wallet = wallets.find((w: TWallet) => w.getID() === walletID) as TWallet;
  const feeSatoshi = new BigNumber(fee).multipliedBy(100000000).toNumber();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!wallet) {
      goBack();
    }
  }, [wallet, goBack]);

  const stylesHook = StyleSheet.create({
    transactionDetailsTitle: {
      color: colors.foregroundColor,
    },
    transactionDetailsSubtitle: {
      color: colors.feeText,
    },
    transactionAmountFiat: {
      color: colors.feeText,
    },
    valueValue: {
      color: colors.alternativeTextColor2,
    },
    root: {
      backgroundColor: colors.elevated,
    },
    payjoinWrapper: {
      backgroundColor: colors.buttonDisabledBackgroundColor,
    },
    header: {
      backgroundColor: colors.elevated,
      paddingTop: Platform.select({ ios: 16, android: insets.top + 8 }),
    },
    button: {
      backgroundColor: colors.lightButton,
    },
  });

  const onPressBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const Header = useMemo(
    () => (
      <View style={[styles.headerContainer, stylesHook.header]}>
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.buttonStyle, stylesHook.button]}
          onPress={onPressBack}
        >
          <View style={styles.icon}>
            <ArrowLeftIcon color={colors.foregroundColor} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          testID="TransactionDetailsButton"
          style={[styles.detailButton, stylesHook.button]}
          onPress={async () => {
            if (await isBiometricUseCapableAndEnabled()) {
              if (!(await unlockWithBiometrics())) {
                return;
              }
            }
            navigate('CreateTransaction', {
              fee,
              recipients,
              memo,
              tx,
              satoshiPerByte,
              feeSatoshi,
            });
          }}
        >
          <View style={styles.icon}>
            <BlueText>{loc.send.create_details}</BlueText>
          </View>
        </TouchableOpacity>
      </View>
    ),
    [
      colors.foregroundColor,
      fee,
      feeSatoshi,
      isBiometricUseCapableAndEnabled,
      memo,
      navigate,
      onPressBack,
      recipients,
      satoshiPerByte,
      stylesHook.button,
      stylesHook.header,
      tx,
    ],
  );

  useEffect(() => {
    setOptions({
      header: () => Header,
    });
  }, [Header, colors, fee, feeSatoshi, memo, recipients, satoshiPerByte, setOptions, tx, wallet]);

  const getPaymentScript = (): Uint8Array | undefined => {
    if (!(recipients.length > 0) || !recipients[0].address) {
      return undefined;
    }
    return bitcoin.address.toOutputScript(recipients[0].address, network);
  };

  const handleSendTransaction = async () => {
    dispatch({ type: ActionType.SET_BUTTON_DISABLED, payload: true });
    dispatch({ type: ActionType.SET_LOADING, payload: true });
    try {
      // Perform biometric authentication first
      if (await isBiometricUseCapableAndEnabled()) {
        if (!(await unlockWithBiometrics())) {
          // Stop execution if biometric unlock fails
          dispatch({ type: ActionType.SET_LOADING, payload: false });
          dispatch({ type: ActionType.SET_BUTTON_DISABLED, payload: false });
          return;
        }
      }

      const txidsToWatch = [];
      if (!state.isPayjoinEnabled) {
        // Only broadcast the transaction after biometrics pass
        const result = await broadcastTransaction(tx);
        if (!result) {
          dispatch({ type: ActionType.SET_LOADING, payload: false });
          dispatch({ type: ActionType.SET_BUTTON_DISABLED, payload: false });
          return;
        }
      } else {
        const payJoinWallet = new PayjoinTransaction(psbt, (txHex: string) => broadcastTransaction(txHex), wallet as HDECurrencyWallet);
        const paymentScript = getPaymentScript();
        if (!paymentScript) {
          throw new Error('Invalid payment script');
        }
        const payjoinClient = new PayjoinClient({
          paymentScript: Buffer.from(uint8ArrayToHex(paymentScript), 'hex'),
          wallet: payJoinWallet.getPayjoinPsbt(),
          payjoinUrl: payjoinUrl as string,
        });
        await payjoinClient.run();
        const payjoinPsbt = payJoinWallet.getPayjoinPsbt();
        if (payjoinPsbt) {
          const txToWatch = payjoinPsbt.extractTransaction();
          txidsToWatch.push(txToWatch.getId());
        }
      }

      // ECR txid = hash256(serialized tx), NOT byte-reversed and NOT parseable by
      // the Bitcoin Transaction class — compute it directly. Bitcoin wallets keep the old path.
      const txid =
        wallet.chain === Chain.ECURRENCY
          ? Buffer.from(bitcoin.crypto.hash256(Buffer.from(tx, 'hex'))).toString('hex')
          : bitcoin.Transaction.fromHex(tx).getId();
      txidsToWatch.push(txid);
      majorTomToGroundControl([], [], txidsToWatch);
      let amount = 0;
      for (const recipient of recipients) {
        if (recipient.value) {
          amount += recipient.value;
        }
      }

      amount = Number(formatBalanceWithoutSuffix(amount, BitcoinUnit.ECR, false));
      triggerHapticFeedback(HapticFeedbackTypes.NotificationSuccess);
      navigate('Success', {
        fee: Number(fee),
        amount,
        txid,
      });

      dispatch({ type: ActionType.SET_LOADING, payload: false });

      await new Promise(resolve => setTimeout(resolve, 3000)); // sleep to make sure network propagates
      fetchAndSaveWalletTransactions(walletID);
    } catch (error: any) {
      const message = error?.message ?? String(error);
      triggerHapticFeedback(HapticFeedbackTypes.NotificationError);
      dispatch({ type: ActionType.SET_LOADING, payload: false });
      dispatch({ type: ActionType.SET_BUTTON_DISABLED, payload: false });
      presentAlert({ message });
    }
  };

  const broadcastTransaction = async (transaction: string) => {
    await BlueElectrum.ping();
    await BlueElectrum.waitTillConnected();

    const result = await wallet.broadcastTx(transaction);
    if (!result) {
      throw new Error(loc.errors.broadcast);
    }

    return result;
  };

  const shortenContactName = (name: string): string => {
    if (name.length < 20) return name;
    return name.substr(0, 10) + '...' + name.substr(name.length - 10, 10);
  };

  const renderItem = ({ index, item }: { index: number; item: CreateTransactionTarget }) => {
    // first, trying to find if this destination is to a PaymentCode, and if it is - get its local alias
    let contact: string = '';
    try {
      const cl = new ContactList();
      if (targets?.[index]?.address && cl.isPaymentCodeValid(targets[index].address!)) {
        // this is why we need `targets` in this screen.
        // in case address was a payment code, and it got turned into a regular address, we need to display the PC as well
        contact = targets[index].address!;
        if (counterpartyMetadata?.[contact].label) {
          contact = counterpartyMetadata?.[contact].label;
        }

        contact = shortenContactName(contact);
      }
    } catch (_) {}

    return (
      <>
        <View style={styles.valueWrap}>
          <BlueText testID="TransactionValue" style={[styles.valueValue, stylesHook.valueValue]}>
            {item.value && satoshiToBTC(item.value)}
          </BlueText>
          <BlueText style={[styles.valueUnit, stylesHook.valueValue]}>{' ' + loc.units[BitcoinUnit.ECR]}</BlueText>
        </View>
        <BlueText style={[styles.transactionAmountFiat, stylesHook.transactionAmountFiat]}>
          {item.value && satoshiToLocalCurrency(item.value)}
        </BlueText>
        <BlueCard>
          <BlueText style={[styles.transactionDetailsTitle, stylesHook.transactionDetailsTitle]}>{loc.send.create_to}:</BlueText>
          <BlueText testID="TransactionAddress" style={[styles.transactionDetailsSubtitle, stylesHook.transactionDetailsSubtitle]}>
            {item.address}
          </BlueText>
          {contact ? <Text style={[styles.transactionDetailsSubtitle, stylesHook.transactionDetailsSubtitle]}>[{contact}]</Text> : null}
        </BlueCard>
        {recipients.length > 1 && (
          <BlueText style={styles.valueOf}>{loc.formatString(loc._.of, { number: index + 1, total: recipients.length })}</BlueText>
        )}
      </>
    );
  };

  const renderSeparator = () => {
    return <View style={styles.separator} />;
  };

  return (
    <SafeArea style={[styles.root, stylesHook.root]}>
      <View style={styles.cardTop}>
        <FlatList<CreateTransactionTarget>
          scrollEnabled={recipients.length > 1}
          extraData={recipients}
          data={recipients}
          renderItem={renderItem}
          keyExtractor={(_item, index) => `${index}`}
          ItemSeparatorComponent={renderSeparator}
        />
        {!!payjoinUrl && (
          <View style={styles.cardContainer}>
            <BlueCard>
              <View style={[styles.payjoinWrapper, stylesHook.payjoinWrapper]}>
                <BlueText style={styles.payjoinText}>Payjoin</BlueText>
                <Switch
                  testID="PayjoinSwitch"
                  value={state.isPayjoinEnabled}
                  onValueChange={value => dispatch({ type: ActionType.SET_PAYJOIN_ENABLED, payload: value })}
                />
              </View>
            </BlueCard>
          </View>
        )}
      </View>
      <View style={styles.cardBottom}>
        <BlueCard>
          <BlueText style={styles.cardText} testID="TransactionFee">
            {loc.send.create_fee}: {formatBalance(feeSatoshi, BitcoinUnit.ECR)} ({satoshiToLocalCurrency(feeSatoshi)})
          </BlueText>
          {state.isLoading ? (
            <ActivityIndicator />
          ) : (
            <Button
              disabled={isElectrumDisabled || state.isButtonDisabled}
              onPress={handleSendTransaction}
              title={loc.send.confirm_sendNow}
            />
          )}
        </BlueCard>
      </View>
    </SafeArea>
  );
};

export default Confirm;

const styles = StyleSheet.create({
  transactionDetailsTitle: {
    ...Styles.fonts['P2 Regular'],
    marginBottom: 2,
  },
  transactionDetailsSubtitle: {
    ...Styles.fonts['P2 Regular'],
    marginBottom: 20,
  },
  transactionAmountFiat: {
    ...Styles.fonts['P2 Regular'],
    marginVertical: 8,
    textAlign: 'center',
  },
  valueWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  valueValue: {
    ...Styles.fonts['P2 Bold'],
    fontSize: 36,
    lineHeight: 42,
  },
  valueUnit: {
    fontSize: 16,
    marginHorizontal: 4,
    paddingBottom: 6,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
  valueOf: {
    alignSelf: 'flex-end',
    marginRight: 18,
    marginVertical: 8,
  },
  separator: {
    height: 0.5,
    margin: 16,
  },
  root: {
    justifyContent: 'space-between',
  },
  cardTop: {
    flexGrow: 8,
    marginTop: 16,
    alignItems: 'center',
    maxHeight: '70%',
  },
  cardBottom: {
    flexGrow: 2,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cardContainer: {
    flexGrow: 1,
    width: '100%',
  },
  cardText: {
    ...Styles.fonts['P1 Regular'],
    flexDirection: 'row',
    color: '#37c0a1',
    marginVertical: 8,
    marginHorizontal: 24,
    paddingBottom: 6,
    alignSelf: 'center',
  },
  payjoinWrapper: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payjoinText: {
    ...Styles.fonts['P2 Bold'],
    color: '#81868e',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  buttonStyle: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignContent: 'center',
    backgroundColor: 'rgba(0,0,0,.1)',
  },
  detailButton: {
    borderRadius: 8,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,.1)',
    height: 38,
    paddingHorizontal: 12,
  },
  icon: {
    alignSelf: 'center',
  },
});
