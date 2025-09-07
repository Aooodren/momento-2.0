const crypto = require('crypto');

// Store temporaire pour les states OAuth 
global.oauthStates = global.oauthStates || new Map();

module.exports = async function handler(req, res) {
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

    const clientId = process.env.NEXT_PUBLIC_NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;

    console.log('🔍 Configuration Notion:', {
      clientId: clientId ? 'PRESENT' : 'MISSING',
      clientSecret: clientSecret ? 'PRESENT' : 'MISSING',
      userId: userId ? 'PRESENT' : 'MISSING'
    });

    if (!clientId || !clientSecret) {
      console.error('❌ Configuration manquante:', {
        clientId: clientId || 'undefined',
        clientSecret: clientSecret ? '[HIDDEN]' : 'undefined'
      });
      return res.status(500).json({ 
        error: 'Configuration Notion manquante. Vérifiez vos variables d\'environnement.',
        debug: {
          clientId: clientId ? 'PRESENT' : 'MISSING',
          clientSecret: clientSecret ? 'PRESENT' : 'MISSING'
        }
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
      client_id: clientId,
      response_type: 'code',
      owner: 'user',
      redirect_uri: redirectUri,
      state: state
    });

    const authUrl = `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;

    console.log('✅ AuthURL généré:', authUrl);
    res.json({ authUrl });
    
  } catch (error) {
    console.error('Erreur initialisation OAuth:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}