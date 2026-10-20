import React, { forwardRef } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { BlueText } from '../BlueComponents';
import SafeAreaScrollView from './SafeAreaScrollView';
import { useTheme } from './themes';

// SafeAreaScrollView with the default top spacing settings screens use before their first section
export const SettingsScrollView = forwardRef<ScrollView, React.ComponentProps<typeof SafeAreaScrollView>>(
  ({ contentContainerStyle, ...rest }, ref) => (
    <SafeAreaScrollView ref={ref} {...rest} contentContainerStyle={[styles.scrollContent, contentContainerStyle]} />
  ),
);
SettingsScrollView.displayName = 'SettingsScrollView';

interface SettingsSectionProps {
  title?: string;
  headerRight?: React.ReactNode;
  onHeaderPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, headerRight, onHeaderPress, containerStyle, children }) => {
  const { colors } = useTheme();
  const stylesHook = StyleSheet.create({
    header: { backgroundColor: colors.cardSectionHeaderBackground },
    headerText: { color: colors.foregroundColor },
    body: { backgroundColor: colors.cardSectionBackground },
  });

  const header =
    title || headerRight ? (
      <View style={[styles.header, stylesHook.header]}>
        {title ? <BlueText style={[styles.headerText, stylesHook.headerText]}>{title}</BlueText> : null}
        {headerRight}
      </View>
    ) : null;

  return (
    <View style={[styles.card, containerStyle]}>
      {onHeaderPress && header ? (
        <Pressable accessibilityRole="button" onPress={onHeaderPress} style={({ pressed }) => (pressed ? styles.headerPressed : undefined)}>
          {header}
        </Pressable>
      ) : (
        header
      )}
      <View style={stylesHook.body}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 20,
  },
  cardContent: {
    padding: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 17,
    fontWeight: '600',
    flexShrink: 1,
  },
  headerPressed: {
    opacity: 0.75,
  },
});

// Shared styles for screens that build card content or FlatList-based cards themselves
export const settingsCardContent = styles.cardContent;
