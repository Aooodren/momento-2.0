import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export default function NotionOAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connexion à Notion en cours...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Erreur d'authentification: ${error}`);
        
        // Notifier la fenêtre parent de l'erreur
        window.opener?.postMessage({
          type: 'NOTION_OAUTH_ERROR',
          error: error
        }, window.location.origin);
        
        setTimeout(() => window.close(), 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Paramètres d\'authentification manquants');
        
        window.opener?.postMessage({
          type: 'NOTION_OAUTH_ERROR',
          error: 'Missing authentication parameters'
        }, window.location.origin);
        
        setTimeout(() => window.close(), 3000);
        return;
      }

      setMessage('Validation des informations...');

      // Notifier la fenêtre parent du succès
      window.opener?.postMessage({
        type: 'NOTION_OAUTH_SUCCESS',
        code: code,
        state: state
      }, window.location.origin);

      setStatus('success');
      setMessage('Connexion réussie ! Vous pouvez fermer cette fenêtre.');
      
      // Fermer automatiquement après 2 secondes
      setTimeout(() => window.close(), 2000);

    } catch (error: any) {
      console.error('Erreur lors du callback OAuth:', error);
      setStatus('error');
      setMessage(`Erreur: ${error.message}`);
      
      window.opener?.postMessage({
        type: 'NOTION_OAUTH_ERROR',
        error: error.message
      }, window.location.origin);
      
      setTimeout(() => window.close(), 3000);
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            {/* Logo Notion */}
            <div className="w-16 h-16 bg-white rounded-lg shadow-sm flex items-center justify-center mb-4">
              <span className="text-2xl font-bold">N</span>
            </div>
            
            {/* Icon de statut */}
            {getIcon()}
            
            {/* Message */}
            <div className={`text-lg font-medium ${getStatusColor()}`}>
              {message}
            </div>
            
            {/* Message supplémentaire selon le statut */}
            {status === 'loading' && (
              <div className="text-sm text-gray-500">
                Veuillez patienter pendant que nous configurons votre connexion...
              </div>
            )}
            
            {status === 'success' && (
              <div className="text-sm text-gray-500">
                Votre compte Notion est maintenant connecté à Momento 2.0
              </div>
            )}
            
            {status === 'error' && (
              <div className="text-sm text-gray-500">
                Cette fenêtre se fermera automatiquement dans quelques secondes
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}