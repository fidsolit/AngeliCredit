import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Account from "./components/Account";
import AdminDashboard from "./components/AdminDashboard";
import { View } from "react-native";
import { Session } from "@supabase/supabase-js";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./lib/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { SimpleThemeProvider, useSimpleTheme } from "./lib/ThemeContextSimple";
import { ThemeProvider as RNEUIThemeProvider } from "@rneui/themed";


// Create a theme-aware RNEUI theme
const createRNEUITheme = (isDark: boolean) => ({
  lightColors: {
    primary: '#ff751f',
    secondary: '#6c757d',
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    background: isDark ? '#121212' : '#f8f9fa',
    surface: isDark ? '#1e1e1e' : '#ffffff',
    text: isDark ? '#ffffff' : '#212529',
    textSecondary: isDark ? '#adb5bd' : '#6c757d',
    border: isDark ? '#3d3d3d' : '#e9ecef',
  },
  darkColors: {
    primary: '#ff751f',
    secondary: '#6c757d',
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    background: isDark ? '#121212' : '#f8f9fa',
    surface: isDark ? '#1e1e1e' : '#ffffff',
    text: isDark ? '#ffffff' : '#212529',
    textSecondary: isDark ? '#adb5bd' : '#6c757d',
    border: isDark ? '#3d3d3d' : '#e9ecef',
  },
  mode: isDark ? 'dark' as const : 'light' as const,
});

// Wrapper component that provides RNEUI theme based on simple theme
const AppContent = ({ session, isAdmin }: { session: Session | null; isAdmin: boolean }) => {
  const { isDark } = useSimpleTheme();
  const rneuiTheme = createRNEUITheme(isDark);

  return (
    <RNEUIThemeProvider theme={rneuiTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={{ flex: 1 }}>
        {session && session.user ? (
          isAdmin ? (
            <AdminDashboard key={session.user.id} session={session} />
          ) : (
            <Account key={session.user.id} session={session} />
          )
        ) : (
          <Auth navigation={undefined} />
        )}
      </View>
    </RNEUIThemeProvider>
  );
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Fetch the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    // Listen for auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        // Directly set the new session - React will handle the comparison
        setSession(newSession);
        if (newSession?.user) {
          checkAdminStatus(newSession.user.id);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // Cleanup the listener on unmount
    return () => {
      subscription.subscription.unsubscribe(); // Properly unsubscribe the listener
    };
  }, []); // Dependency array ensures this runs only once

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setIsAdmin(data.is_admin || false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SimpleThemeProvider>
        <AppContent session={session} isAdmin={isAdmin} />
      </SimpleThemeProvider>
    </SafeAreaProvider>
  );
}
