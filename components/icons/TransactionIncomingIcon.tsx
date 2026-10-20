import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../themes';
import ArrowDownLeftIcon from '../../img/icons/ArrowDownLeftIcon.tsx';

const styles = StyleSheet.create({
  boxIncoming: {
    position: 'relative',
  } as ViewStyle,
  ballIncoming: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
});

const TransactionIncomingIcon: React.FC = () => {
  const { colors } = useTheme();

  const stylesHooks = StyleSheet.create({
    ballIncoming: {
      backgroundColor: colors.inputBackgroundColor,
    },
  });

  return (
    <View style={styles.boxIncoming}>
      <View style={[styles.ballIncoming, stylesHooks.ballIncoming]}>
        <ArrowDownLeftIcon color={colors.incomingForegroundColor} />
      </View>
    </View>
  );
};

export default TransactionIncomingIcon;
