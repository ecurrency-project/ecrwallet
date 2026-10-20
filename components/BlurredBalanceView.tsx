import React from 'react';
import { StyleSheet, View } from 'react-native';
import EyeClosedIcon from '../img/icons/EyeClosedIcon.tsx';

export const BlurredBalanceView = () => {
  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <EyeClosedIcon color="white" size={30} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
  },
  background: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    height: 30,
    width: 110,
    marginRight: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
});
