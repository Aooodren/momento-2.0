import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  FileText,
  Brain,
  Figma,
  Clock,
  Webhook,
  Zap,
  Database,
  Globe,
  Settings,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { cn } from './ui/utils';
import { WorkflowBlockType, ApplicationType, WorkflowAction } from './WorkflowBlock';

// Templates de blocs pré-configurés
interface BlockTemplate {
  id: string;
  title: string;
  description: string;
  blockType: WorkflowBlockType;
  application: ApplicationType;
  action: Partial<WorkflowAction>;
  category: 'trigger' | 'action' | 'condition' | 'transformer';
  tags: string[];
  icon: React.ComponentType<any>;
}

const blockTemplates: BlockTemplate[] = [
  // Déclencheurs
  {
    id: 'trigger_timer',
    title: 'Timer',
    description: 'Déclenche le workflow à intervalles réguliers',
    blockType: 'trigger',
    application: 'timer',
    action: {
      operation: 'schedule',
      config: { interval: 3600000 }, // 1 heure
      description: 'Déclenchement programmé'
    },
    category: 'trigger',
    tags: ['temps', 'automatisation'],
    icon: Clock
  },
  {
    id: 'trigger_webhook',
    title: 'Webhook',
    description: 'Déclenche le workflow via un webhook HTTP',
    blockType: 'trigger',
    application: 'webhook',
    action: {
      operation: 'listen',
      config: { method: 'POST' },
      description: 'Réception webhook'
    },
    category: 'trigger',
    tags: ['http', 'api', 'événement'],
    icon: Webhook
  },

  // Actions Notion
  {
    id: 'notion_get_page',
    title: 'Récupérer Page Notion',
    description: 'Récupère le contenu d\'une page Notion',
    blockType: 'action',
    application: 'notion',
    action: {
      operation: 'get_page',
      config: { pageId: '' },
      description: 'Lecture page Notion'
    },
    category: 'action',
    tags: ['notion', 'lecture', 'contenu'],
    icon: FileText
  },
  {
    id: 'notion_create_page',
    title: 'Créer Page Notion',
    description: 'Crée une nouvelle page dans Notion',
    blockType: 'action',
    application: 'notion',
    action: {
      operation: 'create_page',
      config: { parentId: '', title: 'Nouvelle page' },
      description: 'Création page Notion'
    },
    category: 'action',
    tags: ['notion', 'création', 'contenu'],
    icon: FileText
  },
  {
    id: 'notion_summary',
    title: 'Résumer Contenu Notion',
    description: 'Génère un résumé du contenu Notion',
    blockType: 'action',
    application: 'notion',
    action: {
      operation: 'generate_summary',
      config: {},
      description: 'Résumé automatique'
    },
    category: 'action',
    tags: ['notion', 'résumé', 'analyse'],
    icon: FileText
  },

  // Actions Claude
  {
    id: 'claude_analyze',
    title: 'Analyser avec Claude',
    description: 'Analyse le contenu avec l\'IA Claude',
    blockType: 'action',
    application: 'claude',
    action: {
      operation: 'analyze_content',
      config: { analysisType: 'general' },
      description: 'Analyse IA du contenu'
    },
    category: 'action',
    tags: ['claude', 'analyse', 'ia'],
    icon: Brain
  },
  {
    id: 'claude_generate_ideas',
    title: 'Générer Idées',
    description: 'Génère des idées de design thinking',
    blockType: 'action',
    application: 'claude',
    action: {
      operation: 'generate_ideas',
      config: { topic: 'design thinking', context: '' },
      description: 'Génération d\'idées'
    },
    category: 'action',
    tags: ['claude', 'créativité', 'idées'],
    icon: Brain
  },
  {
    id: 'claude_summarize',
    title: 'Résumer Texte',
    description: 'Crée un résumé intelligent du contenu',
    blockType: 'action',
    application: 'claude',
    action: {
      operation: 'summarize',
      config: { maxLength: 200 },
      description: 'Résumé intelligent'
    },
    category: 'action',
    tags: ['claude', 'résumé', 'texte'],
    icon: Brain
  },

  // Actions Figma
  {
    id: 'figma_get_file',
    title: 'Récupérer Fichier Figma',
    description: 'Récupère les informations d\'un fichier Figma',
    blockType: 'action',
    application: 'figma',
    action: {
      operation: 'get_file',
      config: { fileKey: '' },
      description: 'Lecture fichier Figma'
    },
    category: 'action',
    tags: ['figma', 'design', 'fichier'],
    icon: Figma
  },
  {
    id: 'figma_export_frames',
    title: 'Exporter Frames',
    description: 'Exporte les frames Figma en images',
    blockType: 'action',
    application: 'figma',
    action: {
      operation: 'export_frames',
      config: { fileKey: '', nodeIds: [], format: 'PNG' },
      description: 'Export d\'images'
    },
    category: 'action',
    tags: ['figma', 'export', 'images'],
    icon: Figma
  },
  {
    id: 'figma_post_comment',
    title: 'Commenter Design',
    description: 'Ajoute un commentaire sur un design Figma',
    blockType: 'action',
    application: 'figma',
    action: {
      operation: 'post_comment',
      config: { fileKey: '', message: '' },
      description: 'Ajout de commentaire'
    },
    category: 'action',
    tags: ['figma', 'commentaire', 'collaboration'],
    icon: Figma
  },

  // Transformateurs
  {
    id: 'transform_json',
    title: 'Transformer JSON',
    description: 'Transforme et formate des données JSON',
    blockType: 'transformer',
    application: 'webhook',
    action: {
      operation: 'transform_data',
      config: { format: 'json' },
      description: 'Transformation de données'
    },
    category: 'transformer',
    tags: ['données', 'transformation', 'json'],
    icon: Settings
  }
];

