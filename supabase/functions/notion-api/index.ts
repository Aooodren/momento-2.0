// Fonction Edge Supabase pour l'API Notion sécurisée
import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const app = new Hono();

// CORS configuration
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://momento-2-0.vercel.app'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use('*', logger(console.log));

// Supabase client avec service role pour accès sécurisé
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Configuration Notion (stockée de manière sécurisée)
const NOTION_CONFIG = {
  clientId: Deno.env.get('NOTION_CLIENT_ID'),
  clientSecret: Deno.env.get('NOTION_CLIENT_SECRET'),
  apiUrl: 'https://api.notion.com/v1'
};

// Middleware d'authentification
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

// Récupérer le token Notion de l'utilisateur depuis Supabase
async function getNotionToken(userId: string) {
  const { data, error } = await supabase
    .from('user_integrations')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('integration_type', 'notion')
    .eq('status', 'connected')
    .single();

  if (error || !data?.access_token) {
    throw new Error('Token Notion non trouvé ou expiré');
  }

  return data.access_token;
}

// Faire un appel sécurisé à l'API Notion
async function makeNotionRequest(endpoint: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`${NOTION_CONFIG.apiUrl}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Notion API error: ${error.message || response.statusText}`);
  }

  return await response.json();
}

// Routes API Notion sécurisées

// Test de connexion
app.get('/notion-api/test', (c) => {
  return c.json({ message: 'Notion API service is running securely!' });
});

