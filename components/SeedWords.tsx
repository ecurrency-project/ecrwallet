import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from './themes';
import { useLocale } from '@react-navigation/native';
import { BlueText, Styles } from '../BlueComponents';

const SeedWords = ({ seed }: { seed: string }) => {
  const words = seed.split(/\s/);
  const { colors } = useTheme();
  const { direction } = useLocale();

  const stylesHook = StyleSheet.create({
    word: {
      backgroundColor: colors.inputBackgroundColor,
    },
    wortText: {
      color: colors.labelText,
    },
    secret: {
      flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
      backgroundColor: colors.lightBorder,
    },
  });

  return (
    <View style={[styles.secret, stylesHook.secret]}>
      {words.map((secret, index) => {
        const text = `${index + 1}. ${secret}  `;
        return (
          <View style={[styles.word, stylesHook.word]} key={index}>
            <BlueText style={[styles.wortText, stylesHook.wortText]} textBreakStrategy="simple">
              {text}
            </BlueText>
          </View>
        );
      })}
      <BlueText style={styles.hiddenText} testID="Secret">
        {seed}
      </BlueText>
    </View>
  );
};

const styles = StyleSheet.create({
  word: {
    marginRight: 8,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 4,
  },
  wortText: {
    ...Styles.fonts['P3 Bold'],
    textAlign: 'left',
  },
  secret: {
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    padding: 10,
  },
  hiddenText: {
    height: 0,
    width: 0,
  },
});

export default SeedWords;
