// Backend unifié ultra-sécurisé pour toutes les intégrations
import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const app = new Hono();

// CORS configuration restrictive
app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'https://momento-2-0.vercel.app',
    process.env.SITE_URL || 'http://localhost:3000'
  ],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use('*', logger(console.log));

// Supabase client avec service role pour accès sécurisé
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Configuration sécurisée des intégrations
const INTEGRATIONS_CONFIG = {
  figma: {
    apiUrl: 'https://api.figma.com/v1',
    // Token géré en base de données par utilisateur
  },
  claude: {
    apiUrl: 'https://api.anthropic.com/v1',
    apiKey: Deno.env.get('CLAUDE_API_KEY'), // Clé globale sécurisée
    version: '2023-06-01'
  },
  notion: {
    clientId: Deno.env.get('NOTION_CLIENT_ID'),
    clientSecret: Deno.env.get('NOTION_CLIENT_SECRET'),
    apiUrl: 'https://api.notion.com/v1'
  }
};

// Types pour les intégrations
interface IntegrationRequest {
  integration: 'figma' | 'claude' | 'notion';
  operation: string;
  config: Record<string, any>;
  input?: any;
}

interface IntegrationResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    operation: string;
    integration: string;
    timestamp: string;
    usage?: any;
  };
}

// Middleware d'authentification centralisé
async function authenticateUser(c: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return c.json({ error: 'Token manquant' }, 401);
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return c.json({ error: 'Token invalide' }, 401);
  }

  return user;
}

// Récupérer le token d'intégration pour un utilisateur
async function getIntegrationToken(userId: string, integrationType: string) {
  const { data, error } = await supabase
    .from('user_integrations')
    .select('access_token, refresh_token, expires_at, metadata')
    .eq('user_id', userId)
    .eq('integration_type', integrationType)
    .eq('status', 'connected')
    .single();

  if (error || !data?.access_token) {
    throw new Error(`Token ${integrationType} non trouvé ou expiré`);
  }

  return data;
}

// Logger les appels d'intégration
async function logIntegrationCall(
  userId: string,
  integration: string,
  operation: string,
  success: boolean,
  error?: string
) {
  try {
    await supabase.from('integration_audit_logs').insert({
      user_id: userId,
      integration_type: integration,
      action: operation,
      status_code: success ? 200 : 500,
      error_message: error,
      created_at: new Date().toISOString()
    });
  } catch (logError) {
    console.error('Erreur lors du logging:', logError);
  }
}

// =============================================================================
// ROUTE PRINCIPALE - API INTÉGRÉE
// =============================================================================

