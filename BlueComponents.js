/* eslint react/prop-types: "off", react-native/no-inline-styles: "off" */
import React, { forwardRef } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon, Text } from '@rneui/themed';
import { useTheme } from './components/themes';
import { useLocale } from '@react-navigation/native';

const { height, width } = Dimensions.get('window');
const aspectRatio = height / width;
let isIpad;
if (aspectRatio > 1.6) {
  isIpad = false;
} else {
  isIpad = true;
}

const fontBold = Platform.select({
  ios: 'PTSans-Bold',
  android: 'PTSansBold',
});

const fontRegular = Platform.select({
  ios: 'PTSans-Regular',
  android: 'PTSansRegular',
});

/**
 * TODO: remove this comment once this file gets properly converted to typescript.
 *
 * @type {React.FC<any>}
 */
export const BlueButtonLink = forwardRef((props, ref) => {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.blueButtonLink, pressed && styles.pressed]} {...props} ref={ref}>
      <BlueText style={{ color: colors.foregroundColor, textAlign: 'center', ...Styles.fonts['P2 Regular'] }}>{props.title}</BlueText>
    </Pressable>
  );
});

export const BlueCard = props => {
  return <View {...props} style={{ padding: 16 }} />;
};

export const BlueText = ({ bold = false, ...props }) => {
  const { colors } = useTheme();
  const { direction } = useLocale();
  const style = StyleSheet.compose(
    {
      ...(bold ? Styles.fonts['P2 Bold'] : Styles.fonts['P2 Regular']),
      color: colors.foregroundColor,
      writingDirection: direction,
    },
    props.style,
  );
  return <Text {...props} style={style} />;
};

export const BlueTextCentered = ({ bold = false, ...props }) => {
  const { colors } = useTheme();
  const { direction } = useLocale();
  return (
    <Text
      {...props}
      style={{
        ...(bold ? Styles.fonts['P2 Bold'] : Styles.fonts['P2 Regular']),
        color: colors.foregroundColor,
        textAlign: 'center',
        writingDirection: direction,
      }}
    />
  );
};

export const BlueFormLabel = ({ bold = false, ...props }) => {
  const { colors } = useTheme();
  const { direction } = useLocale();
  return (
    <Text
      {...props}
      style={{
        ...(bold ? Styles.fonts['P2 Bold'] : Styles.fonts['P2 Regular']),
        color: colors.foregroundColor,
        marginHorizontal: 20,
        writingDirection: direction,
      }}
    />
  );
};

export const BlueFormMultiInput = props => {
  const { colors } = useTheme();

  return (
    <TextInput
      multiline
      underlineColorAndroid="transparent"
      numberOfLines={4}
      editable={!props.editable}
      style={{
        ...Styles.fonts['P2 Regular'],
        paddingHorizontal: 24,
        paddingVertical: 16,
        flex: 1,
        marginTop: 5,
        marginHorizontal: 20,
        borderColor: colors.formBorder,
        borderBottomColor: colors.formBorder,
        borderWidth: 1,
        borderRadius: 24,
        backgroundColor: colors.inputBackgroundColor,
        color: colors.foregroundColor,
        textAlignVertical: 'top',
      }}
      autoCorrect={false}
      autoCapitalize="none"
      spellCheck={false}
      {...props}
      selectTextOnFocus={false}
      keyboardType={Platform.OS === 'android' ? 'visible-password' : 'default'}
    />
  );
};

export class is {
  static ipad() {
    return isIpad;
  }
}

export function BlueBigCheckmark({ style = {} }) {
  const defaultStyles = {
    backgroundColor: '#ccddf9',
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 0,
  };
  const mergedStyles = { ...defaultStyles, ...style };
  return (
    <View style={mergedStyles}>
      <Icon name="check" size={50} type="font-awesome" color="#0f5cc0" />
    </View>
  );
}

const styles = StyleSheet.create({
  blueButtonLink: {
    minWidth: 100,
    minHeight: 36,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});

export const Styles = {
  fonts: {
    'P1 Regular': {
      fontFamily: fontRegular,
      fontSize: 14,
      lineHeight: 18,
    },
    'P1 Bold': {
      fontFamily: fontBold,
      fontSize: 14,
      lineHeight: 18,
    },
    'P2 Regular': {
      fontFamily: fontRegular,
      fontSize: 16,
      lineHeight: 20,
    },
    'P2 Bold': {
      fontFamily: fontBold,
      fontSize: 16,
      lineHeight: 20,
    },
    'P3 Regular': {
      fontFamily: fontRegular,
      fontSize: 20,
      lineHeight: 24,
    },
    'P3 Bold': {
      fontFamily: fontBold,
      fontSize: 20,
      lineHeight: 24,
    },
    'P4 Regular': {
      fontFamily: fontRegular,
      fontSize: 30,
      lineHeight: 36,
    },
    'P4 Bold': {
      fontFamily: fontBold,
      fontSize: 30,
      lineHeight: 36,
    },
  },
};
