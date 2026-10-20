import React, { useCallback, useMemo } from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { MenuView, MenuAction, NativeActionEvent } from '@react-native-menu/menu';
import { ToolTipMenuProps, Action } from './types';
import { useSettings } from '../hooks/context/useSettings';

const ToolTipMenu = (props: ToolTipMenuProps) => {
  const {
    title = '',
    isMenuPrimaryAction = false,
    disabled = false,
    onPress,
    buttonStyle,
    onPressMenuItem,
    children,
    isButton = false,
    ...restProps
  } = props;

  const { language } = useSettings();

  // Map Menu Items for RN Menu (supports subactions and displayInline)
  const mapMenuItemForMenuView = useCallback((action: Action): MenuAction | null => {
    if (!action.id) return null;

    // Check for subactions
    const subactions =
      action.subactions?.map(subaction => {
        const subMenuItem: MenuAction = {
          id: subaction.id.toString(),
          title: subaction.text,
          subtitle: subaction.subtitle,
          image: subaction.icon?.iconValue ? subaction.icon.iconValue : undefined,
          attributes: { disabled: subaction.disabled, destructive: subaction.destructive, hidden: subaction.hidden },
        };
        if ('menuState' in subaction) {
          subMenuItem.state = subaction.menuState ? 'on' : 'off';
        }
        if (subaction.subactions && subaction.subactions.length > 0) {
          const deepSubactions = subaction.subactions.map(deepSub => {
            const deepMenuItem: MenuAction = {
              id: deepSub.id.toString(),
              title: deepSub.text,
              subtitle: deepSub.subtitle,
              image: deepSub.icon?.iconValue ? deepSub.icon.iconValue : undefined,
              attributes: { disabled: deepSub.disabled, destructive: deepSub.destructive, hidden: deepSub.hidden },
            };
            if ('menuState' in deepSub) {
              deepMenuItem.state = deepSub.menuState ? 'on' : 'off';
            }
            return deepMenuItem;
          });
          subMenuItem.subactions = deepSubactions;
        }
        return subMenuItem;
      }) || [];

    const menuItem: MenuAction = {
      id: action.id.toString(),
      title: action.text,
      subtitle: action.subtitle,
      image: action.icon?.iconValue ? action.icon.iconValue : undefined,
      attributes: { disabled: action.disabled, destructive: action.destructive, hidden: action.hidden },
      displayInline: action.displayInline || false,
    };
    if ('menuState' in action) {
      menuItem.state = action.menuState ? 'on' : 'off';
    }
    if (subactions.length > 0) {
      menuItem.subactions = subactions;
    }
    return menuItem;
  }, []);

  const menuViewItemsIOS = useMemo(() => {
    return props.actions
      .map(actionGroup => {
        if (Array.isArray(actionGroup) && actionGroup.length > 0) {
          return {
            id: actionGroup[0].id.toString(),
            title: '',
            subactions: actionGroup
              .filter(action => action.id)
              .map(mapMenuItemForMenuView)
              .filter(item => item !== null) as MenuAction[],
            displayInline: true,
          };
        } else if (!Array.isArray(actionGroup) && actionGroup.id) {
          return mapMenuItemForMenuView(actionGroup);
        }
        return null;
      })
      .filter(item => item !== null) as MenuAction[];
  }, [props.actions, mapMenuItemForMenuView]);

  const menuViewItemsAndroid = useMemo(() => {
    const mergedActions = props.actions.flat().filter(action => action.id);
    return mergedActions.map(mapMenuItemForMenuView).filter(item => item !== null) as MenuAction[];
  }, [props.actions, mapMenuItemForMenuView]);

  const handlePressMenuItemForMenuView = useCallback(
    ({ nativeEvent }: NativeActionEvent) => {
      onPressMenuItem(nativeEvent.event);
    },
    [onPressMenuItem],
  );

  // The tap target has to sit on a different side of MenuView per platform:
  // - iOS: MenuView is a UIButton, and it swallows touches meant for nested RN views,
  //   so a TouchableOpacity inside it never fires onPress. It has to wrap MenuView.
  // - Android: MenuView opens its PopupMenu from a GestureDetector, and a JS responder
  //   above it claims the gesture first, so the long press never reaches the menu.
  //   The TouchableOpacity has to live inside.
  const wrapsButtonOutside = isButton && !isMenuPrimaryAction && Platform.OS === 'ios';

  const renderMenuView = () => {
    const menuView = (
      <MenuView
        title={title}
        isAnchoredToRight
        onPressAction={handlePressMenuItemForMenuView}
        actions={Platform.OS === 'ios' ? menuViewItemsIOS : menuViewItemsAndroid}
        shouldOpenOnLongPress={!isMenuPrimaryAction}
        // @ts-ignore: Not exposed in types
        accessibilityLabel={props.accessibilityLabel}
        accessibilityHint={props.accessibilityHint}
        accessibilityRole={props.accessibilityRole}
        accessibilityLanguage={language}
      >
        {(isMenuPrimaryAction || isButton) && !wrapsButtonOutside ? (
          <TouchableOpacity
            style={buttonStyle}
            disabled={disabled}
            onPress={onPress}
            // Keeps Pressability from firing onPress on release of the long press
            // that just opened the native menu.
            onLongPress={isMenuPrimaryAction ? undefined : () => {}}
            {...restProps}
          >
            {children}
          </TouchableOpacity>
        ) : (
          children
        )}
      </MenuView>
    );

    if (!wrapsButtonOutside) return menuView;

    return (
      <TouchableOpacity style={buttonStyle} disabled={disabled} onPress={onPress} onLongPress={() => {}} activeOpacity={0.6} {...restProps}>
        {menuView}
      </TouchableOpacity>
    );
  };

  return props.actions.length > 0 ? renderMenuView() : null;
};

export default ToolTipMenu;