interface WorkflowPaletteProps {
  onAddBlock: (template: BlockTemplate, position: { x: number, y: number }) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export default function WorkflowPalette({ onAddBlock, isVisible, onToggleVisibility }: WorkflowPaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [draggedTemplate, setDraggedTemplate] = useState<BlockTemplate | null>(null);

  // Filtrer les templates
  const filteredTemplates = blockTemplates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Grouper par catégorie
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, BlockTemplate[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'trigger': return Play;
      case 'action': return Zap;
      case 'condition': return Filter;
      case 'transformer': return Settings;
      default: return Zap;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'trigger': return 'Déclencheurs';
      case 'action': return 'Actions';
      case 'condition': return 'Conditions';
      case 'transformer': return 'Transformateurs';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trigger': return 'border-green-200 bg-green-50';
      case 'action': return 'border-blue-200 bg-blue-50';
      case 'condition': return 'border-yellow-200 bg-yellow-50';
      case 'transformer': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const handleDragStart = (e: React.DragEvent, template: BlockTemplate) => {
    setDraggedTemplate(template);
    e.dataTransfer.setData('application/json', JSON.stringify(template));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedTemplate(null);
  };

  const handleTemplateClick = (template: BlockTemplate) => {
    // Ajouter le bloc au centre du canvas
    onAddBlock(template, { x: 200, y: 200 });
  };

  if (!isVisible) {
    return (
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleVisibility}
          className="bg-white shadow-lg border-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Blocs
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Overlay pour fermer la palette */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-20 z-40" 
        onClick={onToggleVisibility}
      />
      
      {/* Palette */}
      <div className="fixed left-4 top-4 bottom-4 w-80 bg-white rounded-lg shadow-xl border z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Blocs Workflow</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleVisibility}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
          
          {/* Recherche */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher des blocs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filtres par catégorie */}
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="h-7 text-xs"
            >
              Tous
            </Button>
            {['trigger', 'action', 'condition', 'transformer'].map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                className="h-7 text-xs"
              >
                {getCategoryLabel(category)}
              </Button>
            ))}
          </div>
        </div>

        {/* Liste des templates */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  {React.createElement(getCategoryIcon(category), { className: 'w-4 h-4' })}
                  <h3 className="font-medium text-sm">{getCategoryLabel(category)}</h3>
                  <Badge variant="outline" className="text-xs">
                    {templates.length}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {templates.map(template => (
                    <Card
                      key={template.id}
                      className={cn(
                        'p-3 cursor-pointer border-2 transition-all duration-200 hover:shadow-md',
                        getCategoryColor(template.category),
                        draggedTemplate?.id === template.id && 'opacity-50'
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, template)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleTemplateClick(template)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-white rounded-md shadow-sm flex-shrink-0">
                          <template.icon className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1">{template.title}</h4>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {template.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0.5">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {category !== Object.keys(groupedTemplates)[Object.keys(groupedTemplates).length - 1] && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
            
            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun bloc trouvé</p>
                <p className="text-xs">Essayez de modifier votre recherche</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Instructions */}
        <div className="p-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            💡 Glissez-déposez ou cliquez pour ajouter un bloc au canvas
          </p>
        </div>
      </div>
    </>
  );
}

export { blockTemplates, type BlockTemplate };