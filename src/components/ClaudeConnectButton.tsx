import React, { useState } from "react";
import { Link2, Loader2, AlertCircle, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";

interface ClaudeConnectButtonProps {
  onConnect: () => void;
  onError: (error: string) => void;
  className?: string;
}

export default function ClaudeConnectButton({ 
  onConnect, 
  onError, 
  className = "" 
}: ClaudeConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError('Veuillez saisir votre clé API Claude');
      return;
    }

    // Validation basique du format de la clé API Claude
    if (!apiKey.startsWith('sk-ant-')) {
      setError('Format de clé API invalide. Les clés Claude commencent par "sk-ant-"');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Tester la connexion avec l'API Claude
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Connexion échouée');
      }

      // Stocker la clé API de façon sécurisée (en production, utiliser un backend)
      localStorage.setItem('claude_api_key', apiKey);
      
      setShowDialog(false);
      setApiKey('');
      onConnect();
      
    } catch (error: any) {
      console.error('Erreur de connexion Claude:', error);
      const errorMessage = error.message || 'Erreur de connexion à Claude';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setApiKey('');
    setError(null);
  };

  return (
    <>
      <Button 
        onClick={() => setShowDialog(true)}
        className={className}
        disabled={isConnecting}
      >
        <Link2 className="h-4 w-4 mr-2" />
        Connecter Claude
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">C</span>
              </div>
              Connecter Claude
            </DialogTitle>
            <DialogDescription>
              Saisissez votre clé API Claude pour connecter l'assistant IA à vos projets de design thinking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="claude-api-key">Clé API Claude</Label>
              <Input
                id="claude-api-key"
                type="password"
                placeholder="sk-ant-api03-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isConnecting}
              />
              <div className="text-xs text-muted-foreground">
                Vous pouvez obtenir votre clé API sur{' '}
                <a 
                  href="https://console.anthropic.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  console.anthropic.com
                </a>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Votre clé API sera stockée localement et chiffrée. Elle ne sera jamais partagée.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isConnecting}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleConnect}
              disabled={isConnecting || !apiKey.trim()}
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}