// Connecteur Notion sécurisé - utilise uniquement les APIs backend
import { ApplicationConnector } from '../hooks/useWorkflowEngine';
import { secureNotionService, NotionPage, NotionDatabase } from '../services/secureNotionService';

// Interfaces pour les opérations Notion sécurisées
export interface SecureNotionPageData {
  id: string;
  title: string;
  properties: Record<string, any>;
  content: any[];
  created_time: string;
  last_edited_time: string;
}

export interface SecureNotionDatabaseEntry {
  id: string;
  properties: Record<string, any>;
  created_time: string;
  last_edited_time: string;
}

// Connecteur Notion sécurisé utilisant exclusivement le backend
export class SecureNotionConnector implements ApplicationConnector {
  type = 'notion' as const;

  async execute(operation: string, config: Record<string, any>, input?: any): Promise<any> {
    console.log(`[SecureNotion] Exécution sécurisée de l'opération: ${operation}`, { config, input });

    // Vérifier la connexion avant toute opération
    const isConnected = await secureNotionService.isConnected();
    if (!isConnected) {
      throw new Error('Non connecté à Notion. Veuillez vous connecter d\'abord.');
    }

    switch (operation) {
      case 'get_page':
        return this.getPage(config.pageId);
      
      case 'create_page':
        return this.createPage(config.parentId, config.title, config.content, input);
      
      case 'update_page':
        return this.updatePage(config.pageId, config.properties, input);
      
      case 'search_pages':
        return this.searchPages(config.query, config.filter);
      
      case 'query_database':
        return this.queryDatabase(config.databaseId, config.filter, config.sorts);
      
      case 'create_database_entry':
        return this.createDatabaseEntry(config.databaseId, config.properties, input);
      
      case 'extract_content':
        return this.extractContent(input);
      
      case 'generate_summary':
        return this.generateSummary(input);
      
      case 'get_connection_status':
        return this.getConnectionStatus();
      
      case 'initiate_auth':
        return this.initiateAuth();
      
      case 'disconnect':
        return this.disconnect();
      
      default:
        throw new Error(`Opération Notion sécurisée non supportée: ${operation}`);
    }
  }

  validate(operation: string, config: Record<string, any>): boolean {
    switch (operation) {
      case 'get_page':
        return !!config.pageId;
      
      case 'create_page':
        return !!config.parentId && !!config.title;
      
      case 'update_page':
        return !!config.pageId;
      
      case 'search_pages':
        return !!config.query;
      
      case 'query_database':
        return !!config.databaseId;
      
      case 'create_database_entry':
        return !!config.databaseId && !!config.properties;
      
      case 'extract_content':
      case 'generate_summary':
      case 'get_connection_status':
      case 'initiate_auth':
      case 'disconnect':
        return true;
      
      default:
        return false;
    }
  }

  getOperations(): string[] {
    return [
      'get_page',
      'create_page',
      'update_page',
      'search_pages',
      'query_database',
      'create_database_entry',
      'extract_content',
      'generate_summary',
      'get_connection_status',
      'initiate_auth',
      'disconnect'
    ];
  }

  // Implémentations sécurisées des opérations

  private async getPage(pageId: string): Promise<SecureNotionPageData> {
    try {
      const pageContent = await secureNotionService.getPageContent(pageId);
      
      return {
        id: pageContent.page.id,
        title: pageContent.page.title,
        properties: {
          "Titre": { title: [{ plain_text: pageContent.page.title }] },
          "URL": { url: pageContent.page.url },
          "Créé le": { created_time: pageContent.page.created_time },
          "Modifié le": { last_edited_time: pageContent.page.last_edited_time }
        },
        content: pageContent.blocks,
        created_time: pageContent.page.created_time,
        last_edited_time: pageContent.page.last_edited_time
      };
    } catch (error: any) {
      console.error('Erreur récupération page sécurisée:', error);
      throw new Error(`Impossible de récupérer la page: ${error.message}`);
    }
  }

