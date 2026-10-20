import React from 'react';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { DetailViewStackParamList } from '../DetailViewStackParamList';
import { navigationRef } from '../../NavigationService';
import { WalletTransactionsHeader } from '../../components/WalletTransactionsHeader.tsx';

export type WalletTransactionsRouteProps = RouteProp<DetailViewStackParamList, 'WalletTransactions'>;

const getWalletTransactionsOptions = ({ route }: { route: WalletTransactionsRouteProps }): NativeStackNavigationOptions => {
  const { walletID } = route.params;

  const onPress = () => {
    navigationRef.navigate('WalletDetails', {
      walletID,
    });
  };

  const onPressBack = () => {
    navigationRef.goBack();
  };

  return {
    headerShadowVisible: false,
    headerTintColor: '#FFFFFF',
    headerBackTitle: undefined,
    header: () => <WalletTransactionsHeader onPress={onPress} onPressBack={onPressBack} />,
  };
};

export default getWalletTransactionsOptions;
