import React, { useLayoutEffect, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BackHandler, InteractionManager, Linking, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import * as BlueElectrum from '../../blue_modules/BlueElectrum';
import triggerHapticFeedback, { HapticFeedbackTypes } from '../../blue_modules/hapticFeedback';
import { BlueCard, BlueText, Styles } from '../../BlueComponents';
import { ECurrencyWallet } from '../../class';
import { Transaction, TWallet } from '../../class/wallets/types';
import { useTheme } from '../../components/themes';
import loc, { formatBalanceWithoutSuffix, formatEcrValueByUnit } from '../../loc';
import { BitcoinUnit } from '../../models/bitcoinUnits';
import { useStorage } from '../../hooks/context/useStorage';
import { DetailViewStackParamList } from '../../navigation/DetailViewStackParamList';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { BlueSpacing20 } from '../../components/BlueSpacing';
import { BlueLoading } from '../../components/BlueLoading';
import ArrowLeftIcon from '../../img/icons/ArrowLeftIcon.tsx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navigationRef } from '../../NavigationService.ts';
import dayjs from 'dayjs';
import ToolTipMenu from '../../components/TooltipMenu.tsx';
import Clipboard from '@react-native-clipboard/clipboard';
import { useSettings } from '../../hooks/context/useSettings.ts';
import presentAlert from '../../components/Alert.ts';
import assert from 'assert';
import SafeAreaScrollView from '../../components/SafeAreaScrollView.tsx';
import { HandOffActivityType } from '../../components/types.ts';
import HandOffComponent from '../../components/HandOffComponent.tsx';
import CopyIcon from '../../img/icons/CopyIcon.tsx';
import ThreeDotsIcon from '../../img/icons/ThreeDotsIcon.tsx';
import ArrowUpRightIcon from '../../img/icons/ArrowUpRightIcon.tsx';
import ArrowDownLeftIcon from '../../img/icons/ArrowDownLeftIcon.tsx';

type RouteProps = RouteProp<DetailViewStackParamList, 'TransactionStatus'>;
type NavigationProps = NativeStackNavigationProp<DetailViewStackParamList, 'TransactionStatus'>;

enum ActionType {
  SetTransaction,
  SetLoading,
  SetEta,
  SetIntervalMs,
  SetWallet,
  SetLoadingError,
}

interface State {
  tx: any;
  isLoading: boolean;
  eta: string;
  intervalMs: number;
  wallet: ECurrencyWallet | null;
  loadingError: boolean;
}

const initialState: State = {
  tx: undefined,
  isLoading: false,
  eta: '',
  intervalMs: 1000,
  wallet: null,
  loadingError: false,
};

const actionKeys = {
  CopyToClipboard: 'copyToClipboard',
  GoToWallet: 'goToWallet',
};

const actionIcons = {
  Clipboard: {
    iconValue: 'doc.on.doc',
  },
  GoToWallet: {
    iconValue: 'wallet.pass',
  },
};

function onlyUnique(value: any, index: number, self: any[]) {
  return self.indexOf(value) === index;
}

function arrDiff(a1: any[], a2: any[]) {
  const ret = [];
  for (const v of a2) {
    if (a1.indexOf(v) === -1) {
      ret.push(v);
    }
  }
  return ret;
}

const toolTipMenuActions = [
  {
    id: actionKeys.CopyToClipboard,
    text: loc.transactions.copy_link,
    icon: actionIcons.Clipboard,
  },
];

const reducer = (state: State, action: { type: ActionType; payload?: any }): State => {
  switch (action.type) {
    case ActionType.SetTransaction:
      return { ...state, tx: action.payload };
    case ActionType.SetLoading:
      return { ...state, isLoading: action.payload };
    case ActionType.SetEta:
      return { ...state, eta: action.payload };
    case ActionType.SetIntervalMs:
      return { ...state, intervalMs: action.payload };
    case ActionType.SetWallet:
      return { ...state, wallet: action.payload };
    case ActionType.SetLoadingError:
      return { ...state, loadingError: action.payload };
    default:
      return state;
  }
};

type TransactionStatusProps = {
  transaction?: {
    amount?: number;
    value?: number;
    confirmations?: number;
  };
  txid?: string;
};

const TransactionStatus: React.FC<TransactionStatusProps> = ({ transaction, txid }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { tx, isLoading, eta, intervalMs, wallet, loadingError } = state;
  const { wallets, txMetadata, fetchAndSaveWalletTransactions, counterpartyMetadata, getTransactions, saveToDisk } = useStorage();
  const { selectedBlockExplorer } = useSettings();
  const { hash, walletID } = useRoute<RouteProps>().params;
  const { navigate, setOptions, goBack } = useExtendedNavigation<NavigationProps>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const fetchTxInterval = useRef<NodeJS.Timeout>(undefined);
  const [memo, setMemo] = useState<string>('');
  const [counterpartyLabel, setCounterpartyLabel] = useState<string>('');
  const [isCounterpartyLabelVisible, setIsCounterpartyLabelVisible] = useState<boolean>(false);
  const [from, setFrom] = useState<string[]>([]);
  const [to, setTo] = useState<string[]>([]);
  const [paymentCode, setPaymentCode] = useState<string>('');

  const stylesHook = StyleSheet.create({
    iconRoot: {
      backgroundColor: colors.inputBackgroundColor,
    },
    header: {
      backgroundColor: colors.elevated,
    },
    button: {
      backgroundColor: colors.lightButton,
    },
    memoTextInput: {
      borderColor: colors.formBorder,
      borderBottomColor: colors.formBorder,
      color: colors.foregroundColor,
    },
    greyButton: {
      backgroundColor: colors.lightButton,
    },
    Link: {
      color: colors.buttonTextColor,
    },
    line: {
      height: 1,
      backgroundColor: colors.inputBackgroundColor,
    },
    blockHash: {
      padding: 8,
      gap: 12,
      backgroundColor: colors.inputBackgroundColor,
      borderRadius: 8,
    },
  });

  const setTX = (value: any) => {
    dispatch({ type: ActionType.SetTransaction, payload: value });
  };

  const setIntervalMs = (ms: number) => {
    dispatch({ type: ActionType.SetIntervalMs, payload: ms });
  };

  const setEta = (value: string) => {
    dispatch({ type: ActionType.SetEta, payload: value });
  };

  const onPressBack = () => {
    navigationRef.goBack();
  };

  const Header = useMemo(
    () => (
      <View style={[styles.headerContainer, stylesHook.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={loc.settings.default_title}
          testID="SettingsButton"
          style={[styles.buttonStyle, stylesHook.button]}
          onPress={onPressBack}
        >
          <View style={styles.icon}>
            <ArrowLeftIcon color={colors.foregroundColor} />
          </View>
        </TouchableOpacity>
        <View>
          <BlueText bold>{tx?.value < 0 ? loc.transactions.details_sent : loc.transactions.details_received}</BlueText>
          <BlueText bold style={styles.label}>
            {dayjs(tx?.timestamp * 1000).format('LLL')}
          </BlueText>
        </View>
      </View>
    ),
    [insets, stylesHook, colors, tx],
  );

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        let foundTx: Transaction | false = false;
        let newFrom: string[] = [];
        let newTo: string[] = [];
        for (const transaction of getTransactions(undefined, Infinity, true)) {
          if (transaction.hash === hash) {
            foundTx = transaction;
            for (const input of foundTx.inputs) {
              newFrom = newFrom.concat(input?.addresses ?? []);
            }
            for (const output of foundTx.outputs) {
              if (output?.address) newTo = newTo.concat(output.address);
            }
          }
        }

        assert(foundTx, 'Internal error: could not find transaction');

        const wallet = wallets.find(w => w.getID() === walletID);
        assert(wallet, 'Internal error: could not find wallet');

        if (wallet.allowBIP47() && wallet.isBIP47Enabled() && 'getBip47CounterpartyByTxid' in wallet) {
          const foundPaymentCode = wallet.getBip47CounterpartyByTxid(hash);
          if (foundPaymentCode) {
            // okay, this txid _was_ with someone using payment codes, so we show the label edit dialog
            // and load user-defined alias for the pc if any

            setCounterpartyLabel(counterpartyMetadata ? (counterpartyMetadata[foundPaymentCode]?.label ?? '') : '');
            setIsCounterpartyLabelVisible(true);
            setPaymentCode(foundPaymentCode);
          }
        }

        setMemo(txMetadata[foundTx.hash]?.memo ?? '');
        setFrom(newFrom);
        setTo(newTo);
        dispatch({ type: ActionType.SetLoading, payload: false });
      });
      return () => {
        task.cancel();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hash, wallets]),
  );

  useLayoutEffect(() => {
    setOptions({
      header: () => Header,
    });
  }, [Header, colors, hash, setOptions, tx]);

  useEffect(() => {
    if (wallet) {
      const transactions = wallet.getTransactions();
      const newTx = transactions.find((t: Transaction) => t.hash === hash);
      if (newTx) {
        setTX(newTx);
      }
    }
  }, [hash, wallet]);

  useEffect(() => {
    const foundWallet = wallets.find(w => w.getID() === walletID) || null;
    dispatch({ type: ActionType.SetWallet, payload: foundWallet });
  }, [walletID, wallets]);

  // re-fetching tx status periodically
  useEffect(() => {
    console.debug('transactionStatus - useEffect');

    if (!tx || tx?.confirmations) return;
    if (!hash) return;

    if (fetchTxInterval.current) {
      // interval already exists, lets cleanup it and recreate, so theres no duplicate intervals
      clearInterval(fetchTxInterval.current);
      fetchTxInterval.current = undefined;
    }

    console.debug('setting up interval to check tx...');
    fetchTxInterval.current = setInterval(async () => {
      try {
        setIntervalMs(31000); // upon first execution we increase poll interval;

        console.debug('checking tx', hash, 'for confirmations...');
        const transactions = await BlueElectrum.multiGetTransactionByTxid([hash], true, 10);
        const txFromElectrum = transactions[hash];
        if (!txFromElectrum) {
          console.error(`Transaction from Electrum with hash ${hash} not found.`);
          return;
        }

        console.debug('got txFromElectrum=', txFromElectrum);

        const address = txFromElectrum.out?.[0]?.address;
        if (!address) {
          console.error('Address not found in txFromElectrum.');
          return;
        }

        if (!txFromElectrum.confirmations && txFromElectrum.size) {
          const txsM = await BlueElectrum.getMempoolTransactionsByAddress(address);
          let txFromMempool;
          // searching for a correct tx in case this address has several pending txs:
          for (const tempTxM of txsM) {
            if (tempTxM?.tx_hash === hash) {
              txFromMempool = tempTxM;
              break;
            }
          }
          if (!txFromMempool) {
            console.error(`Transaction from mempool with hash ${hash} not found.`);
            return;
          }

          console.debug('txFromMempool=', txFromMempool);

          const satPerVbyte = txFromMempool.fee && txFromElectrum.size ? Math.round(txFromMempool.fee / txFromElectrum.size) : 0;
          const fees = await BlueElectrum.estimateFees();
          console.debug('fees=', fees, 'satPerVbyte=', satPerVbyte);
          if (satPerVbyte >= fees.fast) {
            setEta(loc.formatString(loc.transactions.eta_10m));
          }
          if (satPerVbyte >= fees.medium && satPerVbyte < fees.fast) {
            setEta(loc.formatString(loc.transactions.eta_3h));
          }
          if (satPerVbyte < fees.medium) {
            setEta(loc.formatString(loc.transactions.eta_1d));
          }
        } else if (txFromElectrum.confirmations && txFromElectrum.confirmations > 0) {
          // now, handling a case when tx became confirmed!
          triggerHapticFeedback(HapticFeedbackTypes.NotificationSuccess);
          setEta('');
          if (tx) {
            setTX((prevState: any) => {
              return Object.assign({}, prevState, { confirmations: txFromElectrum.confirmations });
            });
          } else {
            console.error('Cannot set confirmations: tx is undefined.');
          }
          clearInterval(fetchTxInterval.current);
          fetchTxInterval.current = undefined;
          if (wallet?.getID()) {
            fetchAndSaveWalletTransactions(wallet.getID());
          } else {
            console.error('Cannot fetch and save wallet transactions: wallet ID is undefined.');
          }
        }
      } catch (error) {
        console.error('Error in fetchTxInterval:', error);
      }
    }, intervalMs);

    return () => {
      clearInterval(fetchTxInterval.current);
      fetchTxInterval.current = undefined;
    };
  }, [hash, intervalMs, tx, fetchAndSaveWalletTransactions, wallet]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });

    return () => {
      subscription.remove();
      clearInterval(fetchTxInterval.current);
      fetchTxInterval.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderTXMetadata = () => {
    if (txMetadata[tx.hash]) {
      if (txMetadata[tx.hash].memo) {
        return (
          <>
            <BlueText selectable style={styles.memoText}>
              {txMetadata[tx.hash].memo}
            </BlueText>
            <View style={stylesHook.line} />
          </>
        );
      }
    }
  };

  useEffect(() => {
    if (!tx && txid) {
      // Fetch transaction details using txid
      const fetchTransaction = async () => {
        try {
          const transactions = await BlueElectrum.multiGetTransactionByTxid([txid], true, 10);
          const fetchedTx = transactions[txid];
          if (fetchedTx) {
            setTX(fetchedTx);
          } else {
            console.error(`Transaction with txid ${txid} not found.`);
            dispatch({ type: ActionType.SetLoadingError, payload: true });
            dispatch({ type: ActionType.SetLoading, payload: false });
          }
        } catch (error) {
          console.error('Error fetching transaction:', error);
          dispatch({ type: ActionType.SetLoadingError, payload: true });
          dispatch({ type: ActionType.SetLoading, payload: false });
        }
      };
      fetchTransaction().catch(error => console.error('Unhandled error in fetchTransaction:', error));
    }
  }, [tx, txid]);

  useEffect(() => {
    if (isLoading) {
      let isComponentMounted = true;
      const loadingTimeout = setTimeout(() => {
        if (isComponentMounted && isLoading) {
          dispatch({ type: ActionType.SetLoadingError, payload: true });
          dispatch({ type: ActionType.SetLoading, payload: false });
          console.error('Loading timed out. There was an issue fetching the transaction.');
        }
      }, 10000);

      return () => {
        isComponentMounted = false;
        clearTimeout(loadingTimeout);
      };
    }
  }, [isLoading]);

  const saveTransactionDetails = useCallback(() => {
    if (tx) {
      txMetadata[tx.hash] = { memo };
      if (counterpartyLabel && paymentCode) {
        counterpartyMetadata[paymentCode] = { label: counterpartyLabel };
      }
      saveToDisk();
    }
  }, [tx, txMetadata, memo, counterpartyLabel, paymentCode, saveToDisk, counterpartyMetadata]);

  const handleMemoBlur = useCallback(() => {
    saveTransactionDetails();
  }, [saveTransactionDetails]);

  const navigateToWallet = (wallet: TWallet) => {
    navigate('WalletTransactions', {
      walletID: wallet.getID(),
      walletType: wallet.type,
    });
  };

  const onPressMenuItem = (key: string) => {
    if (key === actionKeys.CopyToClipboard) {
      handleCopyPress(key);
    } else if (key === actionKeys.GoToWallet) {
      const wallet = weOwnAddress(key);
      if (wallet) {
        navigateToWallet(wallet);
      }
    }
  };

  const renderSection = (array: any[]) => {
    const fromArray = [];

    for (const [index, address] of array.entries()) {
      const actions = [];
      actions.push({
        id: actionKeys.CopyToClipboard,
        text: loc.transactions.details_copy,
        icon: actionIcons.Clipboard,
      });
      const isWeOwnAddress = weOwnAddress(address);
      if (isWeOwnAddress) {
        actions.push({
          id: actionKeys.GoToWallet,
          text: loc.formatString(loc.transactions.view_wallet, { walletLabel: isWeOwnAddress.getLabel() }),
          icon: actionIcons.GoToWallet,
        });
      }

      fromArray.push(
        <ToolTipMenu key={address} isButton title={address} isMenuPrimaryAction actions={actions} onPressMenuItem={onPressMenuItem}>
          <BlueText>
            {address}
            {index === array.length - 1 ? null : ','}
          </BlueText>
        </ToolTipMenu>,
      );
    }

    return fromArray;
  };

  const weOwnAddress = (address: string): TWallet | null => {
    for (const w of wallets) {
      if (w.weOwnAddress(address)) {
        return w;
      }
    }
    return null;
  };

  const handleCopyPress = (stringToCopy: string) => {
    Clipboard.setString(stringToCopy !== actionKeys.CopyToClipboard ? stringToCopy : `${selectedBlockExplorer.url}/tx/${tx?.hash}`);
  };

  const handleOnOpenTransactionOnBlockExplorerTapped = () => {
    const url = `${selectedBlockExplorer.url}/tx/${tx?.hash}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url).catch(e => {
            triggerHapticFeedback(HapticFeedbackTypes.NotificationError);
            presentAlert({ message: e.message });
          });
        } else {
          triggerHapticFeedback(HapticFeedbackTypes.NotificationError);
          presentAlert({ message: loc.transactions.open_url_error });
        }
      })
      .catch(e => {
        triggerHapticFeedback(HapticFeedbackTypes.NotificationError);
        presentAlert({ message: e.message });
      });
  };

  const onCopy = (string: string) => {
    Clipboard.setString(string);
    triggerHapticFeedback(HapticFeedbackTypes.Selection);
  };

  if (loadingError) {
    return (
      <BlueCard>
        <BlueText>{loc.transactions.transaction_loading_error}</BlueText>
      </BlueCard>
    );
  }

  if (isLoading || !tx || wallet === undefined) {
    return <BlueLoading />;
  }

  if (!transaction && !tx) {
    return <BlueText>{loc.transactions.transaction_not_available}</BlueText>;
  }

  return (
    <SafeAreaScrollView>
      <HandOffComponent
        title={loc.transactions.details_title}
        type={HandOffActivityType.ViewInBlockExplorer}
        url={`${selectedBlockExplorer.url}/tx/${tx.hash}`}
      />
      <View style={styles.container}>
        <View style={[styles.row, styles.spaceBetween]}>
          <BlueText style={styles.value} selectable>
            {wallet && formatBalanceWithoutSuffix(tx.value, wallet.preferredBalanceUnit, true)}
            {` `}
            {wallet?.preferredBalanceUnit !== BitcoinUnit.LOCAL_CURRENCY && wallet && (
              <BlueText style={styles.valueUnit}>{wallet.preferredBalanceUnit}</BlueText>
            )}
          </BlueText>
          <View style={[styles.iconWrap, stylesHook.iconRoot]}>
            {(() => {
              if (!tx.confirmations) {
                return <ThreeDotsIcon size={30} color={colors.foregroundColor} />;
              } else if (tx.value < 0) {
                return <ArrowUpRightIcon size={30} color={colors.outgoingForegroundColor} />;
              } else {
                return <ArrowDownLeftIcon size={30} color={colors.incomingForegroundColor} />;
              }
            })()}
          </View>
        </View>

        {renderTXMetadata()}

        <View style={stylesHook.blockHash}>
          {tx.hash ? (
            <View style={styles.blockHash}>
              <BlueText style={styles.hash}>{tx.hash}</BlueText>
              <TouchableOpacity onPress={() => onCopy(tx.hash)}>
                <CopyIcon size={24} color={colors.foregroundColor} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={styles.row}>
          <View style={[styles.flexBlock, styles.gapIndent]}>
            <BlueText style={styles.label}>{loc.wallets.add_wallet_type}</BlueText>
            <BlueText bold style={styles.type}>
              {tx.type}
            </BlueText>
          </View>
          <View style={[styles.flexBlock, styles.gapIndent]}>
            <BlueText style={styles.label}>{loc.send.create_tx_size}</BlueText>
            <BlueText bold>{`${tx.size} B`}</BlueText>
          </View>
        </View>

        <View style={stylesHook.line} />

        {tx.fee ? (
          <>
            <View style={styles.gapIndent}>
              <BlueText style={styles.label}>{loc.send.create_fee}</BlueText>
              <BlueText style={styles.feeText}>
                {formatEcrValueByUnit(tx.fee, wallet?.preferredBalanceUnit ?? BitcoinUnit.ECR, false)}
                {` `}
                {wallet?.preferredBalanceUnit !== BitcoinUnit.LOCAL_CURRENCY && wallet?.preferredBalanceUnit}
              </BlueText>
              <BlueText style={styles.label}>
                {((1 / tx.size) * Math.round(tx.fee * 100000000)).toFixed(5)}
                {' sat/B'}
              </BlueText>
            </View>
            <View style={stylesHook.line} />
          </>
        ) : null}

        <View style={styles.confirmations}>
          <BlueText style={styles.confirmationsText}>
            {loc.formatString(loc.transactions.confirmations_lowercase, {
              confirmations: tx.confirmations,
            })}
          </BlueText>
        </View>

        <View style={stylesHook.line} />

        {eta ? (
          <>
            <BlueText style={styles.confirmationsText}>{eta}</BlueText>
            <View style={stylesHook.line} />
          </>
        ) : null}

        <>
          <TextInput
            placeholder={loc.send.details_note_placeholder}
            value={memo}
            placeholderTextColor="#81868e"
            clearButtonMode="while-editing"
            style={[styles.memoTextInput, stylesHook.memoTextInput]}
            onChangeText={setMemo}
            onBlur={handleMemoBlur}
            testID="TransactionDetailsMemoInput"
          />
          {isCounterpartyLabelVisible ? (
            <View>
              <BlueSpacing20 />
              <TextInput
                placeholder={loc.send.counterparty_label_placeholder}
                value={counterpartyLabel}
                onBlur={handleMemoBlur}
                placeholderTextColor="#81868e"
                style={[styles.memoTextInput, stylesHook.memoTextInput]}
                onChangeText={setCounterpartyLabel}
              />
              <BlueSpacing20 />
            </View>
          ) : null}
          <View style={stylesHook.line} />
        </>

        {tx.block_height ? (
          <>
            <View style={styles.gapIndent}>
              <BlueText style={styles.label}>{loc.transactions.block_height}</BlueText>
              <BlueText style={styles.feeText}>{tx.block_height}</BlueText>
            </View>
            <View style={stylesHook.line} />
          </>
        ) : null}

        {from && (
          <>
            <View style={styles.rowHeader}>
              <BlueText style={styles.label}>{loc.transactions.details_from}</BlueText>

              <TouchableOpacity onPress={() => onCopy(from.filter(onlyUnique).join(', '))}>
                <CopyIcon size={24} color={colors.foregroundColor} />
              </TouchableOpacity>
            </View>
            {renderSection(from.filter(onlyUnique))}
            <View style={stylesHook.line} />
          </>
        )}

        {to && (
          <>
            <View style={styles.rowHeader}>
              <BlueText style={styles.label}>{loc.transactions.details_to}</BlueText>

              <TouchableOpacity onPress={() => onCopy(to.filter(onlyUnique).join(', '))}>
                <CopyIcon size={24} color={colors.foregroundColor} />
              </TouchableOpacity>
            </View>
            {renderSection(arrDiff(from, to.filter(onlyUnique)))}
            <View style={stylesHook.line} />
          </>
        )}

        {tx.inputs && (
          <>
            <View style={styles.gapIndent}>
              <BlueText style={styles.label}>{loc.transactions.details_inputs}</BlueText>
              <BlueText bold>{tx.inputs.length}</BlueText>
            </View>
            <View style={stylesHook.line} />
          </>
        )}

        {tx.outputs?.length > 0 && (
          <View style={styles.gapIndent}>
            <BlueText style={styles.label}>{loc.transactions.details_outputs}</BlueText>
            <BlueText bold>{tx.outputs.length}</BlueText>
          </View>
        )}

        <ToolTipMenu
          isButton
          actions={toolTipMenuActions}
          onPressMenuItem={handleCopyPress}
          onPress={handleOnOpenTransactionOnBlockExplorerTapped}
          buttonStyle={StyleSheet.flatten([styles.greyButton, stylesHook.greyButton])}
        >
          <BlueText style={[styles.Link, stylesHook.Link]}>{loc.transactions.details_view_in_browser}</BlueText>
        </ToolTipMenu>
      </View>
    </SafeAreaScrollView>
  );
};

export default TransactionStatus;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 16,
  },
  flexBlock: {
    flex: 1,
  },
  buttonStyle: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignContent: 'center',
    backgroundColor: 'rgba(0,0,0,.1)',
  },
  type: {
    textTransform: 'capitalize',
  },
  icon: {
    alignSelf: 'center',
  },
  blockHash: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    ...Styles.fonts['P4 Bold'],
    fontSize: 40,
    lineHeight: 44,
  },
  valueUnit: {
    ...Styles.fonts['P3 Bold'],
  },
  memoText: {
    ...Styles.fonts['P1 Regular'],
  },
  hash: {
    width: '90%',
  },
  feeText: {
    ...Styles.fonts['P2 Bold'],
    marginBottom: 4,
  },
  confirmations: {
    justifyContent: 'center',
  },
  confirmationsText: {
    ...Styles.fonts['P2 Regular'],
    color: '#00c49f',
  },
  memoTextInput: {
    ...Styles.fonts['P2 Regular'],
    flexDirection: 'row',
    borderWidth: 1,
    borderBottomWidth: 0.5,
    minHeight: 44,
    alignItems: 'center',
    marginVertical: 8,
    borderRadius: 24,
    paddingHorizontal: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gapIndent: {
    gap: 6,
  },
  label: {
    color: 'grey',
  },
  greyButton: {
    borderRadius: 40,
    minHeight: 49,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'auto',
    flexGrow: 1,
  },
  Link: {
    ...Styles.fonts['P2 Bold'],
    paddingHorizontal: 1,
  },
  row: {
    flexDirection: 'row',
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
});
