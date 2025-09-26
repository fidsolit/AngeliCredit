import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Input, CheckBox } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from './StatusBar';
import { BasicInfoForm, AddressForm, IncomeForm } from '../lib/types';
import { useSimpleTheme } from '../lib/ThemeContextSimple';

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
  const { isDark, colors } = useSimpleTheme();
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

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const stepTitles = ['Basic Info', 'Address', 'Income Details'];

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (stepNumber === 1) {
      if (!basicInfo.full_name?.trim()) {
        newErrors.full_name = 'Full name is required';
      }
      if (!basicInfo.phone?.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[0-9+\-\s()]+$/.test(basicInfo.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    } else if (stepNumber === 2) {
      if (!address.house_number?.trim()) {
        newErrors.house_number = 'House number is required';
      }
      if (!address.province?.trim()) {
        newErrors.province = 'Province is required';
      }
      if (!address.city?.trim()) {
        newErrors.city = 'City is required';
      }
      if (!address.barangay?.trim()) {
        newErrors.barangay = 'Barangay is required';
      }
      if (!address.postal_code?.trim()) {
        newErrors.postal_code = 'Postal code is required';
      }
    } else if (stepNumber === 3) {
      if (!income.monthly_income || income.monthly_income <= 0) {
        newErrors.monthly_income = 'Monthly income is required and must be greater than 0';
      }
      if (!income.employment_company?.trim()) {
        newErrors.employment_company = 'Employment company is required';
      }
      if (!income.employment_position?.trim()) {
        newErrors.employment_position = 'Position is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step) && step < 3) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    if (validateStep(3)) {
      onComplete({ basicInfo, address, income });
      onClose();
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>
        Let's start with your basic details
      </Text>
      
      <Input
        label="Full Name *"
        value={basicInfo.full_name}
        onChangeText={(text) => {
          setBasicInfo({ ...basicInfo, full_name: text });
          if (errors.full_name) {
            setErrors({ ...errors, full_name: '' });
          }
        }}
        placeholder="Enter your full name"
        containerStyle={styles.inputContainer}
        errorMessage={errors.full_name}
        errorStyle={styles.errorText}
      />
      
      <Input
        label="Phone Number *"
        value={basicInfo.phone}
        onChangeText={(text) => {
          setBasicInfo({ ...basicInfo, phone: text });
          if (errors.phone) {
            setErrors({ ...errors, phone: '' });
          }
        }}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
        containerStyle={styles.inputContainer}
        errorMessage={errors.phone}
        errorStyle={styles.errorText}
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
        label="House Number *"
        value={address.house_number}
        onChangeText={(text) => {
          setAddress({ ...address, house_number: text });
          if (errors.house_number) {
            setErrors({ ...errors, house_number: '' });
          }
        }}
        placeholder="Enter house number"
        containerStyle={styles.inputContainer}
        errorMessage={errors.house_number}
        errorStyle={styles.errorText}
      />
      
      <Input
        label="Province *"
        value={address.province}
        onChangeText={(text) => {
          setAddress({ ...address, province: text });
          if (errors.province) {
            setErrors({ ...errors, province: '' });
          }
        }}
        placeholder="Enter province"
        containerStyle={styles.inputContainer}
        errorMessage={errors.province}
        errorStyle={styles.errorText}
      />
      
      <Input
        label="City *"
        value={address.city}
        onChangeText={(text) => {
          setAddress({ ...address, city: text });
          if (errors.city) {
            setErrors({ ...errors, city: '' });
          }
        }}
        placeholder="Enter city"
        containerStyle={styles.inputContainer}
        errorMessage={errors.city}
        errorStyle={styles.errorText}
      />
      
      <Input
        label="Barangay *"
        value={address.barangay}
        onChangeText={(text) => {
          setAddress({ ...address, barangay: text });
          if (errors.barangay) {
            setErrors({ ...errors, barangay: '' });
          }
        }}
        placeholder="Enter barangay"
        containerStyle={styles.inputContainer}
        errorMessage={errors.barangay}
        errorStyle={styles.errorText}
      />
      
      <Input
        label="Postal Code *"
        value={address.postal_code}
        onChangeText={(text) => {
          setAddress({ ...address, postal_code: text });
          if (errors.postal_code) {
            setErrors({ ...errors, postal_code: '' });
          }
        }}
        placeholder="Enter postal code"
        containerStyle={styles.inputContainer}
        errorMessage={errors.postal_code}
        errorStyle={styles.errorText}
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
        label="Monthly Income *"
        value={income.monthly_income.toString()}
        onChangeText={(text) => {
          setIncome({ ...income, monthly_income: parseFloat(text) || 0 });
          if (errors.monthly_income) {
            setErrors({ ...errors, monthly_income: '' });
          }
        }}
        placeholder="Enter monthly income"
        keyboardType="numeric"
        containerStyle={styles.inputContainer}
        errorMessage={errors.monthly_income}
        errorStyle={styles.errorText}
      />
      
      <Input
        label="Employment Company *"
        value={income.employment_company}
        onChangeText={(text) => {
          setIncome({ ...income, employment_company: text });
          if (errors.employment_company) {
            setErrors({ ...errors, employment_company: '' });
          }
        }}
        placeholder="Enter company name"
        containerStyle={styles.inputContainer}
        errorMessage={errors.employment_company}
        errorStyle={styles.errorText}
      />
      
      <Input
        label="Position *"
        value={income.employment_position}
        onChangeText={(text) => {
          setIncome({ ...income, employment_position: text });
          if (errors.employment_position) {
            setErrors({ ...errors, employment_position: '' });
          }
        }}
        placeholder="Enter your position"
        containerStyle={styles.inputContainer}
        errorMessage={errors.employment_position}
        errorStyle={styles.errorText}
      />
    </View>
  );

  if (!visible) return null;

  const themeColors = colors;

  return (
    <View style={styles.overlay}>
      <View style={[styles.modal, { backgroundColor: themeColors.surface }]}>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
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
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 5,
  },
});
