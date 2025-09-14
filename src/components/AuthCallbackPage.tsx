import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export default function AuthCallbackPage() {
  const { loading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connexion en cours...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase gérera automatiquement le callback OAuth
        // et déclenchera l'auth state change dans useAuth
        setStatus('success');
        setMessage('Connexion réussie ! Redirection...');
        
        // Rediriger vers la page principale après un court délai
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Erreur lors de la connexion. Veuillez réessayer.');
      }
    };

    // Vérifier s'il y a des paramètres d'auth dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (error) {
      setStatus('error');
      setMessage(errorDescription || 'Erreur lors de la connexion avec Google.');
    } else {
      handleAuthCallback();
    }
  }, []);

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          {getIcon()}
          <h2 className="text-xl font-medium text-center">
            {status === 'success' && 'Connexion réussie !'}
            {status === 'error' && 'Erreur de connexion'}
            {status === 'loading' && 'Connexion en cours...'}
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            {message}
          </p>
          {status === 'error' && (
            <div className="flex gap-2">
              <button 
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
              >
                Retour à l'accueil
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}