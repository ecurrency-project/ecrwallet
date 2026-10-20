import React from 'react';
import { Alert, Linking, Platform, StyleSheet, View } from 'react-native';
import { getApplicationName, getBuildNumber, getBundleId, getUniqueIdSync, getVersion, hasGmsSync } from 'react-native-device-info';
import Rate, { AndroidMarket } from 'react-native-rate';
import { BlueCard, BlueText, BlueTextCentered, Styles } from '../../BlueComponents';
import { HDECurrencyWallet } from '../../class';
import presentAlert from '../../components/Alert';
import Button from '../../components/Button';
import ListItem from '../../components/ListItem';
import { useTheme } from '../../components/themes';
import loc, { formatStringAddTwoWhiteSpaces } from '../../loc';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { useSettings } from '../../hooks/context/useSettings';
import SafeAreaScrollView from '../../components/SafeAreaScrollView';
import { BlueSpacing20 } from '../../components/BlueSpacing';
import LogoIcon from '../../img/icons/LogoIcon.tsx';

const About: React.FC = () => {
  const { navigate } = useExtendedNavigation();
  const { colors } = useTheme();
  const { isElectrumDisabled } = useSettings();

  const stylesHook = StyleSheet.create({
    textBackup: {
      color: colors.foregroundColor,
    },
  });

  const handleOnSelfTestPress = () => {
    if (isElectrumDisabled) {
      presentAlert({ message: loc.settings.about_selftest_electrum_disabled });
    } else {
      navigate('SelfTest');
    }
  };

  const handleOnLicensingPress = () => {
    navigate('Licensing');
  };

  const handleOnTwitterPress = () => {
    Linking.openURL('https://x.com/eCurrencyECR');
  };

  const handleOnLinkedinPress = () => {
    Linking.openURL('https://www.linkedin.com/company/ecurrency-ecr/');
  };

  const handleOnTelegramPress = () => {
    Linking.openURL('https://t.me/ECReCurrency');
  };

  const handleOnRatePress = () => {
    const options = {
      AppleAppID: '1376878040', // todo change id after publish
      GooglePackageName: 'ecurrency.org.ecrwallet',
      preferredAndroidMarket: AndroidMarket.Google,
      preferInApp: Platform.OS !== 'android',
      openAppStoreIfInAppFails: true,
      fallbackPlatformURL: 'https://bluewallet.io',
    };
    Rate.rate(options, success => {
      if (success) {
        console.log('User Rated.');
      }
    });
  };

  return (
    <SafeAreaScrollView
      contentContainerStyle={styles.container}
      testID="AboutScrollView"
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustContentInsets
    >
      <BlueCard>
        <View style={styles.center}>
          <LogoIcon size={100} />
          <BlueText style={[styles.textBackup, stylesHook.textBackup]}>{formatStringAddTwoWhiteSpaces(loc.settings.about_backup)}</BlueText>
          {((Platform.OS === 'android' && hasGmsSync()) || Platform.OS !== 'android') && (
            <Button onPress={handleOnRatePress} title={loc.settings.about_review + ' ⭐🙏'} />
          )}
        </View>
      </BlueCard>
      <ListItem
        leftIcon={{
          name: 'twitter',
          type: 'font-awesome',
          color: '#1da1f2',
        }}
        onPress={handleOnTwitterPress}
        title={loc.settings.about_sm_twitter}
      />
      <ListItem
        leftIcon={{
          name: 'telegram',
          type: 'font-awesome',
          color: '#0088cc',
        }}
        onPress={handleOnTelegramPress}
        title={loc.settings.about_sm_telegram}
      />
      <ListItem
        leftIcon={{
          name: 'linkedin',
          type: 'font-awesome-5',
          color: '#0b66c2',
        }}
        onPress={handleOnLinkedinPress}
        title="LinkedIn"
      />
      <ListItem
        leftIcon={{
          name: 'balance-scale',
          type: 'font-awesome',
          color: colors.foregroundColor,
        }}
        chevron
        onPress={handleOnLicensingPress}
        title={loc.settings.about_license}
      />
      <ListItem
        leftIcon={{
          name: 'flask',
          type: 'font-awesome',
          color: '#FC0D44',
        }}
        chevron
        onPress={handleOnSelfTestPress}
        testID="RunSelfTestButton"
        title={loc.settings.about_selftest}
      />
      <ListItem
        leftIcon={{
          name: 'flask',
          type: 'font-awesome',
          color: '#FC0D44',
        }}
        chevron
        onPress={async () => {
          const secret = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
          const w = new HDECurrencyWallet();
          w.setSecret(secret);

          const start = Date.now();
          let num;
          for (num = 0; num < 1000; num++) {
            w._getExternalAddressByIndex(num);
            if (Date.now() - start > 10 * 1000) {
              break;
            }
          }

          Alert.alert(loc.formatString(loc.settings.performance_score, { num }));
        }}
        title={loc.settings.run_performance_test}
      />
      <BlueSpacing20 />
      <BlueSpacing20 />
      <BlueTextCentered>
        {getApplicationName()} ver {getVersion()} (build {getBuildNumber()})
      </BlueTextCentered>
      <BlueTextCentered>{getBundleId()}</BlueTextCentered>
      <BlueTextCentered>Unique ID: {getUniqueIdSync()}</BlueTextCentered>
      <BlueSpacing20 />
      <BlueSpacing20 />
    </SafeAreaScrollView>
  );
};

export default About;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 54,
    gap: 12,
  },
  textBackup: {
    ...Styles.fonts['P2 Bold'],
    maxWidth: 260,
    marginBottom: 40,
    textAlign: 'center',
  },
});
