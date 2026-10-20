import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Keyboard, Platform, StyleSheet, TouchableWithoutFeedback, View, TouchableOpacity, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlueFormLabel, BlueFormMultiInput, BlueText, Styles } from '../../BlueComponents';
import Button from '../../components/Button';
import {
  DoneAndDismissKeyboardInputAccessory,
  DoneAndDismissKeyboardInputAccessoryViewID,
} from '../../components/DoneAndDismissKeyboardInputAccessory';
import HeaderMenuButton from '../../components/HeaderMenuButton';
import { useTheme } from '../../components/themes';
import { useSettings } from '../../hooks/context/useSettings';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { useKeyboard } from '../../hooks/useKeyboard';
import loc from '../../loc';
import { CommonToolTipActions } from '../../typings/CommonToolTipActions';
import { AddWalletStackParamList } from '../../navigation/AddWalletStack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AddressInputScanButton } from '../../components/AddressInputScanButton';
import { useScreenProtect } from '../../hooks/useScreenProtect';
import SafeAreaScrollView from '../../components/SafeAreaScrollView';
import { BlueSpacing20 } from '../../components/BlueSpacing';
import CrossIcon from '../../img/icons/CrossIcon.tsx';

type RouteProps = RouteProp<AddWalletStackParamList, 'ImportWallet'>;
type NavigationProps = NativeStackNavigationProp<AddWalletStackParamList, 'ImportWallet'>;

