import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserPreferences } from '../hooks/useUserPreferences';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
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
  const { preferences, savePreferences } = useUserPreferences();
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  const theme = preferences?.theme || 'system';

  const setTheme = (newTheme: Theme) => {
    savePreferences({ theme: newTheme });
  };

  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
        setActualTheme('dark');
      } else {
        root.classList.remove('dark');
        setActualTheme('light');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

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