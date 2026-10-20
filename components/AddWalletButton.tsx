import React, { useCallback, useMemo } from 'react';
import { StyleSheet, GestureResponderEvent, View } from 'react-native';
import { useTheme } from './themes';
import ToolTipMenu from './TooltipMenu';
import { CommonToolTipActions } from '../typings/CommonToolTipActions';
import loc from '../loc';
import { useExtendedNavigation } from '../hooks/useExtendedNavigation';
import PlusIcon from '../img/icons/PlusIcon.tsx';

type AddWalletButtonProps = {
  onPress?: (event: GestureResponderEvent) => void;
};

const styles = StyleSheet.create({
  ball: {
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

const AddWalletButton: React.FC<AddWalletButtonProps> = ({ onPress }) => {
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();
  const stylesHook = StyleSheet.create({
    ball: {
      backgroundColor: colors.lightButton,
    },
  });

  const onPressMenuItem = useCallback(
    (action: string) => {
      switch (action) {
        case CommonToolTipActions.ImportWallet.id:
          navigation.navigate('AddWalletRoot', { screen: 'ImportWallet' });
          break;
        default:
          break;
      }
    },
    [navigation],
  );

  const actions = useMemo(() => [CommonToolTipActions.ImportWallet], []);

  return (
    <ToolTipMenu
      accessibilityRole="button"
      accessibilityLabel={loc.wallets.add_title}
      isButton
      onPress={onPress}
      buttonStyle={[styles.ball, stylesHook.ball]}
      onPressMenuItem={onPressMenuItem}
      actions={actions}
    >
      <View style={styles.icon}>
        <PlusIcon color={colors.foregroundColor} size={28} />
      </View>
    </ToolTipMenu>
  );
};

export default AddWalletButton;
