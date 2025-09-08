import React, { useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Settings,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from './ui/utils';
import { useWorkflowEngine, type WorkflowExecution, type WorkflowStep } from '../hooks/useWorkflowEngine';

interface WorkflowControlPanelProps {
  nodes: Node[];
  edges: Edge[];
  onNodeStatusChange?: (nodeId: string, status: string) => void;
  className?: string;
}

export default function WorkflowControlPanel({
  nodes,
  edges,
  onNodeStatusChange,
  className
}: WorkflowControlPanelProps) {
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const [showExecutionDetails, setShowExecutionDetails] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const {
    executions,
    isExecuting,
    currentExecution,
    createExecution,
    executeWorkflow,
    pauseExecution,
    resumeExecution,
    stopExecution,
    getExecutionStatus,
    getExecutionData
  } = useWorkflowEngine();

  // Calculer les statistiques du workflow
  const workflowStats = React.useMemo(() => {
    const totalNodes = nodes.length;
    const claudeNodes = nodes.filter(n => n.type?.includes('claude')).length;
    const dataNodes = nodes.filter(n => n.type === 'figma' || n.type === 'notion').length;
    
    return {
      totalNodes,
      claudeNodes,
      dataNodes,
      connections: edges.length
    };
  }, [nodes, edges]);

  // Obtenir l'exécution sélectionnée
  const currentExecutionData = selectedExecution 
    ? executions.find(e => e.id === selectedExecution)
    : null;

  // Calculer le progrès de l'exécution
  const calculateProgress = (execution: WorkflowExecution): number => {
    if (execution.steps.length === 0) return 0;
    const completedSteps = execution.steps.filter(s => s.status === 'completed').length;
    return (completedSteps / execution.steps.length) * 100;
  };

  // Démarrer une nouvelle exécution
  const handleStartExecution = async () => {
    if (nodes.length === 0) {
      alert('Aucun bloc à exécuter');
      return;
    }

    const executionId = createExecution(
      `Workflow ${new Date().toLocaleTimeString()}`,
      nodes,
      edges
    );

    setSelectedExecution(executionId);
    
    try {
      await executeWorkflow(executionId);
    } catch (error: any) {
      console.error('Erreur d\'exécution:', error);
    }
  };

  // Contrôles d'exécution
  const handlePause = () => {
    if (selectedExecution) {
      pauseExecution(selectedExecution);
    }
  };

  const handleResume = () => {
    if (selectedExecution) {
      resumeExecution(selectedExecution);
    }
  };

  const handleStop = () => {
    if (selectedExecution) {
      stopExecution(selectedExecution);
    }
  };

  // Basculer l'expansion d'un step
  const toggleStepExpansion = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  // Obtenir l'icône selon le statut du step
  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Obtenir la couleur selon le statut du step
  const getStepColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'skipped':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  // Mettre à jour les statuts des nœuds dans le canvas
  useEffect(() => {
    if (currentExecutionData && onNodeStatusChange) {
      for (const step of currentExecutionData.steps) {
        let canvasStatus = 'disconnected';
        
        switch (step.status) {
          case 'running':
            canvasStatus = 'syncing';
            break;
          case 'completed':
            canvasStatus = 'connected';
            break;
          case 'error':
            canvasStatus = 'error';
            break;
        }
        
        onNodeStatusChange(step.nodeId, canvasStatus);
      }
    }
  }, [currentExecutionData?.steps, onNodeStatusChange]);

  return (
    <div className={cn('bg-background', className)}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5" />
            Contrôle de Workflow
          </CardTitle>
          <CardDescription>
            Exécutez et surveillez vos chaînes de blocs Claude
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Statistiques du workflow */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total Blocs</div>
              <div className="text-2xl font-bold text-blue-800">{workflowStats.totalNodes}</div>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm text-orange-600 font-medium">Blocs Claude</div>
              <div className="text-2xl font-bold text-orange-800">{workflowStats.claudeNodes}</div>
            </div>
          </div>

          {/* Contrôles principaux */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={handleStartExecution}
                disabled={isExecuting || nodes.length === 0}
                className="flex-1"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                {isExecuting ? 'En cours...' : 'Démarrer'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handlePause}
                disabled={!isExecuting || getExecutionStatus(selectedExecution || '') !== 'running'}
                size="sm"
              >
                <Pause className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                onClick={handleStop}
                disabled={!selectedExecution || getExecutionStatus(selectedExecution) === 'completed'}
                size="sm"
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>

            {currentExecutionData && (
              <Button
                variant="outline"
                onClick={() => setShowExecutionDetails(true)}
                className="w-full"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Voir les détails
              </Button>
            )}
          </div>

          {/* Statut de l'exécution actuelle */}
          {currentExecutionData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exécution en cours</span>
                <Badge 
                  variant={
                    currentExecutionData.context.status === 'completed' ? 'default' :
                    currentExecutionData.context.status === 'error' ? 'destructive' :
                    currentExecutionData.context.status === 'running' ? 'secondary' :
                    'outline'
                  }
                >
                  {currentExecutionData.context.status}
                </Badge>
              </div>
              
              <Progress value={calculateProgress(currentExecutionData)} className="h-2" />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {currentExecutionData.context.completedNodes.size} / {currentExecutionData.steps.length} blocs
                </span>
                <span>
                  {currentExecutionData.context.status === 'completed' && currentExecutionData.completedAt
                    ? `Terminé à ${currentExecutionData.completedAt.toLocaleTimeString()}`
                    : `Démarré à ${currentExecutionData.context.startedAt.toLocaleTimeString()}`
                  }
                </span>
              </div>
            </div>
          )}

          {/* Historique rapide */}
          {executions.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Exécutions récentes</div>
              <ScrollArea className="h-24">
                <div className="space-y-1">
                  {executions.slice(-3).map((execution) => (
                    <div
                      key={execution.id}
                      onClick={() => setSelectedExecution(execution.id)}
                      className={cn(
                        "p-2 rounded border cursor-pointer transition-colors",
                        selectedExecution === execution.id
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{execution.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {execution.context.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {execution.context.completedNodes.size} / {execution.steps.length} blocs
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {currentExecutionData?.context.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="font-medium">Erreur</span>
              </div>
              <div className="text-sm text-red-600">
                {currentExecutionData.context.error}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog des détails d'exécution */}
      <Dialog open={showExecutionDetails} onOpenChange={setShowExecutionDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Détails de l'exécution</DialogTitle>
          </DialogHeader>
          
          {currentExecutionData && (
            <div className="space-y-4">
              {/* En-tête de l'exécution */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="font-medium">{currentExecutionData.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ID: {currentExecutionData.id}
                  </p>
                </div>
                <Badge 
                  variant={
                    currentExecutionData.context.status === 'completed' ? 'default' :
                    currentExecutionData.context.status === 'error' ? 'destructive' :
                    'secondary'
                  }
                  className="px-3 py-1"
                >
                  {currentExecutionData.context.status}
                </Badge>
              </div>

              {/* Progression globale */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Progression</span>
                  <span className="text-sm text-muted-foreground">
                    {currentExecutionData.context.completedNodes.size} / {currentExecutionData.steps.length}
                  </span>
                </div>
                <Progress value={calculateProgress(currentExecutionData)} />
              </div>

              {/* Liste des steps */}
              <div>
                <h4 className="font-medium mb-3">Étapes d'exécution</h4>
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {currentExecutionData.steps.map((step, index) => (
                      <div
                        key={step.nodeId}
                        className={cn(
                          "border rounded-lg transition-all",
                          getStepColor(step.status)
                        )}
                      >
                        <div
                          onClick={() => toggleStepExpansion(step.nodeId)}
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-black/5"
                        >
                          <div className="flex items-center gap-2">
                            {getStepIcon(step.status)}
                            <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                              {index + 1}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium">{step.nodeId}</div>
                            <div className="text-sm text-muted-foreground">
                              Type: {step.type}
                              {step.startTime && (
                                <>
                                  {' • '}Démarré à {step.startTime.toLocaleTimeString()}
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {step.startTime && step.endTime && (
                              <Badge variant="outline" className="text-xs">
                                {Math.round((step.endTime.getTime() - step.startTime.getTime()) / 1000)}s
                              </Badge>
                            )}
                            {expandedSteps.has(step.nodeId) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        </div>

                        {expandedSteps.has(step.nodeId) && (
                          <div className="border-t p-3 bg-white/50">
                            {step.error && (
                              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
                                <span className="font-medium text-red-700">Erreur:</span>
                                <div className="text-red-600">{step.error}</div>
                              </div>
                            )}

                            {step.input && (
                              <div className="mb-3">
                                <div className="text-sm font-medium mb-1">Entrée:</div>
                                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                                  {JSON.stringify(step.input, null, 2)}
                                </pre>
                              </div>
                            )}

                            {step.output && (
                              <div>
                                <div className="text-sm font-medium mb-1">Sortie:</div>
                                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                                  {JSON.stringify(step.output, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}