// Initier l'authentification OAuth Notion
app.post('/notion-api/auth/initiate', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (user instanceof Response) return user;

    if (!NOTION_CONFIG.clientId) {
      return c.json({ error: 'Configuration Notion manquante' }, 500);
    }

    const state = crypto.randomUUID();
    const redirectUri = `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/auth/callback/notion`;
    
    // Stocker le state de manière sécurisée
    await supabase
      .from('oauth_states')
      .insert({
        user_id: user.id,
        state,
        integration_type: 'notion',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });

    const authUrl = `https://api.notion.com/v1/oauth/authorize?` +
      `client_id=${NOTION_CONFIG.clientId}&` +
      `response_type=code&` +
      `owner=user&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;

    return c.json({ authUrl, state });
  } catch (error) {
    console.error('Erreur initiation OAuth:', error);
    return c.json({ error: 'Erreur lors de l\'initiation OAuth' }, 500);
  }
});

// Gérer le callback OAuth
app.post('/notion-api/auth/callback', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (user instanceof Response) return user;

    const { code, state } = await c.req.json();

    // Vérifier le state
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('user_id', user.id)
      .eq('state', state)
      .eq('integration_type', 'notion')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (stateError || !stateData) {
      return c.json({ error: 'State invalide ou expiré' }, 400);
    }

    // Échanger le code contre un token
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${NOTION_CONFIG.clientId}:${NOTION_CONFIG.clientSecret}`)}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/auth/callback/notion`
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      return c.json({ error: `Échange de token échoué: ${error.error_description || error.error}` }, 400);
    }

    const tokenData = await tokenResponse.json();

    // Sauvegarder le token de manière sécurisée
    await supabase
      .from('user_integrations')
      .upsert({
        user_id: user.id,
        integration_type: 'notion',
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
          owner: tokenData.owner
        },
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    // Nettoyer le state
    await supabase
      .from('oauth_states')
      .delete()
      .eq('user_id', user.id)
      .eq('state', state);

    return c.json({ success: true, workspace: tokenData.workspace_name });
  } catch (error) {
    console.error('Erreur callback OAuth:', error);
    return c.json({ error: 'Erreur lors du callback OAuth' }, 500);
  }
});

// Récupérer les pages Notion
app.get('/notion-api/pages', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (user instanceof Response) return user;

    const token = await getNotionToken(user.id);
    
    const response = await makeNotionRequest('/search', token, {
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

    const pages = response.results.map((page: any) => ({
      id: page.id,
      title: extractTitle(page.properties),
      url: page.url,
      icon: page.icon,
      parent: page.parent,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time
    }));

    return c.json({ pages });
  } catch (error) {
    console.error('Erreur récupération pages:', error);
    return c.json({ error: error.message || 'Erreur lors de la récupération des pages' }, 500);
  }
});

// Récupérer les databases Notion
app.get('/notion-api/databases', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (user instanceof Response) return user;

    const token = await getNotionToken(user.id);
    
    const response = await makeNotionRequest('/search', token, {
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

    const databases = response.results.map((db: any) => ({
      id: db.id,
      title: extractTitle(db.title),
      description: db.description?.[0]?.plain_text,
      properties: db.properties,
      url: db.url,
      icon: db.icon,
      created_time: db.created_time,
      last_edited_time: db.last_edited_time
    }));

    return c.json({ databases });
  } catch (error) {
    console.error('Erreur récupération databases:', error);
    return c.json({ error: error.message || 'Erreur lors de la récupération des databases' }, 500);
  }
});

// Récupérer le contenu d'une page
app.get('/notion-api/pages/:pageId', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (user instanceof Response) return user;

    const pageId = c.req.param('pageId');
    const token = await getNotionToken(user.id);
    
    // Récupérer les métadonnées de la page
    const page = await makeNotionRequest(`/pages/${pageId}`, token);
    
    // Récupérer les blocs de contenu
    const blocks = await makeNotionRequest(`/blocks/${pageId}/children`, token);

    const pageData = {
      id: page.id,
      title: extractTitle(page.properties),
      url: page.url,
      icon: page.icon,
      parent: page.parent,
      properties: page.properties,
      created_time: page.created_time,
      last_edited_time: page.last_edited_time
    };

    return c.json({ 
      page: pageData,
      blocks: blocks.results,
      content: extractTextContent(blocks.results)
    });
  } catch (error) {
    console.error('Erreur récupération contenu page:', error);
    return c.json({ error: error.message || 'Erreur lors de la récupération du contenu' }, 500);
  }
});

// Créer une nouvelle page
app.post('/notion-api/pages', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (user instanceof Response) return user;

    const { parentId, title, content } = await c.req.json();
    const token = await getNotionToken(user.id);
    
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
      children: content || []
    };

    const response = await makeNotionRequest('/pages', token, {
      method: 'POST',
      body: JSON.stringify(pageData)
    });

    const page = {
      id: response.id,
      title: extractTitle(response.properties),
      url: response.url,
      icon: response.icon,
      parent: response.parent,
      properties: response.properties,
      created_time: response.created_time,
      last_edited_time: response.last_edited_time
    };

    return c.json({ page });
  } catch (error) {
    console.error('Erreur création page:', error);
    return c.json({ error: error.message || 'Erreur lors de la création de la page' }, 500);
  }
});

// Mettre à jour le contenu d'une page
app.put('/notion-api/pages/:pageId/content', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (user instanceof Response) return user;

    const pageId = c.req.param('pageId');
    const { blocks } = await c.req.json();
    const token = await getNotionToken(user.id);
    
    // Supprimer tous les blocs existants
    const existingBlocks = await makeNotionRequest(`/blocks/${pageId}/children`, token);
    
    for (const block of existingBlocks.results) {
      await makeNotionRequest(`/blocks/${block.id}`, token, {
        method: 'DELETE'
      });
    }

    // Ajouter les nouveaux blocs
    if (blocks && blocks.length > 0) {
      await makeNotionRequest(`/blocks/${pageId}/children`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          children: blocks
        })
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Erreur mise à jour contenu:', error);
    return c.json({ error: error.message || 'Erreur lors de la mise à jour du contenu' }, 500);
  }
});

// Déconnecter l'utilisateur de Notion
app.delete('/notion-api/auth/disconnect', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (user instanceof Response) return user;

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

    return c.json({ success: true });
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    return c.json({ error: 'Erreur lors de la déconnexion' }, 500);
  }
});

// Vérifier le statut de connexion
app.get('/notion-api/auth/status', async (c) => {
  try {
    const user = await authenticateUser(c);
    if (user instanceof Response) return user;

    const { data, error } = await supabase
      .from('user_integrations')
      .select('status, metadata, last_sync')
      .eq('user_id', user.id)
      .eq('integration_type', 'notion')
      .single();

    if (error || !data) {
      return c.json({ connected: false });
    }

    return c.json({ 
      connected: data.status === 'connected',
      workspace: data.metadata?.workspace_name,
      lastSync: data.last_sync
    });
  } catch (error) {
    console.error('Erreur vérification statut:', error);
    return c.json({ connected: false });
  }
});

// Fonctions utilitaires
function extractTitle(titleProperty: any): string {
  if (Array.isArray(titleProperty)) {
    return titleProperty.map(t => t.plain_text).join('');
  }
  
  if (titleProperty?.title) {
    return titleProperty.title.map((t: any) => t.plain_text).join('');
  }
  
  return 'Sans titre';
}

function extractTextContent(blocks: any[]): string {
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

// Start the server
Deno.serve(app.fetch);