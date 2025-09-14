// Service unifié ultra-sécurisé pour toutes les intégrations
import { supabase } from '../utils/supabase/client';

// Types pour le service unifié
export interface IntegrationRequest {
  integration: 'figma' | 'claude' | 'notion';
  operation: string;
  config: Record<string, any>;
  input?: any;
}

export interface IntegrationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    operation: string;
    integration: string;
    timestamp: string;
    usage?: any;
  };
}

export interface IntegrationStatus {
  figma: { connected: boolean; lastSync?: string; workspace?: string };
  claude: { connected: boolean; lastSync?: string; workspace?: string };
  notion: { connected: boolean; lastSync?: string; workspace?: string };
}

// Types spécifiques par intégration
export interface FigmaFile {
  key: string;
  name: string;
  version: string;
  lastModified: string;
  thumbnailUrl?: string;
}

export interface FigmaFrame {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
}

export interface ClaudeResponse {
  id: string;
  content: string;
  model: string;
}

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  lastEdited: string;
}

class SecureIntegrationsService {
  private baseUrl: string;

  constructor() {
    // URL de la fonction Edge unifiée
    this.baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/integrations-api`;
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

  // Exécuter une opération d'intégration de manière sécurisée
  async execute<T = any>(request: IntegrationRequest): Promise<IntegrationResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return result;
    } catch (error: any) {
      console.error(`Erreur intégration ${request.integration}:`, error);
      throw new Error(error.message || 'Erreur lors de l\'exécution');
    }
  }

  // Obtenir le statut de toutes les intégrations
  async getIntegrationsStatus(): Promise<IntegrationStatus> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.status;
    } catch (error: any) {
      console.error('Erreur statut intégrations:', error);
      // Retourner un statut par défaut en cas d'erreur
      return {
        figma: { connected: false },
        claude: { connected: false },
        notion: { connected: false }
      };
    }
  }

  // Déconnecter une intégration
  async disconnectIntegration(integration: 'figma' | 'claude' | 'notion'): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/${integration}/disconnect`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error(`Erreur déconnexion ${integration}:`, error);
      throw error;
    }
  }

  // ==========================================================================
  // MÉTHODES FIGMA SÉCURISÉES
  // ==========================================================================

  async figma_getFile(fileKey: string): Promise<FigmaFile> {
    const response = await this.execute<FigmaFile>({
      integration: 'figma',
      operation: 'get_file',
      config: { fileKey }
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération du fichier Figma');
    }

    return response.data;
  }

  async figma_getFrames(fileKey: string): Promise<FigmaFrame[]> {
    const response = await this.execute<{ frames: FigmaFrame[] }>({
      integration: 'figma',
      operation: 'get_frames',
      config: { fileKey }
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des frames');
    }

    return response.data.frames;
  }

  async figma_exportFrames(
    fileKey: string, 
    nodeIds: string[], 
    format: string = 'PNG', 
    scale: number = 1
  ): Promise<Record<string, string>> {
    const response = await this.execute<{ images: Record<string, string> }>({
      integration: 'figma',
      operation: 'export_frames',
      config: { fileKey, nodeIds, format, scale }
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de l\'export des frames');
    }

    return response.data.images;
  }

  async figma_getComments(fileKey: string): Promise<any[]> {
    const response = await this.execute<{ comments: any[] }>({
      integration: 'figma',
      operation: 'get_comments',
      config: { fileKey }
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des commentaires');
    }

    return response.data.comments;
  }

  async figma_postComment(fileKey: string, message: string, position?: { x: number, y: number }): Promise<any> {
    const response = await this.execute({
      integration: 'figma',
      operation: 'post_comment',
      config: { fileKey, position },
      input: message
    });

    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de l\'ajout du commentaire');
    }

    return response.data;
  }

  // ==========================================================================
  // MÉTHODES CLAUDE SÉCURISÉES
  // ==========================================================================

  async claude_generateText(
    prompt: string, 
    input?: string, 
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<ClaudeResponse> {
    const response = await this.execute<ClaudeResponse>({
      integration: 'claude',
      operation: 'generate_text',
      config: {
        prompt,
        model: options?.model || 'claude-3-sonnet-20240229',
        maxTokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7
      },
      input
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la génération de texte');
    }

    return response.data;
  }

  async claude_analyzeContent(content: string): Promise<string> {
    const response = await this.execute<{ analysis: string }>({
      integration: 'claude',
      operation: 'analyze_content',
      config: {},
      input: content
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de l\'analyse du contenu');
    }

    return response.data.analysis;
  }

  async claude_summarize(content: string, maxLength?: number): Promise<string> {
    const response = await this.execute<{ summary: string }>({
      integration: 'claude',
      operation: 'summarize',
      config: { maxLength: maxLength || 200 },
      input: content
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors du résumé');
    }

    return response.data.summary;
  }

  // ==========================================================================
  // MÉTHODES NOTION SÉCURISÉES
  // ==========================================================================

  async notion_getPages(): Promise<NotionPage[]> {
    const response = await this.execute<{ pages: NotionPage[] }>({
      integration: 'notion',
      operation: 'get_pages',
      config: {}
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des pages Notion');
    }

    return response.data.pages;
  }

  async notion_getPageContent(pageId: string): Promise<{
    page: NotionPage;
    blocks: any[];
    content: string;
  }> {
    const response = await this.execute<{
      page: NotionPage;
      blocks: any[];
      content: string;
    }>({
      integration: 'notion',
      operation: 'get_page_content',
      config: { pageId }
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération du contenu');
    }

    return response.data;
  }

  // ==========================================================================
  // MÉTHODES UTILITAIRES
  // ==========================================================================

  // Tester la connexion au service
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/test`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Vérifier si une intégration spécifique est connectée
  async isIntegrationConnected(integration: 'figma' | 'claude' | 'notion'): Promise<boolean> {
    try {
      const status = await this.getIntegrationsStatus();
      return status[integration].connected;
    } catch {
      return false;
    }
  }

  // Gestion d'erreurs centralisée
  private handleError(error: any, context: string): never {
    console.error(`Erreur ${context}:`, error);
    
    if (error.message?.includes('Non authentifié')) {
      // Rediriger vers la page de connexion
      window.location.href = '/login';
    }
    
    throw error;
  }
}

// Instance singleton
export const secureIntegrationsService = new SecureIntegrationsService();

// Export par défaut pour compatibilité
export default secureIntegrationsService;