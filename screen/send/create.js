import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation, useRoute } from '@react-navigation/native';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, FlatList, Linking, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import RNFS from 'react-native-fs';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Share from 'react-native-share';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { satoshiToBTC } from '../../blue_modules/currency';
import { isDesktop } from '../../blue_modules/environment';
import { BlueText, Styles } from '../../BlueComponents';
import presentAlert from '../../components/Alert';
import { useTheme } from '../../components/themes';
import loc from '../../loc';
import { BitcoinUnit } from '../../models/bitcoinUnits';
import { useSettings } from '../../hooks/context/useSettings';
import { useScreenProtect } from '../../hooks/useScreenProtect';
import ShareIcon from '../../img/icons/ShareIcon';
import ArrowLeftIcon from '../../img/icons/ArrowLeftIcon';

const SendCreate = () => {
  const { fee, recipients, memo = '', satoshiPerByte, tx } = useRoute().params;
  const size = tx ? tx.length / 2 : 0;
  const { isPrivacyBlurEnabled } = useSettings();
  const { colors } = useTheme();
  const { setOptions, goBack } = useNavigation();
  const insets = useSafeAreaInsets();

  const styleHooks = StyleSheet.create({
    transactionDetailsTitle: {
      color: colors.feeText,
    },
    transactionDetailsSubtitle: {
      color: colors.foregroundColor,
    },
    separator: {
      backgroundColor: colors.inputBorderColor,
    },
    root: {
      backgroundColor: colors.elevated,
    },
    cardText: {
      color: colors.foregroundColor,
    },
    header: {
      backgroundColor: colors.elevated,
      paddingTop: Platform.select({ ios: 16, android: insets.top + 8 }),
    },
  });

  const { enableScreenProtect, disableScreenProtect } = useScreenProtect();

  useEffect(() => {
    if (isPrivacyBlurEnabled) {
      enableScreenProtect();
    }
    return () => {
      disableScreenProtect();
    };
  }, [isPrivacyBlurEnabled, enableScreenProtect, disableScreenProtect]);

  const exportTXN = useCallback(async () => {
    const fileName = `${Date.now()}.txn`;
    if (Platform.OS === 'ios') {
      const filePath = RNFS.TemporaryDirectoryPath + `/${fileName}`;
      await RNFS.writeFile(filePath, tx);
      Share.open({
        url: 'file://' + filePath,
        saveToFiles: isDesktop,
      })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {
          RNFS.unlink(filePath);
        });
    } else if (Platform.OS === 'android') {
      const granted = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
      if (granted === RESULTS.GRANTED) {
        console.log('Storage Permission: Granted');
        const filePath = RNFS.DownloadDirectoryPath + `/${fileName}`;
        try {
          await RNFS.writeFile(filePath, tx);
          presentAlert({ message: loc.formatString(loc.send.txSaved, { filePath }) });
        } catch (e) {
          console.log(e);
          presentAlert({ message: e.message });
        }
      } else {
        console.log('Storage Permission: Denied');
        Alert.alert(loc.send.permission_storage_title, loc.send.permission_storage_denied_message, [
          {
            text: loc.send.open_settings,
            onPress: () => {
              Linking.openSettings();
            },
            style: 'default',
          },
          { text: loc._.cancel, onPress: () => {}, style: 'cancel' },
        ]);
      }
    }
  }, [tx]);

  const Header = useMemo(
    () => (
      <View style={[styles.headerContainer, styleHooks.header]}>
        <TouchableOpacity style={[styles.buttonCross, { backgroundColor: colors.lightButton }]} onPress={goBack}>
          <View style={styles.iconContainer}>
            <ArrowLeftIcon color={colors.foregroundColor} size={28} />
          </View>
        </TouchableOpacity>
        <BlueText style={styles.title}>{loc.send.create_details}</BlueText>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={exportTXN}
          style={[styles.buttonCross, { backgroundColor: colors.lightButton }]}
        >
          <View style={styles.iconContainer}>
            <ShareIcon color={colors.foregroundColor} />
          </View>
        </TouchableOpacity>
      </View>
    ),
    [colors.foregroundColor, colors.lightButton, exportTXN, goBack, styleHooks.header],
  );

  useEffect(() => {
    setOptions({
      header: () => Header,
    });
  }, [Header, colors, setOptions]);

  const _renderItem = ({ index, item }) => {
    return (
      <>
        <View>
          <BlueText style={[styles.transactionDetailsTitle, styleHooks.transactionDetailsTitle]}>{loc.send.create_to}</BlueText>
          <BlueText style={[styles.transactionDetailsSubtitle, styleHooks.transactionDetailsSubtitle]}>{item.address}</BlueText>
          <BlueText style={[styles.transactionDetailsTitle, styleHooks.transactionDetailsTitle]}>{loc.send.create_amount}</BlueText>
          <BlueText style={[styles.transactionDetailsSubtitle, styleHooks.transactionDetailsSubtitle]}>
            {satoshiToBTC(item.value)} {BitcoinUnit.ECR}
          </BlueText>
          {recipients.length > 1 && (
            <BlueText style={styles.itemOf}>{loc.formatString(loc._.of, { number: index + 1, total: recipients.length })}</BlueText>
          )}
        </View>
      </>
    );
  };
  _renderItem.propTypes = {
    index: PropTypes.number,
    item: PropTypes.shape({
      address: PropTypes.string,
      value: PropTypes.number,
    }),
  };

  const renderSeparator = () => {
    return <View style={[styles.separator, styleHooks.separator]} />;
  };

  const ListHeaderComponent = (
    <View>
      <BlueText style={styleHooks.cardText}>{loc.send.create_this_is_hex}</BlueText>
      <TextInput testID="TxhexInput" style={styles.cardTx} height={92} multiline editable={false} value={tx} />
      <TouchableOpacity accessibilityRole="button" style={styles.actionTouch} onPress={() => Clipboard.setString(tx)}>
        <BlueText style={styles.actionBlueText}>{loc.send.create_copy}</BlueText>
      </TouchableOpacity>
    </View>
  );

  const ListFooterComponent = (
    <View>
      <BlueText style={[styles.transactionDetailsTitle, styleHooks.transactionDetailsTitle]}>{loc.send.create_fee}</BlueText>
      <BlueText style={[styles.transactionDetailsSubtitle, styleHooks.transactionDetailsSubtitle]}>
        {new BigNumber(fee).toFixed()} {BitcoinUnit.ECR}
      </BlueText>
      <BlueText style={[styles.transactionDetailsTitle, styleHooks.transactionDetailsTitle]}>{loc.send.create_tx_size}</BlueText>
      <BlueText style={[styles.transactionDetailsSubtitle, styleHooks.transactionDetailsSubtitle]}>{size} vbytes</BlueText>
      <BlueText style={[styles.transactionDetailsTitle, styleHooks.transactionDetailsTitle]}>{loc.send.create_satoshi_per_vbyte}</BlueText>
      <BlueText style={[styles.transactionDetailsSubtitle, styleHooks.transactionDetailsSubtitle]}>{satoshiPerByte} Sat/vB</BlueText>
      {memo?.length > 0 && (
        <>
          <BlueText style={[styles.transactionDetailsTitle, styleHooks.transactionDetailsTitle]}>{loc.send.create_memo}</BlueText>
          <BlueText style={[styles.transactionDetailsSubtitle, styleHooks.transactionDetailsSubtitle]}>{memo}</BlueText>
        </>
      )}
    </View>
  );

  return (
    <FlatList
      contentContainerStyle={[styles.root, styleHooks.root]}
      extraData={recipients}
      data={recipients}
      renderItem={_renderItem}
      keyExtractor={(_item, index) => `${index}`}
      ItemSeparatorComponent={renderSeparator}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustContentInsets
    />
  );
};

export default SendCreate;

const styles = StyleSheet.create({
  transactionDetailsTitle: {
    ...Styles.fonts['P2 Regular'],
    marginBottom: 2,
  },
  root: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transactionDetailsSubtitle: {
    ...Styles.fonts['P2 Regular'],
    marginBottom: 20,
  },
  itemOf: {
    alignSelf: 'flex-end',
  },
  separator: {
    height: 0.5,
    marginVertical: 16,
  },
  cardTx: {
    ...Styles.fonts['P1 Regular'],
    borderColor: '#ebebeb',
    backgroundColor: '#d2f8d6',
    borderRadius: 4,
    marginTop: 20,
    color: '#37c0a1',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 16,
  },
  actionTouch: {
    marginVertical: 24,
  },
  actionBlueText: {
    ...Styles.fonts['P2 Bold'],
    color: '#9aa0aa',
    alignSelf: 'center',
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
