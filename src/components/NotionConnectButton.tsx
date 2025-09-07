import React, { useState } from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase/client';

interface NotionConnectButtonProps {
  onConnect?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function NotionConnectButton({ onConnect, onError, className }: NotionConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Utilisateur non connecté');
      }

      // Démarrer le flow OAuth - URL dynamique selon l'environnement
      const apiUrl = window.location.origin.includes('localhost') 
        ? 'http://localhost:3002/api/notion/auth'  // Local: serveur Express
        : '/api/notion/auth';  // Production: fonction Vercel
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'initialisation OAuth');
      }
      
      const { authUrl } = await response.json();
      
      // Ouvrir la popup OAuth
      const popup = window.open(
        authUrl,
        'notion-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Écouter la fermeture de la popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'NOTION_OAUTH_SUCCESS') {
          window.removeEventListener('message', messageListener);
          popup?.close();
          setIsConnecting(false);
          onConnect?.();
        } else if (event.data.type === 'NOTION_OAUTH_ERROR') {
          window.removeEventListener('message', messageListener);
          popup?.close();
          setIsConnecting(false);
          onError?.(event.data.error);
        }
      };

      window.addEventListener('message', messageListener);

      // Vérifier si la popup a été fermée manuellement
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsConnecting(false);
          onError?.('Connexion annulée');
        }
      }, 1000);

    } catch (error) {
      setIsConnecting(false);
      onError?.(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className={className}
    >
      {isConnecting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connexion...
        </>
      ) : (
        'Se connecter à Notion'
      )}
    </Button>
  );
}