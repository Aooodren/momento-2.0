import React, { useState, useEffect, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Bot, 
  Send, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Edit3,
  FileText,
  Wand2,
  Copy,
  ExternalLink
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
import { notionService } from '../services/notionService';

export interface ClaudeBlockData {
  id: string;
  title: string;
  type: 'claude';
  status: 'idle' | 'thinking' | 'completed' | 'error';
  prompt: string;
  inputSource?: {
    type: 'notion';
    blockId: string;
    pageId: string;
    content: string;
  };
  outputTarget?: {
    type: 'notion';
    action: 'create_page' | 'update_page';
    pageId?: string;
    title?: string;
  };
  response?: string;
  lastProcessed?: string;
  metadata: {
    model?: 'claude-3-sonnet' | 'claude-3-haiku';
    maxTokens?: number;
    temperature?: number;
    [key: string]: any;
  };
}

interface ClaudeBlockProps extends NodeProps {
  data: ClaudeBlockData;
}

function ClaudeBlock({ data, selected }: ClaudeBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(data.prompt || '');
  const [error, setError] = useState<string | null>(null);

  // Templates de prompts prédéfinis
  const promptTemplates = {
    'summarize': 'Résume le contenu suivant de manière concise et structurée :\n\n{content}',
    'improve': 'Améliore et restructure le texte suivant en gardant les idées principales :\n\n{content}',
    'translate': 'Traduis le texte suivant en français :\n\n{content}',
    'analyze': 'Analyse le contenu suivant et donne des insights pertinents :\n\n{content}',
    'questions': 'Génère 5 questions pertinentes basées sur ce contenu :\n\n{content}',
    'outline': 'Crée un plan détaillé basé sur le contenu suivant :\n\n{content}',
    'custom': localPrompt || 'Traite le contenu suivant :\n\n{content}'
  };

  // Icône selon le statut
  const getStatusIcon = () => {
    switch (data.status) {
      case 'thinking':
        return Loader2;
      case 'completed':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      default:
        return Bot;
    }
  };

  // Couleur selon le statut
  const getStatusColor = () => {
    switch (data.status) {
      case 'thinking':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-orange-600 bg-orange-50 border-orange-200';
    }
  };

  // Simuler le traitement par Claude
  const processWithClaude = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Récupérer le contenu depuis la source (bloc Notion)
      let inputContent = '';
      if (data.inputSource && data.inputSource.type === 'notion') {
        // Ici, vous devrez récupérer le contenu du bloc Notion connecté
        inputContent = data.inputSource.content || 'Contenu Notion non disponible';
      }

      // Construire le prompt avec le contenu
      const finalPrompt = localPrompt.replace('{content}', inputContent);

      // Simuler l'appel à Claude API
      await simulateClaudeAPI(finalPrompt);

    } catch (error: any) {
      console.error('Erreur lors du traitement Claude:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Simuler l'API Claude (remplacer par le vrai appel)
  const simulateClaudeAPI = async (prompt: string) => {
    // Simulation d'un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Réponse simulée
    const mockResponse = `Voici une analyse du contenu fourni :

**Résumé :** Le contenu traite de [thème principal].

**Points clés :**
• Point important 1
• Point important 2  
• Point important 3

**Recommandations :**
1. Suggestion d'amélioration
2. Action à considérer
3. Prochaine étape

Cette analyse a été générée à partir de votre prompt : "${prompt.slice(0, 100)}..."`;

    // Sauvegarder la réponse et créer une page Notion si configuré
    if (data.outputTarget && data.outputTarget.type === 'notion') {
      await saveToNotion(mockResponse);
    }

    console.log('Réponse Claude:', mockResponse);
    return mockResponse;
  };

  // Sauvegarder dans Notion
  const saveToNotion = async (content: string) => {
    try {
      const isConnected = await notionService.isConnected();
      if (!isConnected) {
        throw new Error('Notion non connecté');
      }

      if (data.outputTarget?.action === 'create_page') {
        // Créer une nouvelle page
        const title = data.outputTarget.title || `Analyse Claude - ${new Date().toLocaleDateString()}`;
        
        // Note: Pour créer une page, il faut un parent (page ou database)
        // Ici, vous devrez avoir configuré un parent par défaut
        console.log('Création page Notion:', { title, content });
        
      } else if (data.outputTarget?.action === 'update_page' && data.outputTarget.pageId) {
        // Mettre à jour une page existante
        console.log('Mise à jour page Notion:', { 
          pageId: data.outputTarget.pageId, 
          content 
        });
      }
    } catch (error: any) {
      console.error('Erreur sauvegarde Notion:', error);
      throw error;
    }
  };

  // Appliquer un template
  const applyTemplate = (templateKey: string) => {
    const template = promptTemplates[templateKey as keyof typeof promptTemplates];
    setLocalPrompt(template);
  };

  const StatusIcon = getStatusIcon();
  const statusColor = getStatusColor();

  return (
    <>
      <Card 
        className={cn(
          'w-80 bg-white border-2 transition-all duration-200 cursor-pointer',
          'border-orange-300 bg-orange-50', // Couleurs Claude
          selected && 'ring-2 ring-blue-500 ring-offset-2',
          isHovered && 'shadow-lg scale-105'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-orange-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white rounded-md shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <span className="text-xs text-muted-foreground">
              Claude AI
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <StatusIcon className={cn("w-3 h-3", 
              data.status === 'thinking' && 'animate-spin'
            )} />
            <Badge 
              variant="secondary" 
              className={cn('text-xs px-2 py-0.5', statusColor)}
            >
              {data.status === 'thinking' ? 'Traitement...' : data.status}
            </Badge>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-3">
          <h3 className="font-medium text-sm mb-2 line-clamp-1">
            {data.title}
          </h3>

          {/* Prompt */}
          <div className="mb-3">
            <Label className="text-xs text-muted-foreground">Prompt:</Label>
            <div className="mt-1 p-2 bg-white border rounded text-xs line-clamp-3">
              {localPrompt || 'Aucun prompt configuré'}
            </div>
          </div>

          {/* Source d'entrée */}
          {data.inputSource && (
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center gap-1 text-xs text-blue-700">
                <FileText className="w-3 h-3" />
                Entrée: {data.inputSource.type}
              </div>
            </div>
          )}

          {/* Cible de sortie */}
          {data.outputTarget && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center gap-1 text-xs text-green-700">
                <FileText className="w-3 h-3" />
                Sortie: {data.outputTarget.action === 'create_page' ? 'Nouvelle page' : 'Mise à jour'}
              </div>
            </div>
          )}

          {/* Réponse */}
          {data.response && (
            <div className="mb-3 p-2 bg-gray-50 border rounded">
              <Label className="text-xs text-muted-foreground">Réponse:</Label>
              <div className="text-xs mt-1 line-clamp-4">
                {data.response}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-1 pt-2 border-t border-orange-100">
            <Button
              size="sm"
              onClick={processWithClaude}
              disabled={isProcessing || !localPrompt.trim()}
              className="flex-1 text-xs bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Traitement...
                </>
              ) : (
                <>
                  <Send className="w-3 h-3 mr-1" />
                  Exécuter
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
              Dernier traitement: {new Date(data.lastProcessed).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Handles spécialisés Claude AI */}
        {/* Inputs */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-blue-400 border-2 border-white"
          id="user-prompt"
          style={{ top: '25%' }}
        />
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-purple-400 border-2 border-white"
          id="context-data"
          style={{ top: '45%' }}
        />
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-green-400 border-2 border-white"
          id="system-instructions"
          style={{ top: '65%' }}
        />
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-yellow-400 border-2 border-white"
          id="memory-context"
          style={{ top: '85%' }}
        />
        
        {/* Outputs */}
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-orange-600 border-2 border-white"
          id="ai-response"
          style={{ top: '30%' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-red-600 border-2 border-white"
          id="structured-data"
          style={{ top: '50%' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-indigo-600 border-2 border-white"
          id="confidence-score"
          style={{ top: '70%' }}
        />
      </Card>

      {/* Dialog de configuration */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Configuration Claude AI
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Templates */}
            <div>
              <Label className="text-sm font-medium">Templates de prompts</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {Object.entries(promptTemplates).slice(0, -1).map(([key, template]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(key)}
                    className="justify-start text-xs"
                  >
                    <Wand2 className="w-3 h-3 mr-2" />
                    {key === 'summarize' && 'Résumer'}
                    {key === 'improve' && 'Améliorer'}
                    {key === 'translate' && 'Traduire'}
                    {key === 'analyze' && 'Analyser'}
                    {key === 'questions' && 'Questions'}
                    {key === 'outline' && 'Plan'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Prompt personnalisé */}
            <div>
              <Label className="text-sm font-medium">Prompt personnalisé</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Utilisez {'{content}'} pour insérer le contenu depuis les blocs connectés
              </p>
              <Textarea
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                placeholder="Entrez votre prompt personnalisé..."
                className="min-h-32"
              />
            </div>

            {/* Configuration modèle */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Modèle</Label>
                <Select 
                  value={data.metadata.model || 'claude-3-sonnet'}
                  onValueChange={(value) => {
                    // Mettre à jour les métadonnées du bloc
                    console.log('Modèle sélectionné:', value);
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

              <div>
                <Label className="text-sm font-medium">Température</Label>
                <Select 
                  value={String(data.metadata.temperature || 0.7)}
                  onValueChange={(value) => {
                    console.log('Température sélectionnée:', value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 (Précis)</SelectItem>
                    <SelectItem value="0.3">0.3 (Peu créatif)</SelectItem>
                    <SelectItem value="0.7">0.7 (Équilibré)</SelectItem>
                    <SelectItem value="1">1 (Créatif)</SelectItem>
                  </SelectContent>
                </Select>
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
                  // Sauvegarder les modifications
                  setShowConfig(false);
                }}
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(ClaudeBlock);