import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { openSettings } from 'react-native-permissions';
import { Header } from '../../components/Header';
import ListItem, { PressableWrapper } from '../../components/ListItem';
import { useTheme } from '../../components/themes';
import loc from '../../loc';
import { useStorage } from '../../hooks/context/useStorage';
import { useSettings } from '../../hooks/context/useSettings';
import { isDesktop } from '../../blue_modules/environment';
import SafeAreaScrollView from '../../components/SafeAreaScrollView';
import { BlueSpacing20 } from '../../components/BlueSpacing';
import NavigationItem from '../../components/NavigationItem.tsx';
import { BlueText, Styles } from '../../BlueComponents';

enum SettingsPrivacySection {
  None,
  All,
  ReadClipboard,
  QuickActions,
  Widget,
  TemporaryScreenshots,
  TotalBalance,
}

const SettingsPrivacy: React.FC = () => {
  const { colors } = useTheme();
  const { isStorageEncrypted, wallets } = useStorage();
  const {
    isDoNotTrackEnabled,
    setDoNotTrackStorage,
    isPrivacyBlurEnabled,
    setIsPrivacyBlurEnabled,
    isWidgetBalanceDisplayAllowed,
    setIsWidgetBalanceDisplayAllowedStorage,
    isClipboardGetContentEnabled,
    setIsClipboardGetContentEnabledStorage,
    isQuickActionsEnabled,
    setIsQuickActionsEnabledStorage,
    isTotalBalanceEnabled,
    setIsTotalBalanceEnabledStorage,
  } = useSettings();
  const [isLoading, setIsLoading] = useState<number>(SettingsPrivacySection.All);

  const [storageIsEncrypted, setStorageIsEncrypted] = useState<boolean>(true);
  const styleHooks = StyleSheet.create({
    root: {
      backgroundColor: colors.background,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        setStorageIsEncrypted(await isStorageEncrypted());
      } catch (e) {
        console.log(e);
      }
      setIsLoading(SettingsPrivacySection.None);
    })();
  }, [isStorageEncrypted]);

  const onDoNotTrackValueChange = async (value: boolean) => {
    setIsLoading(SettingsPrivacySection.All);
    try {
      setDoNotTrackStorage(value);
    } catch (e) {
      console.debug('onDoNotTrackValueChange catch', e);
    }
    setIsLoading(SettingsPrivacySection.None);
  };

  const onQuickActionsValueChange = async (value: boolean) => {
    setIsLoading(SettingsPrivacySection.QuickActions);
    try {
      setIsQuickActionsEnabledStorage(value);
    } catch (e) {
      console.debug('onQuickActionsValueChange catch', e);
    }
    setIsLoading(SettingsPrivacySection.None);
  };

  const onWidgetsTotalBalanceValueChange = async (value: boolean) => {
    setIsLoading(SettingsPrivacySection.Widget);
    try {
      setIsWidgetBalanceDisplayAllowedStorage(value);
    } catch (e) {
      console.debug('onWidgetsTotalBalanceValueChange catch', e);
    }
    setIsLoading(SettingsPrivacySection.None);
  };

  const onTotalBalanceEnabledValueChange = async (value: boolean) => {
    setIsLoading(SettingsPrivacySection.TotalBalance);
    try {
      setIsTotalBalanceEnabledStorage(value);
    } catch (e) {
      console.debug('onTotalBalanceEnabledValueChange catch', e);
    }
    setIsLoading(SettingsPrivacySection.None);
  };

  const onTemporaryScreenshotsValueChange = (value: boolean) => {
    setIsLoading(SettingsPrivacySection.TemporaryScreenshots);
    setIsPrivacyBlurEnabled(!value);
    setIsLoading(SettingsPrivacySection.None);
  };

  const openApplicationSettings = () => {
    openSettings();
  };

  return (
    <SafeAreaScrollView style={[styles.root, styleHooks.root]} contentInsetAdjustmentBehavior="automatic" automaticallyAdjustContentInsets>
      {Platform.OS === 'android' ? (
        <View style={styles.headerContainer}>
          <Header leftText={loc.settings.general} />
        </View>
      ) : null}

      <ListItem
        title={loc.settings.privacy_read_clipboard}
        Component={TouchableWithoutFeedback}
        switch={{
          onValueChange: setIsClipboardGetContentEnabledStorage,
          value: isClipboardGetContentEnabled,
          disabled: isLoading === SettingsPrivacySection.All,
          testID: 'ClipboardSwitch',
        }}
        // subtitle={loc.settings.privacy_clipboard_explanation}
        subtitle={<BlueText style={styles.subtitleText}>{loc.settings.privacy_clipboard_explanation}</BlueText>}
      />

      <ListItem
        title={loc.settings.privacy_quickactions}
        Component={TouchableWithoutFeedback}
        switch={{
          onValueChange: onQuickActionsValueChange,
          value: storageIsEncrypted ? false : isQuickActionsEnabled,
          disabled: isLoading === SettingsPrivacySection.All || storageIsEncrypted,
          testID: 'QuickActionsSwitch',
        }}
        subtitle={
          <>
            <BlueText style={styles.subtitleText}>{loc.settings.privacy_quickactions_explanation}</BlueText>
            {storageIsEncrypted && <BlueText style={styles.subtitleText}>{loc.settings.encrypted_feature_disabled}</BlueText>}
          </>
        }
      />

      <ListItem
        title={loc.total_balance_view.title}
        Component={PressableWrapper}
        switch={{
          onValueChange: onTotalBalanceEnabledValueChange,
          value: isTotalBalanceEnabled,
          disabled: isLoading === SettingsPrivacySection.All || wallets.length < 2,
          testID: 'TotalBalanceSwitch',
        }}
        subtitle={<BlueText style={styles.subtitleText}>{loc.total_balance_view.explanation}</BlueText>}
      />

      {!isDesktop && (
        <ListItem
          title={loc.settings.privacy_temporary_screenshots}
          Component={TouchableWithoutFeedback}
          switch={{
            onValueChange: onTemporaryScreenshotsValueChange,
            value: !isPrivacyBlurEnabled,
            disabled: isLoading === SettingsPrivacySection.All,
          }}
          subtitle={<BlueText style={styles.subtitleText}>{loc.settings.privacy_temporary_screenshots_instructions}</BlueText>}
        />
      )}

      <ListItem
        title={loc.settings.privacy_do_not_track}
        Component={TouchableWithoutFeedback}
        switch={{
          onValueChange: onDoNotTrackValueChange,
          value: isDoNotTrackEnabled,
          disabled: isLoading === SettingsPrivacySection.All,
        }}
        subtitle={<BlueText style={styles.subtitleText}>{loc.settings.privacy_do_not_track_explanation}</BlueText>}
      />

      {Platform.OS === 'ios' && (
        <>
          <BlueSpacing20 />
          <Header leftText={loc.settings.widgets} />
          <ListItem
            title={loc.settings.total_balance}
            Component={TouchableWithoutFeedback}
            switch={{
              onValueChange: onWidgetsTotalBalanceValueChange,
              value: storageIsEncrypted ? false : isWidgetBalanceDisplayAllowed,
              disabled: isLoading === SettingsPrivacySection.All || storageIsEncrypted,
            }}
            subtitle={
              <>
                <BlueText style={styles.subtitleText}>{loc.settings.total_balance_explanation}</BlueText>
                {storageIsEncrypted && <BlueText style={styles.subtitleText}>{loc.settings.encrypted_feature_disabled}</BlueText>}
              </>
            }
          />
        </>
      )}

      <NavigationItem title={loc.settings.privacy_system_settings} onPress={openApplicationSettings} />
    </SafeAreaScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
  },

  headerContainer: {
    paddingVertical: 16,
  },
  subtitleText: {
    ...Styles.fonts['P2 Regular'],
    marginTop: 5,
  },
});

export default SettingsPrivacy;
