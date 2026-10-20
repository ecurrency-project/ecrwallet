import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Icon } from '@rneui/themed';

import { useTheme } from '../themes';
import ThreeDotsIcon from '../../img/icons/ThreeDotsIcon.tsx';

const styles = StyleSheet.create({
  boxIncoming: {
    position: 'relative',
  } as ViewStyle,
  ball: {
    width: 30,
    height: 30,
    borderRadius: 8,
    transform: [{ rotate: '-90deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
});

const TransactionPendingIcon: React.FC = () => {
  const { colors } = useTheme();

  const stylesHook = StyleSheet.create({
    ball: {
      backgroundColor: colors.inputBackgroundColor,
    },
  });

  return (
    <View style={styles.boxIncoming}>
      <View style={[styles.ball, stylesHook.ball]}>
        <ThreeDotsIcon color={colors.foregroundColor} />
      </View>
    </View>
  );
};

export default TransactionPendingIcon;
