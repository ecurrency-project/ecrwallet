import React from 'react';
import { ColorValue, DimensionValue, Image, ImageSourcePropType, StyleSheet, Pressable, View } from 'react-native';
import { useLocale } from '@react-navigation/native';

import loc from '../loc';
import { Theme, useTheme } from './themes';
import { BlueText, Styles } from '../BlueComponents';

interface ButtonDetails {
  image: ImageSourcePropType;
  title: string;
  explain: string;
  borderColorActive: keyof Theme['colors'];
}

interface WalletButtonProps {
  buttonType: keyof typeof buttonDetails;
  testID?: string;
  onPress: () => void;
  size: {
    width: DimensionValue | undefined;
    height: DimensionValue | undefined;
  };
  active: boolean;
}

const buttonDetails: Record<string, ButtonDetails> = {
  ECurrency: {
    image: require('../img/addWallet/ecurrency.png'),
    title: 'Ecurrency',
    explain: loc.wallets.add_ecurrency_explain,
    borderColorActive: 'newBlue',
  },
};

const WalletButton: React.FC<WalletButtonProps> = ({ buttonType, testID, onPress, size, active }) => {
  const details = buttonDetails[buttonType];
  const { colors } = useTheme();
  const { direction } = useLocale();
  const borderColor = active ? colors[details.borderColorActive] : colors.buttonDisabledBackgroundColor;
  const stylesHook = StyleSheet.create({
    buttonContainer: {
      borderColor: borderColor as ColorValue,
      backgroundColor: colors.buttonDisabledBackgroundColor,
      minWidth: size.width,
      minHeight: size.height,
      height: size.height,
    },
    textTitle: {
      color: '#d53030',
      fontWeight: 'bold',
      fontSize: 18,
      writingDirection: direction,
    },
    textExplain: {
      ...Styles.fonts['P1 Regular'],
      color: colors.alternativeTextColor,
      writingDirection: direction,
    },
  });

  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed, styles.touchable]}
    >
      <View style={[styles.container, stylesHook.buttonContainer]}>
        <View style={styles.content}>
          <Image style={styles.image} source={details.image} />
          <View style={styles.textContainer}>
            <BlueText style={stylesHook.textTitle}>{details.title}</BlueText>
            <BlueText style={stylesHook.textExplain}>{details.explain}</BlueText>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  container: {
    borderRadius: 36,
  },
  content: {
    marginHorizontal: 16,
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 34,
    height: 34,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});

export default WalletButton;
