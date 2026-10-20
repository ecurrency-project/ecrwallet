import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigationState, useRoute, RouteProp } from '@react-navigation/native';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import triggerHapticFeedback, { HapticFeedbackTypes } from '../../blue_modules/hapticFeedback';
import { BlueText, Styles } from '../../BlueComponents';
import SafeArea from '../../components/SafeArea';
import { useTheme } from '../../components/themes';
import loc from '../../loc';
import { Chain } from '../../models/bitcoinUnits';
import { useStorage } from '../../hooks/context/useStorage';
import WalletsCarousel from '../../components/WalletsCarousel';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { TWallet } from '../../class/wallets/types';
import { pop } from '../../NavigationService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SendDetailsStackParamList } from '../../navigation/SendDetailsStackParamList';
import { BlueSpacing20 } from '../../components/BlueSpacing';
import ArrowLeftIcon from '../../img/icons/ArrowLeftIcon.tsx';

type NavigationProps = NativeStackNavigationProp<SendDetailsStackParamList, 'SelectWallet'>;

type RouteProps = RouteProp<SendDetailsStackParamList, 'SelectWallet'>;

const SelectWallet: React.FC = () => {
  const route = useRoute<RouteProps>();
  const {
    chainType,
    onWalletSelect,
    availableWallets,
    noWalletExplanationText,
    onChainRequireSend = false,
    selectedWalletID,
  } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useExtendedNavigation<NavigationProps>();
  const { wallets } = useStorage();
  const { colors } = useTheme();
  const isModal = useNavigationState(state => state.routes.length > 1);
  const walletsCarousel = useRef<any>(null);
  const previousRouteName = useNavigationState(state => state.routes[state.routes.length - 2]?.name);
  const [filteredWallets, setFilteredWallets] = useState<TWallet[]>([]);
  const insets = useSafeAreaInsets();

  const stylesHook = StyleSheet.create({
    loading: {
      backgroundColor: colors.background,
    },
    button: {
      backgroundColor: colors.lightButton,
    },
    header: {
      backgroundColor: colors.elevated,
      paddingTop: Platform.select({ ios: 16, android: insets.top + 8 }),
    },
  });

  const filterWallets = useCallback(() => {
    if (availableWallets && availableWallets.length > 0) {
      return availableWallets;
    }

    if (!onChainRequireSend && chainType === Chain.ONCHAIN) {
      return wallets.filter(item => item.chain === Chain.ONCHAIN);
    }

    if (chainType) {
      return wallets.filter(item => item.chain === chainType && item.allowSend());
    }

    return wallets.filter(item => item.allowSend());
  }, [availableWallets, chainType, onChainRequireSend, wallets]);

  const Header = useMemo(
    () => (
      <View style={[styles.headerContainer, stylesHook.header]}>
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.buttonCross, stylesHook.button]}
          onPress={navigation.goBack}
        >
          <View style={styles.iconContainer}>
            <ArrowLeftIcon color={colors.foregroundColor} size={24} />
          </View>
        </TouchableOpacity>
        <BlueText style={styles.title}>{loc.wallets.select_wallet}</BlueText>
        <View style={styles.emptyBlock} />
      </View>
    ),
    [stylesHook, navigation, colors],
  );

  // Initialize filtered wallets and handle loading state
  useEffect(() => {
    const filtered = filterWallets();
    setFilteredWallets(filtered);
    setIsLoading(false);
  }, [filterWallets]);

  // Scroll to the selected wallet if provided
  useEffect(() => {
    if (!isLoading && selectedWalletID && walletsCarousel.current) {
      const walletIndex = filteredWallets.findIndex(wallet => wallet.getID() === selectedWalletID);

      if (walletIndex !== -1) {
        // Add a slight delay to ensure the carousel is fully rendered
        setTimeout(() => {
          if (walletsCarousel.current) {
            walletsCarousel.current.scrollToIndex({
              index: walletIndex,
              animated: true,
              viewPosition: 0.5, // Center the item
            });
          }
        }, 200);
      } else {
        console.log(`Wallet with ID ${selectedWalletID} not found in filtered wallets`);
      }
    }
  }, [isLoading, selectedWalletID, filteredWallets]);

  useEffect(() => {
    navigation.setOptions({
      statusBarStyle: isLoading || filteredWallets.length === 0 ? 'light' : 'auto',
    });
  }, [isLoading, filteredWallets, navigation]);

  useEffect(() => {
    navigation.setOptions({
      header: () => Header,
    });
  }, [navigation, Header]);

  useEffect(() => {
    if (!isModal) {
      navigation.setOptions({ headerBackVisible: false });
    }
  }, [isModal, navigation]);

  const onPress = (item: TWallet) => {
    triggerHapticFeedback(HapticFeedbackTypes.Selection);
    if (onWalletSelect) {
      // @ts-ignore idk how to fix
      onWalletSelect(item, { navigation: { pop, navigate: navigation.navigate } });
    } else {
      // @ts-ignore: fix later
      navigation.popTo(previousRouteName, { walletID: item.getID(), merge: true });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loading, stylesHook.loading]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (filteredWallets.length <= 0) {
    return (
      <SafeArea>
        <View style={styles.noWallets}>
          <BlueText style={styles.center}>{loc.wallets.select_no_bitcoin}</BlueText>
          <BlueSpacing20 />
          <BlueText style={styles.center}>{noWalletExplanationText || loc.wallets.select_no_bitcoin_exp}</BlueText>
        </View>
      </SafeArea>
    );
  }

  return (
    <WalletsCarousel
      data={filteredWallets}
      scrollEnabled
      onPress={onPress}
      ref={walletsCarousel}
      testID="SelectWalletsList"
      horizontal={false}
      style={styles.walletsCarousel}
      animateChanges={true}
    />
  );
};

export default SelectWallet;

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
    paddingTop: 20,
  },

  noWallets: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  center: {
    textAlign: 'center',
  },
  walletsCarousel: {
    flex: 1,
    paddingHorizontal: 16,
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
});
