import { useState, useEffect, useCallback } from 'react';

export interface Integration {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  metadata?: Record<string, any>;
  lastSync?: number;
}

interface IntegrationConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
}

interface UseIntegrationsReturn {
  integrations: Integration[];
  isLoading: boolean;
  connectIntegration: (integrationId: string) => Promise<void>;
  disconnectIntegration: (integrationId: string) => Promise<void>;
  refreshIntegration: (integrationId: string) => Promise<void>;
  getIntegrationStatus: (integrationId: string) => Integration['status'];
  isConnected: (integrationId: string) => boolean;
}

// Configuration des intégrations
const INTEGRATION_CONFIGS: Record<string, IntegrationConfig> = {
  notion: {
    clientId: 'notion-client-id', // À remplacer par votre client ID Notion
    redirectUri: `${window.location.origin}/integrations/callback/notion`,
    scopes: ['read_content', 'update_content', 'insert_content']
  },
  figma: {
    clientId: 'figma-client-id', // À remplacer par votre client ID Figma  
    redirectUri: `${window.location.origin}/integrations/callback/figma`,
    scopes: ['file_read', 'file_write']
  },
  claude: {
    clientId: 'claude-client-id', // Pour l'API Claude
    redirectUri: `${window.location.origin}/integrations/callback/claude`,
    scopes: ['api_access']
  }
};

// URLs d'autorisation OAuth pour chaque service
const OAUTH_URLS = {
  notion: 'https://api.notion.com/v1/oauth/authorize',
  figma: 'https://www.figma.com/oauth',
  claude: 'https://api.anthropic.com/oauth/authorize' // URL fictive pour la demo
};

