import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from './themes.ts';

const ItemSeparatorComponent = () => {
  const { colors } = useTheme();

  return <View style={[styles.separator, { backgroundColor: colors.lightBorder }]} />;
};

const styles = StyleSheet.create({
  separator: {
    height: 1,
  },
});

export default ItemSeparatorComponent;
