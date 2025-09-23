import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';

interface QuickActionsProps {
  onLoanCalculator: () => void;
  onLoanHistory: () => void;
  onAccountSettings: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onLoanCalculator,
  onLoanHistory,
  onAccountSettings,
}) => {
  return (
    <View style={styles.container}>
      <Text h4 style={styles.sectionTitle}>Quick Actions</Text>
      
      <View style={styles.actionsGrid}>
        <Button
          title="Loan Calculator"
          buttonStyle={[styles.actionButton, { backgroundColor: '#007bff' }]}
          titleStyle={styles.actionButtonText}
          onPress={onLoanCalculator}
          icon={{ name: 'calculator', type: 'material', color: 'white', size: 20 }}
          iconContainerStyle={styles.actionIcon}
        />
        
        <Button
          title="View Loan History"
          buttonStyle={[styles.actionButton, { backgroundColor: '#28a745' }]}
          titleStyle={styles.actionButtonText}
          onPress={onLoanHistory}
          icon={{ name: 'history', type: 'material', color: 'white', size: 20 }}
          iconContainerStyle={styles.actionIcon}
        />
        
        <Button
          title="Account Settings"
          buttonStyle={[styles.actionButton, { backgroundColor: '#6c757d' }]}
          titleStyle={styles.actionButtonText}
          onPress={onAccountSettings}
          icon={{ name: 'settings', type: 'material', color: 'white', size: 20 }}
          iconContainerStyle={styles.actionIcon}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#212529',
    fontWeight: '600',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minWidth: '30%',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionIcon: {
    marginRight: 0,
  },
});
