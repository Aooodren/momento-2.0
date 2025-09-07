export default function handler(req, res) {
  // CORS simple
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_NOTION_CLIENT_ID;
    
    if (!clientId) {
      res.status(500).json({ 
        error: 'Configuration manquante',
        debug: 'NEXT_PUBLIC_NOTION_CLIENT_ID not found'
      });
      return;
    }

    // State simple (pas de sécurité pour le test)
    const state = Math.random().toString(36).substring(7);
    
    // URL de callback vers Vercel
    const redirectUri = 'https://momento-2-0.vercel.app/auth/callback/notion';
    
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    console.log('AuthURL:', authUrl);
    
    res.status(200).json({ 
      authUrl,
      state,
      redirectUri 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message
    });
  }
}