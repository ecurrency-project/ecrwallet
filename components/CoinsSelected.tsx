import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import loc from '../loc';
import { BlueText, Styles } from '../BlueComponents';
import CrossIcon from '../img/icons/CrossIcon.tsx';

const styles = StyleSheet.create({
  root: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#3477F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  labelContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  labelText: {
    ...Styles.fonts['P2 Bold'],
    color: 'white',
  },
  buttonContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 15,
  },
});

interface CoinsSelectedProps {
  number: number;
  onContainerPress: () => void;
  onClose: () => void;
}

const CoinsSelected: React.FC<CoinsSelectedProps> = ({ number, onContainerPress, onClose }) => (
  <TouchableOpacity accessibilityRole="button" style={styles.root} onPress={onContainerPress}>
    <View style={styles.labelContainer}>
      <BlueText style={styles.labelText}>{loc.formatString(loc.cc.coins_selected, { number })}</BlueText>
    </View>
    <TouchableOpacity accessibilityRole="button" style={styles.buttonContainer} onPress={onClose}>
      <CrossIcon color="white" />
    </TouchableOpacity>
  </TouchableOpacity>
);

export default CoinsSelected;
