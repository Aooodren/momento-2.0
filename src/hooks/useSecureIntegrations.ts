// Hook unifié ultra-sécurisé pour toutes les intégrations
import { useState, useCallback, useEffect } from 'react';
import { 
  secureIntegrationsService, 
  IntegrationStatus,
  FigmaFile,
  FigmaFrame,
  ClaudeResponse,
  NotionPage
} from '../services/secureIntegrationsService';

// Interface pour l'état du hook
interface IntegrationsState {
  isLoading: boolean;
  error: string | null;
  status: IntegrationStatus;
}

// Type pour les opérations disponibles
type IntegrationOperation = {
  integration: 'figma' | 'claude' | 'notion';
  operation: string;
  config: Record<string, any>;
  input?: any;
};

export function useSecureIntegrations() {
  const [state, setState] = useState<IntegrationsState>({
    isLoading: false,
    error: null,
    status: {
      figma: { connected: false },
      claude: { connected: false },
      notion: { connected: false }
    }
  });

  // Mettre à jour l'état de manière sécurisée
  const updateState = useCallback((updates: Partial<IntegrationsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Charger le statut des intégrations
  const loadStatus = useCallback(async () => {
    updateState({ isLoading: true, error: null });
    
    try {
      const status = await secureIntegrationsService.getIntegrationsStatus();
      updateState({ status, isLoading: false });
    } catch (error: any) {
      console.error('Erreur chargement statut:', error);
      updateState({ 
        error: 'Impossible de charger le statut des intégrations',
        isLoading: false 
      });
    }
  }, [updateState]);

  // Exécuter une opération d'intégration
  const executeOperation = useCallback(async <T = any>(
    operation: IntegrationOperation
  ): Promise<T> => {
    updateState({ isLoading: true, error: null });
    
    try {
      const response = await secureIntegrationsService.execute<T>(operation);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de l\'exécution');
      }
      
      updateState({ isLoading: false });
      return response.data as T;
    } catch (error: any) {
      console.error(`Erreur opération ${operation.integration}:`, error);
      updateState({ 
        error: error.message || 'Erreur lors de l\'opération',
        isLoading: false 
      });
      throw error;
    }
  }, [updateState]);

  // Déconnecter une intégration
  const disconnectIntegration = useCallback(async (integration: 'figma' | 'claude' | 'notion') => {
    updateState({ isLoading: true, error: null });
    
    try {
      await secureIntegrationsService.disconnectIntegration(integration);
      await loadStatus(); // Recharger le statut
      updateState({ isLoading: false });
    } catch (error: any) {
      console.error(`Erreur déconnexion ${integration}:`, error);
      updateState({ 
        error: `Impossible de déconnecter ${integration}`,
        isLoading: false 
      });
    }
  }, [updateState, loadStatus]);

  // ==========================================================================
  // MÉTHODES FIGMA SIMPLIFIÉES
  // ==========================================================================

  const figma = {
    async getFile(fileKey: string): Promise<FigmaFile> {
      return executeOperation({
        integration: 'figma',
        operation: 'get_file',
        config: { fileKey }
      });
    },

    async getFrames(fileKey: string): Promise<FigmaFrame[]> {
      const result = await executeOperation<{ frames: FigmaFrame[] }>({
        integration: 'figma',
        operation: 'get_frames',
        config: { fileKey }
      });
      return result.frames;
    },

    async exportFrames(fileKey: string, nodeIds: string[], format = 'PNG', scale = 1): Promise<Array<{id: string, url: string}>> {
      const result = await executeOperation<{ exports: Array<{id: string, url: string}> }>({
        integration: 'figma',
        operation: 'export_frames',
        config: { fileKey, nodeIds, format, scale }
      });
      return result.exports;
    },

    async getComments(fileKey: string): Promise<any[]> {
      const result = await executeOperation<{ comments: any[] }>({
        integration: 'figma',
        operation: 'get_comments',
        config: { fileKey }
      });
      return result.comments;
    },

    async postComment(fileKey: string, message: string, position?: { x: number, y: number }): Promise<any> {
      return executeOperation({
        integration: 'figma',
        operation: 'post_comment',
        config: { fileKey, message, position }
      });
    },

    async analyzeDesign(fileKey: string, context?: string): Promise<{ analysis: string }> {
      return executeOperation({
        integration: 'figma',
        operation: 'analyze_design',
        config: { fileKey },
        input: context
      });
    }
  };

  // ==========================================================================
  // MÉTHODES CLAUDE SIMPLIFIÉES
  // ==========================================================================

  const claude = {
    async generateText(prompt: string, context?: string, options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }): Promise<ClaudeResponse> {
      return executeOperation({
        integration: 'claude',
        operation: 'generate_text',
        config: {
          prompt,
          model: options?.model,
          maxTokens: options?.maxTokens,
          temperature: options?.temperature
        },
        input: context
      });
    },

    async analyzeContent(content: string): Promise<{ analysis: string }> {
      return executeOperation({
        integration: 'claude',
        operation: 'analyze_content',
        config: {},
        input: content
      });
    },

    async summarize(content: string, maxLength = 200): Promise<{ summary: string }> {
      return executeOperation({
        integration: 'claude',
        operation: 'summarize',
        config: { maxLength },
        input: content
      });
    },

    async extractInsights(content: string): Promise<{ insights: string[] }> {
      return executeOperation({
        integration: 'claude',
        operation: 'extract_insights',
        config: {},
        input: content
      });
    },

    async generateIdeas(topic: string, context?: string, additionalInfo?: string): Promise<{ ideas: string[] }> {
      return executeOperation({
        integration: 'claude',
        operation: 'generate_ideas',
        config: { topic, context },
        input: additionalInfo
      });
    },

    async improveText(text: string, style = 'professional'): Promise<{ improvedText: string }> {
      return executeOperation({
        integration: 'claude',
        operation: 'improve_text',
        config: { style },
        input: text
      });
    },

    async translate(text: string, targetLanguage: string): Promise<{ translatedText: string }> {
      return executeOperation({
        integration: 'claude',
        operation: 'translate',
        config: { targetLanguage },
        input: text
      });
    },

    async answerQuestion(question: string, context?: string): Promise<{ answer: string }> {
      return executeOperation({
        integration: 'claude',
        operation: 'answer_question',
        config: { question },
        input: context
      });
    }
  };

  // ==========================================================================
  // MÉTHODES NOTION SIMPLIFIÉES
  // ==========================================================================

  const notion = {
    async getPages(): Promise<NotionPage[]> {
      const result = await executeOperation<{ pages: NotionPage[] }>({
        integration: 'notion',
        operation: 'get_pages',
        config: {}
      });
      return result.pages;
    },

    async getPageContent(pageId: string): Promise<{
      page: NotionPage;
      blocks: any[];
      content: string;
    }> {
      return executeOperation({
        integration: 'notion',
        operation: 'get_page_content',
        config: { pageId }
      });
    }
  };

  // ==========================================================================
  // MÉTHODES UTILITAIRES
  // ==========================================================================

  // Vérifier si une intégration est connectée
  const isConnected = useCallback((integration: 'figma' | 'claude' | 'notion'): boolean => {
    return state.status[integration].connected;
  }, [state.status]);

  // Tester la connexion au service
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      return await secureIntegrationsService.testConnection();
    } catch {
      return false;
    }
  }, []);

  // Nettoyer l'erreur
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Charger le statut au montage du composant
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return {
    // État
    isLoading: state.isLoading,
    error: state.error,
    status: state.status,
    
    // Méthodes générales
    loadStatus,
    disconnectIntegration,
    isConnected,
    testConnection,
    clearError,
    executeOperation,
    
    // API spécifiques
    figma,
    claude,
    notion
  };
}

// Hook spécialisé pour Figma uniquement
export function useSecureFigma() {
  const { figma, isLoading, error, isConnected, clearError } = useSecureIntegrations();
  
  return {
    ...figma,
    isLoading,
    error,
    isConnected: isConnected('figma'),
    clearError
  };
}

// Hook spécialisé pour Claude uniquement
export function useSecureClaude() {
  const { claude, isLoading, error, isConnected, clearError } = useSecureIntegrations();
  
  return {
    ...claude,
    isLoading,
    error,
    isConnected: isConnected('claude'),
    clearError
  };
}

// Hook spécialisé pour Notion uniquement
export function useSecureNotion() {
  const { notion, isLoading, error, isConnected, clearError } = useSecureIntegrations();
  
  return {
    ...notion,
    isLoading,
    error,
    isConnected: isConnected('notion'),
    clearError
  };
}

export default useSecureIntegrations;