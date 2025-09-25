import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTheme, ThemeProvider as RNEUIThemeProvider } from '@rneui/themed';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Enhanced theme colors for better dark mode support
const lightTheme = createTheme({
  lightColors: {
    primary: '#ff751f',
    secondary: '#28a745',
    success: '#28a745',
    warning: '#ff9800',
    error: '#dc3545',
    background: '#f8f9fa',
    surface: '#ffffff',
    grey0: '#212529',
    grey1: '#495057',
    grey2: '#6c757d',
    grey3: '#adb5bd',
    grey4: '#ced4da',
    grey5: '#e9ecef',
    white: '#ffffff',
    black: '#000000',
  },
  darkColors: {
    primary: '#ff751f',
    secondary: '#28a745',
    success: '#28a745',
    warning: '#ff9800',
    error: '#dc3545',
    background: '#121212',
    surface: '#1e1e1e',
    grey0: '#ffffff',
    grey1: '#f8f9fa',
    grey2: '#e9ecef',
    grey3: '#adb5bd',
    grey4: '#6c757d',
    grey5: '#495057',
    white: '#ffffff',
    black: '#000000',
  },
  mode: 'light',
});

const darkTheme = createTheme({
  lightColors: {
    primary: '#ff751f',
    secondary: '#28a745',
    success: '#28a745',
    warning: '#ff9800',
    error: '#dc3545',
    background: '#f8f9fa',
    surface: '#ffffff',
    grey0: '#212529',
    grey1: '#495057',
    grey2: '#6c757d',
    grey3: '#adb5bd',
    grey4: '#ced4da',
    grey5: '#e9ecef',
    white: '#ffffff',
    black: '#000000',
  },
  darkColors: {
    primary: '#ff751f',
    secondary: '#28a745',
    success: '#28a745',
    warning: '#ff9800',
    error: '#dc3545',
    background: '#121212',
    surface: '#1e1e1e',
    grey0: '#ffffff',
    grey1: '#f8f9fa',
    grey2: '#e9ecef',
    grey3: '#adb5bd',
    grey4: '#6c757d',
    grey5: '#495057',
    white: '#ffffff',
    black: '#000000',
  },
  mode: 'dark',
});

const THEME_STORAGE_KEY = '@ecredit_theme_mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isDark, setIsDark] = useState(false);

  // Load theme preference from storage on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
        updateTheme(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const updateTheme = (mode: ThemeMode) => {
    let shouldBeDark = false;
    
    if (mode === 'system') {
      // For system mode, you could use Appearance API in the future
      // For now, defaulting to light mode
      shouldBeDark = false;
    } else {
      shouldBeDark = mode === 'dark';
    }
    
    setIsDark(shouldBeDark);
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
      updateTheme(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const currentTheme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, toggleTheme, setThemeMode }}>
      <RNEUIThemeProvider theme={currentTheme}>
        {children}
      </RNEUIThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export theme colors for direct use in components
export const getThemeColors = (isDark: boolean) => ({
  primary: '#ff751f',
  secondary: '#28a745',
  success: '#28a745',
  warning: '#ff9800',
  error: '#dc3545',
  background: isDark ? '#121212' : '#f8f9fa',
  surface: isDark ? '#1e1e1e' : '#ffffff',
  card: isDark ? '#2d2d2d' : '#ffffff',
  text: isDark ? '#ffffff' : '#212529',
  textSecondary: isDark ? '#adb5bd' : '#6c757d',
  border: isDark ? '#3d3d3d' : '#e9ecef',
  shadow: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
});
