import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { Text, Card, Button, Avatar, Divider, Input, CheckBox } from "@rneui/themed";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSimpleTheme } from "../lib/ThemeContextSimple";

interface Loan {
  id: string | number;
  user_id: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number;
  status: "pending" | "approved" | "rejected" | "active" | "completed";
  application_date: string;
  approval_date?: string;
  disbursement_date?: string;
  user_email?: string;
  user_name?: string;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  credit_score?: number;
  loan_limit?: number;
  avatar_url?: string;
}

interface DashboardStats {
  totalUsers: number;
  totalLoans: number;
  pendingLoans: number;
  approvedLoans: number;
  totalLoanAmount: number;
  totalRevenue: number;
}

export default function AdminDashboard({ session }: { session: any }) {
  const { isDark, colors } = useSimpleTheme();
  const [activeTab, setActiveTab] = useState<"overview" | "loans" | "users" | "profile">(
    "overview"
  );
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [securitySettingsModalVisible, setSecuritySettingsModalVisible] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    province: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    emailNotifications: true,
    loginAlerts: true,
    sessionTimeout: true,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loanFilter, setLoanFilter] = useState<
    "all" | "pending" | "approved" | "active" | "completed"
  >("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanDetailsVisible, setLoanDetailsVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailsVisible, setUserDetailsVisible] = useState(false);
  const [userLoans, setUserLoans] = useState<Loan[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalLoans: 0,
    pendingLoans: 0,
    approvedLoans: 0,
    totalLoanAmount: 0,
    totalRevenue: 0,
  });
  const [loans, setLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Pagination states
  const [loansPage, setLoansPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [hasMoreLoans, setHasMoreLoans] = useState(true);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  const [loadingMoreLoans, setLoadingMoreLoans] = useState(false);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);
  const [loadingMoreActivities, setLoadingMoreActivities] = useState(false);
  
  // Pagination constants
  const LOANS_PER_PAGE = 10;
  const USERS_PER_PAGE = 15;
  const ACTIVITIES_PER_PAGE = 8;

  useEffect(() => {
    if (session?.user) {
      checkAdminAccess();
      loadDashboardData();
      loadAdminProfile();
    }
  }, [session]);

  const loadAdminProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error loading admin profile:", error);
        return;
      }

      setAdminProfile(data);
      
      // Initialize forms with current data
      setEditProfileForm({
        full_name: data?.full_name || "",
        phone: data?.phone || "",
        city: data?.city || "",
        province: data?.province || "",
      });
      
      // Load security settings (you can store these in profile or separate table)
      setSecuritySettings({
        twoFactorAuth: data?.two_factor_auth || false,
        emailNotifications: data?.email_notifications !== false,
        loginAlerts: data?.login_alerts !== false,
        sessionTimeout: data?.session_timeout !== false,
      });
    } catch (error) {
      console.error("Error loading admin profile:", error);
    }
  };

  const openEditProfileModal = () => {
    setEditProfileForm({
      full_name: adminProfile?.full_name || "",
      phone: adminProfile?.phone || "",
      city: adminProfile?.city || "",
      province: adminProfile?.province || "",
    });
    setEditProfileModalVisible(true);
  };

  const closeEditProfileModal = () => {
    setEditProfileModalVisible(false);
  };

  const handleSaveProfile = async () => {
    try {
      if (!editProfileForm.full_name.trim()) {
        Alert.alert("Error", "Full name is required");
        return;
      }

      setSavingProfile(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editProfileForm.full_name,
          phone: editProfileForm.phone,
          city: editProfileForm.city,
          province: editProfileForm.province,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (error) throw error;

      Alert.alert("Success", "Profile updated successfully!");
      await loadAdminProfile();
      closeEditProfileModal();
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const openChangePasswordModal = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setChangePasswordModalVisible(true);
  };

  const closeChangePasswordModal = () => {
    setChangePasswordModalVisible(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleChangePassword = async () => {
    try {
      if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
        Alert.alert("Error", "Please fill in all password fields");
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        Alert.alert("Error", "New password must be at least 6 characters");
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        Alert.alert("Error", "New passwords do not match");
        return;
      }

      setChangingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      Alert.alert("Success", "Password changed successfully!");
      closeChangePasswordModal();
    } catch (error: any) {
      console.error("Error changing password:", error);
      Alert.alert("Error", error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const openSecuritySettingsModal = () => {
    setSecuritySettingsModalVisible(true);
  };

  const closeSecuritySettingsModal = () => {
    setSecuritySettingsModalVisible(false);
  };

  const handleSaveSecuritySettings = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          two_factor_auth: securitySettings.twoFactorAuth,
          email_notifications: securitySettings.emailNotifications,
          login_alerts: securitySettings.loginAlerts,
          session_timeout: securitySettings.sessionTimeout,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (error) throw error;

      Alert.alert("Success", "Security settings updated successfully!");
      closeSecuritySettingsModal();
    } catch (error) {
      console.error("Error saving security settings:", error);
      Alert.alert("Error", "Failed to update security settings");
    }
  };

  const checkAdminAccess = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error checking admin access:", error);
        // If profile doesn't exist, create it and set as admin
        if (error.code === "PGRST116") {
          await createAdminProfile();
          return;
        }
        Alert.alert("Error", "Failed to verify admin access.");
        return;
      }

      if (!data?.is_admin) {
        Alert.alert(
          "Access Denied",
          "You do not have admin privileges. Please contact the system administrator.",
          [
            {
              text: "OK",
              onPress: () => {
                // Optionally redirect to regular account view
              },
            },
          ]
        );
        return;
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      Alert.alert("Error", "Failed to verify admin access.");
    }
  };

  const createAdminProfile = async () => {
    try {
      const { error } = await supabase.from("profiles").insert({
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name || "",
        is_admin: true,
      });

      if (error) {
        console.error("Error creating admin profile:", error);
        Alert.alert("Error", "Failed to create admin profile.");
      } else {
        Alert.alert(
          "Admin Profile Created",
          "Your admin profile has been created successfully!",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error creating admin profile:", error);
      Alert.alert("Error", "Failed to create admin profile.");
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Reset pagination states
      setLoansPage(1);
      setUsersPage(1);
      setActivitiesPage(1);
      setHasMoreLoans(true);
      setHasMoreUsers(true);
      setHasMoreActivities(true);
      
      await Promise.all([loadStats(), loadLoans(true), loadUsers(true)]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Load user count
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Load loan statistics
      const { data: loanData, error: loanError } = await supabase
        .from("loans")
        .select("amount, status, monthly_payment, term_months");

      if (loanError) throw loanError;

      const totalLoans = loanData?.length || 0;
      const pendingLoans =
        loanData?.filter((loan) => loan.status === "pending").length || 0;
      const approvedLoans =
        loanData?.filter((loan) => loan.status === "approved").length || 0;
      const totalLoanAmount =
        loanData?.reduce((sum, loan) => sum + loan.amount, 0) || 0;
      const totalRevenue =
        loanData?.reduce((sum, loan) => {
          if (loan.status === "active" || loan.status === "completed") {
            return (
              sum + (loan.monthly_payment * loan.term_months - loan.amount)
            );
          }
          return sum;
        }, 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalLoans,
        pendingLoans,
        approvedLoans,
        totalLoanAmount,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadLoans = async (reset = false) => {
    try {
      if (reset) {
        setLoansPage(1);
        setHasMoreLoans(true);
        setLoadingMoreLoans(false);
      }

      const currentPage = reset ? 1 : loansPage;
      const offset = (currentPage - 1) * LOANS_PER_PAGE;

      // Get loans with pagination
      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("*")
        .order("application_date", { ascending: false })
        .range(offset, offset + LOANS_PER_PAGE - 1);

      if (loansError) throw loansError;

      if (!loansData || loansData.length === 0) {
        if (reset) {
          setLoans([]);
        }
        setHasMoreLoans(false);
        return;
      }

      // Check if there are more loans
      setHasMoreLoans(loansData.length === LOANS_PER_PAGE);

      // Get user IDs from loans
      const userIds = [...new Set(loansData.map((loan) => loan.user_id))];

      // Get user profiles for these user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
        // Continue with loans data even if profiles fail
        const formattedLoans = loansData.map((loan) => ({
          ...loan,
          user_email: "Unknown",
          user_name: "Unknown User",
        }));
        
        if (reset) {
          setLoans(formattedLoans);
        } else {
          setLoans(prev => [...prev, ...formattedLoans]);
        }
        return;
      }

      // Create a map of user_id to profile data
      const profileMap = new Map();
      profilesData?.forEach((profile) => {
        profileMap.set(profile.id, profile);
      });

      // Combine loans with profile data
      const formattedLoans = loansData.map((loan) => {
        const profile = profileMap.get(loan.user_id);
        return {
          ...loan,
          user_email: profile?.email || "Unknown",
          user_name: profile?.full_name || "Unknown User",
        };
      });

      if (reset) {
        setLoans(formattedLoans);
      } else {
        setLoans(prev => [...prev, ...formattedLoans]);
      }
    } catch (error) {
      console.error("Error loading loans:", error);
      if (reset) {
        setLoans([]);
      }
      setHasMoreLoans(false);
    }
  };

  const loadMoreLoans = async () => {
    if (!hasMoreLoans || loadingMoreLoans) return;
    
    setLoadingMoreLoans(true);
    setLoansPage(prev => prev + 1);
    await loadLoans(false);
    setLoadingMoreLoans(false);
  };

  const loadUsers = async (reset = false) => {
    try {
      // First check if we have admin access
      const { data: adminCheck, error: adminError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      if (adminError || !adminCheck?.is_admin) {
        console.log("User does not have admin access or profile not found");
        if (reset) {
          setUsers([]);
        }
        setHasMoreUsers(false);
        return;
      }

      if (reset) {
        setUsersPage(1);
        setHasMoreUsers(true);
        setLoadingMoreUsers(false);
      }

      const currentPage = reset ? 1 : usersPage;
      const offset = (currentPage - 1) * USERS_PER_PAGE;

      // Load users with pagination
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + USERS_PER_PAGE - 1);

      if (error) {
        console.error("Error loading users:", error);
        // If RLS is blocking, show helpful message
        if (
          error.message.includes("policy") ||
          error.message.includes("permission")
        ) {
          Alert.alert(
            "Permission Error",
            "Admin RLS policies may not be properly configured. Please check the database setup.",
            [{ text: "OK" }]
          );
        }
        if (reset) {
          setUsers([]);
        }
        setHasMoreUsers(false);
        return;
      }

      if (!data || data.length === 0) {
        setHasMoreUsers(false);
        return;
      }

      // Check if there are more users
      setHasMoreUsers(data.length === USERS_PER_PAGE);

      if (reset) {
        setUsers(data);
      } else {
        setUsers(prev => [...prev, ...data]);
      }
      
      console.log(`Loaded ${data?.length || 0} users for admin dashboard`);
    } catch (error) {
      console.error("Error loading users:", error);
      if (reset) {
        setUsers([]);
      }
      setHasMoreUsers(false);
    }
  };

  const loadMoreUsers = async () => {
    if (!hasMoreUsers || loadingMoreUsers) return;
    
    setLoadingMoreUsers(true);
    setUsersPage(prev => prev + 1);
    await loadUsers(false);
    setLoadingMoreUsers(false);
  };

  const handleLoanAction = async (
    loanId: string | number,
    action: "approve" | "reject" | "disburse" | "complete"
  ) => {
    try {
      console.log(`Starting ${action} action for loan ID: ${loanId}`);

      let updateData: any = {};

      switch (action) {
        case "approve":
          updateData.status = "approved";
          // Try to add approval_date, but don't fail if column doesn't exist
          try {
            updateData.approval_date = new Date().toISOString();
          } catch (e) {
            console.log(
              "approval_date column may not exist, continuing with status only"
            );
          }
          break;
        case "reject":
          updateData.status = "rejected";
          // Try to add approval_date, but don't fail if column doesn't exist
          try {
            updateData.approval_date = new Date().toISOString();
          } catch (e) {
            console.log(
              "approval_date column may not exist, continuing with status only"
            );
          }
          break;
        case "disburse":
          updateData.status = "active";
          // Try to add disbursement_date, but don't fail if column doesn't exist
          try {
            updateData.disbursement_date = new Date().toISOString();
          } catch (e) {
            console.log(
              "disbursement_date column may not exist, continuing with status only"
            );
          }
          break;
        case "complete":
          updateData.status = "completed";
          // Try to add completion_date, but don't fail if column doesn't exist
          try {
            updateData.completion_date = new Date().toISOString();
          } catch (e) {
            console.log(
              "completion_date column may not exist, continuing with status only"
            );
          }
          break;
      }

      console.log("Update data:", updateData);

      const { data, error } = await supabase
        .from("loans")
        .update(updateData)
        .eq("id", loanId)
        .select();

      console.log("Update result:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log("Update successful:", data);

      // Check if any rows were actually updated
      if (!data || data.length === 0) {
        console.warn(
          "No rows were updated - loan might not exist or no changes made"
        );
        Alert.alert(
          "Warning",
          "No changes were made. The loan might not exist or already has this status."
        );
        return;
      }

      // Log activity
      const loan = loans.find((l) => l.id === loanId);
      if (loan) {
        await supabase.from("activity_log").insert({
          user_id: loan.user_id,
          activity_type: `loan_${action}`,
          description: `Loan ${action}d by admin`,
          amount: loan.amount,
        });
      }

      // Show success message
      Alert.alert("Success", `Loan ${action}d successfully!`, [
        {
          text: "OK",
          onPress: async () => {
            // Refresh loans data while preserving pagination state
            await loadLoans(true);
            // Also refresh stats
            await loadStats();
          },
        },
      ]);
    } catch (error) {
      console.error(`Error ${action}ing loan:`, error);
      Alert.alert("Error", `Failed to ${action} loan.`);
    }
  };

  const showLoanDetails = (loan: Loan) => {
    setSelectedLoan(loan);
    setLoanDetailsVisible(true);
  };

  const closeLoanDetails = () => {
    setSelectedLoan(null);
    setLoanDetailsVisible(false);
  };

  const getFilteredLoans = () => {
    if (loanFilter === "all") return loans;
    return loans.filter((loan) => loan.status === loanFilter);
  };

  const getFilteredUsers = () => {
    if (!userSearchQuery) return users;
    return users.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    );
  };

  const showUserDetails = async (user: User) => {
    setSelectedUser(user);
    setUserDetailsVisible(true);

    // Load user's loans
    try {
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", user.id)
        .order("application_date", { ascending: false });

      if (!error) {
        setUserLoans(data || []);
      }
    } catch (error) {
      console.error("Error loading user loans:", error);
      setUserLoans([]);
    }
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setUserDetailsVisible(false);
    setUserLoans([]);
  };

  const updateUserCreditScore = async (userId: string, newScore: number) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ credit_score: newScore })
        .eq("id", userId);

      if (error) throw error;

      Alert.alert("Success", "Credit score updated successfully!", [
        {
          text: "OK",
          onPress: async () => {
            // Refresh users data while preserving pagination state
            await loadUsers(true);
            if (selectedUser?.id === userId) {
              setSelectedUser({ ...selectedUser, credit_score: newScore });
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Error updating credit score:", error);
      Alert.alert("Error", "Failed to update credit score.");
    }
  };

  const updateUserLoanLimit = async (userId: string, newLimit: number) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ loan_limit: newLimit })
        .eq("id", userId);

      if (error) throw error;

      Alert.alert("Success", "Loan limit updated successfully!", [
        {
          text: "OK",
          onPress: async () => {
            // Refresh users data while preserving pagination state
            await loadUsers(true);
            if (selectedUser?.id === userId) {
              setSelectedUser({ ...selectedUser, loan_limit: newLimit });
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Error updating loan limit:", error);
      Alert.alert("Error", "Failed to update loan limit.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Reset pagination states
    setLoansPage(1);
    setUsersPage(1);
    setActivitiesPage(1);
    setHasMoreLoans(true);
    setHasMoreUsers(true);
    setHasMoreActivities(true);
    
    await Promise.all([loadStats(), loadLoans(true), loadUsers(true)]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    console.log("Logout button pressed"); // Debug log
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("Starting logout process..."); // Debug log

            // Clear any stored session data
            await AsyncStorage.removeItem("supabase.auth.token");

            // Sign out from Supabase
            await supabase.auth.signOut();

            console.log("Logout successful"); // Debug log

            // The App.tsx will automatically redirect to Auth component
            // when session becomes null
          } catch (error) {
            console.error("Error signing out:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return "#4CAF50"; // Green
    if (score >= 650) return "#FF9800"; // Orange
    return "#F44336"; // Red
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#ff9800";
      case "approved":
        return "#28a745";
      case "rejected":
        return "#dc3545";
      case "active":
        return "#007bff";
      case "completed":
        return "#6c757d";
      default:
        return "#6c757d";
    }
  };

  const renderOverview = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card containerStyle={styles.statCard}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={24} color="#007bff" />
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
          </View>
        </Card>

        <Card containerStyle={styles.statCard}>
          <View style={styles.statItem}>
            <Ionicons name="document-text" size={24} color="#28a745" />
            <Text style={styles.statLabel}>Total Loans</Text>
            <Text style={styles.statValue}>{stats.totalLoans}</Text>
          </View>
        </Card>

        <Card containerStyle={styles.statCard}>
          <View style={styles.statItem}>
            <Ionicons name="time" size={24} color="#ff9800" />
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{stats.pendingLoans}</Text>
          </View>
        </Card>

        <Card containerStyle={styles.statCard}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={24} color="#28a745" />
            <Text style={styles.statLabel}>Approved</Text>
            <Text style={styles.statValue}>{stats.approvedLoans}</Text>
          </View>
        </Card>

        <Card containerStyle={styles.statCard}>
          <View style={styles.statItem}>
            <Ionicons name="cash" size={24} color="#007bff" />
            <Text style={styles.statLabel}>Total Amount</Text>
            <Text style={styles.statValue}>
              {formatCurrency(stats.totalLoanAmount)}
            </Text>
          </View>
        </Card>

        <Card containerStyle={styles.statCard}>
          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={24} color="#28a745" />
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statValue}>
              {formatCurrency(stats.totalRevenue)}
            </Text>
          </View>
        </Card>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentActivityContainer}>
        <Text h4 style={styles.sectionTitle}>
          Recent Loan Applications
        </Text>
        {loans.slice(0, 5).map((loan, index) => (
          <Card key={loan.id} containerStyle={[styles.activityCard, { marginBottom: 12 }]}>
            <View style={styles.activityItem}>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>
                  {loan.user_name || loan.user_email}
                </Text>
                <Text style={styles.activitySubtitle}>
                  {formatCurrency(loan.amount)} • {loan.term_months} months
                </Text>
                <Text style={styles.activityDate}>
                  Applied: {formatDate(loan.application_date)}
                </Text>
              </View>
              <View style={styles.activityRight}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(loan.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {loan.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );

  const renderLoans = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Loan Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: "all", label: "All", count: loans.length },
            {
              key: "pending",
              label: "Pending",
              count: loans.filter((l) => l.status === "pending").length,
            },
            {
              key: "approved",
              label: "Approved",
              count: loans.filter((l) => l.status === "approved").length,
            },
            {
              key: "active",
              label: "Active",
              count: loans.filter((l) => l.status === "active").length,
            },
            {
              key: "completed",
              label: "Completed",
              count: loans.filter((l) => l.status === "completed").length,
            },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                loanFilter === filter.key && styles.activeFilterButton,
              ]}
              onPress={() => setLoanFilter(filter.key as any)}
              activeOpacity={1}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  loanFilter === filter.key && styles.activeFilterButtonText,
                ]}
              >
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Loans List */}
      {getFilteredLoans().map((loan) => (
        <TouchableOpacity
          key={loan.id}
          onPress={() => showLoanDetails(loan)}
          style={styles.loanCardTouchable}
          activeOpacity={1}
        >
          <Card containerStyle={styles.loanCard}>
            <View style={styles.loanHeader}>
              <View style={styles.loanInfo}>
                <Text style={styles.loanTitle}>
                  {loan.user_name || loan.user_email}
                </Text>
                <Text style={styles.loanAmount}>
                  {formatCurrency(loan.amount)}
                </Text>
                <Text style={styles.loanDetails}>
                  {loan.term_months} months •{" "}
                  {formatCurrency(loan.monthly_payment)}/month
                </Text>
              </View>
              <View style={styles.loanRightSection}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(loan.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {loan.status.toUpperCase()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6c757d" />
              </View>
            </View>

            <Text style={styles.loanDate}>
              Applied: {formatDate(loan.application_date)}
            </Text>

            {/* Quick Actions */}
            {loan.status === "pending" && (
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={[
                    styles.quickActionButton,
                    { backgroundColor: "#28a745" },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleLoanAction(loan.id, "approve");
                  }}
                  activeOpacity={1}
                >
                  <Ionicons name="checkmark" size={16} color="white" />
                  <Text style={styles.quickActionText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickActionButton,
                    { backgroundColor: "#dc3545" },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleLoanAction(loan.id, "reject");
                  }}
                  activeOpacity={1}
                >
                  <Ionicons name="close" size={16} color="white" />
                  <Text style={styles.quickActionText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}

            {loan.status === "approved" && (
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={[
                    styles.quickActionButton,
                    { backgroundColor: "#007bff" },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleLoanAction(loan.id, "disburse");
                  }}
                  activeOpacity={1}
                >
                  <Ionicons name="cash" size={16} color="white" />
                  <Text style={styles.quickActionText}>Disburse</Text>
                </TouchableOpacity>
              </View>
            )}

            {loan.status === "active" && (
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={[
                    styles.quickActionButton,
                    { backgroundColor: "#6c757d" },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleLoanAction(loan.id, "complete");
                  }}
                  activeOpacity={1}
                >
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                  <Text style={styles.quickActionText}>Complete</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </TouchableOpacity>
      ))}

      {/* Load More Button */}
      {hasMoreLoans && (
        <View style={styles.loadMoreContainer}>
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={loadMoreLoans}
            disabled={loadingMoreLoans}
            activeOpacity={0.7}
          >
            {loadingMoreLoans ? (
              <>
                <Ionicons name="hourglass" size={16} color="#ffffff" />
                <Text style={styles.loadMoreText}>Loading...</Text>
              </>
            ) : (
              <>
                <Ionicons name="add-circle" size={16} color="#ffffff" />
                <Text style={styles.loadMoreText}>Load More Loans</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderProfile = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeaderContainer}>
        <View style={styles.profileHeader}>
          <Avatar
            size={100}
            rounded
            source={{ uri: adminProfile?.avatar_url }}
            icon={{ name: "person", type: "material" }}
            containerStyle={styles.profileAvatar}
          />
          <View style={styles.profileHeaderInfo}>
            <Text style={styles.profileName}>
              {adminProfile?.full_name || "Admin User"}
            </Text>
            <Text style={styles.profileEmail}>{adminProfile?.email}</Text>
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#ffffff" />
              <Text style={styles.adminBadgeText}>Administrator</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Profile Info Cards */}
      <View style={styles.profileCardsContainer}>
        <Card containerStyle={styles.profileInfoCard}>
          <View style={styles.profileInfoRow}>
            <Ionicons name="call" size={20} color="#007bff" />
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Phone</Text>
              <Text style={styles.profileInfoValue}>
                {adminProfile?.phone || "Not provided"}
              </Text>
            </View>
          </View>
        </Card>

        <Card containerStyle={styles.profileInfoCard}>
          <View style={styles.profileInfoRow}>
            <Ionicons name="location" size={20} color="#28a745" />
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Location</Text>
              <Text style={styles.profileInfoValue}>
                {adminProfile?.city && adminProfile?.province
                  ? `${adminProfile.city}, ${adminProfile.province}`
                  : "Not provided"}
              </Text>
            </View>
          </View>
        </Card>

        <Card containerStyle={styles.profileInfoCard}>
          <View style={styles.profileInfoRow}>
            <Ionicons name="calendar" size={20} color="#ff9800" />
            <View style={styles.profileInfoContent}>
              <Text style={styles.profileInfoLabel}>Member Since</Text>
              <Text style={styles.profileInfoValue}>
                {adminProfile?.created_at
                  ? formatDate(adminProfile.created_at)
                  : "Unknown"}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Admin Actions */}
      <View style={styles.profileActionsContainer}>
        <Text style={styles.profileSectionTitle}>Admin Actions</Text>
        
        <TouchableOpacity
          style={styles.profileActionButton}
          onPress={openEditProfileModal}
          activeOpacity={0.7}
        >
          <View style={styles.profileActionContent}>
            <Ionicons name="person-circle-outline" size={24} color="#007bff" />
            <View style={styles.profileActionTextContainer}>
              <Text style={styles.profileActionTitle}>Edit Profile</Text>
              <Text style={styles.profileActionSubtitle}>Update your personal information</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6c757d" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileActionButton}
          onPress={openChangePasswordModal}
          activeOpacity={0.7}
        >
          <View style={styles.profileActionContent}>
            <Ionicons name="lock-closed-outline" size={24} color="#28a745" />
            <View style={styles.profileActionTextContainer}>
              <Text style={styles.profileActionTitle}>Change Password</Text>
              <Text style={styles.profileActionSubtitle}>Update your account password</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6c757d" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileActionButton}
          onPress={openSecuritySettingsModal}
          activeOpacity={0.7}
        >
          <View style={styles.profileActionContent}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#ff9800" />
            <View style={styles.profileActionTextContainer}>
              <Text style={styles.profileActionTitle}>Security Settings</Text>
              <Text style={styles.profileActionSubtitle}>Manage security preferences</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6c757d" />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <View style={styles.profileSignOutContainer}>
        <TouchableOpacity
          style={styles.profileSignOutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color="#ffffff" />
          <Text style={styles.profileSignOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderUsers = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* User Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#6c757d"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name or email..."
            value={userSearchQuery}
            onChangeText={setUserSearchQuery}
            placeholderTextColor="#6c757d"
          />
          {userSearchQuery ? (
            <TouchableOpacity
              onPress={() => setUserSearchQuery("")}
              activeOpacity={1}
            >
              <Ionicons name="close-circle" size={20} color="#6c757d" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Users List */}
      {getFilteredUsers().map((user) => (
        <TouchableOpacity
          key={user.id}
          onPress={() => showUserDetails(user)}
          style={styles.userCardTouchable}
          activeOpacity={1}
        >
          <Card containerStyle={styles.userCard}>
            <View style={styles.userHeader}>
              <Avatar
                size={50}
                rounded
                source={{ uri: user.avatar_url }}
                icon={{ name: "person", type: "material" }}
                containerStyle={styles.userAvatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.full_name || "No Name"}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userDate}>
                  Joined: {formatDate(user.created_at)}
                </Text>
              </View>
              <View style={styles.userRightSection}>
                <View style={styles.userStats}>
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeText}>
                      Score: {user.credit_score || 0}
                    </Text>
                  </View>
                  <Text style={styles.loanLimit}>
                    Limit: {formatCurrency(user.loan_limit || 0)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6c757d" />
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      ))}

      {/* Load More Button */}
      {hasMoreUsers && (
        <View style={styles.loadMoreContainer}>
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={loadMoreUsers}
            disabled={loadingMoreUsers}
            activeOpacity={0.7}
          >
            {loadingMoreUsers ? (
              <>
                <Ionicons name="hourglass" size={16} color="#ffffff" />
                <Text style={styles.loadMoreText}>Loading...</Text>
              </>
            ) : (
              <>
                <Ionicons name="add-circle" size={16} color="#ffffff" />
                <Text style={styles.loadMoreText}>Load More Users</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <Text h3 style={styles.headerTitle}>Admin Dashboard</Text> */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={onRefresh}
            style={styles.headerButton}
            activeOpacity={1}
          >
            <Ionicons name="refresh" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "overview" && styles.activeTab]}
          onPress={() => setActiveTab("overview")}
          activeOpacity={1}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "overview" && styles.activeTabText,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "loans" && styles.activeTab]}
          onPress={() => setActiveTab("loans")}
          activeOpacity={1}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "loans" && styles.activeTabText,
            ]}
          >
            Loans
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "users" && styles.activeTab]}
          onPress={() => setActiveTab("users")}
          activeOpacity={1}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "users" && styles.activeTabText,
            ]}
          >
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "profile" && styles.activeTab]}
          onPress={() => setActiveTab("profile")}
          activeOpacity={1}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "profile" && styles.activeTabText,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === "overview" && renderOverview()}
        {activeTab === "loans" && renderLoans()}
        {activeTab === "users" && renderUsers()}
        {activeTab === "profile" && renderProfile()}
      </ScrollView>

      {/* Loan Details Modal */}
      {selectedLoan && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Loan Details</Text>
              <TouchableOpacity onPress={closeLoanDetails} activeOpacity={1}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Loan Information */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Loan Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Applicant:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLoan.user_name || selectedLoan.user_email}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: "#007bff", fontWeight: "700" },
                    ]}
                  >
                    {formatCurrency(selectedLoan.amount)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Term:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLoan.term_months} months
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Monthly Payment:</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(selectedLoan.monthly_payment)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Interest Rate:</Text>
                  <Text style={styles.detailValue}>
                    {(selectedLoan.interest_rate * 100).toFixed(1)}% APR
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(selectedLoan.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {selectedLoan.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Timeline */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Timeline</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Applied:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedLoan.application_date)}
                  </Text>
                </View>
                {selectedLoan.approval_date && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Approved:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedLoan.approval_date)}
                    </Text>
                  </View>
                )}
                {selectedLoan.disbursement_date && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Disbursed:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedLoan.disbursement_date)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Actions</Text>
                <View style={styles.modalActions}>
                  {selectedLoan.status === "pending" && (
                    <>
                      <Button
                        title="Approve Loan"
                        buttonStyle={[
                          styles.modalActionButton,
                          { backgroundColor: "#28a745" },
                        ]}
                        onPress={() => {
                          handleLoanAction(selectedLoan.id, "approve");
                          closeLoanDetails();
                        }}
                        icon={{
                          name: "check",
                          type: "material",
                          color: "white",
                        }}
                        activeOpacity={1}
                      />
                      <Button
                        title="Reject Loan"
                        buttonStyle={[
                          styles.modalActionButton,
                          { backgroundColor: "#dc3545" },
                        ]}
                        onPress={() => {
                          handleLoanAction(selectedLoan.id, "reject");
                          closeLoanDetails();
                        }}
                        icon={{
                          name: "close",
                          type: "material",
                          color: "white",
                        }}
                        activeOpacity={1}
                      />
                    </>
                  )}
                  {selectedLoan.status === "approved" && (
                    <Button
                      title="Disburse Loan"
                      buttonStyle={[
                        styles.modalActionButton,
                        { backgroundColor: "#007bff" },
                      ]}
                      onPress={() => {
                        handleLoanAction(selectedLoan.id, "disburse");
                        closeLoanDetails();
                      }}
                      icon={{ name: "cash", type: "material", color: "white" }}
                      activeOpacity={1}
                    />
                  )}
                  {selectedLoan.status === "active" && (
                    <Button
                      title="Mark as Complete"
                      buttonStyle={[
                        styles.modalActionButton,
                        { backgroundColor: "#6c757d" },
                      ]}
                      onPress={() => {
                        handleLoanAction(selectedLoan.id, "complete");
                        closeLoanDetails();
                      }}
                      icon={{
                        name: "check-circle",
                        type: "material",
                        color: "white",
                      }}
                      activeOpacity={1}
                    />
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Profile</Text>
              <TouchableOpacity onPress={closeUserDetails} activeOpacity={1}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* User Information */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>User Information</Text>
                <View style={styles.userProfileHeader}>
                  <Avatar
                    size={80}
                    rounded
                    source={{ uri: selectedUser.avatar_url }}
                    icon={{ name: "person", type: "material" }}
                    containerStyle={styles.modalAvatar}
                  />
                  <View style={styles.userProfileInfo}>
                    <Text style={styles.userProfileName}>
                      {selectedUser.full_name || "No Name"}
                    </Text>
                    <Text style={styles.userProfileEmail}>
                      {selectedUser.email}
                    </Text>
                    <Text style={styles.userProfileDate}>
                      Joined: {formatDate(selectedUser.created_at)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Financial Information */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Financial Information
                </Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Credit Score:</Text>
                  <View style={styles.editableValue}>
                    <Text
                      style={[
                        styles.detailValue,
                        {
                          color: getCreditScoreColor(
                            selectedUser.credit_score || 0
                          ),
                        },
                      ]}
                    >
                      {selectedUser.credit_score || 0}
                    </Text>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        Alert.prompt(
                          "Update Credit Score",
                          "Enter new credit score (300-850):",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Update",
                              onPress: (text: string | undefined) => {
                                const newScore = parseInt(text || "0");
                                if (newScore >= 300 && newScore <= 850) {
                                  updateUserCreditScore(
                                    selectedUser.id,
                                    newScore
                                  );
                                } else {
                                  Alert.alert(
                                    "Error",
                                    "Credit score must be between 300 and 850."
                                  );
                                }
                              },
                            },
                          ]
                        );
                      }}
                      activeOpacity={1}
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color="#007bff"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Loan Limit:</Text>
                  <View style={styles.editableValue}>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: "#28a745", fontWeight: "700" },
                      ]}
                    >
                      {formatCurrency(selectedUser.loan_limit || 0)}
                    </Text>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        Alert.prompt(
                          "Update Loan Limit",
                          "Enter new loan limit:",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Update",
                              onPress: (text: string | undefined) => {
                                const newLimit = parseFloat(text || "0");
                                if (newLimit >= 0) {
                                  updateUserLoanLimit(
                                    selectedUser.id,
                                    newLimit
                                  );
                                } else {
                                  Alert.alert(
                                    "Error",
                                    "Loan limit must be a positive number."
                                  );
                                }
                              },
                            },
                          ]
                        );
                      }}
                      activeOpacity={1}
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color="#007bff"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Loan History */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Loan History ({userLoans.length})
                </Text>
                {userLoans.length > 0 ? (
                  userLoans.map((loan) => (
                    <View key={loan.id} style={styles.loanHistoryItem}>
                      <View style={styles.loanHistoryHeader}>
                        <Text style={styles.loanHistoryAmount}>
                          {formatCurrency(loan.amount)}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(loan.status) },
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {loan.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.loanHistoryDetails}>
                        {loan.term_months} months •{" "}
                        {formatCurrency(loan.monthly_payment)}/month
                      </Text>
                      <Text style={styles.loanHistoryDate}>
                        Applied: {formatDate(loan.application_date)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noLoansText}>
                    No loan applications found
                  </Text>
                )}
              </View>

              {/* User Statistics */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Statistics</Text>
                <View style={styles.userStatsGrid}>
                  <View style={styles.userStatCard}>
                    <Text style={styles.userStatValue}>{userLoans.length}</Text>
                    <Text style={styles.userStatLabel}>Total Loans</Text>
                  </View>
                  <View style={styles.userStatCard}>
                    <Text style={styles.userStatValue}>
                      {userLoans.filter((l) => l.status === "active").length}
                    </Text>
                    <Text style={styles.userStatLabel}>Active Loans</Text>
                  </View>
                  <View style={styles.userStatCard}>
                    <Text style={styles.userStatValue}>
                      {formatCurrency(
                        userLoans.reduce((sum, loan) => sum + loan.amount, 0)
                      )}
                    </Text>
                    <Text style={styles.userStatLabel}>Total Borrowed</Text>
                  </View>
                  <View style={styles.userStatCard}>
                    <Text style={styles.userStatValue}>
                      {userLoans.filter((l) => l.status === "completed").length}
                    </Text>
                    <Text style={styles.userStatLabel}>Completed</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Edit Profile Modal */}
      {editProfileModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={closeEditProfileModal} activeOpacity={1}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Input
                label="Full Name"
                value={editProfileForm.full_name}
                onChangeText={(text) =>
                  setEditProfileForm({ ...editProfileForm, full_name: text })
                }
                placeholder="Enter your full name"
                leftIcon={<Ionicons name="person" size={20} color="#6c757d" />}
                containerStyle={{ paddingHorizontal: 0 }}
              />

              <Input
                label="Phone"
                value={editProfileForm.phone}
                onChangeText={(text) =>
                  setEditProfileForm({ ...editProfileForm, phone: text })
                }
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                leftIcon={<Ionicons name="call" size={20} color="#6c757d" />}
                containerStyle={{ paddingHorizontal: 0 }}
              />

              <Input
                label="City"
                value={editProfileForm.city}
                onChangeText={(text) =>
                  setEditProfileForm({ ...editProfileForm, city: text })
                }
                placeholder="Enter your city"
                leftIcon={<Ionicons name="location" size={20} color="#6c757d" />}
                containerStyle={{ paddingHorizontal: 0 }}
              />

              <Input
                label="Province"
                value={editProfileForm.province}
                onChangeText={(text) =>
                  setEditProfileForm({ ...editProfileForm, province: text })
                }
                placeholder="Enter your province"
                leftIcon={<Ionicons name="map" size={20} color="#6c757d" />}
                containerStyle={{ paddingHorizontal: 0 }}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  onPress={closeEditProfileModal}
                  buttonStyle={[
                    styles.modalActionButton,
                    { backgroundColor: "#6c757d" },
                  ]}
                  containerStyle={{ flex: 1 }}
                />
                <Button
                  title={savingProfile ? "Saving..." : "Save Changes"}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                  buttonStyle={[
                    styles.modalActionButton,
                    { backgroundColor: "#007bff" },
                  ]}
                  containerStyle={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Change Password Modal */}
      {changePasswordModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={closeChangePasswordModal} activeOpacity={1}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.passwordHelperText}>
                Enter your new password. It must be at least 6 characters long.
              </Text>

              <Input
                label="New Password"
                value={passwordForm.newPassword}
                onChangeText={(text) =>
                  setPasswordForm({ ...passwordForm, newPassword: text })
                }
                placeholder="Enter new password"
                secureTextEntry
                leftIcon={<Ionicons name="lock-closed" size={20} color="#6c757d" />}
                containerStyle={{ paddingHorizontal: 0 }}
              />

              <Input
                label="Confirm New Password"
                value={passwordForm.confirmPassword}
                onChangeText={(text) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: text })
                }
                placeholder="Confirm new password"
                secureTextEntry
                leftIcon={<Ionicons name="lock-closed" size={20} color="#6c757d" />}
                containerStyle={{ paddingHorizontal: 0 }}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  onPress={closeChangePasswordModal}
                  buttonStyle={[
                    styles.modalActionButton,
                    { backgroundColor: "#6c757d" },
                  ]}
                  containerStyle={{ flex: 1 }}
                />
                <Button
                  title={changingPassword ? "Changing..." : "Change Password"}
                  onPress={handleChangePassword}
                  disabled={changingPassword}
                  buttonStyle={[
                    styles.modalActionButton,
                    { backgroundColor: "#28a745" },
                  ]}
                  containerStyle={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Security Settings Modal */}
      {securitySettingsModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Security Settings</Text>
              <TouchableOpacity onPress={closeSecuritySettingsModal} activeOpacity={1}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.securitySectionTitle}>Account Security</Text>

              <CheckBox
                title="Two-Factor Authentication"
                checked={securitySettings.twoFactorAuth}
                onPress={() =>
                  setSecuritySettings({
                    ...securitySettings,
                    twoFactorAuth: !securitySettings.twoFactorAuth,
                  })
                }
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
              />
              <Text style={styles.checkboxDescription}>
                Add an extra layer of security to your account
              </Text>

              <Divider style={styles.securityDivider} />

              <Text style={styles.securitySectionTitle}>Notifications</Text>

              <CheckBox
                title="Email Notifications"
                checked={securitySettings.emailNotifications}
                onPress={() =>
                  setSecuritySettings({
                    ...securitySettings,
                    emailNotifications: !securitySettings.emailNotifications,
                  })
                }
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
              />
              <Text style={styles.checkboxDescription}>
                Receive email updates about account activity
              </Text>

              <CheckBox
                title="Login Alerts"
                checked={securitySettings.loginAlerts}
                onPress={() =>
                  setSecuritySettings({
                    ...securitySettings,
                    loginAlerts: !securitySettings.loginAlerts,
                  })
                }
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
              />
              <Text style={styles.checkboxDescription}>
                Get notified when someone logs into your account
              </Text>

              <Divider style={styles.securityDivider} />

              <Text style={styles.securitySectionTitle}>Session Management</Text>

              <CheckBox
                title="Auto Session Timeout"
                checked={securitySettings.sessionTimeout}
                onPress={() =>
                  setSecuritySettings({
                    ...securitySettings,
                    sessionTimeout: !securitySettings.sessionTimeout,
                  })
                }
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
              />
              <Text style={styles.checkboxDescription}>
                Automatically log out after 30 minutes of inactivity
              </Text>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  onPress={closeSecuritySettingsModal}
                  buttonStyle={[
                    styles.modalActionButton,
                    { backgroundColor: "#6c757d" },
                  ]}
                  containerStyle={{ flex: 1 }}
                />
                <Button
                  title="Save Settings"
                  onPress={handleSaveSecuritySettings}
                  buttonStyle={[
                    styles.modalActionButton,
                    { backgroundColor: "#ff9800" },
                  ]}
                  containerStyle={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      )}

    </View>
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
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    color: "#212529",
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  logoutButton: {
    backgroundColor: "#ff751f",
    borderWidth: 1,
    borderColor: "#ff751f",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 2,
    borderRadius: 12,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#ff751f",
  },
  tabText: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingBottom: 10,
  },
  // Stats Styles
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    gap: 15,
  },
  statCard: {
    flexBasis: "48%",
    borderRadius: 12,
    padding: 20,
    backgroundColor: "#ffffff",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 140,
    margin: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  statItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "500",
    textAlign: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    textAlign: "center",
    marginBottom: 2,
  },
  // Recent Activity
  recentActivityContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#212529",
    fontWeight: "600",
    marginBottom: 15,
  },
  activityCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 0,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    margin: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "500",
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  activityDate: {
    fontSize: 12,
    color: "#6c757d",
  },
  activityRight: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
  },
  // Filter Styles
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#f8f9fa",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 0,
    minWidth: 80,
    alignItems: "center",
  },
  activeFilterButton: {
    backgroundColor: "#ff751f",
    borderWidth: 0,
  },
  filterButtonText: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  activeFilterButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  // Loan Card
  loanCardTouchable: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  loanCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#ffffff",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    margin: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  loanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  loanInfo: {
    flex: 1,
  },
  loanTitle: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "600",
    marginBottom: 4,
  },
  loanAmount: {
    fontSize: 18,
    color: "#007bff",
    fontWeight: "700",
    marginBottom: 4,
  },
  loanDetails: {
    fontSize: 14,
    color: "#6c757d",
  },
  loanRightSection: {
    alignItems: "flex-end",
  },
  loanDate: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    minWidth: 80,
    justifyContent: "center",
  },
  quickActionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  // Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#f8f9fa",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
  },
  // User Card
  userCardTouchable: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  userCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#ffffff",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    margin: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "600",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 2,
  },
  userDate: {
    fontSize: 12,
    color: "#6c757d",
  },
  userRightSection: {
    alignItems: "flex-end",
  },
  userStats: {
    alignItems: "flex-end",
    marginBottom: 8,
  },
  statBadge: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  statBadgeText: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "500",
  },
  loanLimit: {
    fontSize: 12,
    color: "#28a745",
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    width: "100%",
    maxHeight: "85%",
    overflow: "hidden",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0,
    backgroundColor: "#ffffff",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
  },
  modalContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 25,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
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
  editableValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    padding: 6,
  },
  modalActions: {
    gap: 10,
  },
  modalActionButton: {
    borderRadius: 8,
    paddingVertical: 12,
  },
  // User Profile Modal
  userProfileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  modalAvatar: {
    marginRight: 15,
  },
  userProfileInfo: {
    flex: 1,
  },
  userProfileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  userProfileEmail: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 2,
  },
  userProfileDate: {
    fontSize: 12,
    color: "#6c757d",
  },
  // Loan History
  loanHistoryItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  loanHistoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  loanHistoryAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007bff",
  },
  loanHistoryDetails: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
  },
  loanHistoryDate: {
    fontSize: 12,
    color: "#6c757d",
  },
  noLoansText: {
    fontSize: 14,
    color: "#6c757d",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
  // User Statistics
  userStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  userStatCard: {
    flexBasis: "47%",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
  },
  userStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  userStatLabel: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
  },
  // Bottom Logout
  bottomLogoutContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#ffffff",
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bottomLogoutButton: {
    backgroundColor: "#ff751f",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomLogoutContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bottomLogoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Load More Styles
  loadMoreContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadMoreText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Profile Styles
  profileHeaderContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileAvatar: {
    backgroundColor: "#e9ecef",
    borderWidth: 3,
    borderColor: "#ff751f",
  },
  profileHeaderInfo: {
    flex: 1,
    marginLeft: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff751f",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 6,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  profileCardsContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
    gap: 12,
  },
  profileInfoCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#ffffff",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    margin: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  profileInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  profileInfoContent: {
    flex: 1,
  },
  profileInfoLabel: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "500",
    marginBottom: 4,
  },
  profileInfoValue: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "600",
  },
  profileActionsContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
  },
  profileSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 15,
  },
  profileActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileActionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 15,
  },
  profileActionTextContainer: {
    flex: 1,
  },
  profileActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  profileActionSubtitle: {
    fontSize: 12,
    color: "#6c757d",
  },
  profileSignOutContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 30,
  },
  profileSignOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc3545",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  profileSignOutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  // Password Modal Styles
  passwordHelperText: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 20,
    lineHeight: 20,
  },
  // Security Settings Modal Styles
  securitySectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 15,
    marginTop: 10,
  },
  checkboxContainer: {
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 10,
    marginBottom: 5,
  },
  checkboxText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212529",
  },
  checkboxDescription: {
    fontSize: 13,
    color: "#6c757d",
    marginLeft: 40,
    marginBottom: 10,
  },
  securityDivider: {
    marginVertical: 20,
    backgroundColor: "#e9ecef",
  },
});
