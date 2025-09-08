import React, { useState, useEffect, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Bot, 
  FileText, 
  Send, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Edit3,
  Wand2,
  Download,
  Upload,
  Database,
  Plus,
  RefreshCw
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
import { useClaudeAPI } from '../hooks/useClaudeAPI';

export interface ClaudeNotionBlockData {
  id: string;
  title: string;
  type: 'claude-notion';
  status: 'idle' | 'loading-notion' | 'processing-claude' | 'saving-notion' | 'completed' | 'error';
  prompt: string;
  notionConfig: {
    sourceType: 'page' | 'database' | 'blocks';
    sourceId?: string;
    sourceName?: string;
    processType: 'content-enhancement' | 'data-extraction' | 'summarization' | 'translation' | 'qa-generation' | 'custom';
    filters?: {
      properties?: string[];
      dateRange?: { start: string; end: string };
    };
  };
  outputConfig: {
    action: 'create-page' | 'update-page' | 'create-database-entry' | 'append-blocks';
    targetId?: string;
    targetName?: string;
    template?: string;
    properties?: Record<string, any>;
  };
  results?: {
    notionData?: any;
    claudeResponse?: string;
    outputData?: any;
    createdPages?: Array<{ id: string; title: string; url: string }>;
  };
  lastProcessed?: string;
  metadata: {
    model?: 'claude-3-sonnet' | 'claude-3-haiku';
    tokensUsed?: number;
    processingTime?: number;
    notionBlocks?: number;
    [key: string]: any;
  };
}

interface ClaudeNotionBlockProps extends NodeProps {
  data: ClaudeNotionBlockData;
}

function ClaudeNotionBlock({ data, selected }: ClaudeNotionBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(data.prompt || '');
  const [error, setError] = useState<string | null>(null);
  
  // Hook pour Claude API (Notion sera géré via le serveur MCP existant)
  const { callClaude, isConnected: isClaudeConnected } = useClaudeAPI();

  // Templates de prompts spécialisés Notion
  const notionPromptTemplates = {
    'content-enhancement': `Améliore et enrichis ce contenu Notion :

**Contenu source :**
{notion_content}

**Améliorations demandées :**
- Restructuration pour plus de clarté
- Ajout de détails pertinents
- Amélioration du style et de la lisibilité
- Suggestions de sections supplémentaires

Conserve la structure Notion (titres, listes, etc.) et fournis un contenu plus riche et engageant.`,

    'data-extraction': `Extrais et structure les données importantes de ce contenu Notion :

**Source Notion :**
{notion_content}

**Extraction demandée :**
- Informations clés et données factuelles
- Dates et chiffres importants
- Actions et tâches identifiées
- Personnes et organisations mentionnées

Organise les données en format structuré pour une utilisation ultérieure.`,

    'summarization': `Créé un résumé concis et structuré de ce contenu Notion :

**Contenu à résumer :**
{notion_content}

**Format du résumé :**
- Points clés (3-5 maximum)
- Conclusions principales
- Actions à retenir
- Informations importantes

Le résumé doit être informatif et facile à parcourir.`,

    'translation': `Traduis ce contenu Notion tout en préservant sa structure :

**Contenu source :**
{notion_content}

**Instructions de traduction :**
- Conserve tous les titres, listes et formatage
- Adapte le ton et le style à la langue cible
- Préserve les liens et références
- Maintiens la cohérence terminologique

Langue cible : {target_language}`,

    'qa-generation': `Génère des questions et réponses basées sur ce contenu Notion :

**Contenu source :**
{notion_content}

**Types de questions à créer :**
- Questions de compréhension
- Questions d'approfondissement
- Questions pratiques d'application
- Questions de révision

Format : Pour chaque question, fournis une réponse complète et référencée.`,

    'custom': localPrompt || `Traite le contenu Notion suivant selon tes critères :

{notion_content}

Fournis un résultat structuré et utile.`
  };

  // Obtenir l'icône selon le statut
  const getStatusIcon = () => {
    switch (data.status) {
      case 'loading-notion':
        return Database;
      case 'processing-claude':
        return Bot;
      case 'saving-notion':
        return Upload;
      case 'completed':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      default:
        return FileText;
    }
  };

  // Obtenir les couleurs selon le statut
  const getStatusColor = () => {
    switch (data.status) {
      case 'loading-notion':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'processing-claude':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'saving-notion':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  // Traitement principal : Notion → Claude → Notion
  const processWithClaudeNotion = async () => {
    if (!isClaudeConnected()) {
      setError('Claude non connecté');
      return;
    }

    if (!data.notionConfig.sourceId) {
      setError('Source Notion non configurée');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      // Étape 1 : Récupérer les données depuis Notion via MCP
      const notionData = await loadNotionData();
      
      // Étape 2 : Préparer le contexte pour Claude
      const notionContext = prepareNotionContextForClaude(notionData);
      
      // Étape 3 : Construire le prompt
      const templateKey = data.notionConfig.processType;
      const promptTemplate = notionPromptTemplates[templateKey] || notionPromptTemplates.custom;
      let finalPrompt = promptTemplate.replace('{notion_content}', notionContext);
      
      // Remplacer les variables spécifiques
      if (templateKey === 'translation' && data.outputConfig.properties?.language) {
        finalPrompt = finalPrompt.replace('{target_language}', data.outputConfig.properties.language);
      }
      
      // Étape 4 : Appeler Claude
      const claudeResponse = await callClaude([{
        role: 'user',
        content: finalPrompt
      }]);

      // Étape 5 : Sauvegarder le résultat dans Notion
      const savedResults = await saveResultsToNotion(claudeResponse.content, notionData);
      
      console.log('Résultats Claude-Notion:', {
        claudeResponse: claudeResponse.content,
        savedResults
      });
      
    } catch (error: any) {
      console.error('Erreur traitement Claude-Notion:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Charger les données depuis Notion (via MCP)
  const loadNotionData = async () => {
    // Simulation - en pratique utiliser le serveur MCP Notion
    return {
      id: data.notionConfig.sourceId,
      type: data.notionConfig.sourceType,
      title: data.notionConfig.sourceName,
      content: "Contenu exemple depuis Notion...",
      properties: {},
      blocks: []
    };
  };

  // Préparer le contexte Notion pour Claude
  const prepareNotionContextForClaude = (notionData: any) => {
    const context = {
      title: notionData.title,
      type: notionData.type,
      content: notionData.content,
      properties: notionData.properties,
      blocksCount: notionData.blocks?.length || 0
    };

    return JSON.stringify(context, null, 2);
  };

  // Sauvegarder les résultats dans Notion
  const saveResultsToNotion = async (claudeResponse: string, originalData: any) => {
    const actionType = data.outputConfig.action;
    
    switch (actionType) {
      case 'create-page':
        return await createNotionPage(claudeResponse);
      case 'update-page':
        return await updateNotionPage(claudeResponse);
      case 'create-database-entry':
        return await createDatabaseEntry(claudeResponse);
      case 'append-blocks':
        return await appendNotionBlocks(claudeResponse);
      default:
        return { success: true, message: 'Traitement terminé sans sauvegarde' };
    }
  };

  // Créer une nouvelle page Notion
  const createNotionPage = async (content: string) => {
    // Via MCP Notion server
    return {
      id: 'new-page-id',
      title: data.outputConfig.targetName || 'Claude Analysis',
      url: 'https://notion.so/new-page-id',
      success: true
    };
  };

  // Mettre à jour une page existante
  const updateNotionPage = async (content: string) => {
    return {
      id: data.outputConfig.targetId,
      updated: true,
      success: true
    };
  };

  // Créer une entrée de database
  const createDatabaseEntry = async (content: string) => {
    return {
      id: 'new-entry-id',
      database: data.outputConfig.targetId,
      success: true
    };
  };

  // Ajouter des blocs à une page
  const appendNotionBlocks = async (content: string) => {
    return {
      pageId: data.outputConfig.targetId,
      blocksAdded: content.split('\n').length,
      success: true
    };
  };

  // Appliquer un template
  const applyTemplate = (templateKey: string) => {
    const template = notionPromptTemplates[templateKey as keyof typeof notionPromptTemplates];
    setLocalPrompt(template);
  };

  const StatusIcon = getStatusIcon();
  const statusColor = getStatusColor();
  const isNotionConfigured = data.notionConfig.sourceId && data.outputConfig.action;

  return (
    <>
      <Card 
        className={cn(
          'w-80 bg-white border-2 transition-all duration-200 cursor-pointer',
          'border-slate-300 bg-slate-50', // Couleurs Claude-Notion
          selected && 'ring-2 ring-blue-500 ring-offset-2',
          isHovered && 'shadow-lg scale-105',
          !isNotionConfigured && 'opacity-60 border-dashed'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header avec icônes combinées */}
        <div className="flex items-center justify-between p-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="p-1 bg-white rounded-md shadow-sm mr-1">
                <Bot className="w-3 h-3 text-orange-500" />
              </div>
              <div className="p-1 bg-white rounded-md shadow-sm">
                <FileText className="w-3 h-3 text-gray-600" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              Claude + Notion
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <StatusIcon className={cn("w-3 h-3", 
              (data.status === 'processing-claude' || data.status === 'loading-notion') && 'animate-spin'
            )} />
            <Badge 
              variant="secondary" 
              className={cn('text-xs px-2 py-0.5', statusColor)}
            >
              {data.status === 'loading-notion' && 'Chargement'}
              {data.status === 'processing-claude' && 'Traitement'}
              {data.status === 'saving-notion' && 'Sauvegarde'}
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

          {/* Configuration source Notion */}
          <div className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded">
            <div className="flex items-center gap-1 text-xs text-gray-700 mb-1">
              <Database className="w-3 h-3" />
              Source Notion
            </div>
            <div className="text-xs">
              {data.notionConfig.sourceName ? (
                <>
                  <div className="font-medium">{data.notionConfig.sourceName}</div>
                  <div className="text-muted-foreground">
                    {data.notionConfig.sourceType} • {data.notionConfig.processType.replace('-', ' ')}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">Source non configurée</div>
              )}
            </div>
          </div>

          {/* Configuration sortie */}
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-1 text-xs text-blue-700 mb-1">
              <Upload className="w-3 h-3" />
              Destination Notion
            </div>
            <div className="text-xs">
              {data.outputConfig.targetName ? (
                <>
                  <div className="font-medium">{data.outputConfig.targetName}</div>
                  <div className="text-muted-foreground">
                    {data.outputConfig.action.replace('-', ' ')}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">
                  {data.outputConfig.action.replace('-', ' ')}
                </div>
              )}
            </div>
          </div>

          {/* Résultats */}
          {data.results?.createdPages && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center gap-1 text-xs text-green-700 mb-1">
                <CheckCircle className="w-3 h-3" />
                Résultats
              </div>
              <div className="text-xs">
                {data.results.createdPages.length} page(s) créée(s)
                {data.metadata.tokensUsed && (
                  <div className="text-muted-foreground">
                    {data.metadata.tokensUsed} tokens • {data.metadata.processingTime}ms
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-1 pt-2 border-t border-slate-100">
            <Button
              size="sm"
              onClick={processWithClaudeNotion}
              disabled={isProcessing || !isClaudeConnected() || !isNotionConfigured}
              className="flex-1 text-xs bg-slate-600 hover:bg-slate-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  {data.status === 'loading-notion' && 'Import...'}
                  {data.status === 'processing-claude' && 'Traitement...'}
                  {data.status === 'saving-notion' && 'Sauvegarde...'}
                </>
              ) : (
                <>
                  <Send className="w-3 h-3 mr-1" />
                  Traiter
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
              Dernière exécution: {new Date(data.lastProcessed).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Handles pour les connexions */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
          id="notion-input"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-slate-600 border-2 border-white"
          id="result-output"
        />
      </Card>

      {/* Dialog de configuration */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center">
                <Bot className="w-4 h-4 text-orange-500 mr-1" />
                <FileText className="w-4 h-4 text-gray-600" />
              </div>
              Configuration Claude + Notion
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 pr-4">
              {/* Configuration source Notion */}
              <div>
                <Label className="text-sm font-medium">Source Notion</Label>
                <div className="mt-2 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Type de source</Label>
                      <Select 
                        value={data.notionConfig.sourceType}
                        onValueChange={(value) => {
                          console.log('Source type:', value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="page">Page Notion</SelectItem>
                          <SelectItem value="database">Base de données</SelectItem>
                          <SelectItem value="blocks">Blocs spécifiques</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Type de traitement</Label>
                      <Select 
                        value={data.notionConfig.processType}
                        onValueChange={(value) => {
                          console.log('Process type:', value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="content-enhancement">Amélioration contenu</SelectItem>
                          <SelectItem value="data-extraction">Extraction données</SelectItem>
                          <SelectItem value="summarization">Résumé</SelectItem>
                          <SelectItem value="translation">Traduction</SelectItem>
                          <SelectItem value="qa-generation">Questions/Réponses</SelectItem>
                          <SelectItem value="custom">Personnalisé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">ID de la source Notion</Label>
                    <Input 
                      placeholder="ID de page, database ou bloc..."
                      value={data.notionConfig.sourceId || ''}
                      onChange={(e) => {
                        console.log('Source ID:', e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Configuration destination */}
              <div>
                <Label className="text-sm font-medium">Destination Notion</Label>
                <div className="mt-2 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Action</Label>
                    <Select 
                      value={data.outputConfig.action}
                      onValueChange={(value) => {
                        console.log('Output action:', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="create-page">Créer nouvelle page</SelectItem>
                        <SelectItem value="update-page">Mettre à jour page existante</SelectItem>
                        <SelectItem value="create-database-entry">Créer entrée database</SelectItem>
                        <SelectItem value="append-blocks">Ajouter des blocs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">ID de destination (optionnel)</Label>
                    <Input 
                      placeholder="ID page/database destination..."
                      value={data.outputConfig.targetId || ''}
                      onChange={(e) => {
                        console.log('Target ID:', e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Templates */}
              <div>
                <Label className="text-sm font-medium">Templates de traitement</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {Object.entries(notionPromptTemplates).slice(0, -1).map(([key, template]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(key)}
                      className="justify-start text-xs"
                    >
                      <Wand2 className="w-3 h-3 mr-2" />
                      {key === 'content-enhancement' && 'Amélioration'}
                      {key === 'data-extraction' && 'Extraction'}
                      {key === 'summarization' && 'Résumé'}
                      {key === 'translation' && 'Traduction'}
                      {key === 'qa-generation' && 'Q&A'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Prompt personnalisé */}
              <div>
                <Label className="text-sm font-medium">Prompt de traitement personnalisé</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Utilisez {'{notion_content}'} pour insérer le contenu Notion
                </p>
                <Textarea
                  value={localPrompt}
                  onChange={(e) => setLocalPrompt(e.target.value)}
                  placeholder="Prompt de traitement personnalisé..."
                  className="min-h-32"
                />
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

export default memo(ClaudeNotionBlock);