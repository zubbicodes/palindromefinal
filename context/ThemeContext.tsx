import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeColors {
  background: string;
  text: string;
  card: string;
  accent: string;
  border: string;
  secondaryText: string;
  gradient: string; // ✅ Changed to string
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  inputBackground: string;
  buttonText: string;
  buttonPrimary: string; // ✅ Added missing property
}

interface ThemeContextProps {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

// LIGHT THEME COLORS - FIGMA LIKE
const lightColors: ThemeColors = {
  background: '#FFFFFF',
  text: '#000000',
  card: '#F8F9FA',
  accent: '#0060FF',
  border: 'rgba(0, 0, 0, 0.08)',
  secondaryText: '#666666',
  gradient: 'linear-gradient(195.18deg, #FFFFFF 0%, #F0F4FF 100%)', // ✅ Added gradient
  primary: '#0060FF',
  secondary: '#6C757D',
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  inputBackground: '#FFFFFF',
  buttonText: '#FFFFFF',
  buttonPrimary: '#0060FF', // ✅ Added buttonPrimary
};

// DARK THEME COLORS - FIGMA LIKE (Professional Dark Blue)
const darkColors: ThemeColors = {
  background: '#0A0F2D',      // Dark Blue Background
  text: '#FFFFFF',
  card: '#1A1F3C',            // Dark Blue Cards
  accent: '#0060FF',
  border: 'rgba(255, 255, 255, 0.1)',
  secondaryText: '#8B9CB0',   // Light Blue Gray
  gradient: 'linear-gradient(195.18deg, #000017 0%, #000074 100%)', // ✅ Added gradient
  primary: '#0060FF',         // Bright Blue
  secondary: '#8B9CB0',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  inputBackground: '#1A1F3C',
  buttonText: '#FFFFFF',
  buttonPrimary: '#0060FF', // ✅ Added buttonPrimary
};

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  colors: lightColors,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('appTheme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      await AsyncStorage.setItem('appTheme', newTheme);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};