import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Profile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  company: string;
  location: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface Preferences {
  darkMode: boolean;
  language: string;
  fontSize: string;
  sidebarCollapsed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Notifications {
  email: boolean;
  push: boolean;
  marketing: boolean;
  updates: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserData {
  profile: Profile | null;
  preferences: Preferences | null;
  notifications: Notifications | null;
  user: { id: string; email: string } | null;
}

interface UseProfileReturn {
  data: UserData;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
  updatePreferences: (updates: Partial<Preferences>) => Promise<boolean>;
  updateNotifications: (updates: Partial<Notifications>) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1`;

export function useProfile(): UseProfileReturn {
  const [data, setData] = useState<UserData>({
    profile: null,
    preferences: null,
    notifications: null,
    user: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mock data for development/testing
  const getMockData = useCallback(() => ({
    profile: {
      name: 'Aodren Sarlat',
      email: 'aodren.sarlat@example.com',
      phone: '+33 6 12 34 56 78',
      bio: 'Product Designer passionate about innovation and user experience.',
      company: 'Innovation Studio',
      location: 'Paris, France',
      avatarUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    preferences: {
      darkMode: false,
      language: 'fr',
      fontSize: 'medium',
      sidebarCollapsed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    notifications: {
      email: true,
      push: true,
      marketing: false,
      updates: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    user: {
      id: 'mock-user-id',
      email: 'aodren.sarlat@example.com'
    }
  }), []);

  // Make authenticated request to server
  const makeAuthenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Non authentifié');
    }

    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        ...options.headers
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `Erreur serveur (${response.status})`);
    }

    return result;
  };

  // Load user data
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
        setData({
          profile: null,
          preferences: null,
          notifications: null,
          user: null
        });
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Try to load data from server, fallback to mock data
      try {
        const result = await makeAuthenticatedRequest('/make-server-6c8ffc9e/user-data');
        
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error);
        }
      } catch (serverError) {
        console.warn('Server unavailable, using mock data:', serverError);
        // Use mock data when server is not available
        setData(getMockData());
        setError('Mode local - Utilisation de données de test');
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [getMockData]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<boolean> => {
    try {
      setError(null);
      
      // For mock mode, just update local state
      if (error?.includes('local')) {
        setData(prev => ({
          ...prev,
          profile: prev.profile ? { 
            ...prev.profile, 
            ...updates,
            updatedAt: new Date().toISOString()
          } : null
        }));
        return true;
      }

      const result = await makeAuthenticatedRequest('/make-server-6c8ffc9e/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...data.profile,
          ...updates
        })
      });

      if (result.success) {
        setData(prev => ({
          ...prev,
          profile: result.data
        }));
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour');
      return false;
    }
  }, [data.profile, error]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<Preferences>): Promise<boolean> => {
    try {
      setError(null);
      
      // For mock mode, just update local state
      if (error?.includes('local')) {
        setData(prev => ({
          ...prev,
          preferences: prev.preferences ? { 
            ...prev.preferences, 
            ...updates,
            updatedAt: new Date().toISOString()
          } : null
        }));
        return true;
      }

      const result = await makeAuthenticatedRequest('/make-server-6c8ffc9e/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          ...data.preferences,
          ...updates
        })
      });

      if (result.success) {
        setData(prev => ({
          ...prev,
          preferences: result.data
        }));
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour');
      return false;
    }
  }, [data.preferences, error]);

  // Update notifications
  const updateNotifications = useCallback(async (updates: Partial<Notifications>): Promise<boolean> => {
    try {
      setError(null);
      
      // For mock mode, just update local state
      if (error?.includes('local')) {
        setData(prev => ({
          ...prev,
          notifications: prev.notifications ? { 
            ...prev.notifications, 
            ...updates,
            updatedAt: new Date().toISOString()
          } : null
        }));
        return true;
      }

      const result = await makeAuthenticatedRequest('/make-server-6c8ffc9e/notifications', {
        method: 'PUT',
        body: JSON.stringify({
          ...data.notifications,
          ...updates
        })
      });

      if (result.success) {
        setData(prev => ({
          ...prev,
          notifications: result.data
        }));
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error updating notifications:', err);
      setError(err instanceof Error ? err.message : 'Erreur de mise à jour');
      return false;
    }
  }, [data.notifications, error]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      // Data will be loaded automatically via useEffect
      return true;
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign up
  const signUp = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${SERVER_URL}/make-server-6c8ffc9e/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email,
          password,
          name
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      // Now sign in with these credentials
      return await signIn(email, password);
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err instanceof Error ? err.message : 'Erreur d\'inscription');
      return false;
    } finally {
      setLoading(false);
    }
  }, [signIn]);

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      
      setIsAuthenticated(false);
      setData({
        profile: null,
        preferences: null,
        notifications: null,
        user: null
      });
      setError(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err.message : 'Erreur de déconnexion');
    }
  }, []);

  // Refresh data
  const refreshData = useCallback(async (): Promise<void> => {
    await loadUserData();
  }, [loadUserData]);

  // Effect to load data on mount and listen to auth changes
  useEffect(() => {
    loadUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadUserData();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setData({
          profile: null,
          preferences: null,
          notifications: null,
          user: null
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  return {
    data,
    loading,
    error,
    isAuthenticated,
    updateProfile,
    updatePreferences,
    updateNotifications,
    signIn,
    signUp,
    signOut,
    refreshData
  };
}