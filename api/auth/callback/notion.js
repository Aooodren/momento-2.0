// Store temporaire pour les states OAuth
if (!globalThis.oauthStates) {
  globalThis.oauthStates = new Map();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, error } = req.query;
    const origin = req.headers.origin || 'https://momento-2-0.vercel.app';

    console.log('🔍 Callback reçu:', { 
      code: code ? 'PRESENT' : 'MISSING', 
      state: state ? state.substring(0, 8) + '...' : 'MISSING',
      error: error || 'NONE',
      origin 
    });

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
    if (!globalThis.oauthStates.has(state)) {
      console.error('❌ State invalide:', { 
        state: state.substring(0, 8) + '...',
        availableStates: Array.from(globalThis.oauthStates.keys()).map(k => k.substring(0, 8) + '...')
      });
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

    const stateData = globalThis.oauthStates.get(state);
    globalThis.oauthStates.delete(state);

    const clientId = process.env.NEXT_PUBLIC_NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri = `${origin}/auth/callback/notion`;

    console.log('🔄 Échange du token...');

    // Échanger le code contre un access token
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Erreur échange token:', errorText);
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
    console.log('✅ Token reçu:', { workspace: tokenData.workspace_name });

    // Sauvegarder dans Supabase avec fetch natif
    if (stateData.userId) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        console.log('💾 Sauvegarde dans Supabase...');

        const payload = {
          user_id: stateData.userId,
          integration_type: 'notion',
          status: 'connected',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
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
        };

        // Utiliser upsert pour éviter les conflits
        const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/user_integrations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        });

        if (!supabaseResponse.ok) {
          const errorData = await supabaseResponse.text();
          console.error('❌ Erreur Supabase:', errorData);
          throw new Error(`Supabase error: ${errorData}`);
        }

        console.log('✅ Token sauvegardé pour utilisateur:', stateData.userId);
      } catch (dbError) {
        console.error('❌ Erreur base de données:', dbError);
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
            workspace_icon: '${tokenData.workspace_icon || ''}'
          }
        }, '${origin}');
        window.close();
      </script>
    `);

  } catch (error) {
    console.error('❌ Erreur callback OAuth:', error);
    const origin = req.headers.origin || 'https://momento-2-0.vercel.app';
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