import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../lib/types';
import { checkLoanEligibility } from '../lib/utils';

interface LoanRequirementsChecklistProps {
  profile: UserProfile;
}

export const LoanRequirementsChecklist: React.FC<LoanRequirementsChecklistProps> = ({
  profile,
}) => {
  const { canApply, requirements, missingRequirements } = checkLoanEligibility(profile);

  const getRequirementStatus = (requirement: string) => {
    return !missingRequirements.includes(requirement);
  };

  const getRequirementIcon = (requirement: string) => {
    const isCompleted = getRequirementStatus(requirement);
    return isCompleted ? 'checkmark-circle' : 'close-circle';
  };

  const getRequirementColor = (requirement: string) => {
    const isCompleted = getRequirementStatus(requirement);
    return isCompleted ? '#28a745' : '#dc3545';
  };

  if (canApply) {
    return (
      <Card containerStyle={styles.successCard}>
        <View style={styles.successContent}>
          <Ionicons name="checkmark-circle" size={24} color="#28a745" />
          <Text style={styles.successText}>
            You're eligible to apply for a loan!
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card containerStyle={styles.requirementsCard}>
      <Text style={styles.requirementsTitle}>Loan Application Requirements</Text>
      <Text style={styles.requirementsSubtitle}>
        Complete these requirements to apply for a loan:
      </Text>
      
      <View style={styles.requirementsList}>
        {requirements.map((requirement, index) => (
          <View key={index} style={styles.requirementItem}>
            <Ionicons
              name={getRequirementIcon(requirement) as any}
              size={20}
              color={getRequirementColor(requirement)}
            />
            <Text style={[
              styles.requirementText,
              getRequirementStatus(requirement) && styles.requirementCompleted
            ]}>
              {requirement}
            </Text>
          </View>
        ))}
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Progress: {requirements.length - missingRequirements.length} of {requirements.length} completed
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((requirements.length - missingRequirements.length) / requirements.length) * 100}%` }
            ]} 
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  successCard: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  successContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
  },
  requirementsCard: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 8,
  },
  requirementsSubtitle: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 16,
    lineHeight: 20,
  },
  requirementsList: {
    marginBottom: 16,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
  requirementCompleted: {
    textDecorationLine: 'line-through',
    color: '#6c757d',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff751f',
    borderRadius: 3,
  },
});