export function useIntegrations(): UseIntegrationsReturn {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les intégrations depuis le localStorage au démarrage
  useEffect(() => {
    loadIntegrations();
  }, []);

  // Écouter les messages de la fenêtre popup OAuth
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'OAUTH_SUCCESS') {
        handleOAuthSuccess(event.data.integrationId, event.data.code);
      } else if (event.data.type === 'OAUTH_ERROR') {
        handleOAuthError(event.data.integrationId, event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadIntegrations = useCallback(() => {
    try {
      const stored = localStorage.getItem('momento_integrations');
      if (stored) {
        const parsed = JSON.parse(stored);
        setIntegrations(parsed);
      } else {
        // Initialiser avec les intégrations par défaut
        const defaultIntegrations: Integration[] = [
          {
            id: 'notion',
            name: 'Notion',
            status: 'disconnected'
          },
          {
            id: 'claude',
            name: 'Claude',
            status: 'disconnected'
          },
          {
            id: 'figma',
            name: 'Figma',
            status: 'disconnected'
          }
        ];
        setIntegrations(defaultIntegrations);
        localStorage.setItem('momento_integrations', JSON.stringify(defaultIntegrations));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des intégrations:', error);
    }
  }, []);

  const saveIntegrations = useCallback((newIntegrations: Integration[]) => {
    try {
      localStorage.setItem('momento_integrations', JSON.stringify(newIntegrations));
      setIntegrations(newIntegrations);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des intégrations:', error);
    }
  }, []);

  const connectIntegration = useCallback(async (integrationId: string) => {
    const config = INTEGRATION_CONFIGS[integrationId];
    if (!config) {
      throw new Error(`Configuration non trouvée pour ${integrationId}`);
    }

    // Mettre à jour le statut à "connecting"
    const updatedIntegrations = integrations.map(integration =>
      integration.id === integrationId
        ? { ...integration, status: 'connecting' as const }
        : integration
    );
    saveIntegrations(updatedIntegrations);

    try {
      // Pour la démo, on peut soit :
      // 1. Ouvrir une popup OAuth réelle
      // 2. Simuler une connexion
      
      if (integrationId === 'notion') {
        // Connexion Notion réelle
        await connectNotion(config);
      } else {
        // Pour Claude et Figma, simulation pour la démo
        await simulateConnection(integrationId);
      }
    } catch (error) {
      // Marquer comme erreur
      const errorIntegrations = integrations.map(integration =>
        integration.id === integrationId
          ? { ...integration, status: 'error' as const }
          : integration
      );
      saveIntegrations(errorIntegrations);
      throw error;
    }
  }, [integrations, saveIntegrations]);

  const connectNotion = async (config: IntegrationConfig) => {
    return new Promise<void>((resolve, reject) => {
      // Construction de l'URL d'autorisation Notion
      const authUrl = new URL(OAUTH_URLS.notion);
      authUrl.searchParams.append('client_id', config.clientId);
      authUrl.searchParams.append('redirect_uri', config.redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('owner', 'user');
      
      // Pour la démo, on simule le processus
      setTimeout(() => {
        const mockToken = 'notion_demo_token_' + Date.now();
        handleOAuthSuccess('notion', 'demo_auth_code');
        resolve();
      }, 2000);

      // En production, ouvrir une popup :
      // const popup = window.open(authUrl.toString(), 'notion-auth', 'width=600,height=700');
      // const checkClosed = setInterval(() => {
      //   if (popup?.closed) {
      //     clearInterval(checkClosed);
      //     reject(new Error('Popup fermée par l\'utilisateur'));
      //   }
      // }, 1000);
    });
  };

  const simulateConnection = async (integrationId: string) => {
    // Simulation d'une connexion pour la démo
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockToken = `${integrationId}_demo_token_${Date.now()}`;
    handleOAuthSuccess(integrationId, 'demo_auth_code');
  };

  const handleOAuthSuccess = useCallback((integrationId: string, authCode: string) => {
    // En production, échanger le code contre un token
    // Pour la démo, on simule un token
    const mockToken = `${integrationId}_access_token_${Date.now()}`;
    
    const updatedIntegrations = integrations.map(integration =>
      integration.id === integrationId
        ? {
            ...integration,
            status: 'connected' as const,
            accessToken: mockToken,
            expiresAt: Date.now() + (3600 * 1000), // Expire dans 1h
            lastSync: Date.now(),
            metadata: {
              connectedAt: new Date().toISOString(),
              workspace: integrationId === 'notion' ? 'Mon Workspace' : undefined
            }
          }
        : integration
    );
    
    saveIntegrations(updatedIntegrations);
  }, [integrations, saveIntegrations]);

  const handleOAuthError = useCallback((integrationId: string, error: string) => {
    const updatedIntegrations = integrations.map(integration =>
      integration.id === integrationId
        ? { ...integration, status: 'error' as const }
        : integration
    );
    saveIntegrations(updatedIntegrations);
  }, [integrations, saveIntegrations]);

  const disconnectIntegration = useCallback(async (integrationId: string) => {
    const updatedIntegrations = integrations.map(integration =>
      integration.id === integrationId
        ? {
            ...integration,
            status: 'disconnected' as const,
            accessToken: undefined,
            refreshToken: undefined,
            expiresAt: undefined,
            metadata: undefined,
            lastSync: undefined
          }
        : integration
    );
    
    saveIntegrations(updatedIntegrations);
  }, [integrations, saveIntegrations]);

  const refreshIntegration = useCallback(async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration?.refreshToken) {
      throw new Error('Token de rafraîchissement non disponible');
    }

    // En production, utiliser le refresh token pour obtenir un nouveau access token
    // Pour la démo, on simule
    const newToken = `${integrationId}_refreshed_token_${Date.now()}`;
    
    const updatedIntegrations = integrations.map(i =>
      i.id === integrationId
        ? {
            ...i,
            accessToken: newToken,
            expiresAt: Date.now() + (3600 * 1000),
            lastSync: Date.now()
          }
        : i
    );
    
    saveIntegrations(updatedIntegrations);
  }, [integrations, saveIntegrations]);

  const getIntegrationStatus = useCallback((integrationId: string): Integration['status'] => {
    const integration = integrations.find(i => i.id === integrationId);
    return integration?.status || 'disconnected';
  }, [integrations]);

  const isConnected = useCallback((integrationId: string): boolean => {
    return getIntegrationStatus(integrationId) === 'connected';
  }, [getIntegrationStatus]);

  return {
    integrations,
    isLoading,
    connectIntegration,
    disconnectIntegration,
    refreshIntegration,
    getIntegrationStatus,
    isConnected
  };
}