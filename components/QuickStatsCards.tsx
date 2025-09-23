import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Card } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../lib/utils';
import { UserProfile } from '../lib/types';

interface QuickStatsCardsProps {
  profile: UserProfile;
  onCashLoanPress: () => void;
  onProductLoanPress: () => void;
  onCompleteProfile: () => void;
}

export const QuickStatsCards: React.FC<QuickStatsCardsProps> = ({
  onCashLoanPress,
  onProductLoanPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Cash Loan Card */}
      <TouchableOpacity onPress={onCashLoanPress} style={styles.cardTouchable}>
        <Card containerStyle={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="cash" size={24} color="#28a745" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Cash Loan</Text>
              <Text style={styles.cardSubtitle}>
                {formatCurrency(1000)} - {formatCurrency(10000)}
              </Text>
              <Text style={styles.cardDescription}>Quick cash when you need it</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6c757d" />
          </View>
        </Card>
      </TouchableOpacity>

      {/* Product Loan Card */}
      <TouchableOpacity onPress={onProductLoanPress} style={styles.cardTouchable}>
        <Card containerStyle={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="storefront" size={24} color="#007bff" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Product Loan</Text>
              <Text style={styles.cardSubtitle}>Available Soon</Text>
              <Text style={styles.cardDescription}>Shop now, pay later</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6c757d" />
          </View>
        </Card>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  cardTouchable: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    margin: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 0,
    minHeight: 120,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 12,
    color: '#6c757d',
  },
});
