import React from 'react';
import { StyleSheet } from 'react-native';
import presentAlert from '../../components/Alert';
import ListItem from '../../components/ListItem';
import { useTheme } from '../../components/themes';
import loc from '../../loc';
import { AvailableLanguages, TLanguage } from '../../loc/languages';
import { useSettings } from '../../hooks/context/useSettings';
import SafeAreaFlatList from '../../components/SafeAreaFlatList';
import ItemSeparatorComponent from '../../components/ItemSeparatorComponent';

const Language = () => {
  const { setLanguageStorage, language } = useSettings();
  const { colors } = useTheme();
  const stylesHook = StyleSheet.create({
    content: {
      backgroundColor: colors.background,
    },
  });

  const onLanguageSelect = (item: TLanguage) => {
    const currentLanguage = AvailableLanguages.find(l => l.value === language);
    setLanguageStorage(item.value).then(() => {
      if (currentLanguage?.isRTL !== item.isRTL) {
        presentAlert({ message: loc.settings.language_isRTL });
      }
    });
  };

  const renderItem = ({ item }: { item: TLanguage }) => {
    return (
      <ListItem
        title={item.label}
        checkmark={language === item.value}
        onPress={() => onLanguageSelect(item)}
        containerStyle={[styles.row, stylesHook.content]}
      />
    );
  };

  return (
    <SafeAreaFlatList
      style={styles.flex}
      contentContainerStyle={stylesHook.content}
      keyExtractor={(_item, index) => `${index}`}
      data={AvailableLanguages.filter(l => l.label.toLowerCase())}
      renderItem={renderItem}
      initialNumToRender={25}
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustContentInsets
      ItemSeparatorComponent={ItemSeparatorComponent}
    />
  );
};

export default Language;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    paddingHorizontal: 16,
  },
  row: {
    minHeight: 60,
    borderBottomWidth: 0,
  },
});
