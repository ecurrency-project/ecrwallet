import { RouteProp, useFocusEffect, useLocale, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo } from 'react';
import { BackHandler, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import { useTheme } from '../../components/themes';
import { useSettings } from '../../hooks/context/useSettings';
import { useStorage } from '../../hooks/context/useStorage';
import loc from '../../loc';
import { AddWalletStackParamList } from '../../navigation/AddWalletStack';
import SeedWords from '../../components/SeedWords';
import { useScreenProtect } from '../../hooks/useScreenProtect';
import { BlueText, Styles } from '../../BlueComponents';
import ArrowLeftIcon from '../../img/icons/ArrowLeftIcon.tsx';

type RouteProps = RouteProp<AddWalletStackParamList, 'PleaseBackup'>;
type NavigationProp = NativeStackNavigationProp<AddWalletStackParamList, 'PleaseBackup'>;

const PleaseBackup: React.FC = () => {
  const { wallets } = useStorage();
  const { walletID } = useRoute<RouteProps>().params;
  const wallet = wallets.find(w => w.getID() === walletID)!;
  const navigation = useNavigation<NavigationProp>();
  const { isPrivacyBlurEnabled } = useSettings();
  const { colors } = useTheme();
  const { direction } = useLocale();
  const { enableScreenProtect, disableScreenProtect } = useScreenProtect();
  const insets = useSafeAreaInsets();

  const stylesHook = StyleSheet.create({
    flex: {
      backgroundColor: colors.elevated,
      paddingTop: Platform.select({ ios: 16, android: insets.top + 8 }),
    },
    pleaseText: {
      color: colors.foregroundColor,
      writingDirection: direction,
    },
    button: {
      backgroundColor: colors.lightButton,
    },
  });

  const Header = useMemo(() => {
    return (
      <View style={[styles.headerContainer, stylesHook.flex]}>
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
        <BlueText style={styles.title}>{loc.pleasebackup.title}</BlueText>
        <View style={styles.emptyBlock} />
      </View>
    );
  }, [colors, navigation.goBack, stylesHook]);

  const handleBackButton = useCallback(() => {
    navigation.getParent()?.goBack();
    return true;
  }, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      header: () => Header,
    });
  }, [Header, navigation]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackButton);

    return () => {
      subscription.remove();
    };
  }, [handleBackButton]);

  useFocusEffect(
    useCallback(() => {
      if (isPrivacyBlurEnabled) enableScreenProtect();
      return () => {
        disableScreenProtect();
      };
    }, [disableScreenProtect, enableScreenProtect, isPrivacyBlurEnabled]),
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.flex, stylesHook.flex]}
      testID="PleaseBackupScrollView"
      automaticallyAdjustContentInsets
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.please}>
        <BlueText style={[styles.pleaseText, stylesHook.pleaseText]}>{loc.pleasebackup.text}</BlueText>
      </View>
      <View style={styles.list}>
        <SeedWords seed={wallet.getSecret() ?? ''} />
      </View>
      <View style={styles.bottom}>
        <Button testID="PleasebackupOk" onPress={handleBackButton} title={loc.pleasebackup.ok} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
    justifyContent: 'space-around',
  },
  please: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  list: {
    flexGrow: 8,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  bottom: {
    flexGrow: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pleaseText: {
    marginVertical: 16,
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

export default PleaseBackup;
