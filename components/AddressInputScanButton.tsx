import React, { useCallback, useMemo } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import ToolTipMenu from './TooltipMenu';
import loc from '../loc';
import { showFilePickerAndReadFile, showImagePickerAndReadImage } from '../blue_modules/fs';
import presentAlert from './Alert';
import { useTheme } from './themes';
import RNQRGenerator from 'rn-qr-generator';
import { CommonToolTipActions } from '../typings/CommonToolTipActions';
import { useSettings } from '../hooks/context/useSettings';
import { scanQrHelper } from '../helpers/scan-qr.ts';
import ScanIcon from '../img/icons/ScanIcon.tsx';
import { BlueText, Styles } from '../BlueComponents';

interface AddressInputScanButtonProps {
  isLoading?: boolean;
  onChangeText: (text: string) => void;
  type?: 'default' | 'link';
  testID?: string;
  beforePress?: () => Promise<void> | void;
}

export const AddressInputScanButton = ({
  isLoading,
  onChangeText,
  type = 'default',
  testID = 'BlueAddressInputScanQrButton',
  beforePress,
}: AddressInputScanButtonProps) => {
  const { colors } = useTheme();
  const { isClipboardGetContentEnabled } = useSettings();

  const toolTipOnPress = useCallback(async () => {
    if (beforePress) {
      await beforePress();
    }
    Keyboard.dismiss();
    scanQrHelper().then(onChangeText);
  }, [beforePress, onChangeText]);

  const actions = useMemo(() => {
    const availableActions = [
      CommonToolTipActions.ChoosePhoto,
      CommonToolTipActions.ImportFile,
      {
        ...CommonToolTipActions.PasteFromClipboard,
        hidden: !isClipboardGetContentEnabled,
      },
    ];

    return availableActions;
  }, [isClipboardGetContentEnabled]);

  const onMenuItemPressed = useCallback(
    async (action: string) => {
      switch (action) {
        case CommonToolTipActions.PasteFromClipboard.id:
          try {
            let getImage: string | null = null;
            let hasImage = false;
            if (Platform.OS === 'android') {
              hasImage = true;
            } else {
              hasImage = await Clipboard.hasImage();
            }

            if (hasImage) {
              getImage = await Clipboard.getImage();
            }

            if (getImage) {
              try {
                const base64Data = getImage.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
                const values = await RNQRGenerator.detect({
                  base64: base64Data,
                });

                if (values && values.values.length > 0) {
                  onChangeText(values.values[0]);
                } else {
                  presentAlert({ message: loc.send.qr_error_no_qrcode });
                }
              } catch (error) {
                presentAlert({ message: (error as Error).message });
              }
            } else {
              const clipboardText = await Clipboard.getString();
              onChangeText(clipboardText);
            }
          } catch (error) {
            presentAlert({ message: (error as Error).message });
          }
          break;
        case CommonToolTipActions.ChoosePhoto.id:
          showImagePickerAndReadImage()
            .then(value => {
              if (value) {
                onChangeText(value);
              }
            })
            .catch(error => {
              presentAlert({ message: error.message });
            });
          break;
        case CommonToolTipActions.ImportFile.id:
          showFilePickerAndReadFile()
            .then(value => {
              if (value.data) {
                onChangeText(value.data);
              }
            })
            .catch(error => {
              presentAlert({ message: error.message });
            });
          break;
      }
      Keyboard.dismiss();
    },
    [onChangeText],
  );

  return (
    <ToolTipMenu
      actions={actions}
      isButton
      onPress={toolTipOnPress}
      onPressMenuItem={onMenuItemPressed}
      testID={testID}
      disabled={isLoading}
      accessibilityLabel={loc.send.details_scan}
      accessibilityHint={loc.send.details_scan_hint}
    >
      <View style={[styles.container, { backgroundColor: colors.lightButton }]}>
        <ScanIcon color={colors.foregroundColor} />
        <BlueText style={[styles.linkText, { color: colors.foregroundColor }]} accessible={false}>
          {type === 'default' ? loc.send.details_scan : loc.wallets.import_scan_qr}
        </BlueText>
      </View>
    </ToolTipMenu>
  );
};

AddressInputScanButton.displayName = 'AddressInputScanButton';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    maxHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
  },
  linkText: {
    ...Styles.fonts['P2 Bold'],
    textAlign: 'center',
  },
});
