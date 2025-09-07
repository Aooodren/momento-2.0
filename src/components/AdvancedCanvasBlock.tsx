import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Figma, 
  FileText, 
  Zap, 
  Globe, 
  Database, 
  Code, 
  Image, 
  Video, 
  File,
  Wifi,
  WifiOff,
  Edit3,
  Trash2,
  Brain,
  Settings,
  Play
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from './ui/utils';

// Types d'icônes selon le type de bloc
const blockIcons = {
  figma: Figma,
  notion: FileText,
  figjam: Zap,
  website: Globe,
  database: Database,
  code: Code,
  image: Image,
  video: Video,
  document: File,
  openai: Brain,
  api: Globe,
  tool: Settings,
  other: File,
};

// Couleurs selon le type de bloc
const blockColors = {
  figma: 'border-purple-500 bg-purple-50',
  notion: 'border-gray-500 bg-gray-50', 
  figjam: 'border-yellow-500 bg-yellow-50',
  website: 'border-blue-500 bg-blue-50',
  database: 'border-green-500 bg-green-50',
  code: 'border-orange-500 bg-orange-50',
  image: 'border-pink-500 bg-pink-50',
  video: 'border-red-500 bg-red-50',
  document: 'border-indigo-500 bg-indigo-50',
  openai: 'border-green-600 bg-green-50',
  api: 'border-cyan-500 bg-cyan-50',
  tool: 'border-slate-500 bg-slate-50',
  other: 'border-gray-400 bg-gray-50',
};

// Types de données pour les inputs/outputs
export type DataType = 'text' | 'number' | 'boolean' | 'object' | 'array' | 'file' | 'image';

// Interface pour un input ou output
export interface BlockPort {
  id: string;
  label: string;
  type: DataType;
  required?: boolean;
  description?: string;
  value?: any;
}

// Configuration spécifique par type de bloc
export const blockConfigurations = {
  notion: {
    inputs: [
      { id: 'page_id', label: 'Page ID', type: 'text' as DataType, required: true, description: 'ID de la page Notion' },
      { id: 'database_id', label: 'Database ID', type: 'text' as DataType, description: 'ID de la base de données' }
    ],
    outputs: [
      { id: 'content', label: 'Content', type: 'text' as DataType, description: 'Contenu de la page' },
      { id: 'metadata', label: 'Metadata', type: 'object' as DataType, description: 'Métadonnées de la page' }
    ]
  },
  openai: {
    inputs: [
      { id: 'prompt', label: 'Prompt', type: 'text' as DataType, required: true, description: 'Prompt pour l\'IA' },
      { id: 'model', label: 'Model Name', type: 'text' as DataType, description: 'Modèle à utiliser' },
      { id: 'temperature', label: 'Temperature', type: 'number' as DataType, description: 'Température (0-1)' },
      { id: 'api_key', label: 'API Key', type: 'text' as DataType, required: true, description: 'Clé API OpenAI' }
    ],
    outputs: [
      { id: 'text', label: 'Text', type: 'text' as DataType, description: 'Réponse générée' },
      { id: 'usage', label: 'Usage', type: 'object' as DataType, description: 'Informations d\'utilisation' }
    ]
  },
  figma: {
    inputs: [
      { id: 'file_key', label: 'File Key', type: 'text' as DataType, required: true, description: 'Clé du fichier Figma' },
      { id: 'access_token', label: 'Access Token', type: 'text' as DataType, required: true, description: 'Token d\'accès' }
    ],
    outputs: [
      { id: 'frames', label: 'Frames', type: 'array' as DataType, description: 'Frames du fichier' },
      { id: 'components', label: 'Components', type: 'array' as DataType, description: 'Composants' },
      { id: 'styles', label: 'Styles', type: 'object' as DataType, description: 'Styles du fichier' }
    ]
  },
  database: {
    inputs: [
      { id: 'query', label: 'Query', type: 'text' as DataType, required: true, description: 'Requête SQL' },
      { id: 'parameters', label: 'Parameters', type: 'object' as DataType, description: 'Paramètres de requête' }
    ],
    outputs: [
      { id: 'results', label: 'Results', type: 'array' as DataType, description: 'Résultats de la requête' },
      { id: 'count', label: 'Count', type: 'number' as DataType, description: 'Nombre de résultats' }
    ]
  }
};

interface AdvancedBlockData {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  inputs?: BlockPort[];
  outputs?: BlockPort[];
  configuration?: Record<string, any>;
  onEdit?: (blockId: string) => void;
  onDelete?: (blockId: string) => void;
  onConfigChange?: (blockId: string, config: Record<string, any>) => void;
}

interface AdvancedCanvasBlockProps extends NodeProps {
  data: AdvancedBlockData;
  selected?: boolean;
}

