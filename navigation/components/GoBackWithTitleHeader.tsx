import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { FC } from 'react';
import ArrowLeftIcon from '../../img/icons/ArrowLeftIcon.tsx';
import { BlueText, Styles } from '../../BlueComponents';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation.ts';
import { useTheme } from '../../components/themes.ts';

interface GoBackWithTitleHeaderProps {
  title: string;
}

const GoBackWithTitleHeader: FC<GoBackWithTitleHeaderProps> = ({ title }) => {
  const { goBack } = useExtendedNavigation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const stylesHook = StyleSheet.create({
    root: {
      backgroundColor: colors.elevated,
      paddingTop: insets.top + 8,
    },
    button: {
      backgroundColor: colors.lightButton,
    },
  });

  const onPress = () => {
    goBack();
  };

  return (
    <View style={[styles.headerContainer, stylesHook.root]}>
      <TouchableOpacity
        testID="NavigationCloseButton"
        accessibilityRole="button"
        style={[styles.buttonCross, stylesHook.button]}
        onPress={onPress}
      >
        <View style={styles.iconContainer}>
          <ArrowLeftIcon color={colors.foregroundColor} size={24} />
        </View>
      </TouchableOpacity>
      <BlueText style={styles.title}>{title}</BlueText>
      <View style={styles.emptyBlock} />
    </View>
  );
};

const styles = StyleSheet.create({
  emptyBlock: {
    width: 38,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  buttonCross: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignContent: 'center',
  },
  iconContainer: {
    alignSelf: 'center',
  },
  title: {
    ...Styles.fonts['P3 Bold'],
  },
});

export default GoBackWithTitleHeader;
