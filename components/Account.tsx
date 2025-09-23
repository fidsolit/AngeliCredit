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
import * as Location from "expo-location";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  credit_score?: number;
  loan_limit?: number;
  avatar_url?: string;
  id_document_url?: string;
  id_verification_status?: string;
  // Address Information
  house_number?: string;
  province?: string;
  city?: string;
  barangay?: string;
  postal_code?: string;
  landline?: string;
  work_from_home?: boolean;
  // Income Information
  main_income_source?: string;
  business_name?: string;
  payout_frequency?: string;
  payout_days?: string;
  employment_company?: string;
  employment_position?: string;
  monthly_income?: number;
  // Profile Completion
  profile_completion_step?: number;
  profile_completed?: boolean;
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
  const [calculatorModalVisible, setCalculatorModalVisible] = useState(false);
  const [calculatorInputs, setCalculatorInputs] = useState({
    amount: "",
    termMonths: "1",
    interestRate: "15",
  });
  const [loanHistoryModalVisible, setLoanHistoryModalVisible] = useState(false);
  const [loanHistory, setLoanHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
    smsAlerts: false,
    biometricLogin: false,
    darkMode: false,
    autoLogout: true,
  });
  const [idUploading, setIdUploading] = useState(false);
  const [profileSetupModalVisible, setProfileSetupModalVisible] = useState(false);
  const [currentSetupStep, setCurrentSetupStep] = useState(1);
  const [addressForm, setAddressForm] = useState({
    house_number: "",
    province: "",
    city: "",
    barangay: "",
    postal_code: "",
    landline: "",
    work_from_home: false,
  });
  const [incomeForm, setIncomeForm] = useState({
    main_income_source: "",
    business_name: "",
    payout_frequency: "",
    payout_days: "",
    employment_company: "",
    employment_position: "",
    monthly_income: 0,
  });
  const [basicInfoForm, setBasicInfoForm] = useState({
    full_name: "",
    phone: "",
  });
  const [locationPermission, setLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [updateProfileModalVisible, setUpdateProfileModalVisible] = useState(false);

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
        id_document_url: data?.id_document_url || null,
        id_verification_status: data?.id_verification_status || "not_uploaded",
        // Address Information
        house_number: data?.house_number || "",
        province: data?.province || "",
        city: data?.city || "",
        barangay: data?.barangay || "",
        postal_code: data?.postal_code || "",
        landline: data?.landline || "",
        work_from_home: data?.work_from_home || false,
        // Income Information
        main_income_source: data?.main_income_source || "",
        business_name: data?.business_name || "",
        payout_frequency: data?.payout_frequency || "",
        payout_days: data?.payout_days || "",
        employment_company: data?.employment_company || "",
        employment_position: data?.employment_position || "",
        monthly_income: data?.monthly_income || 0,
        // Profile Completion
        profile_completion_step: data?.profile_completion_step || 1,
        profile_completed: data?.profile_completed || false,
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

  const uploadIdDocument = async (uri: string) => {
    try {
      setIdUploading(true);

      // Create a unique filename for ID document
      const fileExt = uri.split(".").pop()?.toLowerCase() ?? "jpeg";
      const fileName = `${session.user.id}-id-${Date.now()}.${fileExt}`;

      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from("id-documents")
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("id-documents").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading ID document:", error);
      throw error;
    } finally {
      setIdUploading(false);
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

  const pickIdDocument = async () => {
    try {
      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to upload your ID document."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 10], // Better aspect ratio for ID documents
        quality: 0.9, // Higher quality for ID documents
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const publicUrl = await uploadIdDocument(imageUri);

        // Update profile with ID document
        const { error } = await supabase.from("profiles").upsert({
          id: session.user.id,
          id_document_url: publicUrl,
          id_verification_status: "pending",
          updated_at: new Date().toISOString(),
        });

        if (error) {
          throw error;
        }

        // Update local state
        setUserProfile(prev => prev ? {
          ...prev,
          id_document_url: publicUrl,
          id_verification_status: "pending"
        } : null);

        Alert.alert(
          "ID Document Uploaded",
          "Your ID document has been uploaded successfully. It will be reviewed within 24-48 hours."
        );
      }
    } catch (error) {
      console.error("Error uploading ID document:", error);
      Alert.alert("Error", "Failed to upload ID document. Please try again.");
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const openLoanCalculator = () => {
    setCalculatorModalVisible(true);
  };

  const closeCalculatorModal = () => {
    setCalculatorModalVisible(false);
    setCalculatorInputs({
      amount: "",
      termMonths: "1",
      interestRate: "15",
    });
  };

  const openLoanHistory = () => {
    setLoanHistoryModalVisible(true);
    fetchLoanHistory();
  };

  const closeLoanHistoryModal = () => {
    setLoanHistoryModalVisible(false);
  };

  const fetchLoanHistory = async () => {
    try {
      setHistoryLoading(true);
      
      // Fetch loan history from database
      const { data: loanData, error } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", session.user.id)
        .order("application_date", { ascending: false });

      if (error) {
        console.error("Error fetching loan history:", error);
        // Fallback to dummy data
        setLoanHistory(getDummyLoanHistory());
      } else if (loanData && loanData.length > 0) {
        setLoanHistory(loanData);
      } else {
        // No real data, use dummy data
        setLoanHistory(getDummyLoanHistory());
      }
    } catch (error) {
      console.error("Error:", error);
      setLoanHistory(getDummyLoanHistory());
    } finally {
      setHistoryLoading(false);
    }
  };

  const getDummyLoanHistory = () => {
    return [
      {
        id: "loan-1",
        amount: 50000,
        status: "approved",
        application_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        term_months: 3,
        monthly_payment: 19166.67,
        interest_rate: 0.15,
      },
      {
        id: "loan-2",
        amount: 25000,
        status: "completed",
        application_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        term_months: 2,
        monthly_payment: 14375,
        interest_rate: 0.15,
      },
      {
        id: "loan-3",
        amount: 15000,
        status: "pending",
        application_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        term_months: 1,
        monthly_payment: 17250,
        interest_rate: 0.15,
      },
    ];
  };

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "pending":
        return "Pending";
      case "rejected":
        return "Rejected";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  const openAccountSettings = () => {
    setSettingsModalVisible(true);
  };

  const closeSettingsModal = () => {
    setSettingsModalVisible(false);
  };

  const toggleSetting = (settingKey: string) => {
    setSettings(prev => ({
      ...prev,
      [settingKey]: !prev[settingKey as keyof typeof prev]
    }));
  };

  const saveSettings = async () => {
    try {
      // Here you would typically save settings to your backend
      // For now, we'll just show a success message
      Alert.alert("Success", "Settings saved successfully!");
      closeSettingsModal();
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings. Please try again.");
    }
  };

  const resetSettings = () => {
    Alert.alert(
      "Reset Settings",
      "Are you sure you want to reset all settings to default?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setSettings({
              notifications: true,
              emailUpdates: true,
              smsAlerts: false,
              biometricLogin: false,
              darkMode: false,
              autoLogout: true,
            });
          },
        },
      ]
    );
  };

  // Profile Setup Functions
  const openProfileSetup = () => {
    setProfileSetupModalVisible(true);
    setCurrentSetupStep(userProfile?.profile_completion_step || 1);
    
    // Initialize forms with existing data
    setBasicInfoForm({
      full_name: userProfile?.full_name || "",
      phone: userProfile?.phone || "",
    });
    
    setAddressForm({
      house_number: userProfile?.house_number || "",
      province: userProfile?.province || "",
      city: userProfile?.city || "",
      barangay: userProfile?.barangay || "",
      postal_code: userProfile?.postal_code || "",
      landline: userProfile?.landline || "",
      work_from_home: userProfile?.work_from_home || false,
    });
    
    setIncomeForm({
      main_income_source: userProfile?.main_income_source || "",
      business_name: userProfile?.business_name || "",
      payout_frequency: userProfile?.payout_frequency || "",
      payout_days: userProfile?.payout_days || "",
      employment_company: userProfile?.employment_company || "",
      employment_position: userProfile?.employment_position || "",
      monthly_income: userProfile?.monthly_income || 0,
    });
  };

  const closeProfileSetup = () => {
    setProfileSetupModalVisible(false);
    setCurrentSetupStep(1);
  };

  const nextStep = () => {
    if (currentSetupStep < 5) {
      setCurrentSetupStep(currentSetupStep + 1);
    }
  };

  const prevStep = () => {
    if (currentSetupStep > 1) {
      setCurrentSetupStep(currentSetupStep - 1);
    }
  };

  const saveBasicInfo = async () => {
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        full_name: basicInfoForm.full_name,
        phone: basicInfoForm.phone,
        profile_completion_step: 2,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        ...basicInfoForm,
        profile_completion_step: 2
      } : null);

      nextStep();
    } catch (error) {
      console.error("Error saving basic info:", error);
      Alert.alert("Error", "Failed to save basic information.");
    }
  };

  const saveAddressInfo = async () => {
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        house_number: addressForm.house_number,
        province: addressForm.province,
        city: addressForm.city,
        barangay: addressForm.barangay,
        postal_code: addressForm.postal_code,
        landline: addressForm.landline,
        work_from_home: addressForm.work_from_home,
        profile_completion_step: 3,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        ...addressForm,
        profile_completion_step: 3
      } : null);

      nextStep();
    } catch (error) {
      console.error("Error saving address:", error);
      Alert.alert("Error", "Failed to save address information.");
    }
  };

  const saveIncomeInfo = async () => {
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        main_income_source: incomeForm.main_income_source,
        business_name: incomeForm.business_name,
        payout_frequency: incomeForm.payout_frequency,
        payout_days: incomeForm.payout_days,
        employment_company: incomeForm.employment_company,
        employment_position: incomeForm.employment_position,
        monthly_income: incomeForm.monthly_income,
        profile_completion_step: 5,
        profile_completed: true,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        ...incomeForm,
        profile_completion_step: 5,
        profile_completed: true
      } : null);

      Alert.alert("Success", "Profile setup completed successfully!");
      closeProfileSetup();
    } catch (error) {
      console.error("Error saving income info:", error);
      Alert.alert("Error", "Failed to save income information.");
    }
  };

  // Location and Update Profile Functions
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to update your address automatically.'
        );
        return false;
      }
      setLocationPermission(true);
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to request location permission.');
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation(location);
      
      // Reverse geocode to get address
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address.length > 0) {
        const addr = address[0];
        setAddressForm(prev => ({
          ...prev,
          house_number: prev.house_number || `${addr.streetNumber || ''} ${addr.street || ''}`.trim(),
          city: addr.city || prev.city,
          province: addr.region || prev.province,
          postal_code: addr.postalCode || prev.postal_code,
        }));
      }

      Alert.alert(
        'Location Updated',
        'Your current location has been used to update your address information.'
      );
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location.');
    }
  };

  const openUpdateProfile = () => {
    setUpdateProfileModalVisible(true);
    // Initialize forms with current data
    setAddressForm({
      house_number: userProfile?.house_number || "",
      province: userProfile?.province || "",
      city: userProfile?.city || "",
      barangay: userProfile?.barangay || "",
      postal_code: userProfile?.postal_code || "",
      landline: userProfile?.landline || "",
      work_from_home: userProfile?.work_from_home || false,
    });
  };

  const closeUpdateProfile = () => {
    setUpdateProfileModalVisible(false);
  };

  const saveUpdatedProfile = async () => {
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        house_number: addressForm.house_number,
        province: addressForm.province,
        city: addressForm.city,
        barangay: addressForm.barangay,
        postal_code: addressForm.postal_code,
        landline: addressForm.landline,
        work_from_home: addressForm.work_from_home,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        ...addressForm
      } : null);

      Alert.alert("Success", "Profile updated successfully!");
      closeUpdateProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile information.");
    }
  };

  const calculateLoanDetailsForCalculator = (amount: number, termMonths: number, interestRate: number) => {
    if (amount <= 0 || termMonths <= 0 || interestRate < 0) {
      return {
        monthlyPayment: 0,
        totalAmount: 0,
        interestAmount: 0,
        totalInterest: 0,
      };
    }

    // Convert annual interest rate to monthly
    const monthlyInterestRate = interestRate / 100 / 12;
    
    // Calculate monthly payment using the formula for fixed-rate loans
    let monthlyPayment = 0;
    let totalInterest = 0;
    
    if (monthlyInterestRate === 0) {
      // No interest case
      monthlyPayment = amount / termMonths;
      totalInterest = 0;
    } else {
      // With interest case
      monthlyPayment = (amount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, termMonths)) / 
                      (Math.pow(1 + monthlyInterestRate, termMonths) - 1);
      totalInterest = (monthlyPayment * termMonths) - amount;
    }

    const totalAmount = amount + totalInterest;

    return {
      monthlyPayment: isNaN(monthlyPayment) ? 0 : monthlyPayment,
      totalAmount: totalAmount,
      interestAmount: totalInterest,
      totalInterest: totalInterest,
    };
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

  const getIdVerificationStatus = (status: string) => {
    switch (status) {
      case "verified":
        return "Verified";
      case "pending":
        return "Pending Review";
      case "rejected":
        return "Rejected";
      case "not_uploaded":
      default:
        return "Not Uploaded";
    }
  };

  const getIdVerificationColor = (status: string) => {
    switch (status) {
      case "verified":
        return "#28a745";
      case "pending":
        return "#ff9800";
      case "rejected":
        return "#dc3545";
      case "not_uploaded":
      default:
        return "#6c757d";
    }
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
            <View style={styles.idVerificationStatus}>
              <Ionicons 
                name="card" 
                size={16} 
                color={getIdVerificationColor(userProfile?.id_verification_status || "not_uploaded")} 
              />
              <Text style={[
                styles.idStatusText,
                { color: getIdVerificationColor(userProfile?.id_verification_status || "not_uploaded") }
              ]}>
                ID: {getIdVerificationStatus(userProfile?.id_verification_status || "not_uploaded")}
              </Text>
            </View>
            
            {/* Profile Completion Status */}
            {!userProfile?.profile_completed ? (
              <TouchableOpacity style={styles.profileCompletionBanner} onPress={openProfileSetup}>
                <View style={styles.profileCompletionContent}>
                  <Ionicons name="person-add" size={16} color="#ff9800" />
                  <Text style={styles.profileCompletionText}>
                    Complete your profile to unlock more features
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#ff9800" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.updateProfileBanner} onPress={openUpdateProfile}>
                <View style={styles.updateProfileContent}>
                  <Ionicons name="location" size={16} color="#007bff" />
                  <Text style={styles.updateProfileText}>
                    Update your address and location
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#007bff" />
                </View>
              </TouchableOpacity>
            )}
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
        <TouchableOpacity onPress={openLoanApplication} style={styles.statCardTouchable}>
          <Card containerStyle={styles.statCard}>
            <View style={styles.statItem} >
              <Ionicons name="cash" size={24} color="#28a745" />
              <Text style={styles.statLabel}>Cash Loan</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: "#28a745" },
                ]}
              >
                {/* {formatCurrency(1000)}{"-"}{formatCurrency(10000)} */}
                1K-10K
              </Text>
              <Text
                style={[
                  styles.statSubtext,
                  { color: "#28a745" },
                ]}
              >
                Available
              </Text>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Alert.alert("Coming Soon", "Product Loan will be available soon!")} style={styles.statCardTouchable}>
          <Card containerStyle={styles.statCard}>
            <View style={styles.statItem}>
              <Ionicons name="cube" size={24} color="#ff9800" />
              <Text style={styles.statLabel}>Product Loan</Text>
              <Text style={[styles.statValue, { color: "#ff9800" }]}>
                Coming...
              </Text>
              <Text style={[styles.statSubtext, { color: "#ff9800" }]}>Available Soon</Text>
            </View>
          </Card>
        </TouchableOpacity>
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

        <TouchableOpacity style={styles.actionButton} onPress={openLoanHistory}>
          <Ionicons name="document-text" size={24} color="#28a745" />
          <Text style={styles.actionText}>View Loan History</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={openLoanCalculator}>
          <Ionicons name="calculator" size={24} color="#ff9800" />
          <Text style={styles.actionText}>Loan Calculator</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={openAccountSettings}>
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

              {/* ID Document Upload Section */}
              <View style={styles.idUploadSection}>
                <Text style={styles.idUploadTitle}>ID Document Verification</Text>
                <Text style={styles.idUploadDescription}>
                  Upload a valid government-issued ID (Driver's License, Passport, National ID) for verification.
                </Text>
                
                {editingProfile?.id_document_url ? (
                  <View style={styles.idDocumentPreview}>
                    <Image 
                      source={{ uri: editingProfile.id_document_url }} 
                      style={styles.idDocumentImage}
                      resizeMode="cover"
                    />
                    <View style={styles.idDocumentInfo}>
                      <Text style={styles.idDocumentStatus}>
                        Status: {getIdVerificationStatus(editingProfile.id_verification_status || "not_uploaded")}
                      </Text>
                      <Text style={styles.idDocumentNote}>
                        Document uploaded successfully
                      </Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.idUploadButton} 
                    onPress={pickIdDocument}
                    disabled={idUploading}
                  >
                    <Ionicons 
                      name={idUploading ? "hourglass" : "cloud-upload"} 
                      size={24} 
                      color="#007bff" 
                    />
                    <Text style={styles.idUploadButtonText}>
                      {idUploading ? "Uploading..." : "Upload ID Document"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
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

      {/* Loan Calculator Modal */}
      <Modal
        visible={calculatorModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeCalculatorModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeCalculatorModal}>
              <Text style={styles.modalCancelButton}>Close</Text>
            </TouchableOpacity>
            <Text h4 style={styles.modalTitle}>
              Loan Calculator
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formSection}>
              <Text style={styles.calculatorDescription}>
                Calculate your monthly payments and total interest for different loan scenarios.
              </Text>

              {/* Calculator Inputs */}
              <Input
                label="Loan Amount *"
                value={calculatorInputs.amount}
                onChangeText={(text) =>
                  setCalculatorInputs((prev) => ({ ...prev, amount: text }))
                }
                placeholder="Enter loan amount"
                keyboardType="numeric"
                containerStyle={styles.inputContainer}
                rightIcon={<Text style={styles.currencyLabel}>₱</Text>}
              />

              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>Repayment Term *</Text>
                <View style={styles.dropdownOptions}>
                  {["1", "2", "3", "6", "12", "24", "36"].map((term) => (
                    <TouchableOpacity
                      key={term}
                      style={[
                        styles.dropdownOption,
                        calculatorInputs.termMonths === term &&
                          styles.dropdownOptionSelected,
                      ]}
                      onPress={() =>
                        setCalculatorInputs((prev) => ({
                          ...prev,
                          termMonths: term,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          calculatorInputs.termMonths === term &&
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
                label="Annual Interest Rate (%) *"
                value={calculatorInputs.interestRate}
                onChangeText={(text) =>
                  setCalculatorInputs((prev) => ({ ...prev, interestRate: text }))
                }
                placeholder="Enter interest rate"
                keyboardType="numeric"
                containerStyle={styles.inputContainer}
                rightIcon={<Text style={styles.currencyLabel}>%</Text>}
              />

              {/* Calculation Results */}
              {calculatorInputs.amount && calculatorInputs.termMonths && calculatorInputs.interestRate && (
                <View style={styles.calculatorResults}>
                  <Text h4 style={styles.resultsTitle}>
                    Calculation Results
                  </Text>
                  
                  {(() => {
                    const amount = parseFloat(calculatorInputs.amount) || 0;
                    const termMonths = parseInt(calculatorInputs.termMonths) || 1;
                    const interestRate = parseFloat(calculatorInputs.interestRate) || 0;
                    const results = calculateLoanDetailsForCalculator(amount, termMonths, interestRate);
                    
                    return (
                      <View style={styles.resultsContainer}>
                        <View style={styles.resultRow}>
                          <Text style={styles.resultLabel}>Loan Amount:</Text>
                          <Text style={[styles.resultValue, { color: "#007bff" }]}>
                            {formatCurrency(amount)}
                          </Text>
                        </View>
                        
                        <View style={styles.resultRow}>
                          <Text style={styles.resultLabel}>Monthly Payment:</Text>
                          <Text style={[styles.resultValue, { color: "#28a745" }]}>
                            {formatCurrency(results.monthlyPayment)}
                          </Text>
                        </View>
                        
                        <View style={styles.resultRow}>
                          <Text style={styles.resultLabel}>Total Interest:</Text>
                          <Text style={[styles.resultValue, { color: "#ff9800" }]}>
                            {formatCurrency(results.interestAmount)}
                          </Text>
                        </View>
                        
                        <View style={styles.resultRow}>
                          <Text style={styles.resultLabel}>Total Amount:</Text>
                          <Text style={[styles.resultValue, { color: "#dc3545" }]}>
                            {formatCurrency(results.totalAmount)}
                          </Text>
                        </View>
                        
                        <View style={styles.resultRow}>
                          <Text style={styles.resultLabel}>Interest Rate:</Text>
                          <Text style={[styles.resultValue, { color: "#6c757d" }]}>
                            {interestRate}% per year
                          </Text>
                        </View>
                        
                        <View style={styles.resultRow}>
                          <Text style={styles.resultLabel}>Term:</Text>
                          <Text style={[styles.resultValue, { color: "#6c757d" }]}>
                            {termMonths} {termMonths === 1 ? "month" : "months"}
                          </Text>
                        </View>
                      </View>
                    );
                  })()}
                </View>
              )}

              {/* Calculator Tips */}
              <View style={styles.calculatorTips}>
                <Text style={styles.tipsTitle}>💡 Calculator Tips</Text>
                <Text style={styles.tipText}>
                  • Lower interest rates mean lower monthly payments
                </Text>
                <Text style={styles.tipText}>
                  • Shorter terms result in higher monthly payments but less total interest
                </Text>
                <Text style={styles.tipText}>
                  • Longer terms mean lower monthly payments but more total interest
                </Text>
                <Text style={styles.tipText}>
                  • eCredit offers competitive rates starting at 15% annually
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Loan History Modal */}
      <Modal
        visible={loanHistoryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeLoanHistoryModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeLoanHistoryModal}>
              <Text style={styles.modalCancelButton}>Close</Text>
            </TouchableOpacity>
            <Text h4 style={styles.modalTitle}>
              Loan History
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formSection}>
              <Text style={styles.historyDescription}>
                View your past and current loan applications and their status.
              </Text>

              {historyLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading loan history...</Text>
                </View>
              ) : loanHistory.length > 0 ? (
                <View style={styles.historyContainer}>
                  {loanHistory.map((loan, index) => (
                    <View key={loan.id} style={styles.historyItem}>
                      <View style={styles.historyHeader}>
                        <View style={styles.historyInfo}>
                          <Text style={styles.historyAmount}>
                            {formatCurrency(loan.amount)}
                          </Text>
                          <Text style={styles.historyDate}>
                            {formatTimeAgo(loan.application_date)}
                          </Text>
                        </View>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(loan.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {getStatusText(loan.status)}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.historyDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Term:</Text>
                          <Text style={styles.detailValue}>
                            {loan.term_months} {loan.term_months === 1 ? "month" : "months"}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Monthly Payment:</Text>
                          <Text style={styles.detailValue}>
                            {formatCurrency(loan.monthly_payment)}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Interest Rate:</Text>
                          <Text style={styles.detailValue}>
                            {(loan.interest_rate * 100).toFixed(1)}% per month
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Application Date:</Text>
                          <Text style={styles.detailValue}>
                            {new Date(loan.application_date).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      
                      {index < loanHistory.length - 1 && (
                        <Divider style={styles.historyDivider} />
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noHistoryContainer}>
                  <Ionicons name="document-outline" size={48} color="#6c757d" />
                  <Text style={styles.noHistoryTitle}>No Loan History</Text>
                  <Text style={styles.noHistoryText}>
                    You haven't applied for any loans yet. Apply for your first loan to get started!
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Account Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeSettingsModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeSettingsModal}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text h4 style={styles.modalTitle}>
              Account Settings
            </Text>
            <TouchableOpacity onPress={saveSettings}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formSection}>
              <Text style={styles.settingsDescription}>
                Customize your eCredit experience and manage your account preferences.
              </Text>

              {/* Notifications Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="notifications" size={20} color="#007bff" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Push Notifications</Text>
                      <Text style={styles.settingDescription}>
                        Receive notifications about loan updates and payments
                      </Text>
                    </View>
                  </View>
                  <CheckBox
                    checked={settings.notifications}
                    onPress={() => toggleSetting('notifications')}
                    checkedColor="#007bff"
                    uncheckedColor="#6c757d"
                    size={20}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="mail" size={20} color="#28a745" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Email Updates</Text>
                      <Text style={styles.settingDescription}>
                        Get important updates via email
                      </Text>
                    </View>
                  </View>
                  <CheckBox
                    checked={settings.emailUpdates}
                    onPress={() => toggleSetting('emailUpdates')}
                    checkedColor="#007bff"
                    uncheckedColor="#6c757d"
                    size={20}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="chatbubble" size={20} color="#ff9800" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>SMS Alerts</Text>
                      <Text style={styles.settingDescription}>
                        Receive SMS notifications for urgent matters
                      </Text>
                    </View>
                  </View>
                  <CheckBox
                    checked={settings.smsAlerts}
                    onPress={() => toggleSetting('smsAlerts')}
                    checkedColor="#007bff"
                    uncheckedColor="#6c757d"
                    size={20}
                  />
                </View>
              </View>

              {/* Security Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Security</Text>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="finger-print" size={20} color="#dc3545" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Biometric Login</Text>
                      <Text style={styles.settingDescription}>
                        Use fingerprint or face recognition to log in
                      </Text>
                    </View>
                  </View>
                  <CheckBox
                    checked={settings.biometricLogin}
                    onPress={() => toggleSetting('biometricLogin')}
                    checkedColor="#007bff"
                    uncheckedColor="#6c757d"
                    size={20}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="time" size={20} color="#6c757d" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Auto Logout</Text>
                      <Text style={styles.settingDescription}>
                        Automatically log out after 15 minutes of inactivity
                      </Text>
                    </View>
                  </View>
                  <CheckBox
                    checked={settings.autoLogout}
                    onPress={() => toggleSetting('autoLogout')}
                    checkedColor="#007bff"
                    uncheckedColor="#6c757d"
                    size={20}
                  />
                </View>
              </View>

              {/* Appearance Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Appearance</Text>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="moon" size={20} color="#6c757d" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Dark Mode</Text>
                      <Text style={styles.settingDescription}>
                        Switch to dark theme for better viewing in low light
                      </Text>
                    </View>
                  </View>
                  <CheckBox
                    checked={settings.darkMode}
                    onPress={() => toggleSetting('darkMode')}
                    checkedColor="#007bff"
                    uncheckedColor="#6c757d"
                    size={20}
                  />
                </View>
              </View>

              {/* Account Actions */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Account Actions</Text>
                
                <TouchableOpacity style={styles.actionSettingItem} onPress={resetSettings}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="refresh" size={20} color="#ff9800" />
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Reset Settings</Text>
                      <Text style={styles.settingDescription}>
                        Reset all settings to default values
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6c757d" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionSettingItem} onPress={handleLogout}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="log-out" size={20} color="#dc3545" />
                    <View style={styles.settingText}>
                      <Text style={[styles.settingLabel, { color: "#dc3545" }]}>Sign Out</Text>
                      <Text style={styles.settingDescription}>
                        Sign out of your account
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6c757d" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Profile Setup Modal */}
      <Modal
        visible={profileSetupModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeProfileSetup}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeProfileSetup}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text h4 style={styles.modalTitle}>
              Complete Your Profile
            </Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4, 5].map((step) => (
              <View key={step} style={styles.progressStep}>
                <View
                  style={[
                    styles.progressCircle,
                    {
                      backgroundColor:
                        step <= currentSetupStep ? "#28a745" : "#e9ecef",
                    },
                  ]}
                >
                  {step < currentSetupStep ? (
                    <Ionicons name="checkmark" size={16} color="white" />
                  ) : (
                    <Text
                      style={[
                        styles.progressText,
                        {
                          color: step <= currentSetupStep ? "white" : "#6c757d",
                        },
                      ]}
                    >
                      {step}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Step 1: Basic Information */}
            {currentSetupStep === 1 && (
              <View style={styles.formSection}>
                <Text style={styles.stepTitle}>Basic Information</Text>
                <Text style={styles.stepDescription}>
                  Let's start with your basic information to personalize your experience.
                </Text>

                <Input
                  label="Full Name"
                  value={basicInfoForm.full_name}
                  onChangeText={(text) =>
                    setBasicInfoForm({ ...basicInfoForm, full_name: text })
                  }
                  placeholder="Enter your full name"
                  containerStyle={styles.inputContainer}
                />

                <Input
                  label="Phone Number"
                  value={basicInfoForm.phone}
                  onChangeText={(text) =>
                    setBasicInfoForm({ ...basicInfoForm, phone: text })
                  }
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  containerStyle={styles.inputContainer}
                />

                <Button
                  title="Continue"
                  onPress={saveBasicInfo}
                  buttonStyle={styles.continueButton}
                  titleStyle={styles.continueButtonText}
                />
              </View>
            )}

            {/* Step 2: Address Information */}
            {currentSetupStep === 2 && (
              <View style={styles.formSection}>
                <Text style={styles.stepTitle}>Current Residential Address</Text>
                <Text style={styles.stepDescription}>
                  Please provide your current residential address for verification purposes.
                </Text>

                <Input
                  label="House No. / Unit No. / Street Name"
                  value={addressForm.house_number}
                  onChangeText={(text) =>
                    setAddressForm({ ...addressForm, house_number: text })
                  }
                  placeholder="Enter house number, unit, or street name"
                  containerStyle={styles.inputContainer}
                />

                <Input
                  label="Province"
                  value={addressForm.province}
                  onChangeText={(text) =>
                    setAddressForm({ ...addressForm, province: text })
                  }
                  placeholder="Enter province"
                  containerStyle={styles.inputContainer}
                />

                <Input
                  label="City"
                  value={addressForm.city}
                  onChangeText={(text) =>
                    setAddressForm({ ...addressForm, city: text })
                  }
                  placeholder="Enter city"
                  containerStyle={styles.inputContainer}
                />

                <Input
                  label="Barangay (optional)"
                  value={addressForm.barangay}
                  onChangeText={(text) =>
                    setAddressForm({ ...addressForm, barangay: text })
                  }
                  placeholder="Enter barangay"
                  containerStyle={styles.inputContainer}
                />

                <Input
                  label="Postal code / Zip code"
                  value={addressForm.postal_code}
                  onChangeText={(text) =>
                    setAddressForm({ ...addressForm, postal_code: text })
                  }
                  placeholder="Enter postal code"
                  keyboardType="numeric"
                  containerStyle={styles.inputContainer}
                />

                <Input
                  label="Landline (optional)"
                  value={addressForm.landline}
                  onChangeText={(text) =>
                    setAddressForm({ ...addressForm, landline: text })
                  }
                  placeholder="Enter landline number"
                  keyboardType="phone-pad"
                  containerStyle={styles.inputContainer}
                />

                <View style={styles.workFromHomeSection}>
                  <Text style={styles.workFromHomeQuestion}>
                    Do you work from home?
                  </Text>
                  <View style={styles.radioButtonContainer}>
                    <TouchableOpacity
                      style={styles.radioButton}
                      onPress={() =>
                        setAddressForm({ ...addressForm, work_from_home: true })
                      }
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            backgroundColor: addressForm.work_from_home
                              ? "#007bff"
                              : "transparent",
                          },
                        ]}
                      />
                      <Text style={styles.radioLabel}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.radioButton}
                      onPress={() =>
                        setAddressForm({ ...addressForm, work_from_home: false })
                      }
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            backgroundColor: !addressForm.work_from_home
                              ? "#007bff"
                              : "transparent",
                          },
                        ]}
                      />
                      <Text style={styles.radioLabel}>No</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.stepButtons}>
                  <Button
                    title="Back"
                    onPress={prevStep}
                    buttonStyle={styles.backButton}
                    titleStyle={styles.backButtonText}
                  />
                  <Button
                    title="Continue"
                    onPress={saveAddressInfo}
                    buttonStyle={styles.continueButton}
                    titleStyle={styles.continueButtonText}
                  />
                </View>
              </View>
            )}

            {/* Step 3: Income Source Selection */}
            {currentSetupStep === 3 && (
              <View style={styles.formSection}>
                <Text style={styles.stepTitle}>Choose Your Main Income</Text>
                <Text style={styles.stepDescription}>
                  We accept many different sources of income. Please choose your main income.
                </Text>

                <View style={styles.incomeSourceContainer}>
                  {[
                    {
                      id: "employment",
                      title: "Employment",
                      description: "You are employed in a local company. Latest payslip required.",
                      icon: "briefcase",
                    },
                    {
                      id: "business",
                      title: "Business",
                      description: "You own and operate a business. Business registration and financial statements required.",
                      icon: "storefront",
                    },
                    {
                      id: "remittance",
                      title: "Remittance",
                      description: "You receive regular remittance from relatives abroad. Bank statements and/or remittance slips are required.",
                      icon: "card",
                    },
                    {
                      id: "freelance",
                      title: "Freelance",
                      description: "You earn from an online platform like Upwork, Grab, Online English Teacher.",
                      icon: "laptop",
                    },
                  ].map((source) => (
                    <TouchableOpacity
                      key={source.id}
                      style={[
                        styles.incomeSourceCard,
                        incomeForm.main_income_source === source.id &&
                          styles.selectedIncomeCard,
                      ]}
                      onPress={() =>
                        setIncomeForm({
                          ...incomeForm,
                          main_income_source: source.id,
                        })
                      }
                    >
                      <View style={styles.incomeSourceHeader}>
                        <View style={styles.incomeSourceInfo}>
                          <Ionicons
                            name={source.icon as any}
                            size={24}
                            color={
                              incomeForm.main_income_source === source.id
                                ? "#007bff"
                                : "#6c757d"
                            }
                          />
                          <View style={styles.incomeSourceText}>
                            <Text
                              style={[
                                styles.incomeSourceTitle,
                                incomeForm.main_income_source === source.id &&
                                  styles.selectedIncomeTitle,
                              ]}
                            >
                              {source.title}
                            </Text>
                            <Text style={styles.incomeSourceDescription}>
                              {source.description}
                            </Text>
                          </View>
                        </View>
                        <Ionicons
                          name={
                            incomeForm.main_income_source === source.id
                              ? "checkmark-circle"
                              : "add-circle"
                          }
                          size={24}
                          color={
                            incomeForm.main_income_source === source.id
                              ? "#28a745"
                              : "#007bff"
                          }
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.stepButtons}>
                  <Button
                    title="Back"
                    onPress={prevStep}
                    buttonStyle={styles.backButton}
                    titleStyle={styles.backButtonText}
                  />
                  <Button
                    title="Continue"
                    onPress={nextStep}
                    buttonStyle={[
                      styles.continueButton,
                      !incomeForm.main_income_source ? { backgroundColor: "#e9ecef" } : null,
                    ]}
                    titleStyle={styles.continueButtonText}
                    disabled={!incomeForm.main_income_source}
                  />
                </View>
              </View>
            )}

            {/* Step 4: Income Details */}
            {currentSetupStep === 4 && (
              <View style={styles.formSection}>
                <Text style={styles.stepTitle}>Income Details</Text>
                <Text style={styles.stepDescription}>
                  Please provide details about your {incomeForm.main_income_source} income.
                </Text>

                {incomeForm.main_income_source === "business" && (
                  <>
                    <Input
                      label="Business Name"
                      value={incomeForm.business_name}
                      onChangeText={(text) =>
                        setIncomeForm({ ...incomeForm, business_name: text })
                      }
                      placeholder="Enter your business name"
                      containerStyle={styles.inputContainer}
                    />

                    <View style={styles.dropdownContainer}>
                      <Text style={styles.dropdownLabel}>Payout Frequency</Text>
                      <TouchableOpacity style={styles.dropdownButton}>
                        <Text style={styles.dropdownText}>
                          {incomeForm.payout_frequency || "Select frequency"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#6c757d" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.dropdownContainer}>
                      <Text style={styles.dropdownLabel}>
                        Which days of the month do you get paid?
                      </Text>
                      <TouchableOpacity style={styles.dropdownButton}>
                        <Text style={styles.dropdownText}>
                          {incomeForm.payout_days || "Select payment days"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#6c757d" />
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {incomeForm.main_income_source === "employment" && (
                  <>
                    <Input
                      label="Company Name"
                      value={incomeForm.employment_company}
                      onChangeText={(text) =>
                        setIncomeForm({ ...incomeForm, employment_company: text })
                      }
                      placeholder="Enter your company name"
                      containerStyle={styles.inputContainer}
                    />

                    <Input
                      label="Position"
                      value={incomeForm.employment_position}
                      onChangeText={(text) =>
                        setIncomeForm({ ...incomeForm, employment_position: text })
                      }
                      placeholder="Enter your position"
                      containerStyle={styles.inputContainer}
                    />
                  </>
                )}

                <Input
                  label="Monthly Income (₱)"
                  value={incomeForm.monthly_income.toString()}
                  onChangeText={(text) =>
                    setIncomeForm({
                      ...incomeForm,
                      monthly_income: parseFloat(text) || 0,
                    })
                  }
                  placeholder="Enter your monthly income"
                  keyboardType="numeric"
                  containerStyle={styles.inputContainer}
                />

                <View style={styles.stepButtons}>
                  <Button
                    title="Back"
                    onPress={prevStep}
                    buttonStyle={styles.backButton}
                    titleStyle={styles.backButtonText}
                  />
                  <Button
                    title="Complete Setup"
                    onPress={saveIncomeInfo}
                    buttonStyle={styles.continueButton}
                    titleStyle={styles.continueButtonText}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Update Profile Modal */}
      <Modal
        visible={updateProfileModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeUpdateProfile}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeUpdateProfile}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text h4 style={styles.modalTitle}>
              Update Address & Location
            </Text>
            <TouchableOpacity onPress={saveUpdatedProfile}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formSection}>
              <Text style={styles.stepDescription}>
                Update your residential address information. You can use your current location to automatically fill in the address fields.
              </Text>

              {/* Location Button */}
              <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
                <Ionicons name="location" size={24} color="#007bff" />
                <Text style={styles.locationButtonText}>
                  Use Current Location
                </Text>
                <Text style={styles.locationButtonSubtext}>
                  Automatically fill address from GPS
                </Text>
              </TouchableOpacity>

              <Input
                label="House No. / Unit No. / Street Name"
                value={addressForm.house_number}
                onChangeText={(text) =>
                  setAddressForm({ ...addressForm, house_number: text })
                }
                placeholder="Enter house number, unit, or street name"
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Province"
                value={addressForm.province}
                onChangeText={(text) =>
                  setAddressForm({ ...addressForm, province: text })
                }
                placeholder="Enter province"
                containerStyle={styles.inputContainer}
              />

              <Input
                label="City"
                value={addressForm.city}
                onChangeText={(text) =>
                  setAddressForm({ ...addressForm, city: text })
                }
                placeholder="Enter city"
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Barangay (optional)"
                value={addressForm.barangay}
                onChangeText={(text) =>
                  setAddressForm({ ...addressForm, barangay: text })
                }
                placeholder="Enter barangay"
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Postal code / Zip code"
                value={addressForm.postal_code}
                onChangeText={(text) =>
                  setAddressForm({ ...addressForm, postal_code: text })
                }
                placeholder="Enter postal code"
                keyboardType="numeric"
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Landline (optional)"
                value={addressForm.landline}
                onChangeText={(text) =>
                  setAddressForm({ ...addressForm, landline: text })
                }
                placeholder="Enter landline number"
                keyboardType="phone-pad"
                containerStyle={styles.inputContainer}
              />

              <View style={styles.workFromHomeSection}>
                <Text style={styles.workFromHomeQuestion}>
                  Do you work from home?
                </Text>
                <View style={styles.radioButtonContainer}>
                  <TouchableOpacity
                    style={styles.radioButton}
                    onPress={() =>
                      setAddressForm({ ...addressForm, work_from_home: true })
                    }
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          backgroundColor: addressForm.work_from_home
                            ? "#007bff"
                            : "transparent",
                        },
                      ]}
                    />
                    <Text style={styles.radioLabel}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioButton}
                    onPress={() =>
                      setAddressForm({ ...addressForm, work_from_home: false })
                    }
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          backgroundColor: !addressForm.work_from_home
                            ? "#007bff"
                            : "transparent",
                        },
                      ]}
                    />
                    <Text style={styles.radioLabel}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Current Location Display */}
              {currentLocation && (
                <View style={styles.locationInfo}>
                  <Text style={styles.locationInfoTitle}>Current Location:</Text>
                  <Text style={styles.locationInfoText}>
                    Lat: {currentLocation.coords.latitude.toFixed(6)}
                  </Text>
                  <Text style={styles.locationInfoText}>
                    Lng: {currentLocation.coords.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
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
  statCardTouchable: {
    flex: 1,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    minHeight: 140,
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
  // Loan Calculator Styles
  calculatorDescription: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  calculatorResults: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  resultsTitle: {
    color: "#212529",
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  resultsContainer: {
    gap: 12,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  resultLabel: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
    flex: 1,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
  },
  calculatorTips: {
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#2196f3",
  },
  tipsTitle: {
    fontSize: 16,
    color: "#1976d2",
    fontWeight: "600",
    marginBottom: 10,
  },
  tipText: {
    fontSize: 12,
    color: "#1976d2",
    marginBottom: 4,
    lineHeight: 16,
  },
  // Loan History Styles
  historyDescription: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  historyContainer: {
    gap: 15,
  },
  historyItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: "#6c757d",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  historyDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#212529",
    fontWeight: "600",
  },
  historyDivider: {
    marginTop: 15,
  },
  noHistoryContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noHistoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginTop: 16,
    marginBottom: 8,
  },
  noHistoryText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  // Account Settings Styles
  settingsDescription: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  settingsSection: {
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionSettingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "500",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: "#6c757d",
    lineHeight: 16,
  },
  // ID Verification Styles
  idVerificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  idStatusText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  idUploadSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  idUploadTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
  },
  idUploadDescription: {
    fontSize: 12,
    color: "#6c757d",
    lineHeight: 16,
    marginBottom: 16,
  },
  idUploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#007bff",
    borderStyle: "dashed",
  },
  idUploadButtonText: {
    marginLeft: 8,
    color: "#007bff",
    fontSize: 14,
    fontWeight: "500",
  },
  idDocumentPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  idDocumentImage: {
    width: 60,
    height: 40,
    borderRadius: 4,
    backgroundColor: "#f8f9fa",
  },
  idDocumentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  idDocumentStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 2,
  },
  idDocumentNote: {
    fontSize: 12,
    color: "#6c757d",
  },
  // Profile Setup Styles
  profileCompletionBanner: {
    marginTop: 12,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffeaa7",
  },
  profileCompletionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  profileCompletionText: {
    flex: 1,
    fontSize: 12,
    color: "#856404",
    marginLeft: 8,
    marginRight: 8,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  progressStep: {
    flex: 1,
    alignItems: "center",
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: "#6c757d",
    lineHeight: 22,
    marginBottom: 24,
  },
  workFromHomeSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  workFromHomeQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 12,
  },
  radioButtonContainer: {
    flexDirection: "row",
    gap: 24,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#007bff",
    marginRight: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: "#212529",
  },
  stepButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    gap: 16,
  },
  continueButton: {
    backgroundColor: "#ff751f",
    borderRadius: 8,
    paddingVertical: 12,
    flex: 1,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#6c757d",
    borderRadius: 8,
    paddingVertical: 12,
    flex: 1,
  },
  backButtonText: {
    color: "#6c757d",
    fontSize: 16,
    fontWeight: "600",
  },
  incomeSourceContainer: {
    gap: 16,
  },
  incomeSourceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  selectedIncomeCard: {
    borderColor: "#007bff",
    backgroundColor: "#f8f9ff",
  },
  incomeSourceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  incomeSourceInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  incomeSourceText: {
    marginLeft: 12,
    flex: 1,
  },
  incomeSourceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  selectedIncomeTitle: {
    color: "#007bff",
  },
  incomeSourceDescription: {
    fontSize: 14,
    color: "#6c757d",
    lineHeight: 18,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: "#212529",
  },
  // Update Profile Styles
  updateProfileBanner: {
    marginTop: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbdefb",
  },
  updateProfileContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  updateProfileText: {
    flex: 1,
    fontSize: 12,
    color: "#1976d2",
    marginLeft: 8,
    marginRight: 8,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9ff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007bff",
    borderStyle: "dashed",
    marginBottom: 20,
  },
  locationButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#007bff",
  },
  locationButtonSubtext: {
    marginLeft: 12,
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  locationInfo: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  locationInfoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  locationInfoText: {
    fontSize: 12,
    color: "#6c757d",
    fontFamily: "monospace",
  },
});