export const AdvancedCanvasBlock = memo(({ data, selected }: AdvancedCanvasBlockProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  const IconComponent = blockIcons[data.type as keyof typeof blockIcons] || blockIcons.other;
  const colorClass = blockColors[data.type as keyof typeof blockColors] || blockColors.other;
  
  // Obtenir la configuration par défaut selon le type
  const defaultConfig = blockConfigurations[data.type as keyof typeof blockConfigurations];
  const inputs = data.inputs || defaultConfig?.inputs || [];
  const outputs = data.outputs || defaultConfig?.outputs || [];
  
  const StatusIcon = data.status === 'connected' ? Wifi : WifiOff;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onEdit?.(data.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(data.id);
  };

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Logique pour exécuter le bloc
    console.log('Running block:', data.id);
  };

  // Fonction pour obtenir la couleur selon le type de données
  const getDataTypeColor = (type: DataType) => {
    switch (type) {
      case 'text': return 'bg-blue-500';
      case 'number': return 'bg-green-500';
      case 'boolean': return 'bg-purple-500';
      case 'object': return 'bg-orange-500';
      case 'array': return 'bg-red-500';
      case 'file': return 'bg-gray-500';
      case 'image': return 'bg-pink-500';
      default: return 'bg-gray-400';
    }
  };

  // Calculer la hauteur minimale basée sur le nombre d'inputs/outputs
  const inputsHeight = inputs.length > 0 ? 16 + inputs.length * 28 : 0; // titre + items
  const outputsHeight = outputs.length > 0 ? 16 + outputs.length * 28 : 0; // titre + items
  const spacingHeight = inputs.length > 0 && outputs.length > 0 ? 12 : 0; // espace entre sections
  const contentHeight = inputsHeight + outputsHeight + spacingHeight + 24; // padding
  const minHeight = Math.max(160, 56 + contentHeight); // header + content

  return (
    <Card 
      className={cn(
        'relative w-[280px] border-2 transition-all duration-200 cursor-pointer bg-white overflow-visible',
        colorClass,
        selected && 'ring-2 ring-blue-500 ring-offset-2',
        isHovered && 'shadow-lg scale-[1.02]'
      )}
      style={{ minHeight: `${minHeight}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header avec icône, titre et statut */}
      <div className="flex items-start justify-between p-3 border-b border-gray-200">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-1.5 bg-white rounded-md shadow-sm flex-shrink-0">
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm mb-0.5 line-clamp-1">
              {data.title}
            </h3>
            <span className="text-xs text-muted-foreground capitalize">
              {data.type}
            </span>
            {data.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {data.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <StatusIcon className="w-3 h-3" />
          <Badge 
            variant="secondary" 
            className={cn(
              'text-xs px-1.5 py-0.5',
              data.status === 'connected' ? 'bg-green-500 text-white' : 
              data.status === 'error' ? 'bg-red-500 text-white' :
              'bg-gray-500 text-white'
            )}
          >
            {data.status}
          </Badge>
        </div>
      </div>

      {/* Inputs et outputs */}
      <div className="p-3 space-y-3">
        {/* Inputs */}
        {inputs.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600 mb-2">Inputs</div>
            {inputs.map((input, index) => (
              <div key={input.id} className="flex items-center gap-2 relative min-h-[24px]">
                {/* Handle d'entrée */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`input-${input.id}`}
                  className={cn(
                    'w-3 h-3 border-2 border-white rounded-full hover:scale-125 transition-transform',
                    getDataTypeColor(input.type)
                  )}
                  style={{ 
                    left: -12, 
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
                
                <div className="flex items-center gap-1.5 flex-1 ml-3">
                  <div 
                    className={cn('w-2 h-2 rounded-full', getDataTypeColor(input.type))}
                    title={`Type: ${input.type}`}
                  />
                  <span className="text-xs text-gray-700">{input.label}</span>
                  {input.required && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Outputs */}
        {outputs.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600 mb-2">Outputs</div>
            {outputs.map((output, index) => (
              <div key={output.id} className="flex items-center justify-end gap-2 relative min-h-[24px]">
                <div className="flex items-center gap-1.5 flex-1 mr-3">
                  <span className="text-xs text-gray-700 text-right flex-1">{output.label}</span>
                  <div 
                    className={cn('w-2 h-2 rounded-full', getDataTypeColor(output.type))}
                    title={`Type: ${output.type}`}
                  />
                </div>
                
                {/* Handle de sortie */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`output-${output.id}`}
                  className={cn(
                    'w-3 h-3 border-2 border-white rounded-full hover:scale-125 transition-transform',
                    getDataTypeColor(output.type)
                  )}
                  style={{ 
                    right: -12, 
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions (visibles au survol) */}
      {isHovered && (
        <div className="absolute top-2 right-2 flex gap-1 bg-white rounded-md shadow-sm p-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
            onClick={handleRun}
            title="Exécuter"
          >
            <Play className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
            onClick={handleEdit}
            title="Configurer"
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
            onClick={handleDelete}
            title="Supprimer"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </Card>
  );
});

AdvancedCanvasBlock.displayName = 'AdvancedCanvasBlock';