app.post('/integrations-api/execute', async (c) => {
  let user;
  let requestData: IntegrationRequest;

  try {
    // Authentification
    user = await authenticateUser(c);
    if (user instanceof Response) return user;

    // Validation de la requête
    requestData = await c.req.json();
    const { integration, operation, config, input } = requestData;

    if (!integration || !operation) {
      return c.json({ error: 'Paramètres manquants: integration et operation requis' }, 400);
    }

    // Execution sécurisée selon l'intégration
    let result: IntegrationResponse;
    
    switch (integration) {
      case 'figma':
        result = await executeFigmaOperation(user.id, operation, config, input);
        break;
      case 'claude':
        result = await executeClaudeOperation(user.id, operation, config, input);
        break;
      case 'notion':
        result = await executeNotionOperation(user.id, operation, config, input);
        break;
      default:
        throw new Error(`Intégration non supportée: ${integration}`);
    }

    // Logger le succès
    await logIntegrationCall(user.id, integration, operation, true);

    return c.json(result);

  } catch (error: any) {
    console.error(`Erreur intégration ${requestData?.integration}:`, error);
    
    // Logger l'erreur
    if (user) {
      await logIntegrationCall(
        user.id, 
        requestData?.integration || 'unknown', 
        requestData?.operation || 'unknown', 
        false, 
        error.message
      );
    }

    return c.json({
      success: false,
      error: error.message || 'Erreur lors de l\'exécution',
      metadata: {
        operation: requestData?.operation || 'unknown',
        integration: requestData?.integration || 'unknown',
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

// =============================================================================
// FIGMA - OPÉRATIONS SÉCURISÉES
// =============================================================================

async function executeFigmaOperation(
  userId: string, 
  operation: string, 
  config: Record<string, any>, 
  input?: any
): Promise<IntegrationResponse> {
  
  // Récupérer le token Figma de l'utilisateur
  const tokenData = await getIntegrationToken(userId, 'figma');
  
  const figmaApi = {
    async call(endpoint: string, options: RequestInit = {}) {
      const response = await fetch(`${INTEGRATIONS_CONFIG.figma.apiUrl}${endpoint}`, {
        ...options,
        headers: {
          'X-Figma-Token': tokenData.access_token,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Figma API error: ${error.message || response.statusText}`);
      }

      return await response.json();
    }
  };

  switch (operation) {
    case 'get_file':
      const fileData = await figmaApi.call(`/files/${config.fileKey}`);
      return {
        success: true,
        data: {
          key: config.fileKey,
          name: fileData.name,
          version: fileData.version,
          lastModified: fileData.lastModified,
          thumbnailUrl: fileData.thumbnailUrl
        },
        metadata: {
          operation,
          integration: 'figma',
          timestamp: new Date().toISOString()
        }
      };

    case 'get_frames':
      const framesData = await figmaApi.call(`/files/${config.fileKey}`);
      const frames = extractFramesFromFigma(framesData);
      return {
        success: true,
        data: { frames },
        metadata: {
          operation,
          integration: 'figma',
          timestamp: new Date().toISOString()
        }
      };

    case 'export_frames':
      const exportData = await figmaApi.call(
        `/images/${config.fileKey}?ids=${config.nodeIds.join(',')}&format=${config.format || 'PNG'}&scale=${config.scale || 1}`
      );
      return {
        success: true,
        data: { images: exportData.images },
        metadata: {
          operation,
          integration: 'figma',
          timestamp: new Date().toISOString()
        }
      };

    case 'get_comments':
      const commentsData = await figmaApi.call(`/files/${config.fileKey}/comments`);
      return {
        success: true,
        data: { comments: commentsData.comments },
        metadata: {
          operation,
          integration: 'figma',
          timestamp: new Date().toISOString()
        }
      };

    case 'post_comment':
      const commentData = await figmaApi.call(`/files/${config.fileKey}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          message: input || config.message,
          client_meta: config.position || { x: 0, y: 0 }
        })
      });
      return {
        success: true,
        data: commentData,
        metadata: {
          operation,
          integration: 'figma',
          timestamp: new Date().toISOString()
        }
      };

    default:
      throw new Error(`Opération Figma non supportée: ${operation}`);
  }
}

// =============================================================================
// CLAUDE - OPÉRATIONS SÉCURISÉES
// =============================================================================

async function executeClaudeOperation(
  userId: string,
  operation: string,
  config: Record<string, any>,
  input?: any
): Promise<IntegrationResponse> {

  if (!INTEGRATIONS_CONFIG.claude.apiKey) {
    throw new Error('Claude API key non configurée');
  }

  const claudeApi = {
    async call(endpoint: string, data: any) {
      const response = await fetch(`${INTEGRATIONS_CONFIG.claude.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${INTEGRATIONS_CONFIG.claude.apiKey}`,
          'anthropic-version': INTEGRATIONS_CONFIG.claude.version
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
      }

      return await response.json();
    }
  };

  switch (operation) {
    case 'generate_text':
      let prompt = config.prompt;
      if (input) {
        prompt = `${prompt}\n\nContext: ${typeof input === 'string' ? input : JSON.stringify(input)}`;
      }

      const response = await claudeApi.call('/messages', {
        model: config.model || 'claude-3-sonnet-20240229',
        max_tokens: config.maxTokens || 1000,
        temperature: config.temperature || 0.7,
        messages: [{ role: 'user', content: prompt }]
      });

      return {
        success: true,
        data: {
          id: response.id,
          content: response.content[0].text,
          model: response.model
        },
        metadata: {
          operation,
          integration: 'claude',
          timestamp: new Date().toISOString(),
          usage: response.usage
        }
      };

    case 'analyze_content':
      const analysisPrompt = `Analysez le contenu suivant et fournissez des insights, recommandations, sentiment et points clés:\n\n${input}`;
      
      const analysisResponse = await claudeApi.call('/messages', {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [{ role: 'user', content: analysisPrompt }]
      });

      return {
        success: true,
        data: {
          analysis: analysisResponse.content[0].text,
          content: input
        },
        metadata: {
          operation,
          integration: 'claude',
          timestamp: new Date().toISOString(),
          usage: analysisResponse.usage
        }
      };

    case 'summarize':
      const summarizePrompt = `Résumez le contenu suivant en ${config.maxLength || 200} caractères maximum:\n\n${input}`;
      
      const summaryResponse = await claudeApi.call('/messages', {
        model: 'claude-3-haiku-20240307', // Modèle plus rapide pour les résumés
        max_tokens: 500,
        messages: [{ role: 'user', content: summarizePrompt }]
      });

      return {
        success: true,
        data: {
          summary: summaryResponse.content[0].text,
          originalLength: typeof input === 'string' ? input.length : JSON.stringify(input).length
        },
        metadata: {
          operation,
          integration: 'claude',
          timestamp: new Date().toISOString(),
          usage: summaryResponse.usage
        }
      };

    default:
      throw new Error(`Opération Claude non supportée: ${operation}`);
  }
}

// =============================================================================
// NOTION - OPÉRATIONS SÉCURISÉES (Réutilise la logique existante)
// =============================================================================

async function executeNotionOperation(
  userId: string,
  operation: string,
  config: Record<string, any>,
  input?: any
): Promise<IntegrationResponse> {
  
  // Récupérer le token Notion de l'utilisateur
  const tokenData = await getIntegrationToken(userId, 'notion');
  
  const notionApi = {
    async call(endpoint: string, options: RequestInit = {}) {
      const response = await fetch(`${INTEGRATIONS_CONFIG.notion.apiUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Notion API error: ${error.message || response.statusText}`);
      }

      return await response.json();
    }
  };

  switch (operation) {
    case 'get_pages':
      const pagesResponse = await notionApi.call('/search', {
        method: 'POST',
        body: JSON.stringify({
          filter: { property: 'object', value: 'page' },
          sort: { direction: 'descending', timestamp: 'last_edited_time' }
        })
      });

      return {
        success: true,
        data: {
          pages: pagesResponse.results.map((page: any) => ({
            id: page.id,
            title: extractNotionTitle(page.properties),
            url: page.url,
            lastEdited: page.last_edited_time
          }))
        },
        metadata: {
          operation,
          integration: 'notion',
          timestamp: new Date().toISOString()
        }
      };

    case 'get_page_content':
      const pageData = await notionApi.call(`/pages/${config.pageId}`);
      const blocksData = await notionApi.call(`/blocks/${config.pageId}/children`);

      return {
        success: true,
        data: {
          page: {
            id: pageData.id,
            title: extractNotionTitle(pageData.properties),
            url: pageData.url
          },
          blocks: blocksData.results,
          content: extractNotionText(blocksData.results)
        },
        metadata: {
          operation,
          integration: 'notion',
          timestamp: new Date().toISOString()
        }
      };

    default:
      throw new Error(`Opération Notion non supportée: ${operation}`);
  }
}

// =============================================================================
// ROUTES DE STATUT ET GESTION
// =============================================================================

// Statut global des intégrations
app.get('/integrations-api/status', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (user instanceof Response) return user;

    // Vérifier le statut de chaque intégration
    const integrations = ['figma', 'claude', 'notion'];
    const status: Record<string, any> = {};

    for (const integration of integrations) {
      try {
        const tokenData = await getIntegrationToken(user.id, integration);
        status[integration] = {
          connected: true,
          lastSync: tokenData.metadata?.last_sync,
          workspace: tokenData.metadata?.workspace_name
        };
      } catch {
        status[integration] = { connected: false };
      }
    }

    return c.json({ status });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Déconnecter une intégration
app.delete('/integrations-api/:integration/disconnect', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (user instanceof Response) return user;

    const integration = c.req.param('integration');

    await supabase
      .from('user_integrations')
      .update({
        status: 'disconnected',
        access_token: null,
        refresh_token: null,
        expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('integration_type', integration);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Test de l'API
app.get('/integrations-api/test', (c) => {
  return c.json({ 
    message: 'API intégrations sécurisée opérationnelle!',
    integrations: ['figma', 'claude', 'notion'],
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

function extractFramesFromFigma(fileData: any): any[] {
  const frames: any[] = [];
  
  const traverse = (node: any) => {
    if (node.type === 'FRAME') {
      frames.push({
        id: node.id,
        name: node.name,
        type: node.type,
        width: node.absoluteBoundingBox?.width || 0,
        height: node.absoluteBoundingBox?.height || 0
      });
    }
    
    if (node.children) {
      node.children.forEach(traverse);
    }
  };
  
  if (fileData.document) {
    traverse(fileData.document);
  }
  
  return frames;
}

function extractNotionTitle(properties: any): string {
  if (!properties) return 'Sans titre';
  
  for (const prop of Object.values(properties)) {
    if ((prop as any).title) {
      return (prop as any).title.map((t: any) => t.plain_text).join('');
    }
  }
  
  return 'Sans titre';
}

function extractNotionText(blocks: any[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'paragraph':
        return block.paragraph.rich_text.map((t: any) => t.plain_text).join('');
      case 'heading_1':
        return `# ${block.heading_1.rich_text.map((t: any) => t.plain_text).join('')}`;
      case 'heading_2':
        return `## ${block.heading_2.rich_text.map((t: any) => t.plain_text).join('')}`;
      default:
        return '';
    }
  }).filter(Boolean).join('\n\n');
}

// Start the server
Deno.serve(app.fetch);