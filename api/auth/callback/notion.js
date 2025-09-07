export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { code, state, error } = req.query;

    console.log('Callback received:', { code: !!code, state, error });

    if (error) {
      res.send(`
        <html>
          <body>
            <h1>Erreur OAuth</h1>
            <p>Erreur: ${error}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'NOTION_OAUTH_ERROR',
                  error: '${error}'
                }, 'https://momento-2-0.vercel.app');
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      return;
    }

    if (!code) {
      res.send(`
        <html>
          <body>
            <h1>Erreur OAuth</h1>
            <p>Code manquant</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'NOTION_OAUTH_ERROR',
                  error: 'Code manquant'
                }, 'https://momento-2-0.vercel.app');
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      return;
    }

    // Pour le test, on simule juste le succès
    res.send(`
      <html>
        <body>
          <h1>Connexion réussie !</h1>
          <p>Code reçu: ${code.substring(0, 10)}...</p>
          <p>State: ${state}</p>
          <script>
            console.log('Callback success, closing popup');
            if (window.opener) {
              window.opener.postMessage({
                type: 'NOTION_OAUTH_SUCCESS',
                data: {
                  code: '${code}',
                  state: '${state}',
                  workspace_name: 'Test Workspace'
                }
              }, 'https://momento-2-0.vercel.app');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Callback error:', error);
    res.send(`
      <html>
        <body>
          <h1>Erreur serveur</h1>
          <p>${error.message}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'NOTION_OAUTH_ERROR',
                error: 'Erreur serveur'
              }, 'https://momento-2-0.vercel.app');
              window.close();
            }
          </script>
        </body>
      </html>
    `);
  }
}