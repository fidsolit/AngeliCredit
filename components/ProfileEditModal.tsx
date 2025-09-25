import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Input, CheckBox } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { BasicInfoForm, AddressForm, IncomeForm } from '../lib/types';
import { useTheme } from '../lib/ThemeContext';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
  userProfile: any;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  onClose,
  onUpdate,
  userProfile,
}) => {
  const { isDark } = useTheme();
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile && visible) {
      // Populate form with existing data
      setBasicInfo({
        full_name: userProfile.full_name || '',
        phone: userProfile.phone || '',
      });
      setAddress({
        house_number: userProfile.house_number || '',
        province: userProfile.province || '',
        city: userProfile.city || '',
        barangay: userProfile.barangay || '',
        postal_code: userProfile.postal_code || '',
        landline: userProfile.landline || '',
        work_from_home: userProfile.work_from_home || false,
      });
      setIncome({
        main_income_source: userProfile.main_income_source || '',
        business_name: userProfile.business_name || '',
        payout_frequency: userProfile.payout_frequency || '',
        payout_days: userProfile.payout_days || '',
        employment_company: userProfile.employment_company || '',
        employment_position: userProfile.employment_position || '',
        monthly_income: userProfile.monthly_income || 0,
      });
      setErrors({});
    }
  }, [userProfile, visible]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    // Basic Info Validation
    if (!basicInfo.full_name?.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    if (!basicInfo.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(basicInfo.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Address Validation
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

    // Income Validation
    if (!income.monthly_income || income.monthly_income <= 0) {
      newErrors.monthly_income = 'Monthly income is required and must be greater than 0';
    }
    if (!income.employment_company?.trim()) {
      newErrors.employment_company = 'Employment company is required';
    }
    if (!income.employment_position?.trim()) {
      newErrors.employment_position = 'Position is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    try {
      setLoading(true);

      // Check if profile is now complete
      const isComplete = basicInfo.full_name?.trim() && 
                        basicInfo.phone?.trim() &&
                        address.house_number?.trim() &&
                        address.province?.trim() &&
                        address.city?.trim() &&
                        address.barangay?.trim() &&
                        address.postal_code?.trim() &&
                        income.monthly_income && income.monthly_income > 0 &&
                        income.employment_company?.trim() &&
                        income.employment_position?.trim();

      const { error } = await supabase
        .from('profiles')
        .update({
          // Basic Info
          full_name: basicInfo.full_name,
          phone: basicInfo.phone,
          // Address Info
          house_number: address.house_number,
          province: address.province,
          city: address.city,
          barangay: address.barangay,
          postal_code: address.postal_code,
          landline: address.landline,
          work_from_home: address.work_from_home,
          // Income Info
          main_income_source: income.main_income_source,
          business_name: income.business_name,
          payout_frequency: income.payout_frequency,
          payout_days: income.payout_days,
          employment_company: income.employment_company,
          employment_position: income.employment_position,
          monthly_income: income.monthly_income,
          // Profile completion
          profile_completed: isComplete,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.id);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Profile updated successfully!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  if (!visible) return null;

  const themeColors = {
    background: isDark ? '#121212' : '#f8f9fa',
    surface: isDark ? '#1e1e1e' : '#ffffff',
    text: isDark ? '#ffffff' : '#212529',
    textSecondary: isDark ? '#adb5bd' : '#6c757d',
    border: isDark ? '#3d3d3d' : '#e9ecef',
  };

  return (
    <View style={styles.overlay}>
      <View style={[styles.modal, { backgroundColor: themeColors.surface }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6c757d" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <Input
              label="Full Name *"
              value={basicInfo.full_name}
              onChangeText={(text) => {
                setBasicInfo({ ...basicInfo, full_name: text });
                clearError('full_name');
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
                clearError('phone');
              }}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              containerStyle={styles.inputContainer}
              errorMessage={errors.phone}
              errorStyle={styles.errorText}
            />
          </View>

          {/* Address Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <Input
              label="House Number *"
              value={address.house_number}
              onChangeText={(text) => {
                setAddress({ ...address, house_number: text });
                clearError('house_number');
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
                clearError('province');
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
                clearError('city');
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
                clearError('barangay');
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
                clearError('postal_code');
              }}
              placeholder="Enter postal code"
              containerStyle={styles.inputContainer}
              errorMessage={errors.postal_code}
              errorStyle={styles.errorText}
            />

            <Input
              label="Landline (Optional)"
              value={address.landline}
              onChangeText={(text) => setAddress({ ...address, landline: text })}
              placeholder="Enter landline number"
              containerStyle={styles.inputContainer}
            />

            <CheckBox
              title="Work from home"
              checked={address.work_from_home}
              onPress={() => setAddress({ ...address, work_from_home: !address.work_from_home })}
              containerStyle={styles.checkboxContainer}
            />
          </View>

          {/* Income Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Income Information</Text>
            
            <Input
              label="Monthly Income *"
              value={income.monthly_income.toString()}
              onChangeText={(text) => {
                setIncome({ ...income, monthly_income: parseFloat(text) || 0 });
                clearError('monthly_income');
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
                clearError('employment_company');
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
                clearError('employment_position');
              }}
              placeholder="Enter your position"
              containerStyle={styles.inputContainer}
              errorMessage={errors.employment_position}
              errorStyle={styles.errorText}
            />

            <Input
              label="Main Income Source (Optional)"
              value={income.main_income_source}
              onChangeText={(text) => setIncome({ ...income, main_income_source: text })}
              placeholder="e.g., Salary, Business, Freelance"
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Business Name (Optional)"
              value={income.business_name}
              onChangeText={(text) => setIncome({ ...income, business_name: text })}
              placeholder="Enter business name if applicable"
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Payout Frequency (Optional)"
              value={income.payout_frequency}
              onChangeText={(text) => setIncome({ ...income, payout_frequency: text })}
              placeholder="e.g., Weekly, Bi-weekly, Monthly"
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Payout Days (Optional)"
              value={income.payout_days}
              onChangeText={(text) => setIncome({ ...income, payout_days: text })}
              placeholder="e.g., 15th, 30th, Every Friday"
              containerStyle={styles.inputContainer}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              buttonStyle={[styles.button, styles.secondaryButton]}
              titleStyle={styles.secondaryButtonText}
              onPress={onClose}
              icon={{ name: 'close', type: 'material', color: '#ff751f', size: 20 }}
              iconContainerStyle={styles.buttonIcon}
            />
            
            <Button
              title="Save Changes"
              buttonStyle={[styles.button, styles.primaryButton]}
              titleStyle={styles.primaryButtonText}
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              icon={{ name: 'save', type: 'material', color: 'white', size: 20 }}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 8,
  },
  inputContainer: {
    marginBottom: 15,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginBottom: 15,
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
