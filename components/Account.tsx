import {
  StyleSheet,
  View,
  Alert,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import { Button, Text, Card, Avatar, Divider, Input, CheckBox } from "@rneui/themed";
import { supabase } from "../lib/supabase";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  credit_score?: number;
  loan_limit?: number;
  avatar_url?: string;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  amount?: number;
  created_at: string;
  icon: string;
  color: string;
}

export default function Account({ session }: { session: any }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [loanApplication, setLoanApplication] = useState({
    amount: "",
    purpose: "",
    termMonths: "1",
    monthlyIncome: "",
    employmentType: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
      fetchRecentActivities();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
      }

      setUserProfile({
        id: session.user.id,
        email: session.user.email,
        full_name: data?.full_name || "",
        phone: data?.phone || "",
        credit_score: data?.credit_score || 0,
        loan_limit: data?.loan_limit || 0,
        avatar_url: data?.avatar_url || null,
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true);

      // Fetch from activity_log table
      const { data: activityData, error: activityError } = await supabase
        .from("activity_log")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch from loans table for loan-related activities
      const { data: loanData, error: loanError } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", session.user.id)
        .order("application_date", { ascending: false })
        .limit(5);

      let activities: ActivityItem[] = [];

      // Process activity_log data
      if (activityData && !activityError) {
        const processedActivities = activityData.map((activity) => ({
          id: activity.id,
          activity_type: activity.activity_type,
          description: activity.description,
          amount: activity.amount,
          created_at: activity.created_at,
          icon: getActivityIcon(activity.activity_type),
          color: getActivityColor(activity.activity_type),
        }));
        activities = [...activities, ...processedActivities];
      }

      // Process loan data
      if (loanData && !loanError) {
        const processedLoans = loanData.map((loan) => ({
          id: `loan-${loan.id}`,
          activity_type: "loan_status",
          description: `Loan application ${loan.status}`,
          amount: loan.amount,
          created_at: loan.application_date,
          icon: getLoanStatusIcon(loan.status),
          color: getLoanStatusColor(loan.status),
        }));
        activities = [...activities, ...processedLoans];
      }

      // Sort by date and take the most recent 5
      activities.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      activities = activities.slice(0, 5);

      // If no real activities, use dummy data
      if (activities.length === 0) {
        activities = getDummyActivities();
      }

      setRecentActivities(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      // Fallback to dummy data on error
      setRecentActivities(getDummyActivities());
    } finally {
      setActivitiesLoading(false);
    }
  };

  const getActivityIcon = (activityType: string): string => {
    switch (activityType) {
      case "loan_application":
        return "document-text";
      case "payment":
        return "card";
      case "deposit":
        return "add-circle";
      case "withdrawal":
        return "remove-circle";
      default:
        return "information-circle";
    }
  };

  const getActivityColor = (activityType: string): string => {
    switch (activityType) {
      case "loan_application":
        return "#007bff";
      case "payment":
        return "#dc3545";
      case "deposit":
        return "#28a745";
      case "withdrawal":
        return "#ff9800";
      default:
        return "#6c757d";
    }
  };

  const getLoanStatusIcon = (status: string): string => {
    switch (status) {
      case "approved":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "rejected":
        return "close-circle";
      case "completed":
        return "checkmark-done-circle";
      default:
        return "document-text";
    }
  };

  const getLoanStatusColor = (status: string): string => {
    switch (status) {
      case "approved":
        return "#28a745";
      case "pending":
        return "#ff9800";
      case "rejected":
        return "#dc3545";
      case "completed":
        return "#007bff";
      default:
        return "#6c757d";
    }
  };

  const getDummyActivities = (): ActivityItem[] => {
    return [
      {
        id: "dummy-1",
        activity_type: "loan_approved",
        description: "Loan Application Approved",
        amount: 50000,
        created_at: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(), // 2 days ago
        icon: "checkmark-circle",
        color: "#28a745",
      },
      {
        id: "dummy-2",
        activity_type: "payment",
        description: "Monthly Payment",
        amount: 2500,
        created_at: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1 week ago
        icon: "arrow-down-circle",
        color: "#dc3545",
      },
      {
        id: "dummy-3",
        activity_type: "loan_application",
        description: "New Loan Application Submitted",
        amount: 30000,
        created_at: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(), // 10 days ago
        icon: "document-text",
        color: "#007bff",
      },
    ];
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Error", error.message);
  };

  const openEditModal = () => {
    if (userProfile) {
      setEditingProfile({ ...userProfile });
      setEditModalVisible(true);
    }
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingProfile(null);
  };

  const uploadProfilePicture = async (uri: string) => {
    try {
      setUploading(true);

      // Create a unique filename
      const fileExt = uri.split(".").pop()?.toLowerCase() ?? "jpeg";
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;

      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to upload a profile picture."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const publicUrl = await uploadProfilePicture(imageUri);

        if (editingProfile) {
          setEditingProfile({ ...editingProfile, avatar_url: publicUrl });
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    }
  };

  const saveProfile = async () => {
    if (!editingProfile) return;

    try {
      setUploading(true);

      const { error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        full_name: editingProfile.full_name,
        phone: editingProfile.phone,
        avatar_url: editingProfile.avatar_url,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      // Update local state
      setUserProfile(editingProfile);
      closeEditModal();
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const toggleProfileMenu = () => {
    setProfileMenuVisible(!profileMenuVisible);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: handleSignOut,
      },
    ]);
    setProfileMenuVisible(false);
  };

  const openLoanApplication = () => {
    setLoanModalVisible(true);
    setProfileMenuVisible(false);
  };

  const closeLoanModal = () => {
    setLoanModalVisible(false);
    setLoanApplication({
      amount: "",
      purpose: "",
      termMonths: "1",
      monthlyIncome: "",
      employmentType: "",
    });
    setTermsAccepted(false);
  };

  const calculateLoanDetails = () => {
    const amount = parseFloat(loanApplication.amount) || 0;
    const termMonths = parseInt(loanApplication.termMonths) || 1;
    const monthlyInterestRate = 0.15; // 15% per month (fixed rate)

    if (amount <= 0) {
      return {
        monthlyPayment: 0,
        totalAmount: 0,
        interestAmount: 0,
      };
    }

    // Calculate interest amount: 15% per month for each month
    const interestAmount = amount * monthlyInterestRate * termMonths;

    // Calculate total amount
    const totalAmount = amount + interestAmount;

    // Calculate monthly payment
    const monthlyPayment = totalAmount / termMonths;

    return {
      monthlyPayment: isNaN(monthlyPayment) ? 0 : monthlyPayment,
      totalAmount: totalAmount,
      interestAmount: interestAmount,
    };
  };

  const submitLoanApplication = async () => {
    // Validation - Check each field individually
    const missingFields = [];
    
    if (!loanApplication.amount.trim()) missingFields.push("Loan Amount");
    if (!loanApplication.purpose.trim()) missingFields.push("Loan Purpose");
    if (!loanApplication.monthlyIncome.trim()) missingFields.push("Monthly Income");
    if (!loanApplication.employmentType.trim()) missingFields.push("Employment Type");
    
    if (missingFields.length > 0) {
      Alert.alert(
        "Missing Required Fields", 
        `Please fill in the following required fields:\n• ${missingFields.join('\n• ')}`
      );
      return;
    }

    if (!termsAccepted) {
      Alert.alert("Terms Required", "You must accept the terms and conditions before submitting your loan application.");
      return;
    }

    const amount = parseFloat(loanApplication.amount);
    const monthlyIncome = parseFloat(loanApplication.monthlyIncome);

    if (amount < 500 || amount > 500000) {
      Alert.alert(
        "Validation Error",
        "Loan amount must be between ₱500 and ₱500,000."
      );
      return;
    }

    if (monthlyIncome <= 0) {
      Alert.alert("Validation Error", "Monthly income must be greater than 0.");
      return;
    }

    // Check if loan amount is reasonable (not more than 5x monthly income)
    if (amount > monthlyIncome * 5) {
      Alert.alert(
        "Validation Error",
        "Loan amount cannot exceed 5 times your monthly income."
      );
      return;
    }

    try {
      setUploading(true);

      const loanDetails = calculateLoanDetails();
      const interestRate = 0.15; // 15% per month

      const { error } = await supabase.from("loans").insert({
        user_id: session.user.id,
        amount: amount,
        interest_rate: interestRate,
        term_months: parseInt(loanApplication.termMonths),
        monthly_payment: loanDetails.monthlyPayment,
        status: "pending",
        application_date: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      // Log activity
      await supabase.from("activity_log").insert({
        user_id: session.user.id,
        activity_type: "loan_application",
        description: `Applied for ₱${formatCurrency(amount)} loan`,
        amount: amount,
      });

      closeLoanModal();
      Alert.alert(
        "Application Submitted",
        "Your loan application has been submitted successfully! We will review it and get back to you within 24 hours.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error submitting loan application:", error);
      Alert.alert(
        "Error",
        "Failed to submit loan application. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years > 1 ? "s" : ""} ago`;
    }
  };

  const isFormValid = (): boolean => {
    return (
      loanApplication.amount.trim() !== "" &&
      loanApplication.purpose.trim() !== "" &&
      loanApplication.monthlyIncome.trim() !== "" &&
      loanApplication.employmentType.trim() !== "" &&
      termsAccepted
    );
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return "#4CAF50"; // Green
    if (score >= 650) return "#FF9800"; // Orange
    return "#F44336"; // Red
  };

  const getCreditScoreText = (score: number) => {
    if (score >= 750) return "Excellent";
    if (score >= 650) return "Good";
    if (score >= 500) return "Fair";
    return "Poor";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileSection}
          onPress={toggleProfileMenu}
        >
          <Avatar
            size={80}
            rounded
            source={{ uri: userProfile?.avatar_url }}
            icon={{ name: "person", type: "material" }}
            containerStyle={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text h4 style={styles.userName}>
              {userProfile?.full_name || "User"}
            </Text>
            <Text style={styles.userEmail}>{userProfile?.email}</Text>
            <Text style={styles.userPhone}>
              {userProfile?.phone || "No phone number"}
            </Text>
          </View>
          <View style={styles.profileActions}>
            <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
              <Ionicons name="create-outline" size={20} color="#007bff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton}>
              <Ionicons
                name={profileMenuVisible ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6c757d"
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Profile Menu */}
        {profileMenuVisible && (
          <View style={styles.profileMenu}>
            <TouchableOpacity style={styles.menuItem} onPress={openEditModal}>
              <Ionicons name="person-outline" size={20} color="#6c757d" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#dc3545" />
              <Text style={[styles.menuItemText, { color: "#dc3545" }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Stats Cards */}
      <View style={styles.statsContainer}>
        <Card containerStyle={styles.statCard}>
          <View style={styles.statItem}>
            <Ionicons name="card" size={24} color="#007bff" />
            <Text style={styles.statLabel}>Credit Score</Text>
            <Text
              style={[
                styles.statValue,
                { color: getCreditScoreColor(userProfile?.credit_score || 0) },
              ]}
            >
              {userProfile?.credit_score || 0}
            </Text>
            <Text
              style={[
                styles.statSubtext,
                { color: getCreditScoreColor(userProfile?.credit_score || 0) },
              ]}
            >
              {getCreditScoreText(userProfile?.credit_score || 0)}
            </Text>
          </View>
        </Card>

        <Card containerStyle={styles.statCard}>
          <View style={styles.statItem}>
            <Ionicons name="cash" size={24} color="#28a745" />
            <Text style={styles.statLabel}>Loan Limit</Text>
            <Text style={[styles.statValue, { color: "#28a745" }]}>
              {formatCurrency(userProfile?.loan_limit || 0)}
            </Text>
            <Text style={styles.statSubtext}>Available</Text>
          </View>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text h4 style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={openLoanApplication}
        >
          <Ionicons name="add-circle" size={24} color="#007bff" />
          <Text style={styles.actionText}>Apply for Loan</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="document-text" size={24} color="#28a745" />
          <Text style={styles.actionText}>View Loan History</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="calculator" size={24} color="#ff9800" />
          <Text style={styles.actionText}>Loan Calculator</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="settings" size={24} color="#6c757d" />
          <Text style={styles.actionText}>Account Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <View style={styles.activityContainer}>
        <Text h4 style={styles.sectionTitle}>
          Recent Activity
        </Text>
        <Card containerStyle={styles.activityCard}>
          {activitiesLoading ? (
            <View style={styles.loadingActivity}>
              <Text style={styles.loadingText}>Loading activities...</Text>
            </View>
          ) : recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <View key={activity.id}>
                <View style={styles.activityItem}>
                  <Ionicons
                    name={activity.icon as any}
                    size={20}
                    color={activity.color}
                  />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>
                      {activity.description}
                    </Text>
                    <Text style={styles.activityDate}>
                      {formatTimeAgo(activity.created_at)}
                    </Text>
                  </View>
                  {activity.amount && (
                    <Text
                      style={[
                        styles.activityAmount,
                        {
                          color:
                            activity.activity_type === "payment" ||
                            activity.activity_type === "withdrawal"
                              ? "#dc3545"
                              : activity.color,
                        },
                      ]}
                    >
                      {activity.activity_type === "payment" ||
                      activity.activity_type === "withdrawal"
                        ? "-"
                        : "+"}
                      {formatCurrency(activity.amount)}
                    </Text>
                  )}
                </View>
                {index < recentActivities.length - 1 && (
                  <Divider style={styles.divider} />
                )}
              </View>
            ))
          ) : (
            <View style={styles.noActivity}>
              <Text style={styles.noActivityText}>No recent activity</Text>
            </View>
          )}
        </Card>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeEditModal}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text h4 style={styles.modalTitle}>
              Edit Profile
            </Text>
            <TouchableOpacity onPress={saveProfile} disabled={uploading}>
              <Text
                style={[
                  styles.modalSaveButton,
                  uploading && styles.disabledButton,
                ]}
              >
                {uploading ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Picture Section */}
            <View style={styles.avatarSection}>
              <Avatar
                size={120}
                rounded
                source={{ uri: editingProfile?.avatar_url }}
                icon={{ name: "person", type: "material" }}
                containerStyle={styles.modalAvatar}
              />
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#007bff" />
                <Text style={styles.uploadButtonText}>
                  {uploading ? "Uploading..." : "Change Photo"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <Input
                label="Full Name"
                value={editingProfile?.full_name || ""}
                onChangeText={(text) =>
                  setEditingProfile((prev) =>
                    prev ? { ...prev, full_name: text } : null
                  )
                }
                placeholder="Enter your full name"
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Phone Number"
                value={editingProfile?.phone || ""}
                onChangeText={(text) =>
                  setEditingProfile((prev) =>
                    prev ? { ...prev, phone: text } : null
                  )
                }
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Email"
                value={editingProfile?.email || ""}
                editable={false}
                containerStyle={styles.inputContainer}
                inputStyle={styles.disabledInput}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Loan Application Modal */}
      <Modal
        visible={loanModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeLoanModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeLoanModal}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text h4 style={styles.modalTitle}>
              Apply for Loan
            </Text>
            <TouchableOpacity
              onPress={submitLoanApplication}
              disabled={uploading || !isFormValid()}
            >
              <Text
                style={[
                  styles.modalSaveButton,
                  (uploading || !isFormValid()) && styles.disabledButton,
                ]}
              >
                {uploading ? "Submitting..." : "Submit"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Loan Calculator Preview */}
            {loanApplication.amount && (
              <View style={styles.loanPreviewCard}>
                <Text h4 style={styles.loanPreviewTitle}>
                  Loan Preview
                </Text>
                <View style={styles.loanPreviewRow}>
                  <Text style={styles.loanPreviewLabel}>Monthly Payment:</Text>
                  <Text style={[styles.loanPreviewValue, { color: "#007bff" }]}>
                    {formatCurrency(calculateLoanDetails().monthlyPayment)}
                  </Text>
                </View>
                <View style={styles.loanPreviewRow}>
                  <Text style={styles.loanPreviewLabel}>Total Amount:</Text>
                  <Text style={[styles.loanPreviewValue, { color: "#28a745" }]}>
                    {formatCurrency(calculateLoanDetails().totalAmount)}
                  </Text>
                </View>
                <View style={styles.loanPreviewRow}>
                  <Text style={styles.loanPreviewLabel}>
                    Interest (Exactly 15% per month):
                  </Text>
                  <Text style={[styles.loanPreviewValue, { color: "#ff9800" }]}>
                    {formatCurrency(calculateLoanDetails().interestAmount)}
                  </Text>
                </View>
              </View>
            )}

            {/* Loan Application Form */}
            <View style={styles.formSection}>
              <Input
                label="Loan Amount *"
                value={loanApplication.amount}
                onChangeText={(text) =>
                  setLoanApplication((prev) => ({ ...prev, amount: text }))
                }
                placeholder="Enter loan amount"
                keyboardType="numeric"
                containerStyle={styles.inputContainer}
                rightIcon={<Text style={styles.currencyLabel}>₱</Text>}
                errorStyle={!loanApplication.amount.trim() ? styles.errorText : {}}
                errorMessage={!loanApplication.amount.trim() ? "This field is required" : ""}
              />

              <Input
                label="Loan Purpose *"
                value={loanApplication.purpose}
                onChangeText={(text) =>
                  setLoanApplication((prev) => ({ ...prev, purpose: text }))
                }
                placeholder="e.g., Home improvement, Education, Emergency"
                containerStyle={styles.inputContainer}
                errorStyle={!loanApplication.purpose.trim() ? styles.errorText : {}}
                errorMessage={!loanApplication.purpose.trim() ? "This field is required" : ""}
              />

              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>Repayment Term *</Text>
                <View style={styles.dropdownOptions}>
                  {["1", "2", "3"].map((term) => (
                    <TouchableOpacity
                      key={term}
                      style={[
                        styles.dropdownOption,
                        loanApplication.termMonths === term &&
                          styles.dropdownOptionSelected,
                      ]}
                      onPress={() =>
                        setLoanApplication((prev) => ({
                          ...prev,
                          termMonths: term,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          loanApplication.termMonths === term &&
                            styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {term} {term === "1" ? "month" : "months"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Input
                label="Monthly Income *"
                value={loanApplication.monthlyIncome}
                onChangeText={(text) =>
                  setLoanApplication((prev) => ({
                    ...prev,
                    monthlyIncome: text,
                  }))
                }
                placeholder="Enter your monthly income"
                keyboardType="numeric"
                containerStyle={styles.inputContainer}
                rightIcon={<Text style={styles.currencyLabel}>₱</Text>}
                errorStyle={!loanApplication.monthlyIncome.trim() ? styles.errorText : {}}
                errorMessage={!loanApplication.monthlyIncome.trim() ? "This field is required" : ""}
              />

              <View style={styles.dropdownContainer}>
                <Text style={[
                  styles.dropdownLabel,
                  !loanApplication.employmentType.trim() && styles.errorText
                ]}>
                  Employment Type *
                  {!loanApplication.employmentType.trim() && (
                    <Text style={styles.errorText}> - This field is required</Text>
                  )}
                </Text>
                <View style={styles.dropdownOptions}>
                  {[
                    "Full-time",
                    "Part-time",
                    "Self-employed",
                    "Contract",
                    "Retired",
                  ].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.dropdownOption,
                        loanApplication.employmentType === type &&
                          styles.dropdownOptionSelected,
                      ]}
                      onPress={() =>
                        setLoanApplication((prev) => ({
                          ...prev,
                          employmentType: type,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          loanApplication.employmentType === type &&
                            styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.loanTerms}>
                <Text style={styles.loanTermsTitle}>
                  Loan Terms & Conditions
                </Text>
                <Text style={styles.loanTermsText}>
                  • Interest Rate: Exactly 15% per month
                </Text>
                <Text style={styles.loanTermsText}>
                  • Loan amount: ₱500 - ₱500,000
                </Text>
                <Text style={styles.loanTermsText}>
                  • Processing time: 24-48 hours
                </Text>
                <Text style={styles.loanTermsText}>
                  • No prepayment penalties
                </Text>
                <Text style={styles.loanTermsText}>
                  • Late payment fee: ₱500 per month
                </Text>
              </View>

              {/* Terms and Conditions Acceptance */}
              <View style={styles.termsAcceptance}>
                <CheckBox
                  checked={termsAccepted}
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  checkedColor="#007bff"
                  uncheckedColor={!termsAccepted ? "#dc3545" : "#6c757d"}
                  size={20}
                />
                <View style={styles.termsTextContainer}>
                  <Text style={[
                    styles.termsText,
                    !termsAccepted && styles.errorText
                  ]}>
                    I agree to the{" "}
                    <Text 
                      style={styles.termsLink}
                      onPress={() => setTermsModalVisible(true)}
                    >
                      Terms and Conditions
                    </Text>
                    {" "}and understand the loan terms above.
                    {!termsAccepted && (
                      <Text style={styles.errorText}> (Required)</Text>
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
              <Text style={styles.modalCancelButton}>Close</Text>
            </TouchableOpacity>
            <Text h4 style={styles.modalTitle}>
              Terms and Conditions
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.termsContent}>
              <Text h4 style={styles.termsSectionTitle}>
                eCredit Loan Terms and Conditions
              </Text>
              
              <Text style={styles.termsSectionSubtitle}>
                Last updated: {new Date().toLocaleDateString()}
              </Text>

              <View style={styles.termsSection}>
                <Text style={styles.termsSectionHeader}>1. Loan Agreement</Text>
                <Text style={styles.termsSectionText}>
                  By applying for a loan through eCredit, you agree to be bound by these terms and conditions. 
                  The loan agreement will be legally binding once approved and accepted.
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsSectionHeader}>2. Interest Rates and Fees</Text>
                <Text style={styles.termsSectionText}>
                  • Interest Rate: 15% per month (fixed rate)
                  • Late Payment Fee: ₱500 per month
                  • No prepayment penalties
                  • Processing fee: ₱100 (one-time, deducted from loan amount)
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsSectionHeader}>3. Loan Amount and Terms</Text>
                <Text style={styles.termsSectionText}>
                  • Minimum loan amount: ₱500
                  • Maximum loan amount: ₱500,000
                  • Repayment terms: 1-3 months
                  • Processing time: 24-48 hours
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsSectionHeader}>4. Eligibility Requirements</Text>
                <Text style={styles.termsSectionText}>
                  • Must be 18 years or older
                  • Must have valid government-issued ID
                  • Must provide proof of income
                  • Must have active bank account
                  • Loan amount cannot exceed 5x monthly income
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsSectionHeader}>5. Repayment Obligations</Text>
                <Text style={styles.termsSectionText}>
                  • Monthly payments are due on the same date each month
                  • Late payments will incur additional fees
                  • Default may result in legal action
                  • Early repayment is allowed without penalty
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsSectionHeader}>6. Privacy and Data Protection</Text>
                <Text style={styles.termsSectionText}>
                  • We collect and process your personal information in accordance with our Privacy Policy
                  • Your data is protected and will not be shared with third parties without consent
                  • We may use your information for credit assessment and collection purposes
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsSectionHeader}>7. Default and Collection</Text>
                <Text style={styles.termsSectionText}>
                  • Default occurs after 30 days of missed payment
                  • Collection efforts may include phone calls, emails, and legal action
                  • Default may affect your credit score and future loan eligibility
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsSectionHeader}>8. Contact Information</Text>
                <Text style={styles.termsSectionText}>
                  For questions about these terms, contact us at:
                  • Email: support@ecredit.com
                  • Phone: +63 2 1234 5678
                  • Address: eCredit Office, Manila, Philippines
                </Text>
              </View>

              <View style={styles.termsAcceptance}>
                <CheckBox
                  checked={termsAccepted}
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  checkedColor="#007bff"
                  uncheckedColor="#6c757d"
                  size={20}
                />
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsText}>
                    I have read and agree to these Terms and Conditions
                  </Text>
                </View>
              </View>

              <Button
                title="Accept Terms"
                onPress={() => setTermsModalVisible(false)}
                buttonStyle={[styles.primaryButton, { marginTop: 20 }]}
                titleStyle={styles.buttonText}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    paddingVertical: 10,
  },
  avatar: {
    backgroundColor: "#e9ecef",
    borderWidth: 3,
    borderColor: "#007bff",
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  userName: {
    color: "#212529",
    fontWeight: "600",
    marginBottom: 5,
  },
  userEmail: {
    color: "#6c757d",
    fontSize: 14,
    marginBottom: 2,
  },
  userPhone: {
    color: "#6c757d",
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: -15,
    marginBottom: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 0,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 11,
    fontWeight: "500",
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#212529",
    fontWeight: "600",
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: "#212529",
    fontWeight: "500",
  },
  activityContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  activityCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 0,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  activityContent: {
    flex: 1,
    marginLeft: 15,
  },
  activityTitle: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "500",
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: "#6c757d",
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    marginVertical: 10,
  },
  // Edit Profile Styles
  editButton: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalCancelButton: {
    color: "#6c757d",
    fontSize: 16,
    fontWeight: "500",
  },
  modalTitle: {
    color: "#212529",
    fontWeight: "600",
  },
  modalSaveButton: {
    color: "#007bff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    color: "#6c757d",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#ffffff",
    marginTop: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalAvatar: {
    backgroundColor: "#e9ecef",
    borderWidth: 3,
    borderColor: "#007bff",
    marginBottom: 15,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#007bff",
  },
  uploadButtonText: {
    marginLeft: 8,
    color: "#007bff",
    fontSize: 14,
    fontWeight: "500",
  },
  formSection: {
    marginTop: 20,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 10,
  },
  disabledInput: {
    color: "#6c757d",
  },
  // Profile Menu Styles
  profileActions: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuButton: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileMenu: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginTop: 10,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#212529",
    fontWeight: "500",
  },
  // Loan Application Styles
  loanPreviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loanPreviewTitle: {
    color: "#212529",
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  loanPreviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  loanPreviewLabel: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  loanPreviewValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  currencyLabel: {
    fontSize: 16,
    color: "#6c757d",
    fontWeight: "600",
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownLabel: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "500",
    marginBottom: 10,
  },
  dropdownOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
  },
  dropdownOptionSelected: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  dropdownOptionText: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  dropdownOptionTextSelected: {
    color: "#ffffff",
  },
  loanTerms: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  loanTermsTitle: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "600",
    marginBottom: 10,
  },
  loanTermsText: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 4,
    lineHeight: 16,
  },
  // Terms and Conditions Styles
  termsAcceptance: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 20,
    paddingVertical: 10,
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  termsText: {
    fontSize: 14,
    color: "#212529",
    lineHeight: 20,
  },
  termsLink: {
    color: "#007bff",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  termsContent: {
    padding: 20,
  },
  termsSectionTitle: {
    color: "#212529",
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  termsSectionSubtitle: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 30,
    fontStyle: "italic",
  },
  termsSection: {
    marginBottom: 25,
  },
  termsSectionHeader: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "600",
    marginBottom: 8,
  },
  termsSectionText: {
    fontSize: 14,
    color: "#6c757d",
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#007bff",
    borderRadius: 12,
    paddingVertical: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  // Activity Loading and Empty States
  loadingActivity: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#6c757d",
    fontStyle: "italic",
  },
  noActivity: {
    paddingVertical: 20,
    alignItems: "center",
  },
  noActivityText: {
    fontSize: 14,
    color: "#6c757d",
    fontStyle: "italic",
  },
  // Form Validation Styles
  errorText: {
    color: "#dc3545",
    fontSize: 12,
  },
});
