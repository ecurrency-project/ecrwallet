import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import ToolTipMenu from './TooltipMenu';
import { useTheme } from './themes';
import { Action } from './types';
import loc from '../loc';
import ThreeDotsIcon from '../img/icons/ThreeDotsIcon.tsx';

interface HeaderMenuButtonProps {
  onPressMenuItem: (id: string) => void;
  actions: Action[] | Action[][];
  disabled?: boolean;
  title?: string;
}

const HeaderMenuButton: React.FC<HeaderMenuButtonProps> = ({ onPressMenuItem, actions, disabled, title }) => {
  const { colors } = useTheme();

  const menuActions = Array.isArray(actions[0]) ? (actions as Action[][]) : (actions as Action[]);

  return (
    <ToolTipMenu
      testID="HeaderMenuButton"
      disabled={disabled}
      isButton
      isMenuPrimaryAction
      onPressMenuItem={onPressMenuItem}
      actions={menuActions}
      title={title}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={loc.settings.default_title}
        testID="SettingsButton"
        style={[style.buttonStyle, { backgroundColor: colors.lightButton }]}
      >
        <View style={style.icon}>
          <ThreeDotsIcon color={colors.foregroundColor} />
        </View>
      </TouchableOpacity>
    </ToolTipMenu>
  );
};

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

export default HeaderMenuButton;
