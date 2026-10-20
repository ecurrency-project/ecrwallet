import React, { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { SizeClass, useSizeClass } from '../blue_modules/sizeClass.ts';
import SettingsButton from './icons/SettingsButton.tsx';
import AddWalletButton from './AddWalletButton.tsx';
import { useExtendedNavigation } from '../hooks/useExtendedNavigation.ts';

const CustomHeader = () => {
  const insets = useSafeAreaInsets();
  const { sizeClass } = useSizeClass();
  const navigation = useExtendedNavigation();

  const navigateToAddWallet = useCallback(() => {
    navigation.navigate('AddWalletRoot');
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {sizeClass === SizeClass.Large ? (
        <SettingsButton />
      ) : (
        <>
          <AddWalletButton onPress={navigateToAddWallet} />
          <SettingsButton />
        </>
      )}
    </View>
  );
};

export default CustomHeader;

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
