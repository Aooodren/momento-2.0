import React, { useState, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import {
  Play,
  Pause,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { cn } from './ui/utils';
import { useWorkflowEngine } from '../hooks/useWorkflowEngine';

interface WorkflowControlPanelProps {
  nodes: Node[];
  edges: Edge[];
  onNodeStatusChange?: (nodeId: string, status: string) => void;
  onHighlightNodes?: (nodeIds: string[]) => void;
  className?: string;
}

export default function WorkflowControlPanel({
  nodes,
  edges,
  onNodeStatusChange,
  onHighlightNodes,
  className
}: WorkflowControlPanelProps) {
  const [workflowName, setWorkflowName] = useState('Mon Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('Description du workflow');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isExecuting,
    createExecution,
    executeWorkflow,
    pauseExecution,
    resumeExecution,
    stopExecution
  } = useWorkflowEngine();

  // Focus sur les champs d'édition
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingDescription && descriptionTextareaRef.current) {
      descriptionTextareaRef.current.focus();
      descriptionTextareaRef.current.select();
    }
  }, [isEditingDescription]);

  // Gérer l'édition du nom
  const handleNameDoubleClick = () => {
    setIsEditingName(true);
  };

  const handleNameSubmit = () => {
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  // Gérer l'édition de la description
  const handleDescriptionDoubleClick = () => {
    setIsEditingDescription(true);
  };

  const handleDescriptionSubmit = () => {
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setIsEditingDescription(false);
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleDescriptionSubmit();
    } else if (e.key === 'Escape') {
      handleDescriptionCancel();
    }
  };

  // Démarrer une nouvelle exécution
  const handlePlay = async () => {
    if (nodes.length === 0) {
      return;
    }

    const executionId = createExecution(workflowName, nodes, edges);
    
    try {
      await executeWorkflow(executionId);
    } catch (error: any) {
      console.error('Erreur d\'exécution:', error);
    }
  };

  // Pause/Resume
  const handlePauseResume = () => {
    if (isExecuting) {
      pauseExecution('current');
    } else {
      resumeExecution('current');
    }
  };

  // Arrêter l'exécution
  const handleStop = () => {
    stopExecution('current');
  };

  // Highlighter les blocs du workflow au hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onHighlightNodes) {
      const nodeIds = nodes.map(node => node.id);
      onHighlightNodes(nodeIds);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (onHighlightNodes) {
      onHighlightNodes([]);
    }
  };

  return (
    <div 
      className={cn('bg-background', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card className={cn(
        'transition-all duration-200',
        isHovered && 'shadow-md border-blue-200'
      )}>
        <CardContent className="p-4 space-y-3">
          {/* Nom du workflow - éditable */}
          <div className="space-y-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={nameInputRef}
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  onBlur={handleNameSubmit}
                  className="text-lg font-semibold border-0 p-0 h-auto bg-transparent focus-visible:ring-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNameSubmit}
                  className="h-6 w-6 p-0"
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNameCancel}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <h3 
                className="text-lg font-semibold cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors flex items-center gap-2 group"
                onDoubleClick={handleNameDoubleClick}
                title="Double-cliquez pour modifier"
              >
                {workflowName}
                <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              </h3>
            )}
          </div>

          {/* Description - éditable */}
          <div className="space-y-1">
            {isEditingDescription ? (
              <div className="space-y-2">
                <Textarea
                  ref={descriptionTextareaRef}
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  onKeyDown={handleDescriptionKeyDown}
                  onBlur={handleDescriptionSubmit}
                  className="text-sm text-muted-foreground border-0 p-0 bg-transparent focus-visible:ring-1 min-h-[60px] resize-none"
                  placeholder="Description du workflow..."
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDescriptionSubmit}
                    className="h-6 px-2 text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Ctrl+Enter
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDescriptionCancel}
                    className="h-6 px-2 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Échap
                  </Button>
                </div>
              </div>
            ) : (
              <p 
                className="text-sm text-muted-foreground cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors group flex items-start gap-2 min-h-[40px]"
                onDoubleClick={handleDescriptionDoubleClick}
                title="Double-cliquez pour modifier"
              >
                <span className="flex-1">{workflowDescription}</span>
                <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity mt-0.5 flex-shrink-0" />
              </p>
            )}
          </div>

          {/* Contrôles de lecture */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={handlePlay}
              disabled={isExecuting || nodes.length === 0}
              size="sm"
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              {isExecuting ? 'En cours...' : 'Play'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handlePauseResume}
              disabled={!isExecuting}
              size="sm"
            >
              <Pause className="w-4 h-4" />
            </Button>
          </div>

          {/* Indicateur de statut minimaliste */}
          {isExecuting && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Workflow en cours d'exécution</span>
            </div>
          )}

          {/* Informations sur les blocs inclus au hover */}
          {isHovered && (
            <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
              <span className="font-medium">Blocs inclus:</span> {nodes.length} 
              {nodes.length > 0 && (
                <span className="ml-1">
                  ({nodes.slice(0, 2).map(n => n.data?.title || n.id).join(', ')}{nodes.length > 2 && `, +${nodes.length - 2}`})
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}