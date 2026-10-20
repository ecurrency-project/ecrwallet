import React, { Component } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import * as fs from '../../blue_modules/fs';
import { BlueText, Styles } from '../../BlueComponents';
import { ECurrencyWallet, HDECurrencyWallet } from '../../class';
import presentAlert from '../../components/Alert';
import Button from '../../components/Button';
import SaveFileButton from '../../components/SaveFileButton';
import loc from '../../loc';
import { BlueSpacing20 } from '../../components/BlueSpacing';
import { BlueLoading } from '../../components/BlueLoading.tsx';

type TState = {
  isLoading?: boolean;
  isOk?: boolean;
  errorMessage?: string;
};

function assertStrictEqual<T>(actual: T, expected: T, message?: string) {
  if (expected !== actual) {
    throw new Error(message || 'Assertion failed that ' + JSON.stringify(expected) + ' equals ' + JSON.stringify(actual));
  }
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  root: {
    paddingHorizontal: 20,
  },
  confirmText: {
    ...Styles.fonts['P3 Bold'],
  },
});

const ECR_WIF = '5HrQ4wqTTMccKcgqWYaiveeEj9eXuxDFLcj15iGRLHqo3m7qqZn';
const HD_MNEMONIC = 'organ spawn dentist violin great ridge discover layer census barrel include nature';

