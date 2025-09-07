import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Configuration Notion
const NOTION_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID,
  clientSecret: process.env.NOTION_CLIENT_SECRET,
};

// Store temporaire pour les states OAuth (en production, utiliser Redis ou KV)
// Pour la demo, on utilise un Map global (pas idéal en production)
global.oauthStates = global.oauthStates || new Map();

export default async function handler(req, res) {
  // Configure CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    global.oauthStates.set(state, { 
      timestamp: Date.now(),
      userId: userId 
    });

    // Nettoyer les anciens states (plus de 10 minutes)
    for (const [key, value] of global.oauthStates.entries()) {
      if (Date.now() - value.timestamp > 10 * 60 * 1000) {
        global.oauthStates.delete(key);
      }
    }

    const redirectUri = `${req.headers.origin || 'https://momento-2-0.vercel.app'}/auth/callback/notion`;

    const params = new URLSearchParams({
      client_id: NOTION_CONFIG.clientId,
      response_type: 'code',
      owner: 'user',
      redirect_uri: redirectUri,
      state: state
    });

    const authUrl = `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Erreur initialisation OAuth:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}