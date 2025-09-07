#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '../.env.local' });

/**
 * MCP Server pour Momento 2.0 - Intégration Notion
 * Permet à Claude d'interagir directement avec Notion pour le design thinking
 */
class MomentoNotionMCP {
  constructor() {
    this.server = new Server({
      name: 'momento-notion',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
        resources: {}
      }
    });

    // Initialiser le client Notion
    this.notion = new Client({
      auth: process.env.NOTION_INTEGRATION_TOKEN,
    });

    this.setupTools();
    this.setupResources();
  }

  setupTools() {
    // Outil pour lister les pages Notion
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'notion_list_pages',
            description: 'Liste toutes les pages accessibles dans Notion pour Momento',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Terme de recherche optionnel'
                }
              }
            }
          },
          {
            name: 'notion_get_page',
            description: 'Récupère le contenu détaillé d\'une page Notion',
            inputSchema: {
              type: 'object',
              properties: {
                page_id: {
                  type: 'string',
                  description: 'ID de la page Notion'
                }
              },
              required: ['page_id']
            }
          },
          {
            name: 'notion_create_page',
            description: 'Crée une nouvelle page Notion pour un projet de design thinking',
            inputSchema: {
              type: 'object',
              properties: {
                parent_id: {
                  type: 'string',
                  description: 'ID de la page parent où créer la nouvelle page'
                },
                title: {
                  type: 'string',
                  description: 'Titre de la nouvelle page'
                },
                content: {
                  type: 'array',
                  description: 'Contenu de la page (blocs Notion)',
                  items: {
                    type: 'object'
                  }
                }
              },
              required: ['parent_id', 'title']
            }
          },
          {
            name: 'notion_search_databases',
            description: 'Recherche et liste les databases Notion disponibles',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Terme de recherche pour les databases'
                }
              }
            }
          }
        ]
      };
    });

    // Implémentation des outils
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'notion_list_pages':
            return await this.listPages(args.query);
            
          case 'notion_get_page':
            return await this.getPage(args.page_id);
            
          case 'notion_create_page':
            return await this.createPage(args.parent_id, args.title, args.content);
            
          case 'notion_search_databases':
            return await this.searchDatabases(args.query);
            
          default:
            throw new Error(`Outil inconnu: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Erreur: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }

  setupResources() {
    // Ressources pour les templates de design thinking
    this.server.setRequestHandler('resources/list', async () => {
      return {
        resources: [
          {
            uri: 'momento://templates/design-thinking',
            name: 'Templates Design Thinking',
            description: 'Templates prêts à l\'emploi pour vos projets de design thinking',
            mimeType: 'application/json'
          },
          {
            uri: 'momento://workspace/current',
            name: 'Workspace actuel',
            description: 'Informations sur le workspace Notion connecté',
            mimeType: 'application/json'
          }
        ]
      };
    });

    this.server.setRequestHandler('resources/read', async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'momento://templates/design-thinking':
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(this.getDesignThinkingTemplates(), null, 2)
            }]
          };
          
        case 'momento://workspace/current':
          return {
            contents: [{
              uri,
              mimeType: 'application/json', 
              text: JSON.stringify(await this.getWorkspaceInfo(), null, 2)
            }]
          };
          
        default:
          throw new Error(`Ressource inconnue: ${uri}`);
      }
    });
  }

  // Méthodes Notion
  async listPages(query = '') {
    try {
      const response = await this.notion.search({
        query,
        filter: { property: 'object', value: 'page' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' }
      });

      const pages = response.results.map(page => ({
        id: page.id,
        title: this.extractTitle(page.properties),
        url: page.url,
        last_edited: page.last_edited_time,
        icon: page.icon
      }));

      return {
        content: [{
          type: 'text',
          text: `📄 Pages Notion trouvées (${pages.length}):\n\n${pages.map(p => 
            `• **${p.title}** (${p.id})\n  Modifiée: ${new Date(p.last_edited).toLocaleDateString()}\n  URL: ${p.url}`
          ).join('\n\n')}`
        }]
      };
    } catch (error) {
      throw new Error(`Impossible de lister les pages: ${error.message}`);
    }
  }

  async getPage(pageId) {
    try {
      const page = await this.notion.pages.retrieve({ page_id: pageId });
      const blocks = await this.notion.blocks.children.list({ block_id: pageId });

      return {
        content: [{
          type: 'text',
          text: `# ${this.extractTitle(page.properties)}\n\n${this.formatBlocks(blocks.results)}`
        }]
      };
    } catch (error) {
      throw new Error(`Impossible de récupérer la page: ${error.message}`);
    }
  }

  async createPage(parentId, title, content = []) {
    try {
      const newPage = await this.notion.pages.create({
        parent: { page_id: parentId },
        properties: {
          title: {
            title: [{ text: { content: title } }]
          }
        },
        children: content
      });

      return {
        content: [{
          type: 'text',
          text: `✅ Page créée avec succès!\n\n**${title}**\nID: ${newPage.id}\nURL: ${newPage.url}`
        }]
      };
    } catch (error) {
      throw new Error(`Impossible de créer la page: ${error.message}`);
    }
  }

  async searchDatabases(query = '') {
    try {
      const response = await this.notion.search({
        query,
        filter: { property: 'object', value: 'database' }
      });

      const databases = response.results.map(db => ({
        id: db.id,
        title: this.extractTitle(db.title),
        url: db.url,
        properties: Object.keys(db.properties)
      }));

      return {
        content: [{
          type: 'text',
          text: `🗂️ Databases trouvées (${databases.length}):\n\n${databases.map(db => 
            `• **${db.title}** (${db.id})\n  Propriétés: ${db.properties.join(', ')}\n  URL: ${db.url}`
          ).join('\n\n')}`
        }]
      };
    } catch (error) {
      throw new Error(`Impossible de chercher les databases: ${error.message}`);
    }
  }

  // Utilitaires
  extractTitle(properties) {
    if (Array.isArray(properties)) {
      return properties.map(p => p.plain_text).join('');
    }
    
    const titleProp = Object.values(properties).find(p => p.type === 'title');
    if (titleProp?.title) {
      return titleProp.title.map(t => t.plain_text).join('');
    }
    
    return 'Sans titre';
  }

  formatBlocks(blocks) {
    return blocks.map(block => {
      switch (block.type) {
        case 'paragraph':
          return block.paragraph.rich_text.map(t => t.plain_text).join('');
        case 'heading_1':
          return `# ${block.heading_1.rich_text.map(t => t.plain_text).join('')}`;
        case 'heading_2':
          return `## ${block.heading_2.rich_text.map(t => t.plain_text).join('')}`;
        case 'heading_3':
          return `### ${block.heading_3.rich_text.map(t => t.plain_text).join('')}`;
        case 'bulleted_list_item':
          return `• ${block.bulleted_list_item.rich_text.map(t => t.plain_text).join('')}`;
        case 'numbered_list_item':
          return `1. ${block.numbered_list_item.rich_text.map(t => t.plain_text).join('')}`;
        default:
          return '';
      }
    }).filter(Boolean).join('\n\n');
  }

  getDesignThinkingTemplates() {
    return {
      templates: [
        {
          name: "Empathy Map",
          description: "Template pour comprendre votre utilisateur",
          blocks: [
            {
              object: "block",
              type: "heading_1",
              heading_1: {
                rich_text: [{ type: "text", text: { content: "Empathy Map - [Nom de l'utilisateur]" } }]
              }
            },
            {
              object: "block", 
              type: "heading_2",
              heading_2: {
                rich_text: [{ type: "text", text: { content: "Ce qu'il PENSE" } }]
              }
            },
            {
              object: "block",
              type: "paragraph",
              paragraph: {
                rich_text: [{ type: "text", text: { content: "• Ses pensées, croyances, préoccupations..." } }]
              }
            }
          ]
        },
        {
          name: "User Journey",
          description: "Template pour mapper le parcours utilisateur",
          blocks: [
            {
              object: "block",
              type: "heading_1", 
              heading_1: {
                rich_text: [{ type: "text", text: { content: "User Journey - [Nom du parcours]" } }]
              }
            }
          ]
        }
      ]
    };
  }

  async getWorkspaceInfo() {
    try {
      const response = await this.notion.search({ page_size: 1 });
      return {
        connected: true,
        pages_count: response.results.length > 0 ? "Available" : "No pages found",
        last_check: new Date().toISOString()
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Momento Notion MCP Server démarré');
  }
}

// Démarrer le serveur MCP
const server = new MomentoNotionMCP();
server.start().catch(console.error);