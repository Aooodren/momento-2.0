import React from 'react';
import { AlertTriangle, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface NotionConfigHelperProps {
  onClose?: () => void;
}

export default function NotionConfigHelper({ onClose }: NotionConfigHelperProps) {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const currentDomain = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const callbackUrl = `${currentDomain}/integrations/callback/notion`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <CardTitle>Configuration Notion requise</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Pour permettre la connexion à Notion, configurez votre intégration OAuth
                </p>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Étape 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="w-6 h-6 rounded-full p-0 flex items-center justify-center">1</Badge>
              <h3 className="font-medium">Créer une intégration Notion</h3>
            </div>
            
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                Créez une nouvelle intégration sur la plateforme développeur Notion
              </p>
              <Button
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://www.notion.so/my-integrations', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir Notion Integrations
              </Button>
            </div>
          </div>

          <Separator />

          {/* Étape 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="w-6 h-6 rounded-full p-0 flex items-center justify-center">2</Badge>
              <h3 className="font-medium">Configurer l'intégration</h3>
            </div>
            
            <div className="ml-8 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Type :</strong> Public integration
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Nom :</strong> Momento 2.0
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Permissions :</strong> Read content, Update content, Insert content
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Étape 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="w-6 h-6 rounded-full p-0 flex items-center justify-center">3</Badge>
              <h3 className="font-medium">URL de redirection OAuth</h3>
            </div>
            
            <div className="ml-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                Ajoutez cette URL dans la section "OAuth Domain & URIs" :
              </p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                <code className="flex-1 text-sm font-mono">{callbackUrl}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(callbackUrl, 'callback')}
                  className="flex-shrink-0"
                >
                  {copied === 'callback' ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Étape 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="w-6 h-6 rounded-full p-0 flex items-center justify-center">4</Badge>
              <h3 className="font-medium">Variables d'environnement</h3>
            </div>
            
            <div className="ml-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                Ajoutez ces variables dans votre fichier <code>.env.local</code> :
              </p>
              
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Client ID (public)</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('NEXT_PUBLIC_NOTION_CLIENT_ID=your_client_id_here', 'clientId')}
                    >
                      {copied === 'clientId' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <code className="text-sm font-mono">NEXT_PUBLIC_NOTION_CLIENT_ID=your_client_id_here</code>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Client Secret (privé)</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('NOTION_CLIENT_SECRET=your_client_secret_here', 'clientSecret')}
                    >
                      {copied === 'clientSecret' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  <code className="text-sm font-mono">NOTION_CLIENT_SECRET=your_client_secret_here</code>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Étape 5 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="w-6 h-6 rounded-full p-0 flex items-center justify-center">5</Badge>
              <h3 className="font-medium">Redémarrer l'application</h3>
            </div>
            
            <div className="ml-8">
              <p className="text-sm text-muted-foreground mb-2">
                Après avoir ajouté les variables d'environnement :
              </p>
              <div className="p-3 bg-gray-900 text-green-400 rounded-lg font-mono text-sm">
                npm run dev
              </div>
            </div>
          </div>

          <Separator />

          {/* Documentation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">📚</span>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Documentation détaillée</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Pour plus d'informations, consultez le guide complet
                </p>
                <p className="text-xs text-blue-600 font-mono">
                  NOTION_SETUP_GUIDE.md
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
            )}
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Recharger l'application
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}