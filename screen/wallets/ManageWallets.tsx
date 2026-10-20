import React, { useEffect, useLayoutEffect, useReducer, useCallback, useMemo, useRef, useState, lazy, Suspense } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Platform,
  Keyboard,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { usePreventRemove } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../components/themes';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import loc from '../../loc';
import { useStorage } from '../../hooks/context/useStorage';
import { TTXMetadata } from '../../class';
import { ExtendedTransaction, LightningTransaction, TWallet } from '../../class/wallets/types';
import DragList, { DragListRenderItemInfo } from 'react-native-draglist';
import { ItemType, AddressItemData } from '../../models/itemTypes';
import { WalletGroupComponent } from '../../components/ManageWalletsListItem';
import HighlightedText from '../../components/HighlightedText';
import ArrowLeftIcon from '../../img/icons/ArrowLeftIcon.tsx';
import { BlueText } from '../../BlueComponents';

const ManageWalletsListItem = lazy(() => import('../../components/ManageWalletsListItem'));

interface WalletItem {
  type: ItemType.WalletSection;
  data: TWallet;
}

interface TransactionItem {
  type: ItemType.TransactionSection;
  data: ExtendedTransaction & LightningTransaction;
}

interface AddressItem {
  type: ItemType.AddressSection;
  data: Omit<AddressItemData, 'label'>;
}

interface WalletGroupItem {
  type: ItemType.WalletGroupSection;
  wallet: TWallet;
  transactions: TransactionItem[];
  addresses: AddressItem[];
}

type Item = WalletItem | TransactionItem | AddressItem | WalletGroupItem;

const SET_INITIAL_DATA = 'SET_INITIAL_DATA';
const SET_MANAGED_DATA = 'SET_MANAGED_DATA';
const REMOVE_WALLET = 'REMOVE_WALLET';
const SAVE_CHANGES = 'SAVE_CHANGES';

interface SaveChangesAction {
  type: typeof SAVE_CHANGES;
  payload: TWallet[];
}

interface SetInitialDataAction {
  type: typeof SET_INITIAL_DATA;
  payload: { wallets: TWallet[]; txMetadata: TTXMetadata };
}

interface SetManagedDataAction {
  type: typeof SET_MANAGED_DATA;
  payload: Item[];
}

interface RemoveWalletAction {
  type: typeof REMOVE_WALLET;
  payload: string; // Wallet ID
}

type Action = SetInitialDataAction | SetManagedDataAction | SaveChangesAction | RemoveWalletAction;

interface State {
  originalWallets: TWallet[]; // Only used for verifying unsaved changes
  walletsCopy: TWallet[]; // Copy used for display and filtering
  managedWalletsData: Item[];
  txMetadata: TTXMetadata;
}

const initialState: State = {
  originalWallets: [],
  walletsCopy: [],
  managedWalletsData: [],
  txMetadata: {},
};

