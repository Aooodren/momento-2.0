import { ApplicationConnector } from '../hooks/useWorkflowEngine';

// Interface pour les opérations Notion
export interface NotionPageData {
  id: string;
  title: string;
  properties: Record<string, any>;
  content: any[];
  created_time: string;
  last_edited_time: string;
}

export interface NotionDatabaseEntry {
  id: string;
  properties: Record<string, any>;
  created_time: string;
  last_edited_time: string;
}

// Connecteur Notion utilisant le serveur MCP
export class NotionConnector implements ApplicationConnector {
  type = 'notion' as const;

  constructor(private mcpEnabled = true) {}

  async execute(operation: string, config: Record<string, any>, input?: any): Promise<any> {
    console.log(`[Notion] Exécution de l'opération: ${operation}`, { config, input });

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
      
      default:
        throw new Error(`Opération Notion non supportée: ${operation}`);
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
        return true; // Ces opérations utilisent l'input
      
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
      'generate_summary'
    ];
  }

  private async getPage(pageId: string): Promise<NotionPageData> {
    if (this.mcpEnabled && (window as any).mcp?.notion_get_page) {
      try {
        return await (window as any).mcp.notion_get_page(pageId);
      } catch (error) {
        console.warn('MCP Notion non disponible, utilisation de la simulation');
      }
    }
    
    // Simulation pour la démo
    return {
      id: pageId,
      title: `Page simulée ${pageId}`,
      properties: {
        "Titre": { title: [{ plain_text: `Page simulée ${pageId}` }] },
        "Status": { select: { name: "En cours" } },
        "Créé le": { created_time: new Date().toISOString() }
      },
      content: [
        {
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: { content: "Contenu simulé de la page Notion" }
              }
            ]
          }
        }
      ],
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString()
    };
  }

  private async createPage(parentId: string, title: string, content?: any, input?: any): Promise<NotionPageData> {
    if (this.mcpEnabled && (window as any).mcp?.notion_create_page) {
      try {
        return await (window as any).mcp.notion_create_page({
          parent: { page_id: parentId },
          properties: {
            title: { title: [{ text: { content: title } }] }
          },
          children: content || []
        });
      } catch (error) {
        console.warn('MCP Notion non disponible, utilisation de la simulation');
      }
    }

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

    const newPageId = `sim_${Date.now()}`;
    return {
      id: newPageId,
      title,
      properties: {
        "Titre": { title: [{ plain_text: title }] },
        "Créé le": { created_time: new Date().toISOString() }
      },
      content: finalContent || [],
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString()
    };
  }

  private async updatePage(pageId: string, properties: Record<string, any>, input?: any): Promise<NotionPageData> {
    if (this.mcpEnabled && (window as any).mcp?.notion_update_page) {
      try {
        return await (window as any).mcp.notion_update_page(pageId, { properties });
      } catch (error) {
        console.warn('MCP Notion non disponible, utilisation de la simulation');
      }
    }

    // Simulation
    return {
      id: pageId,
      title: properties.title || `Page mise à jour ${pageId}`,
      properties: {
        ...properties,
        "Modifié le": { last_edited_time: new Date().toISOString() }
      },
      content: input ? [
        {
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: input } }]
          }
        }
      ] : [],
      created_time: new Date(Date.now() - 3600000).toISOString(),
      last_edited_time: new Date().toISOString()
    };
  }

  private async searchPages(query: string, filter?: any): Promise<NotionPageData[]> {
    if (this.mcpEnabled && (window as any).mcp?.notion_search_pages) {
      try {
        return await (window as any).mcp.notion_search_pages(query, filter);
      } catch (error) {
        console.warn('MCP Notion non disponible, utilisation de la simulation');
      }
    }

    // Simulation
    return [
      {
        id: `search_result_1_${Date.now()}`,
        title: `Résultat pour "${query}" - Page 1`,
        properties: {
          "Titre": { title: [{ plain_text: `Résultat pour "${query}" - Page 1` }] }
        },
        content: [],
        created_time: new Date().toISOString(),
        last_edited_time: new Date().toISOString()
      },
      {
        id: `search_result_2_${Date.now()}`,
        title: `Résultat pour "${query}" - Page 2`,
        properties: {
          "Titre": { title: [{ plain_text: `Résultat pour "${query}" - Page 2` }] }
        },
        content: [],
        created_time: new Date().toISOString(),
        last_edited_time: new Date().toISOString()
      }
    ];
  }

  private async queryDatabase(databaseId: string, filter?: any, sorts?: any): Promise<NotionDatabaseEntry[]> {
    if (this.mcpEnabled && (window as any).mcp?.notion_query_database) {
      try {
        return await (window as any).mcp.notion_query_database(databaseId, { filter, sorts });
      } catch (error) {
        console.warn('MCP Notion non disponible, utilisation de la simulation');
      }
    }

    // Simulation
    return [
      {
        id: `db_entry_1_${Date.now()}`,
        properties: {
          "Nom": { title: [{ plain_text: "Entrée de base de données 1" }] },
          "Status": { select: { name: "Terminé" } },
          "Date": { date: { start: new Date().toISOString().split('T')[0] } }
        },
        created_time: new Date().toISOString(),
        last_edited_time: new Date().toISOString()
      },
      {
        id: `db_entry_2_${Date.now()}`,
        properties: {
          "Nom": { title: [{ plain_text: "Entrée de base de données 2" }] },
          "Status": { select: { name: "En cours" } },
          "Date": { date: { start: new Date().toISOString().split('T')[0] } }
        },
        created_time: new Date().toISOString(),
        last_edited_time: new Date().toISOString()
      }
    ];
  }

  private async createDatabaseEntry(databaseId: string, properties: Record<string, any>, input?: any): Promise<NotionDatabaseEntry> {
    if (this.mcpEnabled && (window as any).mcp?.notion_create_database_entry) {
      try {
        return await (window as any).mcp.notion_create_database_entry(databaseId, { properties });
      } catch (error) {
        console.warn('MCP Notion non disponible, utilisation de la simulation');
      }
    }

    // Enrichir les propriétés avec l'input si disponible
    const finalProperties = { ...properties };
    if (input && typeof input === 'string') {
      finalProperties["Contenu"] = {
        rich_text: [{ type: "text", text: { content: input } }]
      };
    }

    return {
      id: `db_entry_${Date.now()}`,
      properties: finalProperties,
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString()
    };
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
    
    return `Résumé généré: ${summary}${summary.endsWith('.') ? '' : '.'}`;
  }
}