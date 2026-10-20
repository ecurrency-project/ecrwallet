import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../themes';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import loc from '../../loc';
import ToolTipMenu from '../TooltipMenu';
import { CommonToolTipActions } from '../../typings/CommonToolTipActions';
import ThreeDotsIcon from '../../img/icons/ThreeDotsIcon.tsx';

const SettingsButton = () => {
  const { colors } = useTheme();
  const { navigate } = useExtendedNavigation();
  const onPress = () => {
    console.log('Settings button pressed');
    navigate('Settings');
  };

  const onPressMenuItem = useCallback(
    (menuItem: string) => {
      switch (menuItem) {
        case CommonToolTipActions.ManageWallet.id:
          navigate('ManageWallets');
          break;
        default:
          console.log('Unknown menu item:', menuItem);
          break;
      }
    },
    [navigate],
  );

  const actions = useMemo(() => [CommonToolTipActions.ManageWallet], []);
  return (
    <ToolTipMenu
      accessibilityRole="button"
      accessibilityLabel={loc.settings.default_title}
      testID="SettingsButton"
      isButton
      onPress={onPress}
      buttonStyle={[style.buttonStyle, { backgroundColor: colors.lightButton }]}
      onPressMenuItem={onPressMenuItem}
      actions={actions}
    >
      <View style={style.icon}>
        <ThreeDotsIcon color={colors.foregroundColor} />
      </View>
    </ToolTipMenu>
  );
};

export default SettingsButton;

const style = StyleSheet.create({
  buttonStyle: {
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignContent: 'center',
  },
  icon: {
    alignSelf: 'center',
  },
});
