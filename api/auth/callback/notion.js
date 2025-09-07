// Store temporaire pour les states OAuth
global.oauthStates = global.oauthStates || new Map();

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, error } = req.query;
    const origin = req.headers.origin || req.headers.referer?.split('/')[0] + '//' + req.headers.referer?.split('/')[2] || 'https://momento-2-0.vercel.app';

    if (error) {
      return res.send(`
        <script>
          window.opener?.postMessage({
            type: 'NOTION_OAUTH_ERROR',
            error: '${error}'
          }, '${origin}');
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
          }, '${origin}');
          window.close();
        </script>
      `);
    }

    // Vérifier le state et récupérer l'user_id
    if (!global.oauthStates.has(state)) {
      return res.send(`
        <script>
          window.opener?.postMessage({
            type: 'NOTION_OAUTH_ERROR',
            error: 'State invalide - possible attaque CSRF'
          }, '${origin}');
          window.close();
        </script>
      `);
    }

    const stateData = global.oauthStates.get(state);
    global.oauthStates.delete(state);

    const clientId = process.env.NEXT_PUBLIC_NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri = `${origin}/auth/callback/notion`;

    // Échanger le code contre un access token
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
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
          }, '${origin}');
          window.close();
        </script>
      `);
    }

    const tokenData = await tokenResponse.json();

    // Sauvegarder dans Supabase avec fetch natif
    if (stateData.userId) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/user_integrations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
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
          })
        });

        if (!supabaseResponse.ok) {
          const errorData = await supabaseResponse.text();
          console.error('Erreur Supabase:', errorData);
          throw new Error(`Supabase error: ${errorData}`);
        }

        console.log('✅ Token sauvegardé pour utilisateur:', stateData.userId);
      } catch (dbError) {
        console.error('Erreur base de données:', dbError);
        return res.send(`
          <script>
            window.opener?.postMessage({
              type: 'NOTION_OAUTH_ERROR',
              error: 'Erreur lors de la sauvegarde'
            }, '${origin}');
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
        }, '${origin}');
        window.close();
      </script>
    `);

  } catch (error) {
    console.error('Erreur callback OAuth:', error);
    const origin = req.headers.origin || req.headers.referer?.split('/')[0] + '//' + req.headers.referer?.split('/')[2] || 'https://momento-2-0.vercel.app';
    res.send(`
      <script>
        window.opener?.postMessage({
          type: 'NOTION_OAUTH_ERROR',
          error: 'Erreur serveur'
        }, '${origin}');
        window.close();
      </script>
    `);
  }
}