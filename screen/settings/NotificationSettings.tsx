import React, { useEffect, useState } from 'react';
import { StyleSheet, AppState } from 'react-native';
import {
  getDefaultUri,
  getPushToken,
  getSavedUri,
  getStoredNotifications,
  isNotificationsEnabled,
  setLevels,
  tryToObtainPermissions,
  cleanUserOptOutFlag,
  checkPermissions,
  checkNotificationPermissionStatus,
  NOTIFICATIONS_NO_AND_DONT_ASK_FLAG,
} from '../../blue_modules/notifications';
import { BlueCard, BlueText } from '../../BlueComponents';
import presentAlert from '../../components/Alert';
import ListItem, { PressableWrapper } from '../../components/ListItem';
import { useTheme } from '../../components/themes';
import loc from '../../loc';
import { openSettings } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeAreaScrollView from '../../components/SafeAreaScrollView';
import { BlueSpacing40 } from '../../components/BlueSpacing';
import { useLocale } from '@react-navigation/native';

const NotificationSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationsEnabledState, setNotificationsEnabledState] = useState<boolean | undefined>(undefined);
  const [tokenInfo, setTokenInfo] = useState('<empty>');
  const { direction } = useLocale();
  const [URI, setURI] = useState<string | undefined>();
  const { colors } = useTheme();
  const stylesWithThemeHook = StyleSheet.create({
    scroll: {
      backgroundColor: colors.background,
    },
  });

  const showNotificationPermissionAlert = () => {
    presentAlert({
      title: loc.settings.notifications,
      message: loc.notifications.permission_denied_message,
      buttons: [
        {
          text: loc._.ok,
          style: 'cancel',
        },
        {
          text: loc.settings.header,
          onPress: onSystemSettings,
          style: 'default',
        },
      ],
    });
  };

  const onNotificationsSwitch = async (value: boolean) => {
    if (value) {
      const currentStatus = await checkNotificationPermissionStatus();
      if (currentStatus === 'blocked') {
        // If permissions are denied/blocked, show alert and reset the toggle
        showNotificationPermissionAlert();
        setNotificationsEnabledState(false);
        return;
      }
    }

    try {
      setNotificationsEnabledState(value);
      if (value) {
        await cleanUserOptOutFlag();
        const permissionsGranted = await tryToObtainPermissions();
        if (permissionsGranted) {
          await setLevels(true);
          await AsyncStorage.removeItem(NOTIFICATIONS_NO_AND_DONT_ASK_FLAG);
        } else {
          showNotificationPermissionAlert();
          setNotificationsEnabledState(false);
        }
      } else {
        await setLevels(false);
        await AsyncStorage.setItem(NOTIFICATIONS_NO_AND_DONT_ASK_FLAG, 'true');
        setNotificationsEnabledState(false);
      }

      setNotificationsEnabledState(await isNotificationsEnabled());
    } catch (error) {
      console.error(error);
      presentAlert({ message: (error as Error).message });
      setNotificationsEnabledState(false);
    }
  };

  const updateNotificationStatus = async () => {
    try {
      const currentStatus = await checkNotificationPermissionStatus();
      const isEnabled = await isNotificationsEnabled();
      const isDisabledByUser = (await AsyncStorage.getItem(NOTIFICATIONS_NO_AND_DONT_ASK_FLAG)) === 'true';

      if (!isDisabledByUser) {
        setNotificationsEnabledState(currentStatus === 'granted' && isEnabled);
      } else {
        setNotificationsEnabledState(false);
      }
    } catch (error) {
      console.log('Error updating notification status:', error);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const isDisabledByUser = (await AsyncStorage.getItem(NOTIFICATIONS_NO_AND_DONT_ASK_FLAG)) === 'true';

        if (isDisabledByUser) {
          console.debug('Notifications were disabled by the user. Skipping auto-activation.');
          setNotificationsEnabledState(false);
        } else {
          await updateNotificationStatus();
        }

        setURI((await getSavedUri()) ?? getDefaultUri());
        setTokenInfo(
          'token: ' +
            JSON.stringify(await getPushToken()) +
            ' permissions: ' +
            JSON.stringify(await checkPermissions()) +
            ' stored notifications: ' +
            JSON.stringify(await getStoredNotifications()),
        );
      } catch (e) {
        console.error(e);
        presentAlert({ message: (e as Error).message });
      } finally {
        setIsLoading(false);
      }
    })();

    const appStateListener = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        setTimeout(async () => {
          const isDisabledByUser = (await AsyncStorage.getItem(NOTIFICATIONS_NO_AND_DONT_ASK_FLAG)) === 'true';
          if (!isDisabledByUser) {
            updateNotificationStatus();
          }
        }, 300);
      }
    });

    return () => {
      appStateListener.remove();
    };
  }, []);

  const onSystemSettings = () => {
    openSettings('notifications');
  };

  return (
    <SafeAreaScrollView style={stylesWithThemeHook.scroll} automaticallyAdjustContentInsets contentInsetAdjustmentBehavior="automatic">
      <ListItem
        Component={PressableWrapper}
        title={loc.settings.notifications}
        subtitle={loc.notifications.notifications_subtitle}
        disabled={isLoading}
        isLoading={isNotificationsEnabledState === undefined}
        switch={{ onValueChange: onNotificationsSwitch, value: isNotificationsEnabledState, testID: 'NotificationsSwitch' }}
      />

      <BlueCard>
        <BlueText style={styles.multilineText}>{loc.settings.push_notifications_explanation}</BlueText>
      </BlueCard>
      <BlueSpacing40 />
      <ListItem title={loc.settings.privacy_system_settings} onPress={onSystemSettings} chevron />
    </SafeAreaScrollView>
  );
};

const styles = StyleSheet.create({
  multilineText: {
    textAlign: 'left',
    lineHeight: 20,
    paddingBottom: 10,
  },
});

export default NotificationSettings;
