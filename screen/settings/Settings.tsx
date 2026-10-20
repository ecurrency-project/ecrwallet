import React from 'react';
import { StyleSheet } from 'react-native';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import loc from '../../loc';
import SafeAreaScrollView from '../../components/SafeAreaScrollView';
import { useTheme } from '../../components/themes';
import NavigationItem from '../../components/NavigationItem.tsx';
import WalletIcon from '../../img/icons/WalletIcon.tsx';
import CurrencyIcon from '../../img/icons/CurrencyIcon.tsx';
import GlobeIcon from '../../img/icons/GlobeIcon.tsx';
import ShieldCheckIcon from '../../img/icons/ShieldCheckIcon.tsx';
import ThreeDotsIcon from '../../img/icons/ThreeDotsIcon.tsx';

const Settings = () => {
  const { navigate } = useExtendedNavigation();
  const { colors } = useTheme();

  return (
    <SafeAreaScrollView style={styles.container} contentContainerStyle={styles.contentContainerStyle}>
      <NavigationItem
        title={loc.settings.general}
        leftIcon={<WalletIcon color={colors.foregroundColor} size={24} />}
        onPress={() => navigate('GeneralSettings')}
      />

      <NavigationItem
        title={loc.settings.currency}
        leftIcon={<CurrencyIcon color={colors.foregroundColor} size={24} />}
        onPress={() => navigate('Currency')}
      />

      <NavigationItem
        title={loc.settings.language}
        leftIcon={<GlobeIcon color={colors.foregroundColor} size={24} />}
        onPress={() => navigate('Language')}
      />

      <NavigationItem
        title={loc.settings.encrypt_title}
        leftIcon={<ShieldCheckIcon color={colors.foregroundColor} size={24} />}
        onPress={() => navigate('EncryptStorage')}
      />

      <NavigationItem
        title={loc.settings.network}
        leftIcon={<GlobeIcon color={colors.foregroundColor} size={24} />}
        onPress={() => navigate('NetworkSettings')}
      />

      {/* <ListItem title={loc.settings.network} onPress={() => navigate('NetworkSettings')} testID="NetworkSettings" chevron /> */}

      {/* {isNotificationsCapable && ( */}
      {/*  <NavigationItem */}
      {/*    title={loc.settings.notifications} */}
      {/*    leftIcon={<MessageDotsIcon color={colors.foregroundColor} size={24} />} */}
      {/*    onPress={() => navigate('NotificationSettings')} */}
      {/*  /> */}
      {/* )} */}

      <NavigationItem
        title={loc.settings.about}
        leftIcon={<ThreeDotsIcon color={colors.foregroundColor} size={24} />}
        onPress={() => navigate('About')}
      />
    </SafeAreaScrollView>
  );
};

const styles = StyleSheet.create({
  contentContainerStyle: {
    paddingHorizontal: 16,
    gap: 8,
  },
  container: {
    paddingVertical: 16,
  },
});

export default Settings;
