import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Play, 
  Pause, 
  Square,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  FileText,
  Figma,
  Brain,
  Database,
  Globe,
  Webhook,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from './ui/utils';

// Types pour les blocs de workflow
export type WorkflowBlockType = 'trigger' | 'action' | 'condition' | 'transformer';
export type ApplicationType = 'notion' | 'claude' | 'figma' | 'webhook' | 'timer';
export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error' | 'paused';

export interface WorkflowAction {
  id: string;
  type: ApplicationType;
  operation: string;
  config: Record<string, any>;
  description: string;
}

export interface WorkflowBlockData {
  id: string;
  title: string;
  description?: string;
  blockType: WorkflowBlockType;
  application: ApplicationType;
  action: WorkflowAction;
  status: ExecutionStatus;
  lastRun?: Date;
  executionCount: number;
  avgExecutionTime?: number;
  onEdit?: (blockId: string) => void;
  onDelete?: (blockId: string) => void;
  onExecute?: (blockId: string) => Promise<void>;
  onToggle?: (blockId: string) => void;
}

// Configuration des icônes par application
const applicationIcons = {
  notion: FileText,
  claude: Brain,
  figma: Figma,
  webhook: Webhook,
  timer: Clock,
  database: Database,
  api: Globe
};

// Couleurs par type de bloc
const blockTypeColors = {
  trigger: 'border-green-500 bg-green-50',
  action: 'border-blue-500 bg-blue-50',
  condition: 'border-yellow-500 bg-yellow-50',
  transformer: 'border-purple-500 bg-purple-50'
};

// Couleurs par statut d'exécution
const statusColors = {
  idle: 'bg-gray-100 text-gray-800',
  running: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  paused: 'bg-yellow-100 text-yellow-800'
};

// Icônes par statut
const statusIcons = {
  idle: Clock,
  running: Loader2,
  success: CheckCircle,
  error: AlertCircle,
  paused: Pause
};

interface WorkflowBlockProps extends NodeProps {
  data: WorkflowBlockData;
  selected?: boolean;
}

export const WorkflowBlock = memo(({ data, selected }: WorkflowBlockProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const ApplicationIcon = applicationIcons[data.application] || Webhook;
  const StatusIcon = statusIcons[data.status] || Clock;
  
  const blockColorClass = blockTypeColors[data.blockType] || blockTypeColors.action;
  const statusColorClass = statusColors[data.status] || statusColors.idle;

  const handleExecute = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onExecute && data.status !== 'running') {
      try {
        await data.onExecute(data.id);
      } catch (error) {
        console.error('Workflow execution failed:', error);
      }
    }
  }, [data]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data.onToggle?.(data.id);
  }, [data]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data.onEdit?.(data.id);
  }, [data]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(data.id);
  }, [data]);

  const getBlockTypeLabel = (type: WorkflowBlockType) => {
    switch (type) {
      case 'trigger': return 'Déclencheur';
      case 'action': return 'Action';
      case 'condition': return 'Condition';
      case 'transformer': return 'Transformateur';
      default: return type;
    }
  };

  const getStatusLabel = (status: ExecutionStatus) => {
    switch (status) {
      case 'idle': return 'Inactif';
      case 'running': return 'En cours';
      case 'success': return 'Succès';
      case 'error': return 'Erreur';
      case 'paused': return 'En pause';
      default: return status;
    }
  };

  return (
    <Card 
      className={cn(
        'relative w-[320px] min-h-[180px] border-2 transition-all duration-200 cursor-pointer bg-white',
        blockColorClass,
        selected && 'ring-2 ring-blue-500 ring-offset-2',
        isHovered && 'shadow-lg scale-[1.02]'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-200">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Application Icon */}
          <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
            <ApplicationIcon className="w-5 h-5" />
          </div>
          
          <div className="min-w-0 flex-1">
            {/* Title and Block Type */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{data.title}</h3>
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {getBlockTypeLabel(data.blockType)}
              </Badge>
            </div>
            
            {/* Application and Operation */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <span className="capitalize">{data.application}</span>
              <ArrowRight className="w-3 h-3" />
              <span>{data.action.operation}</span>
            </div>
            
            {/* Description */}
            {data.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {data.description}
              </p>
            )}
          </div>
        </div>
        
        {/* Status */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <StatusIcon 
            className={cn(
              'w-4 h-4',
              data.status === 'running' && 'animate-spin'
            )} 
          />
          <Badge 
            variant="secondary" 
            className={cn('text-xs px-2 py-1', statusColorClass)}
          >
            {getStatusLabel(data.status)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Action Details */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-700 mb-1">Action configurée</div>
          <div className="text-xs text-gray-600">{data.action.description}</div>
          
          {/* Config Preview */}
          {Object.keys(data.action.config).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(data.action.config).slice(0, 2).map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-xs px-1.5 py-0.5">
                  {key}: {String(value).slice(0, 15)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Execution Stats */}
        {(data.executionCount > 0 || data.lastRun) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {data.executionCount > 0 && (
                <span>{data.executionCount} exécution{data.executionCount > 1 ? 's' : ''}</span>
              )}
              {data.avgExecutionTime && (
                <span>~{data.avgExecutionTime}ms</span>
              )}
            </div>
            {data.lastRun && (
              <span>Dernière: {data.lastRun.toLocaleTimeString()}</span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons (visible on hover) */}
      {isHovered && (
        <div className="absolute top-3 right-3 flex gap-1 bg-white rounded-md shadow-lg p-1 border">
          {/* Execute/Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 hover:bg-green-100 hover:text-green-600",
              data.status === 'running' && "hover:bg-yellow-100 hover:text-yellow-600"
            )}
            onClick={data.status === 'running' ? handleToggle : handleExecute}
            disabled={data.status === 'running' && data.blockType !== 'trigger'}
            title={data.status === 'running' ? 'Pause' : 'Exécuter'}
          >
            {data.status === 'running' ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </Button>
          
          {/* Settings Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-600"
            onClick={handleEdit}
            title="Configurer"
          >
            <Settings className="w-3 h-3" />
          </Button>
          
          {/* Stop Button (if running) */}
          {data.status === 'running' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
              onClick={handleToggle}
              title="Arrêter"
            >
              <Square className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {/* Connection Handles */}
      {data.blockType !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full hover:scale-125 transition-transform"
        />
      )}
      
      {data.blockType !== 'action' && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full hover:scale-125 transition-transform"
        />
      )}

      {/* Flow indicator */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse opacity-60" />
      </div>
    </Card>
  );
});

WorkflowBlock.displayName = 'WorkflowBlock';