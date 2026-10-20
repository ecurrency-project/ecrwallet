import React from 'react';
import { StyleSheet } from 'react-native';
import loc from '../../loc';
import NavigationItem from '../../components/NavigationItem.tsx';
import SafeAreaScrollView from '../../components/SafeAreaScrollView';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation.ts';

const NetworkSettings: React.FC = () => {
  const { navigate } = useExtendedNavigation();
  const navigateToElectrumSettings = () => {
    navigate('ElectrumSettings');
  };

  const navigateToBlockExplorerSettings = () => {
    navigate('SettingsBlockExplorer');
  };

  return (
    <SafeAreaScrollView style={styles.container} contentContainerStyle={styles.contentContainerStyle}>
      <NavigationItem title={loc.settings.block_explorer} onPress={navigateToBlockExplorerSettings} />
      <NavigationItem title={loc.settings.network_electrum} onPress={navigateToElectrumSettings} />
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

export default NetworkSettings;
