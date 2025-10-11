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
import { Text, Card, Button, Avatar, Divider } from "@rneui/themed";
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
  const [activeTab, setActiveTab] = useState<"overview" | "loans" | "users">(
    "overview"
  );
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

  useEffect(() => {
    if (session?.user) {
      checkAdminAccess();
      loadDashboardData();
    }
  }, [session]);

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
      await Promise.all([loadStats(), loadLoans(), loadUsers()]);
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

  const loadLoans = async () => {
    try {
      // First, get all loans
      const { data: loansData, error: loansError } = await supabase
        .from("loans")
        .select("*")
        .order("application_date", { ascending: false })
        .limit(20);

      if (loansError) throw loansError;

      if (!loansData || loansData.length === 0) {
        setLoans([]);
        return;
      }

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
        setLoans(formattedLoans);
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

      setLoans(formattedLoans);
    } catch (error) {
      console.error("Error loading loans:", error);
      setLoans([]);
    }
  };

  const loadUsers = async () => {
    try {
      // First check if we have admin access
      const { data: adminCheck, error: adminError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      if (adminError || !adminCheck?.is_admin) {
        console.log("User does not have admin access or profile not found");
        setUsers([]);
        return;
      }

      // Load all users (admin should be able to see all)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50); // Increased limit for admin view

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
        setUsers([]);
        return;
      }

      setUsers(data || []);
      console.log(`Loaded ${data?.length || 0} users for admin dashboard`);
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    }
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
            // Automatically refresh all dashboard data
            await loadDashboardData();
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
            // Automatically refresh all dashboard data
            await loadDashboardData();
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
            // Automatically refresh all dashboard data
            await loadDashboardData();
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
    await loadDashboardData();
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
        {loans.slice(0, 5).map((loan) => (
          <Card key={loan.id} containerStyle={styles.activityCard}>
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

      {/* Bottom Logout Button */}
      <View style={styles.bottomLogoutContainer}>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.bottomLogoutButton}
          activeOpacity={1}
        >
          <View style={styles.bottomLogoutContent}>
            <Ionicons name="log-out-outline" size={24} color="#ffffff" />
            <Text style={styles.bottomLogoutText}>Sign Out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

import { StyleSheet } from "react-native";

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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
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
    marginLeft: 10,
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
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Stats Styles
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
  },
  statCard: {
    flexBasis: "48%",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#ff751f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
    textAlign: "center",
  },
  // Section Title
  sectionTitle: {
    color: "#212529",
    fontWeight: "600",
    marginBottom: 15,
    marginTop: 20,
  },
  // Activity Card
  activityCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "600",
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
  },
  // Loan Card
  loanCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  loanTitle: {
    fontSize: 16,
    color: "#212529",
    fontWeight: "600",
  },
  loanAmount: {
    fontSize: 18,
    color: "#007bff",
    fontWeight: "700",
  },
  loanDate: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  // Modal
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
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    width: "100%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
  },
  modalContent: {
    padding: 20,
  },
  bottomLogoutContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  bottomLogoutButton: {
    backgroundColor: "#ff751f",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomLogoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default styles;
