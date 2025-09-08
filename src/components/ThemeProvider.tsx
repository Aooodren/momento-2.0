import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserPreferences } from '../hooks/useUserPreferences';

type Theme = 'light'; // Only light mode supported

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light';
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { preferences } = useUserPreferences();
  const [actualTheme] = useState<'light'>('light'); // Always light

  const theme: Theme = 'light'; // Force light theme

  const setTheme = (_newTheme: Theme) => {
    // Do nothing - theme is locked to light
    console.log('Theme is locked to light mode');
  };

  useEffect(() => {
    const root = document.documentElement;
    
    // Always apply light theme
    root.classList.remove('dark');
  }, []);

  // Appliquer aussi la taille de police
  useEffect(() => {
    const root = document.documentElement;
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    
    if (preferences?.fontSize) {
      root.style.fontSize = fontSizes[preferences.fontSize];
    }
  }, [preferences?.fontSize]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    actualTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}