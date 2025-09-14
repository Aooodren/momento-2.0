// Service Notion sécurisé - utilise uniquement les APIs backend
import { supabase } from '../utils/supabase/client';

// Types pour l'API Notion sécurisée
export interface NotionPage {
  id: string;
  title: string;
  url: string;
  icon?: {
    type: 'emoji' | 'external' | 'file';
    emoji?: string;
    external?: { url: string };
    file?: { url: string };
  };
  parent: {
    type: string;
    database_id?: string;
    page_id?: string;
    workspace?: boolean;
  };
  created_time: string;
  last_edited_time: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  description?: string;
  properties: Record<string, any>;
  url: string;
  icon?: NotionPage['icon'];
  created_time: string;
  last_edited_time: string;
}

export interface NotionPageContent {
  page: NotionPage;
  blocks: any[];
  content: string;
}

export interface NotionAuthStatus {
  connected: boolean;
  workspace?: string;
  lastSync?: string;
}

class SecureNotionService {
  private baseUrl: string;

  constructor() {
    // URL de la fonction Edge Supabase
    this.baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notion-api`;
  }

  // Obtenir les headers d'authentification
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Non authentifié');
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  // Faire un appel sécurisé à l'API backend
  private async makeSecureRequest(endpoint: string, options: RequestInit = {}) {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  // Vérifier le statut de connexion Notion
  async isConnected(): Promise<boolean> {
    try {
      const status = await this.getConnectionStatus();
      return status.connected;
    } catch {
      return false;
    }
  }

  // Obtenir le statut détaillé de connexion
  async getConnectionStatus(): Promise<NotionAuthStatus> {
    const result = await this.makeSecureRequest('/auth/status');
    return {
      connected: result.connected,
      workspace: result.workspace,
      lastSync: result.lastSync
    };
  }

  // Initier l'authentification OAuth
  async initiateOAuth(): Promise<{ authUrl: string; state: string }> {
    const result = await this.makeSecureRequest('/auth/initiate', {
      method: 'POST'
    });
    
    return {
      authUrl: result.authUrl,
      state: result.state
    };
  }

  // Gérer le callback OAuth
  async handleOAuthCallback(code: string, state: string): Promise<{ success: boolean; workspace?: string }> {
    const result = await this.makeSecureRequest('/auth/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state })
    });
    
    return {
      success: result.success,
      workspace: result.workspace
    };
  }

  // Déconnecter l'utilisateur
  async disconnect(): Promise<void> {
    await this.makeSecureRequest('/auth/disconnect', {
      method: 'DELETE'
    });
  }

  // Récupérer toutes les pages accessibles
  async getPages(): Promise<NotionPage[]> {
    const result = await this.makeSecureRequest('/pages');
    return result.pages;
  }

  // Récupérer les databases
  async getDatabases(): Promise<NotionDatabase[]> {
    const result = await this.makeSecureRequest('/databases');
    return result.databases;
  }

  // Récupérer le contenu d'une page
  async getPageContent(pageId: string): Promise<NotionPageContent> {
    const result = await this.makeSecureRequest(`/pages/${pageId}`);
    return {
      page: result.page,
      blocks: result.blocks,
      content: result.content
    };
  }

  // Créer une nouvelle page
  async createPage(parentId: string, title: string, content?: any[]): Promise<NotionPage> {
    const result = await this.makeSecureRequest('/pages', {
      method: 'POST',
      body: JSON.stringify({
        parentId,
        title,
        content
      })
    });
    
    return result.page;
  }

  // Mettre à jour le contenu d'une page
  async updatePageContent(pageId: string, blocks: any[]): Promise<void> {
    await this.makeSecureRequest(`/pages/${pageId}/content`, {
      method: 'PUT',
      body: JSON.stringify({ blocks })
    });
  }

  // Méthodes utilitaires pour l'interface utilisateur

  // Ouvrir une popup OAuth sécurisée
  async openOAuthPopup(): Promise<{ success: boolean; workspace?: string; error?: string }> {
    return new Promise(async (resolve) => {
      try {
        const { authUrl, state } = await this.initiateOAuth();
        
        // Ouvrir la popup OAuth
        const popup = window.open(
          authUrl,
          'notion-oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Écouter les messages de la popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === 'NOTION_OAUTH_SUCCESS') {
            window.removeEventListener('message', messageListener);
            popup?.close();
            
            this.handleOAuthCallback(event.data.code, state)
              .then((result) => resolve(result))
              .catch((error) => resolve({ success: false, error: error.message }));
              
          } else if (event.data.type === 'NOTION_OAUTH_ERROR') {
            window.removeEventListener('message', messageListener);
            popup?.close();
            resolve({ success: false, error: event.data.error });
          }
        };

        window.addEventListener('message', messageListener);

        // Vérifier si la popup a été fermée manuellement
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            resolve({ success: false, error: 'Popup fermée par l\'utilisateur' });
          }
        }, 1000);

      } catch (error: any) {
        resolve({ success: false, error: error.message });
      }
    });
  }

  // Gestion d'erreurs centralisée
  private handleError(error: any): never {
    console.error('Erreur SecureNotionService:', error);
    
    if (error.message?.includes('Non authentifié')) {
      // Rediriger vers la page de connexion ou rafraîchir le token
      window.location.href = '/login';
    }
    
    throw error;
  }
}

// Instance singleton
export const secureNotionService = new SecureNotionService();

// Export par défaut pour compatibilité
export default secureNotionService;