  private async createPage(parentId: string, title: string, content?: any, input?: any): Promise<SecureNotionPageData> {
    try {
      // Utiliser l'input si fourni pour enrichir le contenu
      let finalContent = content;
      if (input && typeof input === 'string') {
        finalContent = [
          {
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: input } }]
            }
          }
        ];
      }

      const page = await secureNotionService.createPage(parentId, title, finalContent);
      
      return {
        id: page.id,
        title: page.title,
        properties: {
          "Titre": { title: [{ plain_text: page.title }] },
          "URL": { url: page.url },
          "Créé le": { created_time: page.created_time }
        },
        content: finalContent || [],
        created_time: page.created_time,
        last_edited_time: page.last_edited_time
      };
    } catch (error: any) {
      console.error('Erreur création page sécurisée:', error);
      throw new Error(`Impossible de créer la page: ${error.message}`);
    }
  }

  private async updatePage(pageId: string, properties: Record<string, any>, input?: any): Promise<SecureNotionPageData> {
    try {
      // Préparer les blocs de contenu si input fourni
      let blocks: any[] = [];
      if (input && typeof input === 'string') {
        blocks = [
          {
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: input } }]
            }
          }
        ];
      }

      // Mettre à jour le contenu si des blocs sont fournis
      if (blocks.length > 0) {
        await secureNotionService.updatePageContent(pageId, blocks);
      }

      // Récupérer la page mise à jour
      return await this.getPage(pageId);
    } catch (error: any) {
      console.error('Erreur mise à jour page sécurisée:', error);
      throw new Error(`Impossible de mettre à jour la page: ${error.message}`);
    }
  }

  private async searchPages(query: string, filter?: any): Promise<SecureNotionPageData[]> {
    try {
      const pages = await secureNotionService.getPages();
      
      // Filtrer les pages selon la query
      const filteredPages = pages.filter(page => 
        page.title.toLowerCase().includes(query.toLowerCase())
      );

      return filteredPages.map(page => ({
        id: page.id,
        title: page.title,
        properties: {
          "Titre": { title: [{ plain_text: page.title }] },
          "URL": { url: page.url }
        },
        content: [],
        created_time: page.created_time,
        last_edited_time: page.last_edited_time
      }));
    } catch (error: any) {
      console.error('Erreur recherche pages sécurisée:', error);
      throw new Error(`Impossible de rechercher les pages: ${error.message}`);
    }
  }

  private async queryDatabase(databaseId: string, filter?: any, sorts?: any): Promise<SecureNotionDatabaseEntry[]> {
    try {
      // Pour l'instant, retourner les databases disponibles
      // Dans une implémentation complète, il faudrait ajouter une route spécifique pour query les databases
      const databases = await secureNotionService.getDatabases();
      const targetDb = databases.find(db => db.id === databaseId);
      
      if (!targetDb) {
        throw new Error(`Database ${databaseId} non trouvée`);
      }

      // Simulation d'entrées de database
      return [
        {
          id: `${databaseId}_entry_1`,
          properties: {
            "Nom": { title: [{ plain_text: "Entrée de database 1" }] },
            "Status": { select: { name: "Terminé" } },
            "Date": { date: { start: new Date().toISOString().split('T')[0] } }
          },
          created_time: new Date().toISOString(),
          last_edited_time: new Date().toISOString()
        }
      ];
    } catch (error: any) {
      console.error('Erreur query database sécurisée:', error);
      throw new Error(`Impossible de requêter la database: ${error.message}`);
    }
  }

  private async createDatabaseEntry(databaseId: string, properties: Record<string, any>, input?: any): Promise<SecureNotionDatabaseEntry> {
    try {
      // Enrichir les propriétés avec l'input si disponible
      const finalProperties = { ...properties };
      if (input && typeof input === 'string') {
        finalProperties["Contenu"] = {
          rich_text: [{ type: "text", text: { content: input } }]
        };
      }

      // Pour l'instant, simulation car il faudrait ajouter une route backend spécifique
      return {
        id: `${databaseId}_entry_${Date.now()}`,
        properties: finalProperties,
        created_time: new Date().toISOString(),
        last_edited_time: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Erreur création entrée database sécurisée:', error);
      throw new Error(`Impossible de créer l'entrée: ${error.message}`);
    }
  }

  private async extractContent(input: any): Promise<string> {
    // Extraire le contenu texte d'une page ou entrée Notion
    if (!input) return '';

    if (typeof input === 'string') return input;

    if (input.content && Array.isArray(input.content)) {
      return input.content
        .map((block: any) => {
          if (block.paragraph?.rich_text) {
            return block.paragraph.rich_text
              .map((text: any) => text.text?.content || '')
              .join('');
          }
          return '';
        })
        .join('\n');
    }

    if (input.properties) {
      // Extraire le texte des propriétés
      const texts: string[] = [];
      Object.values(input.properties).forEach((prop: any) => {
        if (prop.title) {
          texts.push(...prop.title.map((t: any) => t.plain_text || ''));
        }
        if (prop.rich_text) {
          texts.push(...prop.rich_text.map((t: any) => t.text?.content || ''));
        }
      });
      return texts.join(' ');
    }

    return JSON.stringify(input);
  }

  private async generateSummary(input: any): Promise<string> {
    const content = await this.extractContent(input);
    
    // Simulation d'un résumé intelligent
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences
      .slice(0, 3) // Prendre les 3 premières phrases
      .join('. ');
    
    return `Résumé sécurisé généré: ${summary}${summary.endsWith('.') ? '' : '.'}`;
  }

  private async getConnectionStatus(): Promise<{ connected: boolean; workspace?: string; lastSync?: string }> {
    try {
      return await secureNotionService.getConnectionStatus();
    } catch (error: any) {
      console.error('Erreur statut connexion sécurisée:', error);
      return { connected: false };
    }
  }

  private async initiateAuth(): Promise<{ authUrl: string; message: string }> {
    try {
      const result = await secureNotionService.openOAuthPopup();
      
      if (result.success) {
        return {
          authUrl: '',
          message: `Connexion réussie au workspace: ${result.workspace}`
        };
      } else {
        throw new Error(result.error || 'Échec de l\'authentification');
      }
    } catch (error: any) {
      console.error('Erreur authentification sécurisée:', error);
      throw new Error(`Impossible de s'authentifier: ${error.message}`);
    }
  }

  private async disconnect(): Promise<{ success: boolean; message: string }> {
    try {
      await secureNotionService.disconnect();
      return {
        success: true,
        message: 'Déconnexion réussie de Notion'
      };
    } catch (error: any) {
      console.error('Erreur déconnexion sécurisée:', error);
      throw new Error(`Impossible de se déconnecter: ${error.message}`);
    }
  }
}

// Export du connecteur sécurisé
export default SecureNotionConnector;