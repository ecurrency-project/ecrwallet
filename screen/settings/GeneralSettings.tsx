import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DetailViewStackParamList } from '../../navigation/DetailViewStackParamList';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../components/themes';
import loc from '../../loc';
import { useStorage } from '../../hooks/context/useStorage';
import SafeAreaScrollView from '../../components/SafeAreaScrollView';
import NavigationItem from '../../components/NavigationItem.tsx';

type NavigationProp = NativeStackNavigationProp<DetailViewStackParamList, 'GeneralSettings'>;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  contentContainerStyle: {
    gap: 12,
  },
});

const GeneralSettings: React.FC = () => {
  const { wallets } = useStorage();
  const { navigate } = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const navigateToPrivacy = () => {
    navigate('SettingsPrivacy');
  };

  const stylesWithThemeHook = {
    root: {
      backgroundColor: colors.background,
    },
  };

  return (
    <SafeAreaScrollView
      style={[styles.root, stylesWithThemeHook.root]}
      automaticallyAdjustContentInsets
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.contentContainerStyle}
    >
      {wallets.length > 0 && (
        <>
          <NavigationItem title={loc.settings.default_title} onPress={() => navigate('DefaultView')} />
        </>
      )}

      <NavigationItem title={loc.settings.privacy} onPress={navigateToPrivacy} />
    </SafeAreaScrollView>
  );
};

export default GeneralSettings;
