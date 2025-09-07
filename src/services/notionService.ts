import { supabase } from '../utils/supabase/client';

// Configuration Notion OAuth
const NOTION_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID || 'demo-client-id',
  clientSecret: process.env.NOTION_CLIENT_SECRET || 'demo-client-secret',
  redirectUri: `${window.location.origin}/integrations/callback/notion`,
  authUrl: 'https://api.notion.com/v1/oauth/authorize',
  tokenUrl: 'https://api.notion.com/v1/oauth/token'
};

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
  properties: Record<string, any>;
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

export interface NotionWorkspace {
  name: string;
  icon: string;
  id: string;
}

export class NotionService {
  private accessToken: string | null = null;

  constructor() {
    this.loadAccessToken();
  }

  // Charger le token depuis Supabase
  private async loadAccessToken() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_integrations')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('integration_type', 'notion')
        .eq('status', 'connected')
        .single();

      this.accessToken = data?.access_token || null;
    } catch (error) {
      console.error('Erreur lors du chargement du token Notion:', error);
    }
  }

  // Initialiser l'authentification OAuth
  public initiateOAuth(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
    return new Promise((resolve) => {
      try {
        const state = this.generateState();
        localStorage.setItem('notion_oauth_state', state);

        const params = new URLSearchParams({
          client_id: NOTION_CONFIG.clientId,
          response_type: 'code',
          owner: 'user',
          redirect_uri: NOTION_CONFIG.redirectUri,
          state: state
        });

        const authUrl = `${NOTION_CONFIG.authUrl}?${params.toString()}`;

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
            this.handleOAuthCallback(event.data.code, event.data.state)
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

        resolve({ success: true, authUrl });
      } catch (error: any) {
        resolve({ success: false, error: error.message });
      }
    });
  }

  // Gérer le callback OAuth
  private async handleOAuthCallback(code: string, state: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Vérifier le state
      const savedState = localStorage.getItem('notion_oauth_state');
      if (state !== savedState) {
        throw new Error('State mismatch - possible CSRF attack');
      }

      // Échanger le code contre un access token
      const tokenResponse = await this.exchangeCodeForToken(code);
      
      if (!tokenResponse.access_token) {
        throw new Error('No access token received');
      }

      this.accessToken = tokenResponse.access_token;

      // Sauvegarder dans Supabase
      await this.saveTokenToSupabase(tokenResponse);

      // Nettoyer le localStorage
      localStorage.removeItem('notion_oauth_state');

      return { success: true };
    } catch (error: any) {
      console.error('Erreur OAuth callback:', error);
      return { success: false, error: error.message };
    }
  }

  // Échanger le code contre un token
  private async exchangeCodeForToken(code: string) {
    const response = await fetch(NOTION_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${NOTION_CONFIG.clientId}:${NOTION_CONFIG.clientSecret}`)}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: NOTION_CONFIG.redirectUri
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
    }

    return await response.json();
  }

  // Sauvegarder le token dans Supabase
  private async saveTokenToSupabase(tokenData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_integrations')
      .update({
        status: 'connected',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_in ? 
          new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
        metadata: {
          workspace_name: tokenData.workspace_name,
          workspace_icon: tokenData.workspace_icon,
          workspace_id: tokenData.workspace_id,
          bot_id: tokenData.bot_id,
          owner: tokenData.owner,
          connectedAt: new Date().toISOString()
        },
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('integration_type', 'notion');

    if (error) throw error;
  }

  // Générer un state aléatoire pour OAuth
  private generateState(): string {
    return btoa(crypto.getRandomValues(new Uint8Array(32)).toString());
  }

  // Vérifier si l'utilisateur est connecté
  public async isConnected(): Promise<boolean> {
    if (!this.accessToken) {
      await this.loadAccessToken();
    }
    return !!this.accessToken;
  }

  // Faire une requête à l'API Notion
  private async makeNotionRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) {
      await this.loadAccessToken();
      if (!this.accessToken) {
        throw new Error('Not connected to Notion');
      }
    }

    const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expiré, déconnecter l'utilisateur
        await this.disconnect();
        throw new Error('Notion token expired - please reconnect');
      }
      
      const error = await response.json();
      throw new Error(`Notion API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  // Récupérer toutes les pages accessibles
  public async getPages(): Promise<NotionPage[]> {
    try {
      const response = await this.makeNotionRequest('/search', {
        method: 'POST',
        body: JSON.stringify({
          filter: {
            property: 'object',
            value: 'page'
          },
          sort: {
            direction: 'descending',
            timestamp: 'last_edited_time'
          }
        })
      });

      return response.results.map((page: any) => this.formatPage(page));
    } catch (error: any) {
      console.error('Erreur lors de la récupération des pages:', error);
      throw error;
    }
  }

  // Récupérer les databases
  public async getDatabases(): Promise<NotionDatabase[]> {
    try {
      const response = await this.makeNotionRequest('/search', {
        method: 'POST',
        body: JSON.stringify({
          filter: {
            property: 'object',
            value: 'database'
          },
          sort: {
            direction: 'descending',
            timestamp: 'last_edited_time'
          }
        })
      });

      return response.results.map((db: any) => this.formatDatabase(db));
    } catch (error: any) {
      console.error('Erreur lors de la récupération des databases:', error);
      throw error;
    }
  }

  // Récupérer le contenu d'une page
  public async getPageContent(pageId: string): Promise<any> {
    try {
      // Récupérer les métadonnées de la page
      const page = await this.makeNotionRequest(`/pages/${pageId}`);
      
      // Récupérer les blocs de contenu
      const blocks = await this.makeNotionRequest(`/blocks/${pageId}/children`);

      return {
        page: this.formatPage(page),
        blocks: blocks.results,
        content: this.extractTextContent(blocks.results)
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération du contenu:', error);
      throw error;
    }
  }

  // Créer une nouvelle page
  public async createPage(parentId: string, title: string, content?: any): Promise<NotionPage> {
    try {
      const pageData = {
        parent: { page_id: parentId },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: title
                }
              }
            ]
          }
        },
        children: content ? [content] : []
      };

      const response = await this.makeNotionRequest('/pages', {
        method: 'POST',
        body: JSON.stringify(pageData)
      });

      return this.formatPage(response);
    } catch (error: any) {
      console.error('Erreur lors de la création de la page:', error);
      throw error;
    }
  }

  // Mettre à jour le contenu d'une page
  public async updatePageContent(pageId: string, blocks: any[]): Promise<void> {
    try {
      // Supprimer tous les blocs existants
      const existingBlocks = await this.makeNotionRequest(`/blocks/${pageId}/children`);
      
      for (const block of existingBlocks.results) {
        await this.makeNotionRequest(`/blocks/${block.id}`, {
          method: 'DELETE'
        });
      }

      // Ajouter les nouveaux blocs
      if (blocks.length > 0) {
        await this.makeNotionRequest(`/blocks/${pageId}/children`, {
          method: 'PATCH',
          body: JSON.stringify({
            children: blocks
          })
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du contenu:', error);
      throw error;
    }
  }

  // Déconnecter l'utilisateur
  public async disconnect(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_integrations')
        .update({
          status: 'disconnected',
          access_token: null,
          refresh_token: null,
          expires_at: null,
          metadata: {},
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('integration_type', 'notion');

      this.accessToken = null;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }

  // Formater une page Notion
  private formatPage(page: any): NotionPage {
    const title = this.extractTitle(page.properties);
    
    return {
      id: page.id,
      title: title || 'Sans titre',
      url: page.url,
      icon: page.icon,
      parent: page.parent,
      properties: page.properties,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time
    };
  }

  // Formater une database Notion
  private formatDatabase(db: any): NotionDatabase {
    const title = this.extractTitle(db.title);
    
    return {
      id: db.id,
      title: title || 'Sans titre',
      description: db.description?.[0]?.plain_text,
      properties: db.properties,
      url: db.url,
      icon: db.icon,
      created_time: db.created_time,
      last_edited_time: db.last_edited_time
    };
  }

  // Extraire le titre d'une propriété Notion
  private extractTitle(titleProperty: any): string {
    if (Array.isArray(titleProperty)) {
      return titleProperty.map(t => t.plain_text).join('');
    }
    
    if (titleProperty?.title) {
      return titleProperty.title.map((t: any) => t.plain_text).join('');
    }
    
    return '';
  }

  // Extraire le contenu textuel des blocs
  private extractTextContent(blocks: any[]): string {
    return blocks.map(block => {
      switch (block.type) {
        case 'paragraph':
          return block.paragraph.rich_text.map((t: any) => t.plain_text).join('');
        case 'heading_1':
          return `# ${block.heading_1.rich_text.map((t: any) => t.plain_text).join('')}`;
        case 'heading_2':
          return `## ${block.heading_2.rich_text.map((t: any) => t.plain_text).join('')}`;
        case 'heading_3':
          return `### ${block.heading_3.rich_text.map((t: any) => t.plain_text).join('')}`;
        case 'bulleted_list_item':
          return `• ${block.bulleted_list_item.rich_text.map((t: any) => t.plain_text).join('')}`;
        case 'numbered_list_item':
          return `1. ${block.numbered_list_item.rich_text.map((t: any) => t.plain_text).join('')}`;
        default:
          return '';
      }
    }).filter(Boolean).join('\n\n');
  }
}

// Instance singleton
export const notionService = new NotionService();