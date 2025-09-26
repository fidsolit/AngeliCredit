import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSimpleTheme } from '../lib/ThemeContextSimple';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavigationProps {
  onApplyLoan: () => void;
  onViewHistory: () => void;
  onCalculator: () => void;
  onSettings: () => void;
  activeTab?: 'home' | 'loan' | 'history' | 'calculator' | 'settings';
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onApplyLoan,
  onViewHistory,
  onCalculator,
  onSettings,
  activeTab = 'home',
}) => {
  const { colors } = useSimpleTheme();
  const insets = useSafeAreaInsets();

  const navigationItems = [
    {
      id: 'loan',
      icon: 'add-circle',
      label: 'Apply Loan',
      onPress: onApplyLoan,
      color: '#007bff',
    },
    {
      id: 'history',
      icon: 'document-text',
      label: 'History',
      onPress: onViewHistory,
      color: '#28a745',
    },
    {
      id: 'calculator',
      icon: 'calculator',
      label: 'Calculator',
      onPress: onCalculator,
      color: '#ff9800',
    },
    {
      id: 'settings',
      icon: 'settings',
      label: 'Settings',
      onPress: onSettings,
      color: '#6c757d',
    },
  ];

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      paddingBottom: insets.bottom,
    }]}>
      <View style={styles.navigationBar}>
        {navigationItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                isActive && styles.activeNavItem,
                isActive && { backgroundColor: `${item.color}15` }
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={isActive ? item.color : colors.textSecondary}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: isActive ? item.color : colors.textSecondary }
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 1000,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  activeNavItem: {
    // Active state styling is handled by backgroundColor in the component
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});
