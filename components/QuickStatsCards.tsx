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
  profile,
  onCashLoanPress,
  onProductLoanPress,
  onCompleteProfile,
}) => {
  const isProfileComplete = profile.profile_completed;
  const hasIdDocument = profile.id_document_url;
  const isIdVerified = profile.id_verification_status === 'verified';

  const canApplyForLoan = isProfileComplete && hasIdDocument && isIdVerified;

  const handleCashLoanPress = () => {
    if (!canApplyForLoan) {
      let message = 'Please complete the following requirements to apply for a loan:\n\n';
      
      if (!isProfileComplete) {
        message += '• Complete your profile information\n';
      }
      if (!hasIdDocument) {
        message += '• Upload a valid ID document\n';
      }
      if (!isIdVerified) {
        message += '• Wait for ID verification approval\n';
      }
      
      message += '\nWould you like to complete your profile now?';
      
      Alert.alert(
        'Profile Incomplete',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete Profile', onPress: onCompleteProfile }
        ]
      );
      return;
    }
    
    onCashLoanPress();
  };

  const handleProductLoanPress = () => {
    if (!canApplyForLoan) {
      let message = 'Please complete the following requirements to apply for a loan:\n\n';
      
      if (!isProfileComplete) {
        message += '• Complete your profile information\n';
      }
      if (!hasIdDocument) {
        message += '• Upload a valid ID document\n';
      }
      if (!isIdVerified) {
        message += '• Wait for ID verification approval\n';
      }
      
      message += '\nWould you like to complete your profile now?';
      
      Alert.alert(
        'Profile Incomplete',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete Profile', onPress: onCompleteProfile }
        ]
      );
      return;
    }
    
    onProductLoanPress();
  };

  return (
    <View style={styles.container}>
      {/* Cash Loan Card */}
      <TouchableOpacity onPress={handleCashLoanPress} style={styles.cardTouchable}>
        <Card containerStyle={[
          styles.card,
          !canApplyForLoan && styles.disabledCard
        ]}>
          <View style={styles.cardContent}>
            <View style={[
              styles.iconContainer,
              !canApplyForLoan && styles.disabledIconContainer
            ]}>
              <Ionicons 
                name="cash" 
                size={24} 
                color={canApplyForLoan ? "#28a745" : "#6c757d"} 
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[
                styles.cardTitle,
                !canApplyForLoan && styles.disabledText
              ]}>
                Cash Loan
              </Text>
              <Text style={[
                styles.cardSubtitle,
                !canApplyForLoan && styles.disabledText
              ]}>
                {canApplyForLoan 
                  ? `${formatCurrency(1000)} - ${formatCurrency(10000)}`
                  : 'Complete Profile First'
                }
              </Text>
              <Text style={[
                styles.cardDescription,
                !canApplyForLoan && styles.disabledText
              ]}>
                {canApplyForLoan 
                  ? 'Quick cash when you need it'
                  : 'Complete profile & verify ID to apply'
                }
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={canApplyForLoan ? "#6c757d" : "#9e9e9e"} 
            />
          </View>
        </Card>
      </TouchableOpacity>

      {/* Product Loan Card */}
      <TouchableOpacity onPress={handleProductLoanPress} style={styles.cardTouchable}>
        <Card containerStyle={[
          styles.card,
          !canApplyForLoan && styles.disabledCard
        ]}>
          <View style={styles.cardContent}>
            <View style={[
              styles.iconContainer,
              !canApplyForLoan && styles.disabledIconContainer
            ]}>
              <Ionicons 
                name="storefront" 
                size={24} 
                color={canApplyForLoan ? "#007bff" : "#6c757d"} 
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[
                styles.cardTitle,
                !canApplyForLoan && styles.disabledText
              ]}>
                Product Loan
              </Text>
              <Text style={[
                styles.cardSubtitle,
                !canApplyForLoan && styles.disabledText
              ]}>
                {canApplyForLoan ? 'Available Soon' : 'Complete Profile First'}
              </Text>
              <Text style={[
                styles.cardDescription,
                !canApplyForLoan && styles.disabledText
              ]}>
                {canApplyForLoan 
                  ? 'Shop now, pay later'
                  : 'Complete profile & verify ID to apply'
                }
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={canApplyForLoan ? "#6c757d" : "#9e9e9e"} 
            />
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
  disabledCard: {
    opacity: 0.6,
    backgroundColor: '#f8f9fa',
  },
  disabledIconContainer: {
    backgroundColor: '#e9ecef',
  },
  disabledText: {
    color: '#6c757d',
  },
});
