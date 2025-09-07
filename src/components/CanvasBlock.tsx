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
  Trash2
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
  other: 'border-gray-400 bg-gray-50',
};

// Couleurs des badges de statut
const statusColors = {
  connected: 'bg-green-500 text-white',
  disconnected: 'bg-red-500 text-white',
  syncing: 'bg-yellow-500 text-white',
  error: 'bg-destructive text-destructive-foreground',
};

interface BlockData {
  id: string; // Changed to string
  title: string;
  description?: string;
  type: string;
  status: string;
  metadata?: any;
  onEdit?: (blockId: string) => void; // Changed to string
  onDelete?: (blockId: string) => void; // Changed to string
}

interface CanvasBlockProps extends NodeProps {
  data: BlockData;
  selected?: boolean;
}

export const CanvasBlock = memo(({ data, selected }: CanvasBlockProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const IconComponent = blockIcons[data.type as keyof typeof blockIcons] || blockIcons.other;
  const colorClass = blockColors[data.type as keyof typeof blockColors] || blockColors.other;
  const statusColor = statusColors[data.status as keyof typeof statusColors] || statusColors.disconnected;
  
  const StatusIcon = data.status === 'connected' ? Wifi : WifiOff;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onEdit?.(data.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(data.id);
  };

  return (
    <Card 
      className={cn(
        'relative w-[250px] min-h-[120px] border-2 transition-all duration-200 cursor-pointer',
        colorClass,
        selected && 'ring-2 ring-blue-500 ring-offset-2',
        isHovered && 'shadow-lg scale-105'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header avec icône et statut */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white rounded-md shadow-sm">
            <IconComponent className="w-4 h-4" />
          </div>
          <span className="text-xs text-muted-foreground capitalize">
            {data.type}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <StatusIcon className="w-3 h-3" />
          <Badge 
            variant="secondary" 
            className={cn('text-xs px-2 py-0.5', statusColor)}
          >
            {data.status}
          </Badge>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-3">
        <h3 className="font-medium text-sm mb-1 line-clamp-2">
          {data.title}
        </h3>
        
        {data.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Métadonnées additionnelles */}
        {data.metadata && Object.keys(data.metadata).length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              {Object.entries(data.metadata).slice(0, 2).map(([key, value]) => (
                <Badge 
                  key={key} 
                  variant="outline" 
                  className="text-xs px-1.5 py-0.5"
                >
                  {key}: {String(value).slice(0, 10)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions (visibles au survol) */}
      {isHovered && (
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-white shadow-sm hover:bg-gray-100"
            onClick={handleEdit}
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-white shadow-sm hover:bg-red-100 hover:text-red-600"
            onClick={handleDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Handles de connexion */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </Card>
  );
});

CanvasBlock.displayName = 'CanvasBlock';