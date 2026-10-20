import { StyleSheet, TouchableOpacity, View } from 'react-native';
import loc from '../loc';
import ThreeDotsIcon from '../img/icons/ThreeDotsIcon.tsx';
import React, { FunctionComponent } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArrowLeftIcon from '../img/icons/ArrowLeftIcon.tsx';

interface Props {
  onPress: () => void;
  onPressBack: () => void;
}

export const WalletTransactionsHeader: FunctionComponent<Props> = ({ onPress, onPressBack }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={loc.settings.default_title}
        testID="SettingsButton"
        style={styles.buttonStyle}
        onPress={onPressBack}
      >
        <View style={styles.icon}>
          <ArrowLeftIcon color="#ffffff" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={loc.settings.default_title}
        testID="SettingsButton"
        style={styles.buttonStyle}
        onPress={onPress}
      >
        <View style={styles.icon}>
          <ThreeDotsIcon color="#ffffff" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#d53030',
  },
  buttonStyle: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignContent: 'center',
    backgroundColor: 'rgba(0,0,0,.1)',
  },
  icon: {
    alignSelf: 'center',
  },
});
