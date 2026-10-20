import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from './themes';
import AddWalletButton from './AddWalletButton';
import { BlueText, Styles } from '../BlueComponents';

interface HeaderProps {
  leftText: string;
  isDrawerList?: boolean;
  onNewWalletPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ leftText, isDrawerList, onNewWalletPress }) => {
  const { colors } = useTheme();
  const styleWithProps = StyleSheet.create({
    root: {
      backgroundColor: isDrawerList ? colors.elevated : colors.background,
      borderTopColor: isDrawerList ? colors.elevated : colors.background,
      borderBottomColor: isDrawerList ? colors.elevated : colors.background,
    },
    text: {
      color: colors.foregroundColor,
    },
  });

  return (
    <View style={[styles.root, styleWithProps.root]}>
      <BlueText style={[styles.text, styleWithProps.text]}>{leftText}</BlueText>
      {onNewWalletPress && <AddWalletButton onPress={onNewWalletPress} />}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    ...Styles.fonts['P3 Bold'],
    textAlign: 'left',
    fontSize: 34,
    lineHeight: 40,
  },
});
