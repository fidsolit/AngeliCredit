import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Avatar, Button } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../lib/types';
import { formatCurrency, getIdVerificationStatus, getIdVerificationColor } from '../lib/utils';

interface ProfileHeaderProps {
  profile: UserProfile;
  onEditProfile: () => void;
  onUpdateProfile: () => void;
  onUploadId: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onEditProfile,
  onUpdateProfile,
  onUploadId,
}) => {
  const isProfileComplete = profile.profile_completed;
  const hasIdDocument = profile.id_document_url;
  const idVerificationStatus = profile.id_verification_status;

  return (
    <View style={styles.container}>
      {/* Profile Completion Banner */}
      {!isProfileComplete && (
        <View style={styles.banner}>
          <Ionicons name="information-circle" size={20} color="#007bff" />
          <Text style={styles.bannerText}>
            Complete your profile to access all features
          </Text>
          <TouchableOpacity onPress={onUpdateProfile} style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>Complete Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <Avatar
          size={80}
          rounded
          source={{ uri: profile.avatar_url }}
          icon={{ name: 'person', type: 'material' }}
          containerStyle={styles.avatar}
        />
        <View style={styles.profileDetails}>
          <Text style={styles.name}>
            {profile.full_name || 'Complete your profile'}
          </Text>
          <Text style={styles.email}>{profile.email}</Text>
          <Text style={styles.phone}>
            {profile.phone || 'Add phone number'}
          </Text>
        </View>
        <TouchableOpacity onPress={onEditProfile} style={styles.editButton}>
          <Ionicons name="create-outline" size={20} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* ID Verification Status */}
      <View style={styles.idVerificationSection}>
        <View style={styles.idStatus}>
          <Ionicons 
            name={hasIdDocument ? "checkmark-circle" : "document-outline"} 
            size={20} 
            color={isProfileComplete ? "#ff751f" : getIdVerificationColor(idVerificationStatus)} 
          />
          <Text style={styles.idStatusText}>
            ID Verification: {getIdVerificationStatus(idVerificationStatus)}
          </Text>
        </View>
        {!hasIdDocument && (
          <Button
            title="Upload ID"
            size="sm"
            buttonStyle={styles.uploadButton}
            onPress={onUploadId}
            icon={{ name: 'cloud-upload', type: 'material', color: 'white', size: 16 }}
          />
        )}
      </View>

      {/* Credit Information */}
      <View style={styles.creditInfo}>
        <View style={styles.creditItem}>
          <Text style={styles.creditLabel}>Credit Score</Text>
          <Text style={styles.creditValue}>{profile.credit_score || 0}</Text>
        </View>
        <View style={styles.creditItem}>
          <Text style={styles.creditLabel}>Loan Limit</Text>
          <Text style={styles.creditValue}>
            {formatCurrency(profile.loan_limit || 0)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  bannerText: {
    flex: 1,
    marginLeft: 8,
    color: '#007bff',
    fontSize: 14,
    fontWeight: '500',
  },
  bannerButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bannerButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    backgroundColor: '#e9ecef',
    marginRight: 15,
  },
  profileDetails: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
    color: '#6c757d',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  idVerificationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  idStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  idStatusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  creditInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  creditItem: {
    alignItems: 'center',
  },
  creditLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
    fontWeight: '500',
  },
  creditValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
});
