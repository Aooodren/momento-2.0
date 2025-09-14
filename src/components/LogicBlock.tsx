import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Layers, 
  GitBranch, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Workflow,
  Settings,
  Container,
  ArrowUpDown,
  Filter,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from './ui/utils';

// Types d'icônes selon le type de bloc logique
const logicBlockIcons = {
  group: Container,
  condition: GitBranch,
  loop: RotateCcw,
  decision: CheckCircle2,
  filter: Filter,
  merge: ArrowUpDown,
  workflow: Workflow,
  validator: Settings,
};

// Couleurs selon le type de bloc logique
const logicBlockColors = {
  group: 'border-indigo-500 bg-indigo-50',
  condition: 'border-amber-500 bg-amber-50',
  loop: 'border-emerald-500 bg-emerald-50',
  decision: 'border-blue-500 bg-blue-50',
  filter: 'border-violet-500 bg-violet-50',
  merge: 'border-teal-500 bg-teal-50',
  workflow: 'border-cyan-500 bg-cyan-50',
  validator: 'border-rose-500 bg-rose-50',
};

// Couleurs des badges de statut pour les blocs logiques
const logicStatusColors = {
  active: 'bg-green-500 text-white',
  inactive: 'bg-gray-500 text-white',
  running: 'bg-blue-500 text-white',
  completed: 'bg-emerald-500 text-white',
  error: 'bg-red-500 text-white',
  pending: 'bg-yellow-500 text-white',
};

interface LogicBlockData {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  metadata?: any;
  logicType: 'group' | 'condition' | 'loop' | 'decision' | 'filter' | 'merge' | 'workflow' | 'validator';
  conditions?: string[];
  children?: string[];
  collapsed?: boolean;
  onEdit?: (blockId: string) => void;
  onDelete?: (blockId: string) => void;
  onToggleCollapse?: (blockId: string) => void;
}

interface LogicBlockProps extends NodeProps {
  data: LogicBlockData;
  selected?: boolean;
}

