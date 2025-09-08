import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Activity,
  Eye,
  Download,
  Trash2,
  Calendar,
  Timer
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { cn } from './ui/utils';
import { WorkflowExecution, useWorkflowEngine } from '../hooks/useWorkflowEngine';
import { WorkflowBlockData } from './WorkflowBlock';

interface WorkflowExecutionPanelProps {
  blocks: WorkflowBlockData[];
  connections: any[];
  onExecuteWorkflow: () => void;
  onStopWorkflow: () => void;
  isExecuting: boolean;
}

export default function WorkflowExecutionPanel({ 
  blocks, 
  connections, 
  onExecuteWorkflow, 
  onStopWorkflow, 
  isExecuting 
}: WorkflowExecutionPanelProps) {
  const { executions, getExecutionLogs, clearOldExecutions } = useWorkflowEngine();
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  // Statistiques des exécutions
  const executionStats = {
    total: executions.length,
    successful: executions.filter(e => e.status === 'success').length,
    failed: executions.filter(e => e.status === 'error').length,
    running: executions.filter(e => e.status === 'running').length
  };

  const successRate = executionStats.total > 0 
    ? Math.round((executionStats.successful / executionStats.total) * 100) 
    : 0;

  // Grouper les exécutions par bloc
  const executionsByBlock = executions.reduce((acc, exec) => {
    if (!acc[exec.blockId]) {
      acc[exec.blockId] = [];
    }
    acc[exec.blockId].push(exec);
    return acc;
  }, {} as Record<string, WorkflowExecution[]>);

  // Obtenir le nom du bloc
  const getBlockName = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    return block?.title || `Bloc ${blockId}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
  };

  const handleViewLogs = (execution: WorkflowExecution) => {
    setSelectedExecution(execution);
    setShowLogs(true);
  };

  const handleDownloadLogs = (execution: WorkflowExecution) => {
    const logContent = execution.logs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-logs-${execution.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed right-4 top-4 bottom-4 w-96 bg-white rounded-lg shadow-xl border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Exécution Workflow
          </h2>
        </div>
        
        {/* Contrôles d'exécution */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={onExecuteWorkflow}
            disabled={isExecuting || blocks.length === 0}
            className="flex-1"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                En cours...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Exécuter
              </>
            )}
          </Button>
          
          {isExecuting && (
            <Button
              variant="outline"
              onClick={onStopWorkflow}
              className="px-3"
            >
              <Square className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => clearOldExecutions()}
            className="px-3"
            disabled={executions.length === 0}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Card className="p-3">
            <div className="text-2xl font-bold">{executionStats.total}</div>
            <div className="text-xs text-muted-foreground">Exécutions</div>
          </Card>
          <Card className="p-3">
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <div className="text-xs text-muted-foreground">Succès</div>
          </Card>
        </div>

        {/* Barre de progression pour le workflow en cours */}
        {isExecuting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span>{executionStats.running} blocs actifs</span>
            </div>
            <Progress 
              value={executionStats.running > 0 ? 50 : 0} 
              className="h-2"
            />
          </div>
        )}
      </div>

      {/* Liste des exécutions */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {executions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune exécution</p>
              <p className="text-xs">Lancez votre premier workflow</p>
            </div>
          ) : (
            <>
              {/* Exécutions récentes */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Exécutions récentes
                </h3>
                
                <div className="space-y-2">
                  {executions
                    .slice()
                    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
                    .slice(0, 10)
                    .map(execution => (
                      <Card key={execution.id} className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(execution.status)}
                            <span className="text-sm font-medium">
                              {getBlockName(execution.blockId)}
                            </span>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={cn('text-xs', getStatusColor(execution.status))}
                          >
                            {execution.status}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mb-2">
                          <div className="flex justify-between">
                            <span>{execution.startTime.toLocaleTimeString()}</span>
                            <span>{formatDuration(execution.startTime, execution.endTime)}</span>
                          </div>
                        </div>
                        
                        {execution.error && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2">
                            {execution.error}
                          </div>
                        )}
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleViewLogs(execution)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Logs
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleDownloadLogs(execution)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Export
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Résumé par bloc */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  Statistiques par bloc
                </h3>
                
                <div className="space-y-2">
                  {Object.entries(executionsByBlock).map(([blockId, blockExecs]) => {
                    const successful = blockExecs.filter(e => e.status === 'success').length;
                    const total = blockExecs.length;
                    const rate = total > 0 ? Math.round((successful / total) * 100) : 0;
                    
                    return (
                      <Card key={blockId} className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {getBlockName(blockId)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {rate}% succès
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {total} exécution{total > 1 ? 's' : ''} • 
                          {successful} succès • 
                          {blockExecs.filter(e => e.status === 'error').length} erreurs
                        </div>
                        <Progress value={rate} className="h-1 mt-2" />
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Modal des logs */}
      {showLogs && selectedExecution && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50" 
            onClick={() => setShowLogs(false)}
          />
          <div className="fixed inset-4 bg-white rounded-lg shadow-2xl z-50 flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Logs - {getBlockName(selectedExecution.blockId)}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLogs(false)}
                >
                  ×
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {selectedExecution.startTime.toLocaleString()} • 
                {formatDuration(selectedExecution.startTime, selectedExecution.endTime)}
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="font-mono text-sm space-y-1">
                {selectedExecution.logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      'px-2 py-1 rounded',
                      log.includes('Erreur') ? 'bg-red-50 text-red-800' :
                      log.includes('succès') ? 'bg-green-50 text-green-800' :
                      'bg-gray-50'
                    )}
                  >
                    {log}
                  </div>
                ))}
                
                {selectedExecution.input && (
                  <>
                    <Separator className="my-3" />
                    <div className="text-xs font-semibold mb-2">INPUT:</div>
                    <div className="bg-blue-50 p-3 rounded text-xs">
                      <pre>{JSON.stringify(selectedExecution.input, null, 2)}</pre>
                    </div>
                  </>
                )}
                
                {selectedExecution.output && (
                  <>
                    <Separator className="my-3" />
                    <div className="text-xs font-semibold mb-2">OUTPUT:</div>
                    <div className="bg-green-50 p-3 rounded text-xs">
                      <pre>{JSON.stringify(selectedExecution.output, null, 2)}</pre>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}