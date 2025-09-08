import { useState, useCallback, useRef } from 'react';
import { Node, Edge } from 'reactflow';

export interface WorkflowExecutionContext {
  executionId: string;
  startedAt: Date;
  currentNodeId?: string;
  completedNodes: Set<string>;
  failedNodes: Set<string>;
  data: Map<string, any>; // Données partagées entre les blocs
  status: 'idle' | 'running' | 'completed' | 'error' | 'paused';
  error?: string;
}

export interface WorkflowStep {
  nodeId: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  input?: any;
  output?: any;
  error?: string;
}

export interface WorkflowExecution {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  steps: WorkflowStep[];
  context: WorkflowExecutionContext;
  createdAt: Date;
  completedAt?: Date;
}

export function useWorkflowEngine() {
  const [executions, setExecutions] = useState<Map<string, WorkflowExecution>>(new Map());
  const [isExecuting, setIsExecuting] = useState(false);
  const executionRef = useRef<WorkflowExecutionContext | null>(null);

  // Créer une nouvelle exécution de workflow
  const createExecution = useCallback((
    name: string,
    nodes: Node[],
    edges: Edge[]
  ): string => {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const context: WorkflowExecutionContext = {
      executionId,
      startedAt: new Date(),
      completedNodes: new Set(),
      failedNodes: new Set(),
      data: new Map(),
      status: 'idle'
    };

    const steps: WorkflowStep[] = nodes.map(node => ({
      nodeId: node.id,
      type: node.type || 'default',
      status: 'pending'
    }));

    const execution: WorkflowExecution = {
      id: executionId,
      name,
      nodes,
      edges,
      steps,
      context,
      createdAt: new Date()
    };

    setExecutions(prev => new Map(prev.set(executionId, execution)));
    return executionId;
  }, []);

  // Déterminer les nœuds suivants à exécuter
  const getNextNodes = useCallback((
    currentNodeId: string,
    edges: Edge[],
    completedNodes: Set<string>
  ): string[] => {
    const nextEdges = edges.filter(edge => edge.source === currentNodeId);
    const nextNodes: string[] = [];

    for (const edge of nextEdges) {
      const targetNodeId = edge.target;
      
      // Vérifier si toutes les dépendances du nœud cible sont satisfaites
      const incomingEdges = edges.filter(e => e.target === targetNodeId);
      const allDependenciesMet = incomingEdges.every(e => 
        completedNodes.has(e.source) || e.source === currentNodeId
      );

      if (allDependenciesMet && !completedNodes.has(targetNodeId)) {
        nextNodes.push(targetNodeId);
      }
    }

    return nextNodes;
  }, []);

  // Trouver les nœuds de démarrage (sans dépendances)
  const findStartNodes = useCallback((nodes: Node[], edges: Edge[]): string[] => {
    const nodesWithIncoming = new Set(edges.map(edge => edge.target));
    return nodes
      .filter(node => !nodesWithIncoming.has(node.id))
      .map(node => node.id);
  }, []);

  // Exécuter un nœud spécifique
  const executeNode = useCallback(async (
    node: Node,
    context: WorkflowExecutionContext
  ): Promise<{ success: boolean; output?: any; error?: string }> => {
    try {
      console.log(`Exécution du nœud ${node.id} (${node.type})`);
      
      // Récupérer les données d'entrée depuis le contexte
      const inputData = context.data.get(`${node.id}_input`) || node.data;

      switch (node.type) {
        case 'claude':
          return await executeClaudeNode(node, inputData, context);
        
        case 'claude-figma':
          return await executeClaudeFigmaNode(node, inputData, context);
        
        case 'claude-notion':
          return await executeClaudeNotionNode(node, inputData, context);
        
        case 'figma':
          return await executeFigmaNode(node, inputData, context);
        
        case 'notion':
          return await executeNotionNode(node, inputData, context);
        
        default:
          return await executeDefaultNode(node, inputData, context);
      }
    } catch (error: any) {
      console.error(`Erreur lors de l'exécution du nœud ${node.id}:`, error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  }, []);

  // Exécuters spécialisés pour chaque type de nœud
  const executeClaudeNode = async (node: Node, inputData: any, context: WorkflowExecutionContext) => {
    // Simuler l'exécution d'un bloc Claude
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const output = {
      type: 'claude-response',
      content: `Réponse Claude pour ${node.data?.prompt || 'prompt non défini'}`,
      inputProcessed: inputData,
      timestamp: new Date().toISOString()
    };

    return { success: true, output };
  };

  const executeClaudeFigmaNode = async (node: Node, inputData: any, context: WorkflowExecutionContext) => {
    // Simuler l'exécution d'un bloc Claude-Figma
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const output = {
      type: 'claude-figma-analysis',
      analysis: `Analyse Claude d'un design Figma`,
      recommendations: ['Améliorer les contrastes', 'Revoir la hiérarchie'],
      figmaData: inputData?.figmaData,
      timestamp: new Date().toISOString()
    };

    return { success: true, output };
  };

  const executeClaudeNotionNode = async (node: Node, inputData: any, context: WorkflowExecutionContext) => {
    // Simuler l'exécution d'un bloc Claude-Notion
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const output = {
      type: 'claude-notion-processing',
      processedContent: `Contenu Notion traité par Claude`,
      createdPages: ['page-id-1', 'page-id-2'],
      notionData: inputData?.notionData,
      timestamp: new Date().toISOString()
    };

    return { success: true, output };
  };

  const executeFigmaNode = async (node: Node, inputData: any, context: WorkflowExecutionContext) => {
    // Simuler l'exécution d'un bloc Figma
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const output = {
      type: 'figma-data',
      frames: ['frame-1', 'frame-2'],
      images: ['img-1', 'img-2'],
      metadata: { fileName: 'Design System' },
      timestamp: new Date().toISOString()
    };

    return { success: true, output };
  };

  const executeNotionNode = async (node: Node, inputData: any, context: WorkflowExecutionContext) => {
    // Simuler l'exécution d'un bloc Notion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const output = {
      type: 'notion-data',
      pages: ['page-1', 'page-2'],
      content: 'Contenu depuis Notion',
      properties: {},
      timestamp: new Date().toISOString()
    };

    return { success: true, output };
  };

  const executeDefaultNode = async (node: Node, inputData: any, context: WorkflowExecutionContext) => {
    // Simuler l'exécution d'un bloc générique
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const output = {
      type: 'default-output',
      data: inputData,
      processed: true,
      timestamp: new Date().toISOString()
    };

    return { success: true, output };
  };

  // Exécuter un workflow complet
  const executeWorkflow = useCallback(async (executionId: string): Promise<boolean> => {
    const execution = executions.get(executionId);
    if (!execution) {
      throw new Error(`Exécution ${executionId} non trouvée`);
    }

    setIsExecuting(true);
    executionRef.current = execution.context;
    execution.context.status = 'running';

    try {
      // Trouver les nœuds de démarrage
      const startNodes = findStartNodes(execution.nodes, execution.edges);
      
      if (startNodes.length === 0) {
        throw new Error('Aucun nœud de démarrage trouvé');
      }

      // File d'attente des nœuds à exécuter
      const nodeQueue = [...startNodes];
      const executedNodes = new Set<string>();

      while (nodeQueue.length > 0) {
        const currentNodeId = nodeQueue.shift()!;
        
        if (executedNodes.has(currentNodeId)) {
          continue;
        }

        const node = execution.nodes.find(n => n.id === currentNodeId);
        if (!node) {
          throw new Error(`Nœud ${currentNodeId} non trouvé`);
        }

        // Mettre à jour le contexte
        execution.context.currentNodeId = currentNodeId;
        
        // Mettre à jour le statut du step
        const step = execution.steps.find(s => s.nodeId === currentNodeId);
        if (step) {
          step.status = 'running';
          step.startTime = new Date();
        }

        // Exécuter le nœud
        const result = await executeNode(node, execution.context);
        
        if (result.success) {
          // Marquer comme complété
          execution.context.completedNodes.add(currentNodeId);
          executedNodes.add(currentNodeId);
          
          // Stocker le résultat dans le contexte
          if (result.output) {
            execution.context.data.set(`${currentNodeId}_output`, result.output);
          }

          // Mettre à jour le step
          if (step) {
            step.status = 'completed';
            step.endTime = new Date();
            step.output = result.output;
          }

          // Ajouter les nœuds suivants à la file
          const nextNodes = getNextNodes(currentNodeId, execution.edges, execution.context.completedNodes);
          
          // Préparer les données d'entrée pour les nœuds suivants
          for (const nextNodeId of nextNodes) {
            execution.context.data.set(`${nextNodeId}_input`, result.output);
            nodeQueue.push(nextNodeId);
          }

        } else {
          // Marquer comme échoué
          execution.context.failedNodes.add(currentNodeId);
          
          if (step) {
            step.status = 'error';
            step.endTime = new Date();
            step.error = result.error;
          }

          // Pour l'instant, on continue même en cas d'erreur
          // En production, vous pourriez vouloir stopper ou gérer différemment
          console.warn(`Nœud ${currentNodeId} échoué: ${result.error}`);
        }
      }

      // Workflow terminé
      execution.context.status = 'completed';
      execution.context.currentNodeId = undefined;
      execution.completedAt = new Date();

      // Mettre à jour l'état
      setExecutions(prev => new Map(prev.set(executionId, { ...execution })));
      
      return true;

    } catch (error: any) {
      console.error('Erreur lors de l\'exécution du workflow:', error);
      execution.context.status = 'error';
      execution.context.error = error.message;
      
      setExecutions(prev => new Map(prev.set(executionId, { ...execution })));
      return false;
    } finally {
      setIsExecuting(false);
      executionRef.current = null;
    }
  }, [executions, findStartNodes, getNextNodes, executeNode]);

  // Pauser une exécution
  const pauseExecution = useCallback((executionId: string) => {
    const execution = executions.get(executionId);
    if (execution && execution.context.status === 'running') {
      execution.context.status = 'paused';
      setExecutions(prev => new Map(prev.set(executionId, { ...execution })));
    }
  }, [executions]);

  // Reprendre une exécution
  const resumeExecution = useCallback((executionId: string) => {
    const execution = executions.get(executionId);
    if (execution && execution.context.status === 'paused') {
      return executeWorkflow(executionId);
    }
    return Promise.resolve(false);
  }, [executions, executeWorkflow]);

  // Arrêter une exécution
  const stopExecution = useCallback((executionId: string) => {
    const execution = executions.get(executionId);
    if (execution) {
      execution.context.status = 'error';
      execution.context.error = 'Arrêté par l\'utilisateur';
      setExecutions(prev => new Map(prev.set(executionId, { ...execution })));
    }
  }, [executions]);

  // Obtenir le statut d'une exécution
  const getExecutionStatus = useCallback((executionId: string) => {
    return executions.get(executionId)?.context.status || 'idle';
  }, [executions]);

  // Obtenir les données d'une exécution
  const getExecutionData = useCallback((executionId: string, nodeId?: string) => {
    const execution = executions.get(executionId);
    if (!execution) return null;

    if (nodeId) {
      return execution.context.data.get(`${nodeId}_output`);
    }

    // Retourner toutes les données
    return Object.fromEntries(execution.context.data.entries());
  }, [executions]);

  return {
    executions: Array.from(executions.values()),
    isExecuting,
    currentExecution: executionRef.current,
    createExecution,
    executeWorkflow,
    pauseExecution,
    resumeExecution,
    stopExecution,
    getExecutionStatus,
    getExecutionData
  };
}