const ImportWallet = () => {
  const navigation = useExtendedNavigation<NavigationProps>();
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const label = route?.params?.label ?? '';
  const triggerImport = route?.params?.triggerImport ?? false;
  const [importText, setImportText] = useState<string>(label);
  const [isToolbarVisibleForAndroid, setIsToolbarVisibleForAndroid] = useState<boolean>(false);
  const [, setSpeedBackdoor] = useState<number>(0);
  const [searchAccountsMenuState, setSearchAccountsMenuState] = useState<boolean>(false);
  const [askPassphraseMenuState, setAskPassphraseMenuState] = useState<boolean>(false);
  const [clearClipboardMenuState, setClearClipboardMenuState] = useState<boolean>(true);
  const { isPrivacyBlurEnabled } = useSettings();
  const { enableScreenProtect, disableScreenProtect } = useScreenProtect();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const styleHook = StyleSheet.create({
    header: {
      backgroundColor: colors.elevated,
      paddingTop: Platform.select({ ios: 16, android: insets.top + 8 }),
    },
  });

  const onBlur = useCallback(() => {
    const valueWithSingleWhitespace = importText.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
    setImportText(valueWithSingleWhitespace);
    return valueWithSingleWhitespace;
  }, [importText]);

  useKeyboard({
    onKeyboardDidShow: () => {
      setIsToolbarVisibleForAndroid(true);
    },
    onKeyboardDidHide: () => {
      setIsToolbarVisibleForAndroid(false);
    },
  });

  const importMnemonic = useCallback(
    async (text: string) => {
      if (clearClipboardMenuState) {
        try {
          if (await Clipboard.hasString()) {
            Clipboard.setString('');
          }
        } catch (error) {
          console.error('Failed to clear clipboard:', error);
        }
      }

      Keyboard.dismiss();

      navigation.navigate('ImportWalletDiscovery', {
        importText: text,
        askPassphrase: askPassphraseMenuState,
        searchAccounts: searchAccountsMenuState,
      });
    },

    [askPassphraseMenuState, clearClipboardMenuState, navigation, searchAccountsMenuState],
  );

  const handleImport = useCallback(() => {
    const textToImport = onBlur();
    if (textToImport.trim().length === 0) {
      return;
    }
    importMnemonic(textToImport);
  }, [importMnemonic, onBlur]);

  const onBarScanned = useCallback(
    (value: string | { data: any }) => {
      // no objects here, only strings
      const newValue: string = typeof value !== 'string' ? value.data + '' : value;
      setImportText(newValue);
      setTimeout(() => importMnemonic(newValue), 500);
    },
    [importMnemonic],
  );

  useEffect(() => {
    const data = route.params?.onBarScanned;
    if (data) {
      onBarScanned(data);
      navigation.setParams({ onBarScanned: undefined });
    }
  }, [route.name, onBarScanned, route.params?.onBarScanned, navigation]);

  const speedBackdoorTap = () => {
    setSpeedBackdoor(v => {
      v += 1;
      if (v < 5) return v;
      navigation.navigate('ImportSpeed');
      return 0;
    });
  };

  const toolTipOnPressMenuItem = useCallback(
    (menuItem: string) => {
      Keyboard.dismiss();
      if (menuItem === CommonToolTipActions.Passphrase.id) {
        setAskPassphraseMenuState(!askPassphraseMenuState);
      } else if (menuItem === CommonToolTipActions.SearchAccount.id) {
        setSearchAccountsMenuState(!searchAccountsMenuState);
      } else if (menuItem === CommonToolTipActions.ClearClipboard.id) {
        setClearClipboardMenuState(!clearClipboardMenuState);
      }
    },
    [askPassphraseMenuState, clearClipboardMenuState, searchAccountsMenuState],
  );

  // ToolTipMenu actions for advanced options
  const toolTipActions = useMemo(() => {
    return [
      { ...CommonToolTipActions.Passphrase, menuState: askPassphraseMenuState },
      { ...CommonToolTipActions.SearchAccount, menuState: searchAccountsMenuState },
      { ...CommonToolTipActions.ClearClipboard, menuState: clearClipboardMenuState },
    ];
  }, [askPassphraseMenuState, clearClipboardMenuState, searchAccountsMenuState]);

  const Header = useMemo(
    () => (
      <View style={[styles.headerContainer, styleHook.header]}>
        <TouchableOpacity
          testID="NavigationCloseButton"
          accessibilityRole="button"
          style={[styles.buttonCross, { backgroundColor: colors.lightButton }]}
          onPress={navigation.goBack}
        >
          <View style={styles.iconContainer}>
            <CrossIcon color={colors.foregroundColor} size={28} />
          </View>
        </TouchableOpacity>
        <BlueText style={styles.title}>{loc.wallets.import_title}</BlueText>
        <HeaderMenuButton onPressMenuItem={toolTipOnPressMenuItem} actions={toolTipActions} />
      </View>
    ),
    [styleHook.header, colors.lightButton, colors.foregroundColor, navigation.goBack, toolTipOnPressMenuItem, toolTipActions],
  );

  useEffect(() => {
    if (isPrivacyBlurEnabled) {
      enableScreenProtect();
    }
    return () => {
      disableScreenProtect();
    };
  }, [isPrivacyBlurEnabled, enableScreenProtect, disableScreenProtect]);

  useEffect(() => {
    if (triggerImport) handleImport();
  }, [triggerImport, handleImport]);

  useEffect(() => {
    navigation.setOptions({
      header: () => Header,
      statusBarStyle: Platform.select({ ios: 'light', default: colorScheme === 'dark' ? 'light' : 'dark' }),
    });
  }, [Header, navigation, colorScheme]);

  const renderOptionsAndImportButton = (
    <>
      <BlueSpacing20 />
      <View style={[styles.center, { backgroundColor: colors.elevated }]}>
        <>
          <Button disabled={importText.trim().length === 0} title={loc.wallets.import_do_import} testID="DoImport" onPress={handleImport} />
          <BlueSpacing20 />
          <AddressInputScanButton type="link" onChangeText={setImportText} testID="ScanImport" />
        </>
      </View>
    </>
  );

  return (
    <SafeAreaScrollView
      contentContainerStyle={[styles.root, { backgroundColor: colors.elevated }]}
      keyboardShouldPersistTaps="always"
      automaticallyAdjustKeyboardInsets
    >
      <BlueSpacing20 />
      <TouchableWithoutFeedback accessibilityRole="button" onPress={speedBackdoorTap} testID="SpeedBackdoor">
        <BlueFormLabel>{loc.wallets.import_explanation}</BlueFormLabel>
      </TouchableWithoutFeedback>
      <BlueSpacing20 />
      <BlueFormMultiInput
        value={importText}
        onBlur={onBlur}
        onChangeText={setImportText}
        testID="MnemonicInput"
        inputAccessoryViewID={DoneAndDismissKeyboardInputAccessoryViewID}
      />

      {Platform.select({ android: !isToolbarVisibleForAndroid && renderOptionsAndImportButton, default: renderOptionsAndImportButton })}
      {Platform.select({
        ios: (
          <DoneAndDismissKeyboardInputAccessory
            onClearTapped={() => {
              setImportText('');
            }}
            onPasteTapped={text => {
              setImportText(text);
              Keyboard.dismiss();
            }}
          />
        ),
        default: null,
      })}
    </SafeAreaScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingTop: 10,
    flex: 1,
  },
  center: {
    flex: 1,
    marginHorizontal: 16,
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

export default ImportWallet;
