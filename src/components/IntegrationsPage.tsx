import React, { useState } from "react";
import { 
  ArrowLeft, 
  Link2, 
  Check, 
  ExternalLink,
  Loader2,
  AlertCircle,
  Settings,
  Zap
} from "lucide-react";
import { useSupabaseIntegrations } from "../hooks/useSupabaseIntegrations";
import { notionService } from "../services/notionService";
import NotionConfigHelper from "./NotionConfigHelper";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

interface IntegrationTool {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'design' | 'ai';
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  isAvailable: boolean;
  connectionUrl?: string;
  features: string[];
}

interface IntegrationsPageProps {
  onBack: () => void;
}

export default function IntegrationsPage({ onBack }: IntegrationsPageProps) {
  const [selectedTool, setSelectedTool] = useState<IntegrationTool | null>(null);
  const [showNotionConfig, setShowNotionConfig] = useState(false);
  const { 
    integrations, 
    connectIntegration, 
    disconnectIntegration,
    getIntegrationStatus,
    isConnected,
    isLoading,
    error
  } = useSupabaseIntegrations();

  const integrationTools: IntegrationTool[] = [
    {
      id: 'notion',
      name: 'Notion',
      description: 'Synchronisez vos projets avec vos espaces de travail Notion',
      category: 'productivity',
      icon: (
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-lg font-bold">N</span>
        </div>
      ),
      status: getIntegrationStatus('notion'),
      isAvailable: true,
      features: [
        'Synchronisation bidirectionnelle des projets',
        'Import/export de contenus',
        'Collaboration en temps réel',
        'Templates personnalisés'
      ]
    },
    {
      id: 'claude',
      name: 'Claude',
      description: 'Intégrez l\'IA Claude pour améliorer vos workflows de design thinking',
      category: 'ai',
      icon: (
        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-lg font-bold">C</span>
        </div>
      ),
      status: getIntegrationStatus('claude'),
      isAvailable: true,
      features: [
        'Génération d\'idées automatique',
        'Analyse de projets',
        'Suggestions d\'amélioration',
        'Aide à la rédaction'
      ]
    },
    {
      id: 'figma',
      name: 'Figma',
      description: 'Connectez vos designs Figma à vos projets de design thinking',
      category: 'design',
      icon: (
        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
          <span className="text-white text-lg font-bold">F</span>
        </div>
      ),
      status: getIntegrationStatus('figma'),
      isAvailable: true,
      features: [
        'Import de maquettes',
        'Synchronisation des prototypes',
        'Collaboration designer-équipe',
        'Versions et commentaires'
      ]
    }
  ];

  const handleConnect = async (tool: IntegrationTool) => {
    try {
      if (tool.id === 'notion') {
        // Vérifier si Notion est configuré
        if (!notionService.isConfigured()) {
          setShowNotionConfig(true);
          return;
        }
        
        // Utiliser le vrai service OAuth Notion
        const result = await notionService.initiateOAuth();
        if (!result.success) {
          throw new Error(result.error || 'Échec de la connexion OAuth');
        }
        // Le token sera automatiquement sauvegardé dans Supabase par le service
      } else {
        // Utiliser la simulation pour les autres services
        await connectIntegration(tool.id);
      }
    } catch (error) {
      console.error(`Erreur lors de la connexion à ${tool.name}:`, error);
    }
  };

  const handleDisconnect = async (toolId: string) => {
    try {
      await disconnectIntegration(toolId);
    } catch (error) {
      console.error(`Erreur lors de la déconnexion de ${toolId}:`, error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productivity':
        return <Zap className="h-4 w-4" />;
      case 'design':
        return <Settings className="h-4 w-4" />;
      case 'ai':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Link2 className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'productivity':
        return 'Productivité';
      case 'design':
        return 'Design';
      case 'ai':
        return 'Intelligence Artificielle';
      default:
        return 'Autre';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connecté';
      case 'error':
        return 'Erreur';
      default:
        return 'Non connecté';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Intégrations</h1>
            <p className="text-sm text-muted-foreground">
              Connectez vos outils favoris pour enrichir vos projets de design thinking
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Affichage des erreurs */}
          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-medium text-red-800">Erreur de connexion</div>
                    <div className="text-sm text-red-600">{error}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Indicateur de chargement */}
          {isLoading && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Chargement des intégrations...</span>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {integrations.filter(i => i.status === 'connected').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Connectées</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {integrationTools.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Disponibles</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">MCP</div>
                    <div className="text-sm text-muted-foreground">Protocole</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Liste des intégrations par catégorie */}
          {['productivity', 'ai', 'design'].map(category => {
            const categoryTools = integrationTools.filter(tool => tool.category === category);
            if (categoryTools.length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <h2 className="text-lg font-semibold">{getCategoryLabel(category)}</h2>
                  <Badge variant="outline">{categoryTools.length}</Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {categoryTools.map(tool => (
                    <Card key={tool.id} className="transition-all hover:shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            {tool.icon}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{tool.name}</h3>
                                <Badge 
                                  variant="secondary" 
                                  className={getStatusColor(tool.status)}
                                >
                                  {getStatusLabel(tool.status)}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mb-3">{tool.description}</p>
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-foreground">
                                  Fonctionnalités :
                                </div>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {tool.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {tool.status === 'connected' ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedTool(tool)}
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Configurer
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDisconnect(tool.id)}
                                >
                                  Déconnecter
                                </Button>
                              </>
                            ) : (
                              <Button
                                onClick={() => handleConnect(tool)}
                                disabled={tool.status === 'connecting' || !tool.isAvailable}
                                className="min-w-[100px]"
                              >
                                {tool.status === 'connecting' ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Connexion...
                                  </>
                                ) : (
                                  <>
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Connecter
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Section d'information sur MCP */}
          <Separator />
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Protocole MCP (Model Context Protocol)
              </CardTitle>
              <CardDescription>
                Les intégrations utiliseront le protocole MCP pour une communication sécurisée et standardisée avec les services externes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Communication sécurisée</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Authentification OAuth 2.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Synchronisation temps réel</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Gestion des permissions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Dialog de configuration */}
      <Dialog open={!!selectedTool} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedTool?.icon}
              Configuration {selectedTool?.name}
            </DialogTitle>
            <DialogDescription>
              Configurez les paramètres de connexion pour {selectedTool?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Clé API (optionnel pour la démo)</Label>
              <Input 
                id="api-key" 
                type="password" 
                placeholder="Entrez votre clé API..."
              />
              <div className="text-xs text-muted-foreground">
                Cette clé sera chiffrée et stockée de manière sécurisée
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sync-frequency">Fréquence de synchronisation</Label>
              <select 
                id="sync-frequency"
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="realtime">Temps réel</option>
                <option value="5min">Toutes les 5 minutes</option>
                <option value="15min">Toutes les 15 minutes</option>
                <option value="1hour">Toutes les heures</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">Notifications</div>
                <div className="text-xs text-muted-foreground">
                  Recevoir des notifications pour les mises à jour
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedTool(null)}>
              Annuler
            </Button>
            <Button onClick={() => setSelectedTool(null)}>
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Helper de configuration Notion */}
      {showNotionConfig && (
        <NotionConfigHelper onClose={() => setShowNotionConfig(false)} />
      )}
    </div>
  );
}