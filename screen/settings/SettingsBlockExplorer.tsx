import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ListItem } from '@rneui/base';
import loc from '../../loc';
import { SettingsSection, SettingsScrollView } from '../../components/SettingsSection';
import { getBlockExplorersList, normalizeUrl } from '../../models/blockExplorer';
import { useSettings } from '../../hooks/context/useSettings';
import { BlueText } from '../../BlueComponents';
import { useTheme } from '../../components/themes.ts';

const SettingsBlockExplorer: React.FC = () => {
  const { selectedBlockExplorer } = useSettings();
  const predefinedExplorers = getBlockExplorersList().filter(explorer => explorer.key !== 'custom');
  const { colors } = useTheme();

  const styleHook = StyleSheet.create({
    containerStyle: {
      backgroundColor: colors.cardSectionBackground,
    },
  });

  return (
    <SettingsScrollView automaticallyAdjustKeyboardInsets>
      <SettingsSection title={loc._.suggested}>
        {predefinedExplorers.map((explorer, index) => {
          const isSelected = normalizeUrl(selectedBlockExplorer.url || '') === normalizeUrl(explorer.url || '');

          return (
            <View key={explorer.url} style={styles.settingItem}>
              <BlueText>{explorer.name}</BlueText>

              {isSelected && (
                <ListItem.CheckBox
                  containerStyle={styleHook.containerStyle}
                  checked
                  iconRight
                  iconType="octaicon"
                  checkedIcon="check"
                  checkedColor="#fa2b4f"
                />
              )}
            </View>
          );
        })}
      </SettingsSection>
    </SettingsScrollView>
  );
};

const styles = StyleSheet.create({
  settingItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default SettingsBlockExplorer;