export default class SelfTest extends Component {
  state: TState;

  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: true,
    };
  }

  onPressImportDocument = async () => {
    try {
      fs.showFilePickerAndReadFile().then(file => {
        if (file && file.data && file.data.length > 0) {
          presentAlert({ message: file.data });
        } else {
          presentAlert({ message: 'Error reading file' });
        }
      });
    } catch (err) {
      console.log(err);
    }
  };

  async componentDidMount() {
    console.debug('SelfTest - componentDidMount');
    let errorMessage = '';
    let isOk = true;

    try {
      // --- ECurrencyWallet ---

      const ecr = new ECurrencyWallet();
      assertStrictEqual(ecr.type, 'ecurrency', 'ECurrencyWallet: wrong type');
      assertStrictEqual(ecr.typeReadable, 'ECurrency', 'ECurrencyWallet: wrong typeReadable');
      assertStrictEqual(ecr.allowSignVerifyMessage(), false, 'ECurrencyWallet: allowSignVerifyMessage must be false');

      await ecr.generate();
      if (!ecr.secret) throw new Error('ECurrencyWallet: secret must be set after generate()');
      const ecrAddress = ecr.getAddress();
      if (!ecrAddress) throw new Error('ECurrencyWallet: address must be derivable from generated WIF');
      if (!ecr.isAddressValid(ecrAddress as string)) throw new Error('ECurrencyWallet: generated address must be valid');

      const entropy = Buffer.alloc(32, 0xab);
      const ew1 = new ECurrencyWallet();
      const ew2 = new ECurrencyWallet();
      await ew1.generateFromEntropy(entropy);
      await ew2.generateFromEntropy(entropy);
      assertStrictEqual(ew1.secret, ew2.secret, 'ECurrencyWallet: generateFromEntropy must be deterministic (secret)');
      assertStrictEqual(ew1.getAddress(), ew2.getAddress(), 'ECurrencyWallet: generateFromEntropy must be deterministic (address)');

      try {
        const ew3 = new ECurrencyWallet();
        await ew3.generateFromEntropy(Buffer.alloc(16));
        throw new Error('ECurrencyWallet: generateFromEntropy must throw on wrong entropy length');
      } catch (e: any) {
        if (!/Entropy should be 32 bytes/.test(e.message)) throw e;
      }

      assertStrictEqual(
        ecr.isAddressValid('1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf'),
        false,
        'ECurrencyWallet: must reject Bitcoin legacy address',
      );
      assertStrictEqual(
        ecr.isAddressValid('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'),
        false,
        'ECurrencyWallet: must reject bech32 address',
      );
      assertStrictEqual(ecr.isAddressValid(''), false, 'ECurrencyWallet: must reject empty address');

      const allAddrs = ecr.getAllExternalAddresses();
      assertStrictEqual(allAddrs.length, 1, 'ECurrencyWallet: getAllExternalAddresses must return exactly 1 address');
      assertStrictEqual(allAddrs[0], ecrAddress, 'ECurrencyWallet: getAllExternalAddresses must return own address');

      const ew4 = new ECurrencyWallet();
      await ew4.generate();
      assertStrictEqual(ecr.weOwnAddress(ecrAddress as string), true, 'ECurrencyWallet: weOwnAddress must return true for own address');
      assertStrictEqual(
        ecr.weOwnAddress(ew4.getAddress() as string),
        false,
        'ECurrencyWallet: weOwnAddress must return false for another address',
      );

      assertStrictEqual(
        ecr._getWIFbyAddress(ecrAddress as string),
        ecr.secret,
        'ECurrencyWallet: _getWIFbyAddress must return WIF for own address',
      );
      assertStrictEqual(
        ecr._getWIFbyAddress(ew4.getAddress() as string),
        false,
        'ECurrencyWallet: _getWIFbyAddress must return false for another address',
      );

      const ecrFixed = new ECurrencyWallet();
      ecrFixed.setSecret(ECR_WIF);
      const ecrFixedAddr = ecrFixed.getAddress() as string;
      const { inputs, outputs, fee } = ecrFixed.createTransaction(
        [
          {
            txid: '0000000000000000000000000000000000000000000000000000000000000001',
            vout: 0,
            value: 100000,
            address: ecrFixedAddr,
          },
        ],
        [{ address: ecrFixedAddr, value: 50000 }],
        1,
        ecrFixedAddr,
        0xffffffff,
        true,
      );
      if (inputs.length === 0) throw new Error('ECurrencyWallet: createTransaction must pick at least one input');
      if (outputs.length === 0) throw new Error('ECurrencyWallet: createTransaction must produce outputs');
      if (fee <= 0) throw new Error('ECurrencyWallet: createTransaction must produce positive fee');

      try {
        const ew5 = new ECurrencyWallet();
        await ew5.generate();
        ew5.createTransaction([], [], 1, ew5.getAddress() as string, 0xffffffff);
        throw new Error('ECurrencyWallet: createTransaction must throw when no targets provided');
      } catch (e: any) {
        if (!/No destination provided/.test(e.message)) throw e;
      }

      // --- HDECurrencyWallet ---

      const hdecr = new HDECurrencyWallet();
      assertStrictEqual(hdecr.type, 'HDECurrency', 'HDECurrencyWallet: wrong type');
      assertStrictEqual(hdecr.typeReadable, 'HD ECurrency', 'HDECurrencyWallet: wrong typeReadable');
      assertStrictEqual(hdecr.allowSend(), true, 'HDECurrencyWallet: allowSend must be true');
      assertStrictEqual(hdecr.allowCosignPsbt(), true, 'HDECurrencyWallet: allowCosignPsbt must be true');
      assertStrictEqual(hdecr.allowMasterFingerprint(), true, 'HDECurrencyWallet: allowMasterFingerprint must be true');
      assertStrictEqual(hdecr.allowXpub(), true, 'HDECurrencyWallet: allowXpub must be true');
      assertStrictEqual(hdecr.allowSignVerifyMessage(), false, 'HDECurrencyWallet: allowSignVerifyMessage must be false');
      assertStrictEqual(hdecr.allowBIP47(), false, 'HDECurrencyWallet: allowBIP47 must be false');
      assertStrictEqual(hdecr.getDerivationPath(), "m/44'/8128'/0'", 'HDECurrencyWallet: wrong derivation path');

      const hd1 = new HDECurrencyWallet();
      const hd2 = new HDECurrencyWallet();
      hd1.setSecret(HD_MNEMONIC);
      hd2.setSecret(HD_MNEMONIC);
      assertStrictEqual(hd1.getXpub(), hd2.getXpub(), 'HDECurrencyWallet: getXpub must be deterministic');

      if (hd1._getExternalAddressByIndex(0) === hd1._getInternalAddressByIndex(0)) {
        throw new Error('HDECurrencyWallet: external and internal addresses at index 0 must differ');
      }

      const hdAddresses = Array.from({ length: 5 }, (_, i) => hd1._getExternalAddressByIndex(i));
      if (new Set(hdAddresses).size !== 5) throw new Error('HDECurrencyWallet: successive external addresses must all be unique');

      const hdAddr = hd1._getExternalAddressByIndex(0);
      assertStrictEqual(hd1.isAddressValid(hdAddr), true, 'HDECurrencyWallet: must accept derived ECurrency address');
      assertStrictEqual(
        hd1.isAddressValid('1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf'),
        false,
        'HDECurrencyWallet: must reject Bitcoin legacy address',
      );
      assertStrictEqual(
        hd1.isAddressValid('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'),
        false,
        'HDECurrencyWallet: must reject bech32 address',
      );
      assertStrictEqual(hd1.isAddressValid(''), false, 'HDECurrencyWallet: must reject empty address');

      try {
        hd1.createTransaction([], [], 1, hd1._getInternalAddressByIndex(0), 0xffffffff);
        throw new Error('HDECurrencyWallet: createTransaction must throw when no targets provided');
      } catch (e: any) {
        if (!/No destination provided/.test(e.message)) throw e;
      }

      const hdChangeAddr = hd1._getInternalAddressByIndex(0);
      const hdDestAddr = hd1._getExternalAddressByIndex(1);
      const hdUtxoAddr = hd1._getExternalAddressByIndex(0);
      const hdResult = hd1.createTransaction(
        [
          {
            txid: '0000000000000000000000000000000000000000000000000000000000000001',
            vout: 0,
            value: 100000,
            address: hdUtxoAddr,
          },
        ],
        [{ address: hdDestAddr, value: 50000 }],
        1,
        hdChangeAddr,
        0xffffffff,
        true,
      );
      if (hdResult.inputs.length === 0) throw new Error('HDECurrencyWallet: createTransaction must pick at least one input');
      if (hdResult.outputs.length === 0) throw new Error('HDECurrencyWallet: createTransaction must produce outputs');
      if (hdResult.fee <= 0) throw new Error('HDECurrencyWallet: createTransaction must produce positive fee');
    } catch (Err) {
      console.log(Err);
      errorMessage += Err;
      isOk = false;
    }

    this.setState({
      isLoading: false,
      isOk,
      errorMessage,
    });
  }

  render() {
    return (
      <ScrollView contentContainerStyle={styles.root} automaticallyAdjustContentInsets contentInsetAdjustmentBehavior="automatic">
        <BlueSpacing20 />

        {this.state.isLoading ? (
          <BlueLoading testID="SelfTestLoading" />
        ) : (
          (() => {
            if (this.state.isOk) {
              return (
                <View style={styles.center}>
                  <BlueText testID="SelfTestOk" style={styles.confirmText}>
                    OK
                  </BlueText>
                  <BlueSpacing20 />
                  <BlueText>{loc.settings.about_selftest_ok}</BlueText>
                </View>
              );
            } else {
              return (
                <View style={styles.center}>
                  <BlueText>{this.state.errorMessage}</BlueText>
                </View>
              );
            }
          })()
        )}
        <BlueSpacing20 />
        <SaveFileButton fileName="bluewallet-selftest.txt" fileContent={'Success on ' + new Date().toUTCString()}>
          <Button title="Test Save to Storage" />
        </SaveFileButton>
        <BlueSpacing20 />
        <Button title="Test File Import" onPress={this.onPressImportDocument} />
      </ScrollView>
    );
  }
}
