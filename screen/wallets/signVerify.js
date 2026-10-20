import React, { useEffect, useState } from 'react';
import { useLocale, useRoute } from '@react-navigation/native';
import { ActivityIndicator, Keyboard, LayoutAnimation, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import triggerHapticFeedback, { HapticFeedbackTypes } from '../../blue_modules/hapticFeedback';
import { BlueFormLabel, Styles } from '../../BlueComponents';
import presentAlert from '../../components/Alert';
import { useTheme } from '../../components/themes';
import loc from '../../loc';
import { useStorage } from '../../hooks/context/useStorage';
import {
  DoneAndDismissKeyboardInputAccessory,
  DoneAndDismissKeyboardInputAccessoryViewID,
} from '../../components/DoneAndDismissKeyboardInputAccessory';
import { BlueSpacing10, BlueSpacing20, BlueSpacing40 } from '../../components/BlueSpacing';
import { SecondButton } from '../../components/SecondButton';
import Button from '../../components/Button';

const SignVerify = () => {
  const { colors } = useTheme();
  const { wallets, sleep } = useStorage();
  const { params } = useRoute();
  const { direction } = useLocale();

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [address, setAddress] = useState(params.address ?? '');
  const [message, setMessage] = useState(params.message ?? '');
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageHasFocus, setMessageHasFocus] = useState(false);

  const wallet = wallets.find(w => w.getID() === params.walletID);
  const isToolbarVisibleForAndroid = Platform.OS === 'android' && messageHasFocus && isKeyboardVisible;

  useEffect(() => {
    const showSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () =>
      setIsKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setIsKeyboardVisible(false),
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const stylesHooks = StyleSheet.create({
    root: {
      backgroundColor: colors.elevated,
    },
    input: {
      borderColor: colors.formBorder,
      borderBottomColor: colors.formBorder,
      backgroundColor: colors.inputBackgroundColor,
    },
  });

  const handleSign = async () => {
    setLoading(true);
    await sleep(10); // wait for loading indicator to appear
    let newSignature;
    try {
      newSignature = wallet.signMessage(message, address);
      setSignature(newSignature);
    } catch (e) {
      triggerHapticFeedback(HapticFeedbackTypes.NotificationError);
      presentAlert({ title: loc.errors.error, message: e.message });
    }

    setLoading(false);
  };

  const handleVerify = async () => {
    setLoading(true);
    await sleep(10); // wait for loading indicator to appear
    try {
      const res = wallet.verifyMessage(message, address, signature);
      presentAlert({
        title: res ? loc._.success : loc.errors.error,
        message: res ? loc.addresses.sign_signature_correct : loc.addresses.sign_signature_incorrect,
      });
      if (res) {
        triggerHapticFeedback(HapticFeedbackTypes.NotificationSuccess);
      }
    } catch (e) {
      triggerHapticFeedback(HapticFeedbackTypes.NotificationError);
      presentAlert({ title: loc.errors.error, message: e.message });
    }
    setLoading(false);
  };

  const handleFocus = value => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessageHasFocus(value);
  };

  if (loading)
    return (
      <View style={[stylesHooks.root, styles.loading]}>
        <ActivityIndicator />
      </View>
    );

  return (
    <ScrollView
      automaticallyAdjustContentInsets
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.root}
      style={[styles.root, stylesHooks.root]}
    >
      {!isKeyboardVisible && (
        <>
          <BlueSpacing20 />
          <BlueFormLabel>{loc.addresses.sign_help}</BlueFormLabel>
          <BlueSpacing20 />
        </>
      )}

      <View style={[styles.input, stylesHooks.input]}>
        <TextInput
          multiline
          textAlignVertical="top"
          placeholder={loc.addresses.sign_placeholder_address}
          placeholderTextColor="#81868e"
          value={address}
          onChangeText={t => setAddress(t.replace('\n', ''))}
          testID="Signature"
          style={[styles.inputText, { writingDirection: direction }]}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          editable={!loading}
        />
      </View>

      <BlueSpacing10 />

      <View style={[styles.input, stylesHooks.input]}>
        <TextInput
          multiline
          textAlignVertical="top"
          placeholder={loc.addresses.sign_placeholder_signature}
          placeholderTextColor="#81868e"
          value={signature}
          onChangeText={t => setSignature(t.replace('\n', ''))}
          testID="Signature"
          style={[styles.inputText, { writingDirection: direction }]}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          editable={!loading}
        />
      </View>
      <BlueSpacing10 />

      <View style={[styles.input, styles.multiLineInput, stylesHooks.input]}>
        <TextInput
          multiline
          placeholder={loc.addresses.sign_placeholder_message}
          placeholderTextColor="#81868e"
          value={message}
          onChangeText={setMessage}
          testID="Message"
          inputAccessoryViewID={DoneAndDismissKeyboardInputAccessoryViewID}
          style={[styles.inputText, styles.flex, { writingDirection: direction }]}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          editable={!loading}
          onFocus={() => handleFocus(true)}
          onBlur={() => handleFocus(false)}
        />
      </View>
      <BlueSpacing40 />

      {!isKeyboardVisible && (
        <>
          <View style={styles.buttonContainer}>
            <View style={styles.button}>
              <SecondButton title={loc.addresses.sign_sign} disabled={loading} onPress={handleSign} />
            </View>
            <View style={styles.button}>
              <Button onPress={handleVerify} title={loc.addresses.sign_verify} disabled={loading} />
            </View>
          </View>
        </>
      )}

      {Platform.select({
        ios: (
          <DoneAndDismissKeyboardInputAccessory
            onClearTapped={() => setMessage('')}
            onPasteTapped={text => {
              setMessage(text);
              Keyboard.dismiss();
            }}
          />
        ),
        android: isToolbarVisibleForAndroid && (
          <DoneAndDismissKeyboardInputAccessory
            onClearTapped={() => {
              setMessage('');
              Keyboard.dismiss();
            }}
            onPasteTapped={text => {
              setMessage(text);
              Keyboard.dismiss();
            }}
          />
        ),
      })}
    </ScrollView>
  );
};

export default SignVerify;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  buttonContainer: {
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    width: '45%',
  },
  flex: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flexDirection: 'row',
    borderWidth: 1,
    minHeight: 44,
    height: 44,
    alignItems: 'center',
    borderRadius: 24,
    marginHorizontal: 16,
  },
  inputText: {
    ...Styles.fonts['P2 Regular'],
    flex: 1,
    marginHorizontal: 16,
    minHeight: 33,
    color: '#81868e',
  },
  multiLineInput: {
    alignItems: 'flex-start',
    flex: 0.5,
  },
});
