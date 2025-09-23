import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Input, CheckBox } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from './StatusBar';
import { BasicInfoForm, AddressForm, IncomeForm } from '../lib/types';

interface ProfileSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: { basicInfo: BasicInfoForm; address: AddressForm; income: IncomeForm }) => void;
  currentStep: number;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  visible,
  onClose,
  onComplete,
  currentStep,
}) => {
  const [step, setStep] = useState(currentStep);
  const [basicInfo, setBasicInfo] = useState<BasicInfoForm>({
    full_name: '',
    phone: '',
  });
  const [address, setAddress] = useState<AddressForm>({
    house_number: '',
    province: '',
    city: '',
    barangay: '',
    postal_code: '',
    landline: '',
    work_from_home: false,
  });
  const [income, setIncome] = useState<IncomeForm>({
    main_income_source: '',
    business_name: '',
    payout_frequency: '',
    payout_days: '',
    employment_company: '',
    employment_position: '',
    monthly_income: 0,
  });

  const stepTitles = ['Basic Info', 'Address', 'Income Details'];

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    onComplete({ basicInfo, address, income });
    onClose();
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>
        Let's start with your basic details
      </Text>
      
      <Input
        label="Full Name"
        value={basicInfo.full_name}
        onChangeText={(text) => setBasicInfo({ ...basicInfo, full_name: text })}
        placeholder="Enter your full name"
        containerStyle={styles.inputContainer}
      />
      
      <Input
        label="Phone Number"
        value={basicInfo.phone}
        onChangeText={(text) => setBasicInfo({ ...basicInfo, phone: text })}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
        containerStyle={styles.inputContainer}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Address Information</Text>
      <Text style={styles.stepDescription}>
        Tell us where you live
      </Text>
      
      <Input
        label="House Number"
        value={address.house_number}
        onChangeText={(text) => setAddress({ ...address, house_number: text })}
        placeholder="Enter house number"
        containerStyle={styles.inputContainer}
      />
      
      <Input
        label="Province"
        value={address.province}
        onChangeText={(text) => setAddress({ ...address, province: text })}
        placeholder="Enter province"
        containerStyle={styles.inputContainer}
      />
      
      <Input
        label="City"
        value={address.city}
        onChangeText={(text) => setAddress({ ...address, city: text })}
        placeholder="Enter city"
        containerStyle={styles.inputContainer}
      />
      
      <Input
        label="Barangay"
        value={address.barangay}
        onChangeText={(text) => setAddress({ ...address, barangay: text })}
        placeholder="Enter barangay"
        containerStyle={styles.inputContainer}
      />
      
      <Input
        label="Postal Code"
        value={address.postal_code}
        onChangeText={(text) => setAddress({ ...address, postal_code: text })}
        placeholder="Enter postal code"
        containerStyle={styles.inputContainer}
      />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Income Details</Text>
      <Text style={styles.stepDescription}>
        Help us understand your financial situation
      </Text>
      
      <Input
        label="Monthly Income"
        value={income.monthly_income.toString()}
        onChangeText={(text) => setIncome({ ...income, monthly_income: parseFloat(text) || 0 })}
        placeholder="Enter monthly income"
        keyboardType="numeric"
        containerStyle={styles.inputContainer}
      />
      
      <Input
        label="Employment Company"
        value={income.employment_company}
        onChangeText={(text) => setIncome({ ...income, employment_company: text })}
        placeholder="Enter company name"
        containerStyle={styles.inputContainer}
      />
      
      <Input
        label="Position"
        value={income.employment_position}
        onChangeText={(text) => setIncome({ ...income, employment_position: text })}
        placeholder="Enter your position"
        containerStyle={styles.inputContainer}
      />
    </View>
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6c757d" />
          </TouchableOpacity>
        </View>

        {/* Status Bar */}
        <StatusBar
          currentStep={step}
          totalSteps={3}
          stepTitles={stepTitles}
        />

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            {step > 1 && (
              <Button
                title="Previous"
                buttonStyle={[styles.button, styles.secondaryButton]}
                titleStyle={styles.secondaryButtonText}
                onPress={prevStep}
                icon={{ name: 'arrow-back', type: 'material', color: '#ff751f', size: 20 }}
                iconContainerStyle={styles.buttonIcon}
              />
            )}
            
            <Button
              title={step === 3 ? "Complete Setup" : "Next"}
              buttonStyle={[styles.button, styles.primaryButton]}
              titleStyle={styles.primaryButtonText}
              onPress={step === 3 ? handleComplete : nextStep}
              icon={step === 3 ? 
                { name: 'check', type: 'material', color: 'white', size: 20 } :
                { name: 'arrow-forward', type: 'material', color: 'white', size: 20 }
              }
              iconContainerStyle={styles.buttonIcon}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 15,
  },
  primaryButton: {
    backgroundColor: '#ff751f',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ff751f',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#ff751f',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
});
