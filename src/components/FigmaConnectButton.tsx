import React, { useState, useEffect } from "react";
import { Link2, Loader2, AlertCircle, Check, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";

interface FigmaConnectButtonProps {
  onConnect: () => void;
  onError: (error: string) => void;
  className?: string;
}

// Configuration OAuth Figma
const FIGMA_CLIENT_ID = import.meta.env.VITE_FIGMA_CLIENT_ID || 'figma-demo-client-id';
const FIGMA_REDIRECT_URI = `${window.location.origin}/integrations/callback/figma`;
const FIGMA_SCOPES = 'file_read';

export default function FigmaConnectButton({ 
  onConnect, 
  onError, 
  className = "" 
}: FigmaConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'oauth' | 'token'>('oauth');
  const [personalToken, setPersonalToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Écouter le retour OAuth
  useEffect(() => {
    const handleOAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        onError(`Erreur OAuth Figma: ${error}`);
        return;
      }

      if (code && state === 'figma-oauth') {
        handleOAuthSuccess(code);
      }
    };

    if (window.location.pathname.includes('/figma') && window.location.search.includes('code=')) {
      handleOAuthCallback();
    }
  }, []);

  const handleOAuthConnect = () => {
    setIsConnecting(true);
    
    const authUrl = new URL('https://www.figma.com/oauth');
    authUrl.searchParams.set('client_id', FIGMA_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', FIGMA_REDIRECT_URI);
    authUrl.searchParams.set('scope', FIGMA_SCOPES);
    authUrl.searchParams.set('state', 'figma-oauth');
    authUrl.searchParams.set('response_type', 'code');

    // Rediriger vers Figma OAuth
    window.location.href = authUrl.toString();
  };

  const handleOAuthSuccess = async (code: string) => {
    try {
      // En production, ceci se ferait via votre backend
      // Ici on simule le succès OAuth
      console.log('Code OAuth reçu:', code);
      
      // Simuler l'échange du code contre un token
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Stocker le token (en production, via backend sécurisé)
      const mockToken = `figma_token_${Date.now()}`;
      localStorage.setItem('figma_access_token', mockToken);
      
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
      
      setShowDialog(false);
      onConnect();
    } catch (error: any) {
      console.error('Erreur OAuth Figma:', error);
      onError(error.message || 'Erreur lors de la connexion OAuth');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTokenConnect = async () => {
    if (!personalToken.trim()) {
      setError('Veuillez saisir votre token personnel Figma');
      return;
    }

    // Validation basique du format du token
    if (personalToken.length < 20) {
      setError('Le token Figma semble invalide (trop court)');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Tester la connexion avec l'API Figma
      const response = await fetch('https://api.figma.com/v1/me', {
        method: 'GET',
        headers: {
          'X-Figma-Token': personalToken
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Token invalide');
      }

      const userData = await response.json();
      console.log('Utilisateur Figma connecté:', userData);

      // Stocker le token
      localStorage.setItem('figma_personal_token', personalToken);
      
      setShowDialog(false);
      setPersonalToken('');
      onConnect();
      
    } catch (error: any) {
      console.error('Erreur de connexion Figma:', error);
      const errorMessage = error.message || 'Erreur de connexion à Figma';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setPersonalToken('');
    setError(null);
  };

  return (
    <>
      <Button 
        onClick={() => setShowDialog(true)}
        className={className}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Connexion...
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4 mr-2" />
            Connecter Figma
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">F</span>
              </div>
              Connecter Figma
            </DialogTitle>
            <DialogDescription>
              Connectez votre compte Figma pour importer vos designs et prototypes dans vos projets de design thinking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Sélecteur de mode de connexion */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <Button
                variant={connectionMode === 'oauth' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setConnectionMode('oauth')}
                className="flex-1"
              >
                OAuth (Recommandé)
              </Button>
              <Button
                variant={connectionMode === 'token' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setConnectionMode('token')}
                className="flex-1"
              >
                Token Personnel
              </Button>
            </div>

            {connectionMode === 'oauth' ? (
              <div className="space-y-3">
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    La connexion OAuth est plus sécurisée et ne nécessite pas de saisir manuellement vos identifiants.
                  </AlertDescription>
                </Alert>
                <div className="flex justify-center">
                  <Button 
                    onClick={handleOAuthConnect}
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Redirection...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Se connecter via Figma
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="figma-token">Token Personnel Figma</Label>
                <Input
                  id="figma-token"
                  type="password"
                  placeholder="figd_..."
                  value={personalToken}
                  onChange={(e) => setPersonalToken(e.target.value)}
                  disabled={isConnecting}
                />
                <div className="text-xs text-muted-foreground">
                  Générez un token sur{' '}
                  <a 
                    href="https://www.figma.com/developers/api#access-tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    figma.com/developers/api
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isConnecting}
            >
              Annuler
            </Button>
            {connectionMode === 'token' && (
              <Button 
                onClick={handleTokenConnect}
                disabled={isConnecting || !personalToken.trim()}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Se connecter
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}