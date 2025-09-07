import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { useAuthContext } from './useAuth';

export interface Integration {
  id: string;
  user_id: string;
  integration_type: string; // 'notion', 'claude', 'figma'
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

interface IntegrationConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

interface UseSupabaseIntegrationsReturn {
  integrations: Integration[];
  isLoading: boolean;
  error: string | null;
  connectIntegration: (integrationId: string) => Promise<void>;
  disconnectIntegration: (integrationId: string) => Promise<void>;
  refreshIntegration: (integrationId: string) => Promise<void>;
  getIntegrationStatus: (integrationId: string) => Integration['status'];
  isConnected: (integrationId: string) => boolean;
  createIntegrationsTable: () => Promise<void>;
}

// Configuration des intégrations
const INTEGRATION_CONFIGS: Record<string, IntegrationConfig> = {
  notion: {
    clientId: 'notion-client-id',
    redirectUri: `${window.location.origin}/integrations/callback/notion`,
    scopes: ['read_content', 'update_content', 'insert_content']
  },
  figma: {
    clientId: 'figma-client-id',
    redirectUri: `${window.location.origin}/integrations/callback/figma`,
    scopes: ['file_read', 'file_write']
  },
  claude: {
    clientId: 'claude-client-id',
    redirectUri: `${window.location.origin}/integrations/callback/claude`,
    scopes: ['api_access']
  }
};

export function useSupabaseIntegrations(): UseSupabaseIntegrationsReturn {
  const { user } = useAuthContext();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les intégrations depuis Supabase
  const loadIntegrations = useCallback(async () => {
    if (!user) {
      setIntegrations([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        // Si la table n'existe pas, on la crée
        if (supabaseError.code === '42P01') { // Table doesn't exist
          console.log('Table user_integrations n\'existe pas, création...');
          await createIntegrationsTable();
          // Réessayer après création
          const { data: retryData, error: retryError } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', user.id);
          
          if (retryError) throw retryError;
          setIntegrations(retryData || []);
        } else {
          throw supabaseError;
        }
      } else {
        setIntegrations(data || []);
      }

      // S'il n'y a pas d'intégrations, créer les entrées par défaut
      if (!data || data.length === 0) {
        await initializeDefaultIntegrations();
      }

    } catch (err: any) {
      console.error('Erreur lors du chargement des intégrations:', err);
      setError(err.message);
      // Fallback vers localStorage si Supabase échoue
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fallback vers localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('momento_integrations');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convertir le format localStorage vers le format Supabase
        const supabaseFormat = parsed.map((integration: any) => ({
          id: integration.id,
          user_id: user?.id || 'local',
          integration_type: integration.id,
          status: integration.status,
          access_token: integration.accessToken,
          refresh_token: integration.refreshToken,
          expires_at: integration.expiresAt ? new Date(integration.expiresAt).toISOString() : null,
          metadata: integration.metadata,
          last_sync: integration.lastSync ? new Date(integration.lastSync).toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        setIntegrations(supabaseFormat);
      }
    } catch (error) {
      console.error('Erreur lors du chargement depuis localStorage:', error);
    }
  }, [user]);

  // Créer la table des intégrations si elle n'existe pas
  const createIntegrationsTable = useCallback(async () => {
    try {
      // Note: En production, cette table devrait être créée via les migrations Supabase
      // Ici c'est juste pour le développement
      const { error } = await supabase.rpc('create_user_integrations_table');
      
      if (error && !error.message.includes('already exists')) {
        console.error('Erreur lors de la création de la table:', error);
        
        // Alternative: utiliser SQL direct (nécessite des permissions admin)
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS user_integrations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            integration_type TEXT NOT NULL,
            status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'connecting')),
            access_token TEXT,
            refresh_token TEXT,
            expires_at TIMESTAMPTZ,
            metadata JSONB DEFAULT '{}',
            last_sync TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, integration_type)
          );
          
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ language 'plpgsql';
          
          DROP TRIGGER IF EXISTS update_user_integrations_updated_at ON user_integrations;
          CREATE TRIGGER update_user_integrations_updated_at
            BEFORE UPDATE ON user_integrations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        `;
        
        // Pour le moment, nous allons continuer avec localStorage
        console.log('Utilisation du localStorage en fallback');
      }
    } catch (error) {
      console.error('Erreur lors de la création de la table:', error);
    }
  }, []);

  // Initialiser les intégrations par défaut
  const initializeDefaultIntegrations = useCallback(async () => {
    if (!user) return;

    const defaultIntegrations = [
      { integration_type: 'notion', status: 'disconnected' },
      { integration_type: 'claude', status: 'disconnected' },
      { integration_type: 'figma', status: 'disconnected' }
    ];

    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .upsert(
          defaultIntegrations.map(integration => ({
            user_id: user.id,
            integration_type: integration.integration_type,
            status: integration.status,
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'user_id,integration_type' }
        )
        .select();

      if (error) throw error;
      if (data) setIntegrations(data);
    } catch (err) {
      console.error('Erreur lors de l\'initialisation:', err);
    }
  }, [user]);

  // Connecter une intégration
  const connectIntegration = useCallback(async (integrationId: string) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    const config = INTEGRATION_CONFIGS[integrationId];
    if (!config) {
      throw new Error(`Configuration non trouvée pour ${integrationId}`);
    }

    // Mettre à jour le statut à "connecting"
    try {
      const { error } = await supabase
        .from('user_integrations')
        .update({ 
          status: 'connecting',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('integration_type', integrationId);

      if (error) throw error;

      // Recharger les intégrations
      await loadIntegrations();

      // Simuler la connexion (en production, faire l'OAuth réel)
      await simulateConnection(integrationId);

    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      
      // Marquer comme erreur
      await supabase
        .from('user_integrations')
        .update({ 
          status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('integration_type', integrationId);

      await loadIntegrations();
      throw error;
    }
  }, [user, loadIntegrations]);

  // Simuler la connexion
  const simulateConnection = async (integrationId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockToken = `${integrationId}_access_token_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    
    const { error } = await supabase
      .from('user_integrations')
      .update({
        status: 'connected',
        access_token: mockToken,
        expires_at: expiresAt,
        last_sync: new Date().toISOString(),
        metadata: {
          connectedAt: new Date().toISOString(),
          workspace: integrationId === 'notion' ? 'Mon Workspace' : undefined
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user!.id)
      .eq('integration_type', integrationId);

    if (error) throw error;
    await loadIntegrations();
  };

  // Déconnecter une intégration
  const disconnectIntegration = useCallback(async (integrationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_integrations')
        .update({
          status: 'disconnected',
          access_token: null,
          refresh_token: null,
          expires_at: null,
          metadata: {},
          last_sync: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('integration_type', integrationId);

      if (error) throw error;
      await loadIntegrations();
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error);
      setError(error.message);
    }
  }, [user, loadIntegrations]);

  // Rafraîchir une intégration
  const refreshIntegration = useCallback(async (integrationId: string) => {
    if (!user) return;

    const integration = integrations.find(i => i.integration_type === integrationId);
    if (!integration?.refresh_token) {
      throw new Error('Token de rafraîchissement non disponible');
    }

    const newToken = `${integrationId}_refreshed_token_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    try {
      const { error } = await supabase
        .from('user_integrations')
        .update({
          access_token: newToken,
          expires_at: expiresAt,
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('integration_type', integrationId);

      if (error) throw error;
      await loadIntegrations();
    } catch (error: any) {
      console.error('Erreur lors du rafraîchissement:', error);
      setError(error.message);
    }
  }, [user, integrations, loadIntegrations]);

  // Obtenir le statut d'une intégration
  const getIntegrationStatus = useCallback((integrationId: string): Integration['status'] => {
    const integration = integrations.find(i => i.integration_type === integrationId);
    return integration?.status || 'disconnected';
  }, [integrations]);

  // Vérifier si une intégration est connectée
  const isConnected = useCallback((integrationId: string): boolean => {
    return getIntegrationStatus(integrationId) === 'connected';
  }, [getIntegrationStatus]);

  // Charger les intégrations au montage et quand l'utilisateur change
  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_integrations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_integrations',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadIntegrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadIntegrations]);

  return {
    integrations,
    isLoading,
    error,
    connectIntegration,
    disconnectIntegration,
    refreshIntegration,
    getIntegrationStatus,
    isConnected,
    createIntegrationsTable
  };
}