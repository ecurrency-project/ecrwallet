import Clipboard from '@react-native-clipboard/clipboard';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import triggerHapticFeedback, { HapticFeedbackTypes } from '../blue_modules/hapticFeedback';
import loc from '../loc';
import { BlueText, Styles } from '../BlueComponents';

type CopyToClipboardButtonProps = {
  stringToCopy: string;
  displayText?: string;
};

export const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({ stringToCopy, displayText }) => {
  const onPress = () => {
    Clipboard.setString(stringToCopy);
    triggerHapticFeedback(HapticFeedbackTypes.Selection);
  };

  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress}>
      <BlueText style={styles.text}>{displayText && displayText.length > 0 ? displayText : loc.transactions.details_copy}</BlueText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  text: {
    ...Styles.fonts['P2 Regular'],
    color: '#2363d0',
  },
});

export default CopyToClipboardButton;
