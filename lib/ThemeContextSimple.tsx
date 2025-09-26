import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@ecredit_theme_mode';

const getColors = (isDark: boolean) => ({
  primary: '#ff751f',
  secondary: '#28a745',
  success: '#28a745',
  warning: '#ff9800',
  error: '#dc3545',
  background: isDark ? '#121212' : '#f8f9fa',
  surface: isDark ? '#1e1e1e' : '#ffffff',
  text: isDark ? '#ffffff' : '#212529',
  textSecondary: isDark ? '#ff9800' : '#ff751f',
  border: isDark ? '#3d3d3d' : '#ff751f',
  shadow: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
});

export const SimpleThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
      // Fallback to light theme if there's an error
      setThemeModeState('light');
      setIsDark(false);
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
      // Still update the theme even if saving fails
      setThemeModeState(mode);
      updateTheme(mode);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const colors = getColors(isDark);

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, toggleTheme, setThemeMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useSimpleTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    console.warn('useSimpleTheme must be used within a SimpleThemeProvider. Falling back to default values.');
    // Return default values instead of throwing an error
    return {
      themeMode: 'light',
      isDark: false,
      toggleTheme: () => console.warn('SimpleThemeProvider not found'),
      setThemeMode: () => console.warn('SimpleThemeProvider not found'),
      colors: getColors(false),
    };
  }
  return context;
};
