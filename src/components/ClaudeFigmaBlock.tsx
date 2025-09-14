import React, { useState, useEffect, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Bot, 
  Figma, 
  Send, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Edit3,
  FileText,
  Wand2,
  Download,
  Image,
  Eye,
  Layers
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { cn } from './ui/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { useFigmaAPI } from '../hooks/useFigmaAPI';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

export interface ClaudeFigmaBlockData {
  id: string;
  title: string;
  type: 'claude-figma';
  status: 'idle' | 'loading-figma' | 'processing-claude' | 'completed' | 'error';
  prompt: string;
  figmaConfig: {
    fileKey?: string;
    fileName?: string;
    frameIds?: string[];
    analysisType: 'design-critique' | 'accessibility-audit' | 'component-analysis' | 'user-flow' | 'custom';
  };
  outputConfig: {
    format: 'text' | 'structured' | 'recommendations';
    language: 'fr' | 'en';
    includeImages: boolean;
  };
  results?: {
    figmaData?: any;
    claudeAnalysis?: string;
    recommendations?: Array<{
      category: string;
      issue: string;
      suggestion: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  };
  lastProcessed?: string;
  metadata: {
    model?: 'claude-3-sonnet' | 'claude-3-haiku';
    tokensUsed?: number;
    processingTime?: number;
    [key: string]: any;
  };
}

interface ClaudeFigmaBlockProps extends NodeProps {
  data: ClaudeFigmaBlockData;
}

function ClaudeFigmaBlock({ data, selected }: ClaudeFigmaBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(data.prompt || '');
  const [error, setError] = useState<string | null>(null);
  
  // Hooks pour les APIs
  const { importDesign, getUserProjects, getProjectFiles, isConnected: isFigmaConnected } = useFigmaAPI();
  const { callClaude, isConnected: isClaudeConnected } = useClaudeAPI();

  // Templates de prompts spécialisés Figma
  const figmaPromptTemplates = {
    'design-critique': `Analyse ce design Figma et fournis une critique constructive :

**À analyser :**
{figma_data}

**Critères d'évaluation :**
- Hiérarchie visuelle et lisibilité
- Cohérence des composants
- Respect des guidelines UI/UX
- Accessibilité
- Espacement et alignement

Fournis des recommandations spécifiques et actionables.`,

    'accessibility-audit': `Effectue un audit d'accessibilité sur ce design Figma :

**Design à auditer :**
{figma_data}

**Points à vérifier :**
- Contraste des couleurs (WCAG)
- Hiérarchie des titres
- Taille des éléments interactifs
- Navigation au clavier
- Textes alternatifs nécessaires

Classe chaque problème par priorité (haute/moyenne/faible).`,

    'component-analysis': `Analyse les composants de ce design Figma :

**Données Figma :**
{figma_data}

**Analyse demandée :**
- Identification des composants réutilisables
- Cohérence du système de design
- Opportunités d'optimisation
- Suggestions d'amélioration

Propose une architecture de composants optimisée.`,

    'user-flow': `Analyse le parcours utilisateur de ce design Figma :

**Screens/Frames analysés :**
{figma_data}

**Points d'analyse :**
- Fluidité du parcours
- Points de friction potentiels
- Clarté des actions possibles
- Cohérence entre les écrans

Identifie les améliorations UX prioritaires.`,

    'custom': localPrompt || `Analyse le design Figma suivant selon tes critères :

{figma_data}

Fournis une analyse détaillée et des recommandations.`
  };

  // Obtenir l'icône selon le statut
  const getStatusIcon = () => {
    switch (data.status) {
      case 'loading-figma':
        return Figma;
      case 'processing-claude':
        return Bot;
      case 'completed':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      default:
        return Layers;
    }
  };

  // Obtenir les couleurs selon le statut
  const getStatusColor = () => {
    switch (data.status) {
      case 'loading-figma':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'processing-claude':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  // Traitement principal : Figma → Claude
  const processWithClaudeFigma = async () => {
    if (!isFigmaConnected()) {
      setError('Figma non connecté');
      return;
    }

    if (!isClaudeConnected()) {
      setError('Claude non connecté');
      return;
    }

    if (!data.figmaConfig.fileKey) {
      setError('Fichier Figma non sélectionné');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      // Étape 1 : Récupérer les données Figma
      const figmaData = await importDesign(data.figmaConfig.fileKey);
      
      // Étape 2 : Préparer les données pour Claude
      const figmaContext = prepareFigmaContextForClaude(figmaData);
      
      // Étape 3 : Construire le prompt
      const templateKey = data.figmaConfig.analysisType;
      const promptTemplate = figmaPromptTemplates[templateKey] || figmaPromptTemplates.custom;
      const finalPrompt = promptTemplate.replace('{figma_data}', figmaContext);
      
      // Étape 4 : Appeler Claude
      const claudeResponse = await callClaude([{
        role: 'user',
        content: finalPrompt
      }]);

      // Étape 5 : Traiter et structurer la réponse
      const structuredResults = await processClaudeResponse(claudeResponse.content, figmaData);
      
      // Simulation de la sauvegarde des résultats
      console.log('Résultats Claude-Figma:', structuredResults);
      
    } catch (error: any) {
      console.error('Erreur traitement Claude-Figma:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Préparer le contexte Figma pour Claude
  const prepareFigmaContextForClaude = (figmaData: any) => {
    const context = {
      fileName: figmaData.metadata.fileName,
      framesCount: figmaData.frames.length,
      frames: figmaData.frames.map((frame: any) => ({
        name: frame.name,
        type: frame.type,
        dimensions: frame.absoluteBoundingBox
      })),
      images: figmaData.images.map((img: any) => ({
        name: img.name,
        hasImage: !!img.url
      }))
    };

    return JSON.stringify(context, null, 2);
  };

  // Traiter la réponse de Claude pour la structurer
  const processClaudeResponse = async (response: string, figmaData: any) => {
    // Parser la réponse pour extraire les recommandations
    const recommendations = extractRecommendations(response);
    
    return {
      figmaData,
      claudeAnalysis: response,
      recommendations,
      metadata: {
        processedAt: new Date().toISOString(),
        figmaFile: figmaData.metadata.fileName
      }
    };
  };

  // Extraire les recommandations de la réponse Claude
  const extractRecommendations = (response: string) => {
    // Logique simple pour extraire des recommandations
    // En pratique, vous pourriez utiliser des regex plus sophistiquées
    const recommendations = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('recommandation') || line.includes('amélioration') || line.includes('suggestion')) {
        recommendations.push({
          category: 'général',
          issue: 'Point identifié',
          suggestion: line.trim(),
          priority: 'medium' as const
        });
      }
    }
    
    return recommendations;
  };

  // Appliquer un template
  const applyTemplate = (templateKey: string) => {
    const template = figmaPromptTemplates[templateKey as keyof typeof figmaPromptTemplates];
    setLocalPrompt(template);
  };

  const StatusIcon = getStatusIcon();
  const statusColor = getStatusColor();
  const isConnected = isFigmaConnected() && isClaudeConnected();

  return (
    <>
      <Card 
        className={cn(
          'w-80 bg-white border-2 transition-all duration-200 cursor-pointer',
          'border-indigo-300 bg-indigo-50', // Couleurs Claude-Figma
          selected && 'ring-2 ring-blue-500 ring-offset-2',
          isHovered && 'shadow-lg scale-105',
          !isConnected && 'opacity-60 border-dashed'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header avec icônes combinées */}
        <div className="flex items-center justify-between p-3 border-b border-indigo-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="p-1 bg-white rounded-md shadow-sm mr-1">
                <Bot className="w-3 h-3 text-orange-500" />
              </div>
              <div className="p-1 bg-white rounded-md shadow-sm">
                <Figma className="w-3 h-3 text-purple-500" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              Claude + Figma
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <StatusIcon className={cn("w-3 h-3", 
              data.status === 'processing-claude' && 'animate-spin'
            )} />
            <Badge 
              variant="secondary" 
              className={cn('text-xs px-2 py-0.5', statusColor)}
            >
              {data.status === 'loading-figma' && 'Chargement Figma'}
              {data.status === 'processing-claude' && 'Analyse Claude'}
              {data.status === 'completed' && 'Terminé'}
              {data.status === 'error' && 'Erreur'}
              {data.status === 'idle' && 'Prêt'}
            </Badge>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-3">
          <h3 className="font-medium text-sm mb-2 line-clamp-1">
            {data.title}
          </h3>

          {/* Configuration Figma */}
          <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded">
            <div className="flex items-center gap-1 text-xs text-purple-700 mb-1">
              <Figma className="w-3 h-3" />
              Source Figma
            </div>
            <div className="text-xs">
              {data.figmaConfig.fileName ? (
                <>
                  <div className="font-medium">{data.figmaConfig.fileName}</div>
                  <div className="text-muted-foreground">
                    {data.figmaConfig.analysisType} • {data.figmaConfig.frameIds?.length || 0} frames
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">Fichier non sélectionné</div>
              )}
            </div>
          </div>

          {/* Type d'analyse */}
          <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded">
            <div className="flex items-center gap-1 text-xs text-orange-700 mb-1">
              <Bot className="w-3 h-3" />
              Analyse Claude
            </div>
            <div className="text-xs">
              <div className="font-medium">
                {data.figmaConfig.analysisType.replace('-', ' ')}
              </div>
              <div className="text-muted-foreground">
                Format: {data.outputConfig.format} • Lang: {data.outputConfig.language}
              </div>
            </div>
          </div>

          {/* Résultats */}
          {data.results?.recommendations && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center gap-1 text-xs text-green-700 mb-1">
                <CheckCircle className="w-3 h-3" />
                Résultats
              </div>
              <div className="text-xs">
                {data.results.recommendations.length} recommandations
                {data.metadata.tokensUsed && (
                  <div className="text-muted-foreground">
                    {data.metadata.tokensUsed} tokens • {data.metadata.processingTime}ms
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Statut de connexion */}
          {!isConnected && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
              ⚠️ {!isFigmaConnected() && 'Figma'} {!isClaudeConnected() && !isFigmaConnected() && ' et '} {!isClaudeConnected() && 'Claude'} non connecté
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-1 pt-2 border-t border-indigo-100">
            <Button
              size="sm"
              onClick={processWithClaudeFigma}
              disabled={isProcessing || !isConnected || !data.figmaConfig.fileKey}
              className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  {data.status === 'loading-figma' ? 'Import...' : 'Analyse...'}
                </>
              ) : (
                <>
                  <Send className="w-3 h-3 mr-1" />
                  Analyser
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfig(true)}
              className="text-xs"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          </div>

          {/* Erreur */}
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Timestamp */}
          {data.lastProcessed && (
            <div className="text-xs text-muted-foreground mt-2">
              Dernière analyse: {new Date(data.lastProcessed).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Handles spécialisés Figma */}
        {/* Inputs */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-blue-400 border-2 border-white"
          id="design-files"
          style={{ top: '30%' }}
        />
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-purple-400 border-2 border-white"
          id="prompt-context"
          style={{ top: '50%' }}
        />
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-green-400 border-2 border-white"
          id="design-tokens"
          style={{ top: '70%' }}
        />
        
        {/* Outputs */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-orange-600 border-2 border-white"
          id="analysis-text"
          style={{ top: '25%' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-red-600 border-2 border-white"
          id="recommendations"
          style={{ top: '45%' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-indigo-600 border-2 border-white"
          id="extracted-colors"
          style={{ top: '65%' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-teal-600 border-2 border-white"
          id="component-list"
          style={{ top: '85%' }}
        />
      </Card>

      {/* Dialog de configuration */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center">
                <Bot className="w-4 h-4 text-orange-500 mr-1" />
                <Figma className="w-4 h-4 text-purple-500" />
              </div>
              Configuration Claude + Figma
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 pr-4">
              {/* Configuration Figma */}
              <div>
                <Label className="text-sm font-medium">Configuration Figma</Label>
                <div className="mt-2 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Clé du fichier Figma</Label>
                    <Input 
                      placeholder="Clé du fichier (ex: abc123...)"
                      value={data.figmaConfig.fileKey || ''}
                      onChange={(e) => {
                        // Mettre à jour la configuration
                        console.log('File key:', e.target.value);
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Trouvez la clé dans l'URL Figma : figma.com/file/[CLE]/...
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Type d'analyse</Label>
                    <Select 
                      value={data.figmaConfig.analysisType}
                      onValueChange={(value) => {
                        console.log('Analysis type:', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="design-critique">Critique de design</SelectItem>
                        <SelectItem value="accessibility-audit">Audit d'accessibilité</SelectItem>
                        <SelectItem value="component-analysis">Analyse des composants</SelectItem>
                        <SelectItem value="user-flow">Analyse du parcours utilisateur</SelectItem>
                        <SelectItem value="custom">Analyse personnalisée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Templates de prompts */}
              <div>
                <Label className="text-sm font-medium">Templates d'analyse</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {Object.entries(figmaPromptTemplates).slice(0, -1).map(([key, template]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(key)}
                      className="justify-start text-xs"
                    >
                      <Wand2 className="w-3 h-3 mr-2" />
                      {key === 'design-critique' && 'Critique design'}
                      {key === 'accessibility-audit' && 'Audit accessibilité'}
                      {key === 'component-analysis' && 'Analyse composants'}
                      {key === 'user-flow' && 'Parcours utilisateur'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Prompt personnalisé */}
              <div>
                <Label className="text-sm font-medium">Prompt d'analyse personnalisé</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Utilisez {'{figma_data}'} pour insérer les données Figma
                </p>
                <Textarea
                  value={localPrompt}
                  onChange={(e) => setLocalPrompt(e.target.value)}
                  placeholder="Prompt d'analyse personnalisé..."
                  className="min-h-32"
                />
              </div>

              {/* Configuration de sortie */}
              <div>
                <Label className="text-sm font-medium">Configuration de sortie</Label>
                <div className="mt-2 grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Format</Label>
                    <Select 
                      value={data.outputConfig.format}
                      onValueChange={(value) => {
                        console.log('Output format:', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texte libre</SelectItem>
                        <SelectItem value="structured">Structuré JSON</SelectItem>
                        <SelectItem value="recommendations">Recommandations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Langue</Label>
                    <Select 
                      value={data.outputConfig.language}
                      onValueChange={(value) => {
                        console.log('Language:', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Modèle Claude</Label>
                    <Select 
                      value={data.metadata.model || 'claude-3-sonnet'}
                      onValueChange={(value) => {
                        console.log('Model:', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfig(false)}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={() => {
                    setShowConfig(false);
                  }}
                >
                  Sauvegarder
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(ClaudeFigmaBlock);