const deepCopyWallets = (wallets: TWallet[]): TWallet[] => {
  return wallets.map(wallet => Object.assign(Object.create(Object.getPrototypeOf(wallet)), wallet));
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case SET_INITIAL_DATA: {
      const walletsCopy = deepCopyWallets(action.payload.wallets);
      const managedWalletsData: WalletItem[] = walletsCopy.map(wallet => ({
        type: ItemType.WalletSection,
        data: wallet,
      }));

      return {
        ...state,
        originalWallets: deepCopyWallets(action.payload.wallets),
        walletsCopy,
        txMetadata: action.payload.txMetadata,
        managedWalletsData,
      };
    }
    case SET_MANAGED_DATA: {
      const updatedWalletsCopy = action.payload
        .filter((item): item is WalletItem => item.type === ItemType.WalletSection)
        .map(item => item.data);

      return {
        ...state,
        walletsCopy: updatedWalletsCopy.length > 0 ? updatedWalletsCopy : state.walletsCopy,
        managedWalletsData: action.payload,
      };
    }
    case SAVE_CHANGES: {
      return {
        ...state,
        originalWallets: deepCopyWallets(action.payload),
        walletsCopy: deepCopyWallets(action.payload),
      };
    }
    case REMOVE_WALLET: {
      const walletId = action.payload;
      const updatedOrder = state.managedWalletsData.filter(item => item.type !== ItemType.WalletSection || item.data.getID() !== walletId);
      const updatedWalletsCopy = state.walletsCopy.filter(wallet => wallet.getID() !== walletId);

      return {
        ...state,
        managedWalletsData: updatedOrder,
        walletsCopy: updatedWalletsCopy,
      };
    }
    default:
      throw new Error(`Unhandled action type: ${(action as Action).type}`);
  }
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ManageWallets: React.FC = () => {
  const { colors } = useTheme();
  const { wallets: persistedWallets, setWalletsWithNewOrder, txMetadata, handleWalletDeletion } = useStorage();
  const initialWalletsRef = useRef<TWallet[]>(deepCopyWallets(persistedWallets));
  const { navigate, setOptions, goBack, dispatch: navigationDispatch } = useExtendedNavigation();
  const [state, dispatch] = useReducer(reducer, initialState);
  const insets = useSafeAreaInsets();

  const stylesHook = StyleSheet.create({
    header: {
      backgroundColor: colors.elevated,
    },
    button: {
      backgroundColor: colors.lightButton,
    },
  });

  const listRef = useRef<FlatList<Item> | null>(null);
  const [saveInProgress, setSaveInProgress] = useState(false);

  useEffect(() => {
    dispatch({ type: SET_INITIAL_DATA, payload: { wallets: initialWalletsRef.current, txMetadata } });
  }, [txMetadata]);

  const hasUnsavedChanges = useMemo(() => {
    const currentWalletIds = state.managedWalletsData
      .filter((item): item is WalletItem => item.type === ItemType.WalletSection)
      .map(item => item.data.getID());

    const originalWalletIds = state.originalWallets.map(wallet => wallet.getID());

    if (currentWalletIds.length !== originalWalletIds.length) {
      return true;
    }

    for (let i = 0; i < currentWalletIds.length; i++) {
      if (currentWalletIds[i] !== originalWalletIds[i]) {
        return true;
      }
    }

    const modifiedWallets = state.managedWalletsData
      .filter((item): item is WalletItem => item.type === ItemType.WalletSection)
      .map(item => item.data);

    for (const modifiedWallet of modifiedWallets) {
      const originalWallet = state.originalWallets.find(w => w.getID() === modifiedWallet.getID());
      if (originalWallet && originalWallet.hideBalance !== modifiedWallet.hideBalance) {
        return true;
      }
    }

    return false;
  }, [state.managedWalletsData, state.originalWallets]);

  usePreventRemove(hasUnsavedChanges && !saveInProgress, ({ data: preventRemoveData }) => {
    Alert.alert(loc._.discard_changes, loc._.discard_changes_explain, [
      { text: loc._.cancel, style: 'cancel' },
      {
        text: loc._.ok,
        style: 'destructive',
        onPress: () => navigationDispatch(preventRemoveData.action),
      },
    ]);
  });

  useEffect(() => {
    if (saveInProgress) {
      goBack();
      setSaveInProgress(false);
    }
  }, [saveInProgress, goBack]);

  const handleClose = useCallback(() => {
    const reorderedWallets = state.managedWalletsData
      .filter((item): item is WalletItem => item.type === ItemType.WalletSection)
      .map(item => item.data);

    const walletsToDelete = state.originalWallets.filter(
      originalWallet => !reorderedWallets.some(wallet => wallet.getID() === originalWallet.getID()),
    );

    setWalletsWithNewOrder(reorderedWallets);
    dispatch({ type: SAVE_CHANGES, payload: reorderedWallets });
    initialWalletsRef.current = deepCopyWallets(reorderedWallets);

    walletsToDelete.forEach(wallet => {
      handleWalletDeletion(wallet.getID()).then();
    });

    setSaveInProgress(true);
  }, [setWalletsWithNewOrder, state.managedWalletsData, state.originalWallets, handleWalletDeletion]);

  const Header = useMemo(
    () => (
      <View style={[styles.headerContainer, stylesHook.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={[styles.buttonStyle, stylesHook.button]} onPress={goBack} disabled={saveInProgress}>
          <View style={styles.icon}>
            <ArrowLeftIcon color={colors.foregroundColor} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.detailButton, stylesHook.button]} onPress={handleClose}>
          <View style={styles.icon}>
            <BlueText>{loc.send.input_done}</BlueText>
          </View>
        </TouchableOpacity>
      </View>
    ),
    [colors, goBack, insets, stylesHook, saveInProgress, handleClose],
  );

  useLayoutEffect(() => {
    setOptions({
      header: () => Header,
    });
  }, [setOptions, Header]);

  const renderHighlightedText = useCallback((text: string, query: string) => {
    return <HighlightedText text={text} query={query} />;
  }, []);

  const handleDeleteWallet = useCallback(async (wallet: TWallet) => {
    if (Platform.OS === 'ios') {
      LayoutAnimation.configureNext({
        duration: 300,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
        },
        delete: {
          type: LayoutAnimation.Types.spring,
          property: LayoutAnimation.Properties.scaleXY,
          springDamping: 0.9,
          duration: 300,
        },
      });
    } else {
      LayoutAnimation.configureNext({
        duration: 250,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
        },
        delete: {
          type: LayoutAnimation.Types.easeOut,
          property: LayoutAnimation.Properties.opacity,
          duration: 200,
        },
      });
    }

    dispatch({ type: REMOVE_WALLET, payload: wallet.getID() });
  }, []);

  const handleToggleHideBalance = useCallback(
    (wallet: TWallet) => {
      const updatedOrder = state.managedWalletsData.map(item => {
        if (item.type === ItemType.WalletSection && item.data.getID() === wallet.getID()) {
          item.data.hideBalance = !item.data.hideBalance;
          return {
            ...item,
            data: item.data,
          };
        }
        return item;
      });

      dispatch({ type: SET_MANAGED_DATA, payload: updatedOrder });
    },
    [state.managedWalletsData],
  );

  const navigateToWallet = useCallback(
    (wallet: TWallet) => {
      Keyboard.dismiss();
      const walletID = wallet.getID();
      navigate('WalletTransactions', {
        walletID,
        walletType: wallet.type,
      });
    },
    [navigate],
  );

  const navigateToAddress = useCallback(
    (address: string) => {
      Keyboard.dismiss();

      navigate('ReceiveDetails', {
        address,
      });
    },
    [navigate],
  );

  const renderItem = useCallback(
    (info: DragListRenderItemInfo<Item>) => {
      const { item, onDragStart, isActive } = info;

      const compatibleState = {
        wallets: state.walletsCopy,
      };

      if (item.type === ItemType.WalletGroupSection) {
        return (
          <WalletGroupComponent
            wallet={item.wallet}
            transactions={item.transactions}
            addresses={item.addresses}
            state={compatibleState}
            navigateToWallet={navigateToWallet}
            navigateToAddress={navigateToAddress}
            renderHighlightedText={renderHighlightedText}
          />
        );
      }

      return (
        <ManageWalletsListItem
          item={item}
          onPressIn={undefined}
          onPressOut={undefined}
          isDraggingDisabled={false}
          state={compatibleState}
          navigateToWallet={navigateToWallet}
          navigateToAddress={navigateToAddress}
          renderHighlightedText={renderHighlightedText}
          handleDeleteWallet={handleDeleteWallet}
          handleToggleHideBalance={handleToggleHideBalance}
          isActive={isActive}
          drag={onDragStart}
        />
      );
    },
    [state.walletsCopy, navigateToWallet, navigateToAddress, renderHighlightedText, handleDeleteWallet, handleToggleHideBalance],
  );

  const onReordered = useCallback(
    (fromIndex: number, toIndex: number) => {
      const updatedOrder = [...state.managedWalletsData];
      const removed = updatedOrder.splice(fromIndex, 1);
      updatedOrder.splice(toIndex, 0, removed[0]);

      dispatch({ type: SET_MANAGED_DATA, payload: updatedOrder });
    },
    [state.managedWalletsData],
  );

  const keyExtractor = useCallback((item: Item, index: number) => index.toString(), []);

  return (
    <Suspense fallback={<ActivityIndicator size="large" color={colors.brandingColor} />}>
      <GestureHandlerRootView style={[{ backgroundColor: colors.background }, styles.root]}>
        <DragList
          automaticallyAdjustContentInsets
          automaticallyAdjustsScrollIndicatorInsets
          contentInsetAdjustmentBehavior="automatic"
          data={state.managedWalletsData}
          containerStyle={[{ backgroundColor: colors.background }, styles.root]}
          keyExtractor={keyExtractor}
          onReordered={onReordered}
          renderItem={renderItem}
          ref={listRef}
        />
      </GestureHandlerRootView>
    </Suspense>
  );
};

export default React.memo(ManageWallets);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // header styles
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
