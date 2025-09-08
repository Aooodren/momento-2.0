import { useState, useCallback, useRef } from 'react';
import { WorkflowBlockData, ExecutionStatus, ApplicationType } from '../components/WorkflowBlock';

// Types pour l'exécution de workflow
export interface WorkflowExecution {
  id: string;
  blockId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  input?: any;
  output?: any;
  error?: string;
  logs: string[];
}

export interface WorkflowConnection {
  id: string;
  sourceBlockId: string;
  targetBlockId: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// Interface pour les connecteurs d'applications
export interface ApplicationConnector {
  type: ApplicationType;
  execute: (operation: string, config: Record<string, any>, input?: any) => Promise<any>;
  validate: (operation: string, config: Record<string, any>) => boolean;
  getOperations: () => string[];
}

export function useWorkflowEngine() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const connectors = useRef<Map<ApplicationType, ApplicationConnector>>(new Map());
  
  // Enregistrer un connecteur d'application
  const registerConnector = useCallback((connector: ApplicationConnector) => {
    connectors.current.set(connector.type, connector);
  }, []);

  // Exécuter un bloc individuel
  const executeBlock = useCallback(async (
    block: WorkflowBlockData, 
    input?: any
  ): Promise<WorkflowExecution> => {
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${block.id}`,
      blockId: block.id,
      status: 'running',
      startTime: new Date(),
      input,
      logs: []
    };

    setExecutions(prev => [...prev, execution]);

    try {
      execution.logs.push(`[${new Date().toISOString()}] Début de l'exécution du bloc: ${block.title}`);
      
      const connector = connectors.current.get(block.application);
      if (!connector) {
        throw new Error(`Connecteur non trouvé pour ${block.application}`);
      }

      // Valider la configuration
      if (!connector.validate(block.action.operation, block.action.config)) {
        throw new Error('Configuration invalide pour cette opération');
      }

      execution.logs.push(`[${new Date().toISOString()}] Exécution de l'opération: ${block.action.operation}`);
      
      // Exécuter l'action
      const result = await connector.execute(block.action.operation, block.action.config, input);
      
      execution.output = result;
      execution.status = 'success';
      execution.endTime = new Date();
      execution.logs.push(`[${new Date().toISOString()}] Exécution réussie`);

    } catch (error) {
      execution.error = error instanceof Error ? error.message : 'Erreur inconnue';
      execution.status = 'error';
      execution.endTime = new Date();
      execution.logs.push(`[${new Date().toISOString()}] Erreur: ${execution.error}`);
    }

    // Mettre à jour l'exécution
    setExecutions(prev => prev.map(exec => 
      exec.id === execution.id ? execution : exec
    ));

    return execution;
  }, []);

  // Exécuter un workflow complet
  const executeWorkflow = useCallback(async (
    blocks: WorkflowBlockData[],
    connections: WorkflowConnection[],
    startBlockId?: string
  ) => {
    if (isExecuting) {
      console.warn('Un workflow est déjà en cours d\'exécution');
      return;
    }

    setIsExecuting(true);
    
    try {
      // Créer un graphe d'exécution
      const executionGraph = buildExecutionGraph(blocks, connections);
      
      // Trouver le bloc de démarrage
      const startBlock = startBlockId 
        ? blocks.find(b => b.id === startBlockId)
        : blocks.find(b => b.blockType === 'trigger');
      
      if (!startBlock) {
        throw new Error('Aucun bloc de démarrage trouvé');
      }

      // Exécuter le workflow récursivement
      await executeNode(startBlock, executionGraph, blocks, new Map());

    } catch (error) {
      console.error('Erreur lors de l\'exécution du workflow:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [executeBlock, isExecuting]);

  // Construire le graphe d'exécution
  const buildExecutionGraph = (
    blocks: WorkflowBlockData[], 
    connections: WorkflowConnection[]
  ): Map<string, string[]> => {
    const graph = new Map<string, string[]>();
    
    blocks.forEach(block => {
      graph.set(block.id, []);
    });
    
    connections.forEach(conn => {
      const targets = graph.get(conn.sourceBlockId) || [];
      targets.push(conn.targetBlockId);
      graph.set(conn.sourceBlockId, targets);
    });
    
    return graph;
  };

  // Exécuter un nœud et ses successeurs
  const executeNode = async (
    block: WorkflowBlockData,
    graph: Map<string, string[]>,
    allBlocks: WorkflowBlockData[],
    results: Map<string, any>,
    input?: any
  ): Promise<void> => {
    // Exécuter le bloc actuel
    const execution = await executeBlock(block, input);
    results.set(block.id, execution.output);

    // Si l'exécution a échoué et que c'est un bloc critique, arrêter
    if (execution.status === 'error' && block.blockType === 'condition') {
      console.warn(`Condition échouée: ${block.title}, arrêt du workflow`);
      return;
    }

    // Exécuter les blocs suivants
    const nextBlockIds = graph.get(block.id) || [];
    
    for (const nextBlockId of nextBlockIds) {
      const nextBlock = allBlocks.find(b => b.id === nextBlockId);
      if (nextBlock) {
        // Utiliser la sortie du bloc actuel comme entrée du suivant
        await executeNode(nextBlock, graph, allBlocks, results, execution.output);
      }
    }
  };

  // Obtenir les logs d'exécution pour un bloc
  const getExecutionLogs = useCallback((blockId: string) => {
    return executions
      .filter(exec => exec.blockId === blockId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [executions]);

  // Nettoyer les anciennes exécutions
  const clearOldExecutions = useCallback((olderThanHours: number = 24) => {
    const cutoff = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    setExecutions(prev => prev.filter(exec => exec.startTime > cutoff));
  }, []);

  // Annuler toutes les exécutions en cours
  const cancelAllExecutions = useCallback(() => {
    setExecutions(prev => prev.map(exec => 
      exec.status === 'running' ? { ...exec, status: 'error', error: 'Annulé par l\'utilisateur' } : exec
    ));
    setIsExecuting(false);
  }, []);

  return {
    // State
    executions,
    isExecuting,
    
    // Actions
    registerConnector,
    executeBlock,
    executeWorkflow,
    getExecutionLogs,
    clearOldExecutions,
    cancelAllExecutions
  };
}