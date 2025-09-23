import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SimpleStatusBarProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
}

export const SimpleStatusBar: React.FC<SimpleStatusBarProps> = ({
  currentStep,
  totalSteps,
  stepTitles = [],
}) => {
  const renderStep = (stepNumber: number) => {
    const isCompleted = stepNumber < currentStep;
    const isCurrent = stepNumber === currentStep;
    const isPending = stepNumber > currentStep;

    return (
      <View key={stepNumber} style={styles.stepContainer}>
        {/* Step Circle */}
        <View
          style={[
            styles.stepCircle,
            isCompleted && styles.stepCircleCompleted,
            isCurrent && styles.stepCircleCurrent,
            isPending && styles.stepCirclePending,
          ]}
        >
          {isCompleted ? (
            <Ionicons name="checkmark" size={16} color="white" />
          ) : (
            <Text
              style={[
                styles.stepNumber,
                isCurrent && styles.stepNumberCurrent,
                isPending && styles.stepNumberPending,
              ]}
            >
              {stepNumber}
            </Text>
          )}
        </View>

        {/* Step Title */}
        {stepTitles[stepNumber - 1] && (
          <Text
            style={[
              styles.stepTitle,
              isCompleted && styles.stepTitleCompleted,
              isCurrent && styles.stepTitleCurrent,
              isPending && styles.stepTitlePending,
            ]}
          >
            {stepTitles[stepNumber - 1]}
          </Text>
        )}

        {/* Step Description Lines */}
        <View style={styles.stepDescription}>
          <View
            style={[
              styles.descriptionLine,
              isCompleted && styles.descriptionLineCompleted,
              isCurrent && styles.descriptionLineCurrent,
              isPending && styles.descriptionLinePending,
            ]}
          />
          <View
            style={[
              styles.descriptionLine,
              isCompleted && styles.descriptionLineCompleted,
              isCurrent && styles.descriptionLineCurrent,
              isPending && styles.descriptionLinePending,
            ]}
          />
        </View>

        {/* Connector Line */}
        {stepNumber < totalSteps && (
          <View
            style={[
              styles.connectorLine,
              isCompleted && styles.connectorLineCompleted,
              isCurrent && styles.connectorLineCurrent,
              isPending && styles.connectorLinePending,
            ]}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {Array.from({ length: totalSteps }, (_, index) => renderStep(index + 1))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  stepCircleCompleted: {
    backgroundColor: '#ff751f',
    borderColor: '#ff751f',
  },
  stepCircleCurrent: {
    backgroundColor: '#ff751f',
    borderColor: '#ff751f',
  },
  stepCirclePending: {
    backgroundColor: 'white',
    borderColor: '#e0e0e0',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepNumberCurrent: {
    color: 'white',
  },
  stepNumberPending: {
    color: '#9e9e9e',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 6,
    maxWidth: 80,
  },
  stepTitleCompleted: {
    color: '#ff751f',
  },
  stepTitleCurrent: {
    color: '#ff751f',
  },
  stepTitlePending: {
    color: '#9e9e9e',
  },
  stepDescription: {
    alignItems: 'center',
    gap: 2,
  },
  descriptionLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  descriptionLineCompleted: {
    backgroundColor: '#ff751f',
  },
  descriptionLineCurrent: {
    backgroundColor: '#ff751f',
  },
  descriptionLinePending: {
    backgroundColor: '#e0e0e0',
  },
  connectorLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
    borderRadius: 1,
  },
  connectorLineCompleted: {
    backgroundColor: '#ff751f',
  },
  connectorLineCurrent: {
    backgroundColor: '#ff751f',
  },
  connectorLinePending: {
    backgroundColor: '#e0e0e0',
  },
});
