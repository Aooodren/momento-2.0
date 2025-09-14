// Bouton de connexion Notion sécurisé
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Unlink
} from 'lucide-react';
import { cn } from './ui/utils';
import { secureNotionService, NotionAuthStatus } from '../services/secureNotionService';
import { Alert, AlertDescription } from './ui/alert';

interface SecureNotionConnectButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  onConnectionChange?: (connected: boolean, workspace?: string) => void;
  showStatus?: boolean;
}

export default function SecureNotionConnectButton({
  className,
  variant = 'default',
  size = 'default',
  onConnectionChange,
  showStatus = true
}: SecureNotionConnectButtonProps) {
  const [status, setStatus] = useState<NotionAuthStatus>({ connected: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Vérifier le statut de connexion au chargement
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      
      const connectionStatus = await secureNotionService.getConnectionStatus();
      setStatus(connectionStatus);
      
      // Notifier le parent du changement de statut
      if (onConnectionChange) {
        onConnectionChange(connectionStatus.connected, connectionStatus.workspace);
      }
    } catch (error: any) {
      console.error('Erreur vérification statut connexion sécurisée:', error);
      setError('Impossible de vérifier le statut de connexion');
      setStatus({ connected: false });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await secureNotionService.openOAuthPopup();
      
      if (result.success) {
        // Mettre à jour le statut après connexion réussie
        await checkConnectionStatus();
        
        // Afficher un message de succès temporaire
        setTimeout(() => {
          setError(null);
        }, 3000);
      } else {
        setError(result.error || 'Échec de la connexion à Notion');
      }
    } catch (error: any) {
      console.error('Erreur connexion sécurisée Notion:', error);
      setError('Erreur lors de la connexion à Notion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await secureNotionService.disconnect();
      
      // Mettre à jour le statut après déconnexion
      setStatus({ connected: false });
      
      // Notifier le parent
      if (onConnectionChange) {
        onConnectionChange(false);
      }
    } catch (error: any) {
      console.error('Erreur déconnexion sécurisée Notion:', error);
      setError('Erreur lors de la déconnexion');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isLoading || isInitializing) return Loader2;
    if (status.connected) return CheckCircle;
    if (error) return AlertCircle;
    return FileText;
  };

  const getStatusColor = () => {
    if (isLoading || isInitializing) return 'text-blue-600';
    if (status.connected) return 'text-green-600';
    if (error) return 'text-red-600';
    return 'text-gray-600';
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className={cn('space-y-2', className)}>
      {/* Bouton principal */}
      <div className="flex items-center gap-2">
        <Button
          onClick={status.connected ? handleDisconnect : handleConnect}
          disabled={isLoading || isInitializing}
          variant={variant}
          size={size}
          className={cn(
            'flex items-center gap-2',
            status.connected && 'bg-green-600 hover:bg-green-700 text-white'
          )}
        >
          <StatusIcon 
            className={cn(
              'w-4 h-4',
              (isLoading || isInitializing) && 'animate-spin',
              getStatusColor()
            )} 
          />
          
          {isInitializing ? (
            'Vérification...'
          ) : isLoading ? (
            status.connected ? 'Déconnexion...' : 'Connexion...'
          ) : status.connected ? (
            'Déconnecter Notion'
          ) : (
            'Connecter Notion'
          )}
        </Button>

        {/* Badge de statut */}
        {showStatus && !isInitializing && (
          <Badge 
            variant={status.connected ? 'default' : 'secondary'}
            className={cn(
              'text-xs',
              status.connected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            )}
          >
            {status.connected ? 'Connecté' : 'Déconnecté'}
          </Badge>
        )}
      </div>

      {/* Informations de workspace */}
      {status.connected && status.workspace && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="w-3 h-3" />
          <span>Workspace: {status.workspace}</span>
          {status.lastSync && (
            <span className="text-xs">
              • Sync: {new Date(status.lastSync).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {/* Messages d'erreur */}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Message de succès après connexion */}
      {status.connected && !error && !isLoading && (
        <Alert className="py-2 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800">
            ✅ Connexion sécurisée établie avec Notion
            {status.workspace && ` (${status.workspace})`}
          </AlertDescription>
        </Alert>
      )}

      {/* Informations de sécurité */}
      {!status.connected && !error && !isLoading && !isInitializing && (
        <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded border border-blue-200">
          🔒 <strong>Connexion sécurisée</strong> - Vos tokens Notion sont chiffrés et stockés de manière sécurisée sur le serveur.
        </div>
      )}
    </div>
  );
}