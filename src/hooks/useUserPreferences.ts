import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { useAuthContext } from './useAuth';

export interface UserPreferences {
  // Apparence
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en' | 'es' | 'de';
  fontSize: 'small' | 'medium' | 'large';
  sidebarCollapsed: boolean;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  productUpdates: boolean;
  
  // Profile étendu
  phone: string;
  company: string;
  location: string;
  bio: string;
  website: string;
  timezone: string;
  
  // Sécurité
  twoFactorEnabled: boolean;
  sessionTimeout: number; // en minutes
  
  // Préférences de travail
  defaultProjectType: string;
  autoSave: boolean;
  collaborationMode: 'active' | 'passive';
}

export interface UserSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  userAgent: string;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'fr',
  fontSize: 'medium',
  sidebarCollapsed: false,
  emailNotifications: true,
  pushNotifications: true,
  marketingEmails: false,
  productUpdates: true,
  phone: '',
  company: '',
  location: '',
  bio: '',
  website: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  twoFactorEnabled: false,
  sessionTimeout: 480, // 8 heures
  defaultProjectType: 'design',
  autoSave: true,
  collaborationMode: 'active'
};

export const useUserPreferences = () => {
  const { user } = useAuthContext();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les préférences depuis Supabase
  const loadPreferences = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer les préférences stockées
      const { data: prefData, error: prefError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefError && prefError.code !== 'PGRST116') { // PGRST116 = pas de résultats
        throw prefError;
      }

      // Récupérer le profil étendu
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Fusionner avec les préférences par défaut
      const loadedPrefs = {
        ...defaultPreferences,
        ...prefData?.preferences,
        phone: profileData?.phone || '',
        company: profileData?.company || '',
        location: profileData?.location || '',
        bio: profileData?.bio || '',
        website: profileData?.website || '',
        timezone: profileData?.timezone || defaultPreferences.timezone
      };

      setPreferences(loadedPrefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des préférences');
      console.error('Erreur chargement préférences:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les préférences
  const savePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const updatedPrefs = { ...preferences, ...newPreferences };
      
      // Séparer les données de profil des préférences
      const { phone, company, location, bio, website, timezone, ...prefOnly } = updatedPrefs;
      
      // Sauvegarder le profil étendu
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          phone,
          company,
          location,
          bio,
          website,
          timezone,
          updated_at: new Date().toISOString()
        });

      // Sauvegarder les préférences
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferences: prefOnly,
          updated_at: new Date().toISOString()
        });

      setPreferences(updatedPrefs);
      
      // Appliquer le thème immédiatement
      if (newPreferences.theme) {
        applyTheme(newPreferences.theme);
      }
      
      // Appliquer la taille de police
      if (newPreferences.fontSize) {
        applyFontSize(newPreferences.fontSize);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
      console.error('Erreur sauvegarde préférences:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Appliquer le thème
  const applyTheme = (theme: UserPreferences['theme']) => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemPrefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  // Appliquer la taille de police
  const applyFontSize = (fontSize: UserPreferences['fontSize']) => {
    const root = document.documentElement;
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.fontSize = fontSizes[fontSize];
  };

  // Changer le mot de passe
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // Vérifier le mot de passe actuel en tentant de se connecter
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });

      if (signInError) {
        throw new Error('Mot de passe actuel incorrect');
      }

      // Changer le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

    } catch (err) {
      throw err instanceof Error ? err : new Error('Erreur lors du changement de mot de passe');
    }
  };

  // Exporter les données utilisateur
  const exportUserData = async () => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      // Récupérer toutes les données de l'utilisateur
      const [profileRes, prefsRes, projectsRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', user.id),
        supabase.from('user_preferences').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('created_by', user.id)
      ]);

      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at
        },
        profile: profileRes.data?.[0] || {},
        preferences: prefsRes.data?.[0]?.preferences || {},
        projects: projectsRes.data || [],
        exported_at: new Date().toISOString()
      };

      // Créer et télécharger le fichier JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `momento-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      throw err instanceof Error ? err : new Error('Erreur lors de l\'export des données');
    }
  };

  // Supprimer le compte
  const deleteAccount = async (confirmText: string) => {
    if (confirmText !== 'SUPPRIMER') {
      throw new Error('Texte de confirmation incorrect');
    }
    
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      // Supprimer toutes les données utilisateur (les cascades SQL s'occupent du reste)
      await supabase.auth.admin.deleteUser(user.id);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Erreur lors de la suppression du compte');
    }
  };

  // Charger les sessions actives (simulé pour l'instant)
  const loadSessions = async () => {
    // En attendant une vraitable implémentation de gestion des sessions
    const mockSessions: UserSession[] = [
      {
        id: 'current',
        device: 'Chrome sur macOS',
        location: 'Paris, France',
        lastActive: 'Il y a 2 minutes',
        current: true,
        userAgent: navigator.userAgent
      },
      {
        id: 'mobile',
        device: 'Safari Mobile',
        location: 'Paris, France', 
        lastActive: 'Il y a 2 heures',
        current: false,
        userAgent: 'Mobile Safari'
      }
    ];
    setSessions(mockSessions);
  };

  // Déconnecter une session
  const terminateSession = async (sessionId: string) => {
    if (sessionId === 'current') {
      await supabase.auth.signOut();
    } else {
      // Retirer la session de la liste (simulé)
      setSessions(prev => prev.filter(session => session.id !== sessionId));
    }
  };

  // Appliquer les préférences au démarrage
  useEffect(() => {
    applyTheme(preferences.theme);
    applyFontSize(preferences.fontSize);
  }, [preferences.theme, preferences.fontSize]);

  // Écouter les changements de thème système
  useEffect(() => {
    if (preferences.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [preferences.theme]);

  // Charger les données au montage
  useEffect(() => {
    if (user) {
      loadPreferences();
      loadSessions();
    }
  }, [user]);

  return {
    preferences,
    sessions,
    loading,
    saving,
    error,
    
    // Actions
    savePreferences,
    changePassword,
    exportUserData,
    deleteAccount,
    terminateSession,
    loadSessions,
    
    // Utilitaires
    applyTheme,
    applyFontSize
  };
};