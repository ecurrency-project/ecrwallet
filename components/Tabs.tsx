import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const tabsStyles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    height: 50,
  },
  tabRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#e3e3e3',
    borderBottomWidth: 2,
  },
  activeTabRoot: {
    borderBottomWidth: 2,
    borderColor: '#D53131',
  },
  marginBottom: {
    marginBottom: 30,
  },
});

interface TabProps {
  active: boolean;
}

interface TabsProps {
  active: number;
  onSwitch: (index: number) => void;
  tabs: React.ComponentType<TabProps>[];
  isIpad?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({ active, onSwitch, tabs, isIpad = false }) => {
  return (
    <View style={[tabsStyles.root, isIpad && tabsStyles.marginBottom]}>
      {tabs.map((Tab, i) => (
        <TouchableOpacity
          key={i}
          accessibilityRole="button"
          onPress={() => onSwitch(i)}
          style={[tabsStyles.tabRoot, active === i && { ...tabsStyles.activeTabRoot }]}
        >
          <Tab active={active === i} />
        </TouchableOpacity>
      ))}
    </View>
  );
};
