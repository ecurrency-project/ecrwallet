import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlueFormLabel, BlueFormMultiInput, BlueText, Styles } from '../../BlueComponents';
import { HDSegwitBech32Wallet, WatchOnlyWallet } from '../../class';
import presentAlert from '../../components/Alert';
import Button from '../../components/Button';
import SafeArea from '../../components/SafeArea';
import { useTheme } from '../../components/themes';
import { useStorage } from '../../hooks/context/useStorage';
import { AddWalletStackParamList } from '../../navigation/AddWalletStack';
import { BlueSpacing20 } from '../../components/BlueSpacing';
import loc from '../../loc';
import ArrowLeftIcon from '../../img/icons/ArrowLeftIcon.tsx';

type NavigationProp = NativeStackNavigationProp<AddWalletStackParamList, 'ImportSpeed'>;

const ImportSpeed = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [walletType, setWalletType] = useState<string>('');
  const [passphrase, setPassphrase] = useState<string>('');
  const { addAndSaveWallet } = useStorage();
  const insets = useSafeAreaInsets();

  const stylesHook = StyleSheet.create({
    root: {
      backgroundColor: colors.elevated,
      paddingTop: Platform.select({ ios: 16, android: insets.top + 8 }),
    },
    input: {
      borderColor: colors.formBorder,
      borderBottomColor: colors.formBorder,
      backgroundColor: colors.inputBackgroundColor,
    },
    inputText: {
      color: colors.foregroundColor,
    },
  });

  const importMnemonic = async () => {
    setLoading(true);
    try {
      let WalletClass;
      switch (walletType) {
        case HDSegwitBech32Wallet.type:
          WalletClass = HDSegwitBech32Wallet;
          break;
        case WatchOnlyWallet.type:
          WalletClass = WatchOnlyWallet;
          break;
      }

      if (!WalletClass) {
        throw new Error('Invalid wallet type');
      }

      const wallet = new WalletClass();
      wallet.setSecret(importText);
      // check wallet is type of HDSegwitBech32Wallet
      if (passphrase && wallet instanceof HDSegwitBech32Wallet) {
        wallet.setPassphrase(passphrase);
      }
      await wallet.fetchBalance();
      navigation.getParent()?.goBack();
      addAndSaveWallet(wallet);
    } catch (e: any) {
      presentAlert({ message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const Header = useMemo(
    () => (
      <View style={[styles.headerContainer, stylesHook.root]}>
        <TouchableOpacity
          testID="NavigationCloseButton"
          accessibilityRole="button"
          style={[styles.buttonCross, { backgroundColor: colors.lightButton }]}
          onPress={navigation.goBack}
        >
          <View style={styles.iconContainer}>
            <ArrowLeftIcon color={colors.foregroundColor} size={24} />
          </View>
        </TouchableOpacity>
        <BlueText style={styles.title}>{loc.wallets.import_title}</BlueText>
        <View style={styles.emptyBlock} />
      </View>
    ),
    [colors, navigation, stylesHook.root],
  );

  useEffect(() => {
    navigation.setOptions({
      header: () => Header,
    });
  }, [Header, navigation]);

  return (
    <SafeArea style={[styles.root, { backgroundColor: colors.elevated }]}>
      <BlueSpacing20 />
      <BlueFormLabel>Mnemonic</BlueFormLabel>
      <BlueFormMultiInput testID="SpeedMnemonicInput" value={importText} onChangeText={setImportText} />
      <BlueSpacing20 />
      <BlueFormLabel>Wallet type</BlueFormLabel>

      <View style={[styles.input, stylesHook.input]}>
        <TextInput
          testID="SpeedWalletTypeInput"
          value={walletType}
          style={[styles.pathInput, stylesHook.inputText]}
          onChangeText={setWalletType}
        />
      </View>
      <BlueFormLabel>Passphrase</BlueFormLabel>
      <View style={[styles.input, stylesHook.input]}>
        <TextInput
          testID="SpeedPassphraseInput"
          value={passphrase}
          style={[styles.pathInput, stylesHook.inputText]}
          onChangeText={setPassphrase}
        />
      </View>
      <BlueSpacing20 />
      <View style={[styles.center, { backgroundColor: colors.elevated }]}>
        <Button disabled={loading} testID="SpeedDoImport" title="Import" onPress={importMnemonic} />
        {loading && <ActivityIndicator />}
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingTop: 40,
  },
  center: {
    flex: 1,
    marginHorizontal: 16,
  },
  input: {
    flexDirection: 'row',
    borderWidth: 1,
    minHeight: 44,
    height: 44,
    marginHorizontal: 20,
    alignItems: 'center',
    marginVertical: 8,
    borderRadius: 24,
  },
  pathInput: {
    color: '#81868e',
    ...Styles.fonts['P2 Regular'],
    flex: 1,
    marginHorizontal: 24,
  },
  emptyBlock: {
    width: 38,
  },

  // Header styles
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

export default ImportSpeed;