export const LogicBlock = memo(({ data, selected }: LogicBlockProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const IconComponent = logicBlockIcons[data.logicType] || logicBlockIcons.group;
  const colorClass = logicBlockColors[data.logicType] || logicBlockColors.group;
  const statusColor = logicStatusColors[data.status as keyof typeof logicStatusColors] || logicStatusColors.inactive;
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onEdit?.(data.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onDelete?.(data.id);
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onToggleCollapse?.(data.id);
  };

  // Contenu spécialisé selon le type de bloc logique
  const renderLogicContent = () => {
    switch (data.logicType) {
      case 'group':
        return (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Groupe • {data.children?.length || 0} éléments
            </div>
            {data.collapsed && (
              <div className="text-xs text-blue-600">
                Contenu masqué
              </div>
            )}
          </div>
        );
      
      case 'condition':
        return (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Condition logique
            </div>
            {data.conditions && data.conditions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.conditions.slice(0, 2).map((condition, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                    {condition}
                  </Badge>
                ))}
                {data.conditions.length > 2 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    +{data.conditions.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      
      case 'loop':
        return (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Boucle • {data.metadata?.iterations || '∞'} itérations
            </div>
            <div className="text-xs text-emerald-600">
              {data.metadata?.loopType || 'forEach'}
            </div>
          </div>
        );
      
      case 'decision':
        return (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Point de décision
            </div>
            <div className="flex gap-1">
              <Badge className="text-xs bg-green-100 text-green-700">OUI</Badge>
              <Badge className="text-xs bg-red-100 text-red-700">NON</Badge>
            </div>
          </div>
        );
      
      case 'filter':
        return (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Filtre • {data.metadata?.filterCount || 0} règles
            </div>
            <div className="text-xs text-violet-600">
              {data.metadata?.filterType || 'includes'}
            </div>
          </div>
        );
      
      case 'merge':
        return (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Fusion • {data.metadata?.inputs || 2} entrées
            </div>
            <div className="text-xs text-teal-600">
              {data.metadata?.mergeType || 'concat'}
            </div>
          </div>
        );
      
      case 'workflow':
        return (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Flux de travail
            </div>
            <div className="text-xs text-cyan-600">
              {data.metadata?.steps || 0} étapes
            </div>
          </div>
        );
      
      case 'validator':
        return (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Validation • {data.metadata?.rules || 0} règles
            </div>
            <div className="text-xs text-rose-600">
              {data.metadata?.validationType || 'strict'}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Configuration des handles selon le type de bloc
  const getHandleConfig = () => {
    switch (data.logicType) {
      case 'group':
        return {
          targets: [
            { position: Position.Top, id: 'group-input', color: 'bg-blue-400', label: 'Input' },
            { position: Position.Left, id: 'group-context', color: 'bg-purple-400', label: 'Context' }
          ],
          sources: [
            { position: Position.Bottom, id: 'group-output', color: 'bg-green-600', label: 'Output' },
            { position: Position.Right, id: 'group-summary', color: 'bg-orange-600', label: 'Summary' }
          ]
        };
      case 'condition':
      case 'decision':
        return {
          targets: [
            { position: Position.Top, id: 'condition-data', color: 'bg-blue-400', label: 'Data' },
            { position: Position.Left, id: 'condition-rules', color: 'bg-purple-400', label: 'Rules' }
          ],
          sources: [
            { position: Position.Bottom, id: 'condition-true', color: 'bg-green-600', label: 'True' },
            { position: Position.Right, id: 'condition-false', color: 'bg-red-600', label: 'False' }
          ]
        };
      case 'merge':
        return {
          targets: [
            { position: Position.Top, id: 'merge-primary', color: 'bg-blue-400', label: 'Primary' },
            { position: Position.Left, id: 'merge-secondary', color: 'bg-purple-400', label: 'Secondary' },
            { position: Position.Right, id: 'merge-tertiary', color: 'bg-green-400', label: 'Tertiary' }
          ],
          sources: [
            { position: Position.Bottom, id: 'merge-result', color: 'bg-orange-600', label: 'Merged' }
          ]
        };
      case 'filter':
        return {
          targets: [
            { position: Position.Left, id: 'filter-data', color: 'bg-blue-400', label: 'Data' },
            { position: Position.Top, id: 'filter-criteria', color: 'bg-purple-400', label: 'Criteria' }
          ],
          sources: [
            { position: Position.Right, id: 'filter-passed', color: 'bg-green-600', label: 'Passed' },
            { position: Position.Bottom, id: 'filter-rejected', color: 'bg-gray-400', label: 'Rejected' }
          ]
        };
      case 'transform':
        return {
          targets: [
            { position: Position.Left, id: 'transform-input', color: 'bg-blue-400', label: 'Input' },
            { position: Position.Top, id: 'transform-rules', color: 'bg-purple-400', label: 'Rules' }
          ],
          sources: [
            { position: Position.Right, id: 'transform-output', color: 'bg-orange-600', label: 'Output' }
          ]
        };
      default:
        return {
          targets: [
            { position: Position.Left, id: 'default-input', color: 'bg-blue-400', label: 'Input' }
          ],
          sources: [
            { position: Position.Right, id: 'default-output', color: 'bg-green-600', label: 'Output' }
          ]
        };
    }
  };

  const handleConfig = getHandleConfig();

  return (
    <Card 
      className={cn(
        'relative w-[280px] min-h-[140px] border-2 transition-all duration-200 cursor-pointer',
        colorClass,
        selected && 'ring-2 ring-blue-500 ring-offset-2',
        isHovered && 'shadow-xl scale-105'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header avec icône, type et contrôles */}
      <div className="flex items-center justify-between p-3 border-b border-current border-opacity-20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white rounded-md shadow-sm">
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground capitalize">
              {data.logicType}
            </span>
            <Badge 
              variant="secondary" 
              className={cn('text-xs px-2 py-0.5', statusColor)}
            >
              {data.status}
            </Badge>
          </div>
        </div>
        
        {/* Bouton de collapse pour les groupes */}
        {data.logicType === 'group' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleToggleCollapse}
          >
            {data.collapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>

      {/* Contenu principal */}
      <div className="p-3">
        <h3 className="font-medium text-sm mb-2 line-clamp-2">
          {data.title}
        </h3>
        
        {data.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {data.description}
          </p>
        )}

        {/* Contenu spécialisé du bloc logique */}
        {renderLogicContent()}

        {/* Métadonnées additionnelles */}
        {data.metadata && Object.keys(data.metadata).length > 0 && (
          <div className="mt-2 pt-2 border-t border-current border-opacity-10">
            <div className="flex flex-wrap gap-1">
              {Object.entries(data.metadata)
                .filter(([key]) => !['iterations', 'loopType', 'filterCount', 'filterType', 'inputs', 'mergeType', 'steps', 'rules', 'validationType'].includes(key))
                .slice(0, 2)
                .map(([key, value]) => (
                  <Badge 
                    key={key} 
                    variant="outline" 
                    className="text-xs px-1.5 py-0.5"
                  >
                    {key}: {String(value).slice(0, 8)}
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

      {/* Handles de connexion spécialisés selon la logique */}
      {handleConfig.targets.map((handle, index) => (
        <Handle
          key={`target-${index}`}
          type="target"
          position={handle.position}
          id={handle.id}
          className={`w-3 h-3 ${handle.color} border-2 border-white`}
          style={handle.position === Position.Left ? { top: `${25 + index * 25}%` } : 
                 handle.position === Position.Top ? { left: `${25 + index * 25}%` } : {}}
        />
      ))}
      
      {handleConfig.sources.map((handle, index) => (
        <Handle
          key={`source-${index}`}
          type="source"
          position={handle.position}
          id={handle.id}
          className={`w-3 h-3 ${handle.color} border-2 border-white`}
          style={handle.position === Position.Right ? { top: `${25 + index * 25}%` } : 
                 handle.position === Position.Bottom ? { left: `${25 + index * 25}%` } : {}}
        />
      ))}
    </Card>
  );
});

LogicBlock.displayName = 'LogicBlock';