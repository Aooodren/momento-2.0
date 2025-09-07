import { useEffect } from 'react';

export default function NotionCallback() {
  useEffect(() => {
    // Récupérer les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      // Envoyer l'erreur à la fenêtre parent
      if (window.opener) {
        window.opener.postMessage({
          type: 'NOTION_OAUTH_ERROR',
          error: error
        }, window.location.origin);
        window.close();
      }
      return;
    }

    if (code && state) {
      // Envoyer le succès à la fenêtre parent
      if (window.opener) {
        window.opener.postMessage({
          type: 'NOTION_OAUTH_SUCCESS',
          code: code,
          state: state
        }, window.location.origin);
        window.close();
      }
    } else {
      // Paramètres manquants
      if (window.opener) {
        window.opener.postMessage({
          type: 'NOTION_OAUTH_ERROR',
          error: 'Paramètres OAuth manquants'
        }, window.location.origin);
        window.close();
      }
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
        <p className="text-muted-foreground">Finalisation de la connexion Notion...</p>
      </div>
    </div>
  );
}