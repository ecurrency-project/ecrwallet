import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, UIManager, Platform, Keyboard } from 'react-native';

import {
  CurrencyRate,
  getPreferredCurrency,
  initCurrencyDaemon,
  mostRecentFetchedRate,
  setPreferredCurrency,
} from '../../blue_modules/currency';
import { BlueCard, BlueText } from '../../BlueComponents';
import presentAlert from '../../components/Alert';
import ListItem from '../../components/ListItem';
import { useTheme } from '../../components/themes';
import loc from '../../loc';
import { FiatUnit, FiatUnitSource, FiatUnitType, getFiatRate } from '../../models/fiatUnit';
import { useSettings } from '../../hooks/context/useSettings';
import SafeAreaFlatList from '../../components/SafeAreaFlatList';
import { BlueSpacing10, BlueSpacing20 } from '../../components/BlueSpacing';
import ItemSeparatorComponent from '../../components/ItemSeparatorComponent';

dayjs.extend(calendar);

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ITEM_HEIGHT = 60;

const Currency: React.FC = () => {
  const { setPreferredFiatCurrencyStorage } = useSettings();
  const [isSavingNewPreferredCurrency, setIsSavingNewPreferredCurrency] = useState<FiatUnitType | undefined>();
  const [selectedCurrency, setSelectedCurrency] = useState<FiatUnitType>(FiatUnit.USD);
  const [currencyRate, setCurrencyRate] = useState<CurrencyRate>({ LastUpdated: null, Rate: null });
  const { colors } = useTheme();

  const stylesHook = StyleSheet.create({
    flex: {
      backgroundColor: colors.background,
    },
  });

  const data = useMemo(() => {
    return Object.values(FiatUnit).filter(item => item.endPointKey.toLowerCase() || item.country.toLowerCase());
  }, []);

  const fetchCurrency = useCallback(async () => {
    let preferredCurrency;
    try {
      preferredCurrency = await getPreferredCurrency();
      if (preferredCurrency === null) {
        throw Error();
      }
      setSelectedCurrency(preferredCurrency);
    } catch (_error) {
      setSelectedCurrency(FiatUnit.USD);
    }
    const mostRecentFetchedRateValue = await mostRecentFetchedRate();
    setCurrencyRate(mostRecentFetchedRateValue);
  }, []);

  useEffect(() => {
    fetchCurrency();
  }, [fetchCurrency]);

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: FiatUnitType }) => {
      const isSelected = selectedCurrency.endPointKey === item.endPointKey;
      const isDisabled = isSavingNewPreferredCurrency === item || isSelected;
      const isLoading = isSavingNewPreferredCurrency === item;

      return (
        <ListItem
          title={`${item.endPointKey} (${item.symbol})`}
          containerStyle={StyleSheet.flatten([styles.flex, stylesHook.flex, { height: ITEM_HEIGHT }])}
          checkmark={isSelected}
          isLoading={isLoading}
          subtitle={item.country}
          onPress={async () => {
            if (isDisabled) return;

            Keyboard.dismiss();
            setIsSavingNewPreferredCurrency(item);
            try {
              await getFiatRate(item.endPointKey);
              await setPreferredCurrency(item);
              await initCurrencyDaemon(true);
              await fetchCurrency();
              setSelectedCurrency(item);
              setPreferredFiatCurrencyStorage(FiatUnit[item.endPointKey]);
            } catch (error: any) {
              console.log(error);
              presentAlert({
                message: error.message ? `${loc.settings.currency_fetch_error}: ${error.message}` : loc.settings.currency_fetch_error,
              });
            } finally {
              setIsSavingNewPreferredCurrency(undefined);
            }
          }}
        />
      );
    },
    [isSavingNewPreferredCurrency, selectedCurrency, stylesHook.flex, fetchCurrency, setPreferredFiatCurrencyStorage],
  );

  const selectedCurrencyVisible = useMemo(
    () => data.some(item => item.endPointKey === selectedCurrency.endPointKey),
    [data, selectedCurrency.endPointKey],
  );

  const CurrencyInfo = useMemo(() => {
    if (!selectedCurrencyVisible) return null;

    return (
      <BlueCard>
        <BlueText>
          {loc.settings.currency_source} {selectedCurrency?.source ?? FiatUnitSource.Ecurrency}
        </BlueText>
        <BlueSpacing10 />
        <BlueText>
          {loc.settings.rate}: {currencyRate.Rate ?? loc._.never}
        </BlueText>
        <BlueSpacing10 />
        <BlueText>
          {loc.settings.last_updated}: {dayjs(currencyRate.LastUpdated).calendar() ?? loc._.never}
        </BlueText>
        <BlueSpacing20 />
      </BlueCard>
    );
  }, [selectedCurrencyVisible, selectedCurrency?.source, currencyRate]);

  const keyExtractor = useCallback((item: FiatUnitType) => `${item.endPointKey}-${item.locale}`, []);

  return (
    <View style={[styles.flex, stylesHook.flex]}>
      <SafeAreaFlatList
        style={styles.listContainer}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustContentInsets
        automaticallyAdjustKeyboardInsets
        keyExtractor={keyExtractor}
        data={data}
        extraData={selectedCurrency}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        getItemLayout={getItemLayout}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparatorComponent}
      />
      {CurrencyInfo}
    </View>
  );
};

export default Currency;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    borderBottomWidth: 0,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
});
