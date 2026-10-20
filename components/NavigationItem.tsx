import { Pressable, StyleSheet, View } from 'react-native';
import React, { FC } from 'react';
import { BlueText, Styles } from '../BlueComponents';
import ArrowRightIcon from '../img/icons/ArrowRightIcon.tsx';
import { useTheme } from './themes.ts';

interface NavigationItemProps {
  title: string;
  leftIcon?: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}

const NavigationItem: FC<NavigationItemProps> = ({ title, leftIcon, onPress, disabled = false }) => {
  const { colors } = useTheme();

  const stylesHook = StyleSheet.create({
    root: {
      borderColor: colors.placeholderTextColor,
    },
  });

  return (
    <Pressable disabled={disabled} style={[styles.container, stylesHook.root]} onPress={onPress}>
      <View style={styles.wrapper}>
        {leftIcon || null}
        <BlueText style={styles.title}>{title}</BlueText>
      </View>

      <ArrowRightIcon size={24} color={colors.placeholderTextColor} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  title: {
    ...Styles.fonts['P3 Regular'],
  },
  wrapper: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
});

export default NavigationItem;
