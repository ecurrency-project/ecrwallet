import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import DefaultPreference from 'react-native-default-preference';

import * as BlueElectrum from '../../blue_modules/BlueElectrum';
import triggerHapticFeedback, { HapticFeedbackTypes, triggerSelectionHapticFeedback } from '../../blue_modules/hapticFeedback';
import presentAlert from '../../components/Alert';
import { SettingsSection, SettingsScrollView, settingsCardContent } from '../../components/SettingsSection';
import { useTheme } from '../../components/themes';
import { useSettings } from '../../hooks/context/useSettings';
import { useKeyboard } from '../../hooks/useKeyboard';
import loc from '../../loc';
import { BlueText, Styles } from '../../BlueComponents';

export interface ElectrumServerItem {
  host: string;
  tcp?: number;
  ssl?: number;
}

const ElectrumSettings: React.FC = () => {
  const { colors } = useTheme();
  const [config, setConfig] = useState<{ connected?: number; host?: string; port?: string }>({});
  const [serverBanner, setServerBanner] = useState<string>('');
  const { setIsElectrumDisabled, isElectrumDisabled } = useSettings();
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef<number>(0);

  const { height: keyboardHeight, isVisible: isKeyboardVisible } = useKeyboard();
  const androidKeyboardInset = Platform.OS === 'android' && isKeyboardVisible ? keyboardHeight + 24 : 0;

  const stylesHook = StyleSheet.create({
    containerConnected: {
      backgroundColor: colors.feeLabel,
    },
    containerDisconnected: {
      backgroundColor: colors.redBG,
    },
    textConnected: {
      color: colors.feeValue,
    },
    textDisconnected: {
      color: colors.redText,
    },
    hostname: {
      color: colors.foregroundColor,
    },
    bannerText: {
      color: colors.foregroundColor,
    },
  });

  const configIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    const serverHistoryStr = (await DefaultPreference.get(BlueElectrum.ELECTRUM_SERVER_HISTORY)) as string;

    const parsedServerHistory: ElectrumServerItem[] = serverHistoryStr ? JSON.parse(serverHistoryStr) : [];

    const newServerHistoryArray: ElectrumServerItem[] = [];
    for (const item of parsedServerHistory) {
      const existing = newServerHistoryArray.find(s => s.host === item.host && s.tcp === item.tcp && s.ssl === item.ssl);
      if (!existing) {
        newServerHistoryArray.push(item);
      }
    }

    setConfig(await BlueElectrum.getConfig());
    configIntervalRef.current = setInterval(async () => {
      setConfig(await BlueElectrum.getConfig());
    }, 500);

    return () => {
      if (configIntervalRef.current) clearInterval(configIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    fetchData();
    return () => {
      if (configIntervalRef.current) clearInterval(configIntervalRef.current);
    };
  }, [fetchData]);

  // Fetch banner when connected
  useEffect(() => {
    if (config.connected === 1 && config.host && !isElectrumDisabled) {
      BlueElectrum.getServerBanner()
        .then(setServerBanner)
        .catch(() => setServerBanner(''));
    } else {
      setServerBanner('');
    }
  }, [config.connected, config.host, config.port, isElectrumDisabled]);

  const checkServer = async () => {
    try {
      const features = await BlueElectrum.serverFeatures();
      triggerHapticFeedback(HapticFeedbackTypes.NotificationWarning);
      presentAlert({ message: JSON.stringify(features, null, 2) });
    } catch (error) {
      triggerHapticFeedback(HapticFeedbackTypes.NotificationError);
      presentAlert({ message: (error as Error).message });
    }
  };

  const onElectrumConnectionEnabledSwitchChange = async (value: boolean) => {
    try {
      triggerSelectionHapticFeedback();
      await BlueElectrum.setDisabled(value);
      setIsElectrumDisabled(value);
    } catch (error) {
      triggerHapticFeedback(HapticFeedbackTypes.NotificationError);
      presentAlert({ message: (error as Error).message });
    }
  };

  const renderElectrumSettings = () => {
    return (
      <>
        <SettingsSection title={loc.settings.electrum_status}>
          <View style={settingsCardContent}>
            <View style={styles.connectWrap}>
              <View style={[styles.container, config.connected === 1 ? stylesHook.containerConnected : stylesHook.containerDisconnected]}>
                <BlueText
                  style={[styles.textConnectionStatus, config.connected === 1 ? stylesHook.textConnected : stylesHook.textDisconnected]}
                >
                  {config.connected === 1 ? loc.settings.electrum_connected : loc.settings.electrum_connected_not}
                </BlueText>
              </View>
            </View>
            <BlueText style={[styles.hostname, stylesHook.hostname]} onPress={checkServer} selectable>
              {config.host}:{config.port}
            </BlueText>

            {serverBanner.length > 0 && <BlueText style={[styles.bannerText, stylesHook.bannerText]}>{serverBanner}</BlueText>}
          </View>
        </SettingsSection>
      </>
    );
  };

  return (
    <SettingsScrollView
      ref={scrollViewRef}
      keyboardShouldPersistTaps="always"
      automaticallyAdjustContentInsets
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      floatingButtonHeight={androidKeyboardInset}
      onScroll={event => {
        scrollYRef.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      testID="ElectrumSettingsScrollView"
    >
      <SettingsSection title={loc.settings.electrum_offline_mode}>
        <View style={styles.offlineModeContainer}>
          <BlueText>{loc.settings.electrum_offline_description}</BlueText>
          <View>
            <Switch value={isElectrumDisabled} onValueChange={onElectrumConnectionEnabledSwitchChange} />
          </View>
        </View>
      </SettingsSection>
      {!isElectrumDisabled && renderElectrumSettings()}
    </SettingsScrollView>
  );
};

const styles = StyleSheet.create({
  connectWrap: {
    width: 'auto',
    height: 34,
    flexWrap: 'wrap',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  hostname: {
    textAlign: 'center',
  },
  container: {
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 20,
  },
  textConnectionStatus: {
    ...Styles.fonts['P2 Bold'],
  },
  bannerText: {
    marginTop: 16,
    alignSelf: 'center',
    marginBottom: 4,
  },
  offlineModeContainer: {
    width: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
});

export default ElectrumSettings;
