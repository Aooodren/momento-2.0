import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3002;

// Configuration Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Configuration Notion
const NOTION_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID,
  clientSecret: process.env.NOTION_CLIENT_SECRET,
  redirectUri: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.vercel.app/auth/callback/notion'
    : 'http://localhost:3001/auth/callback/notion'
};

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.vercel.app'
    : 'http://localhost:3001',
  credentials: true
}));

app.use(express.json());

// Store temporaire pour les states OAuth (en production, utiliser Redis)
const oauthStates = new Map();

// Route pour initialiser l'OAuth
app.post('/api/notion/auth', (req, res) => {
  try {
    const { userId } = req.body;

    console.log('🔍 Configuration Notion:', {
      clientId: NOTION_CONFIG.clientId ? 'PRESENT' : 'MISSING',
      clientSecret: NOTION_CONFIG.clientSecret ? 'PRESENT' : 'MISSING',
      userId: userId ? 'PRESENT' : 'MISSING'
    });

    if (!NOTION_CONFIG.clientId || !NOTION_CONFIG.clientSecret) {
      return res.status(500).json({ 
        error: 'Configuration Notion manquante. Vérifiez vos variables d\'environnement.' 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        error: 'ID utilisateur requis' 
      });
    }

    // Générer un state unique
    const state = crypto.randomBytes(32).toString('hex');
    oauthStates.set(state, { 
      timestamp: Date.now(),
      userId: userId 
    });

    // Nettoyer les anciens states (plus de 10 minutes)
    for (const [key, value] of oauthStates.entries()) {
      if (Date.now() - value.timestamp > 10 * 60 * 1000) {
        oauthStates.delete(key);
      }
    }

    const params = new URLSearchParams({
      client_id: NOTION_CONFIG.clientId,
      response_type: 'code',
      owner: 'user',
      redirect_uri: NOTION_CONFIG.redirectUri,
      state: state
    });

    const authUrl = `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Erreur initialisation OAuth:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour gérer le callback OAuth
app.get('/auth/callback/notion', async (req, res) => {
  try {
    const { code, state, error, user_id } = req.query;

    if (error) {
      return res.send(`
        <script>
          window.opener?.postMessage({
            type: 'NOTION_OAUTH_ERROR',
            error: '${error}'
          }, '${process.env.NODE_ENV === 'production' ? 'https://your-domain.vercel.app' : 'http://localhost:3001'}');
          window.close();
        </script>
      `);
    }

    if (!code || !state) {
      return res.send(`
        <script>
          window.opener?.postMessage({
            type: 'NOTION_OAUTH_ERROR',
            error: 'Paramètres OAuth manquants'
          }, '${process.env.NODE_ENV === 'production' ? 'https://your-domain.vercel.app' : 'http://localhost:3001'}');
          window.close();
        </script>
      `);
    }

    // Vérifier le state et récupérer l'user_id
    if (!oauthStates.has(state)) {
      return res.send(`
        <script>
          window.opener?.postMessage({
            type: 'NOTION_OAUTH_ERROR',
            error: 'State invalide - possible attaque CSRF'
          }, '${process.env.NODE_ENV === 'production' ? 'https://your-domain.vercel.app' : 'http://localhost:3001'}');
          window.close();
        </script>
      `);
    }

    const stateData = oauthStates.get(state);
    oauthStates.delete(state);

    // Échanger le code contre un access token
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${NOTION_CONFIG.clientId}:${NOTION_CONFIG.clientSecret}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: NOTION_CONFIG.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Erreur échange token:', error);
      return res.send(`
        <script>
          window.opener?.postMessage({
            type: 'NOTION_OAUTH_ERROR',
            error: 'Erreur lors de l\\'échange du token'
          }, '${process.env.NODE_ENV === 'production' ? 'https://your-domain.vercel.app' : 'http://localhost:3001'}');
          window.close();
        </script>
      `);
    }

    const tokenData = await tokenResponse.json();

    // Sauvegarder dans Supabase
    if (stateData.userId) {
      try {
        const { error: upsertError } = await supabase
          .from('user_integrations')
          .upsert({
            user_id: stateData.userId,
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
              owner: tokenData.owner,
              connectedAt: new Date().toISOString()
            },
            last_sync: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,integration_type'
          });

        if (upsertError) {
          console.error('Erreur sauvegarde Supabase:', upsertError);
          throw upsertError;
        }

        console.log('✅ Token sauvegardé pour utilisateur:', stateData.userId);
      } catch (dbError) {
        console.error('Erreur base de données:', dbError);
        return res.send(`
          <script>
            window.opener?.postMessage({
              type: 'NOTION_OAUTH_ERROR',
              error: 'Erreur lors de la sauvegarde'
            }, '${process.env.NODE_ENV === 'production' ? 'https://your-domain.vercel.app' : 'http://localhost:3001'}');
            window.close();
          </script>
        `);
      }
    }

    res.send(`
      <script>
        window.opener?.postMessage({
          type: 'NOTION_OAUTH_SUCCESS',
          data: {
            workspace_name: '${tokenData.workspace_name}',
            workspace_icon: '${tokenData.workspace_icon}'
          }
        }, '${process.env.NODE_ENV === 'production' ? 'https://your-domain.vercel.app' : 'http://localhost:3000'}');
        window.close();
      </script>
    `);

  } catch (error) {
    console.error('Erreur callback OAuth:', error);
    res.send(`
      <script>
        window.opener?.postMessage({
          type: 'NOTION_OAUTH_ERROR',
          error: 'Erreur serveur'
        }, '${process.env.NODE_ENV === 'production' ? 'https://your-domain.vercel.app' : 'http://localhost:3000'}');
        window.close();
      </script>
    `);
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur OAuth démarré sur http://localhost:${PORT}`);
});