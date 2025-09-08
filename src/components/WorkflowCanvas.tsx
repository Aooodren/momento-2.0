import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection,
  NodeTypes,
  BackgroundVariant,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';

import { WorkflowBlock, WorkflowBlockData } from './WorkflowBlock';
import WorkflowPalette, { BlockTemplate } from './WorkflowPalette';
import WorkflowExecutionPanel from './WorkflowExecutionPanel';
import { useWorkflowEngine, ApplicationConnector } from '../hooks/useWorkflowEngine';
import { NotionConnector } from '../connectors/NotionConnector';
import { ClaudeConnector } from '../connectors/ClaudeConnector';
import { FigmaConnector } from '../connectors/FigmaConnector';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Play, 
  Settings, 
  Plus, 
  Save, 
  Upload,
  Download,
  Zap
} from 'lucide-react';
import { cn } from './ui/utils';

// Types pour les nœuds ReactFlow
interface WorkflowNode extends Node {
  data: WorkflowBlockData;
}

interface WorkflowCanvasProps {
  projectId?: string;
  initialBlocks?: WorkflowBlockData[];
  initialConnections?: any[];
  onSave?: (blocks: WorkflowBlockData[], connections: any[]) => void;
  className?: string;
}

export default function WorkflowCanvas({ 
  projectId, 
  initialBlocks = [], 
  initialConnections = [], 
  onSave,
  className 
}: WorkflowCanvasProps) {
  // États ReactFlow
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // États du workflow
  const [workflowBlocks, setWorkflowBlocks] = useState<WorkflowBlockData[]>(initialBlocks);
  const [showPalette, setShowPalette] = useState(false);
  const [showExecutionPanel, setShowExecutionPanel] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Hook du moteur de workflow
  const workflowEngine = useWorkflowEngine();

  // Types de nœuds pour ReactFlow
  const nodeTypes: NodeTypes = useMemo(() => ({
    workflowBlock: WorkflowBlock
  }), []);

  // Initialiser les connecteurs
  useEffect(() => {
    const notionConnector = new NotionConnector();
    const claudeConnector = new ClaudeConnector();
    const figmaConnector = new FigmaConnector();
    
    workflowEngine.registerConnector(notionConnector);
    workflowEngine.registerConnector(claudeConnector);
    workflowEngine.registerConnector(figmaConnector);
  }, [workflowEngine]);

  // Convertir les blocs workflow en nœuds ReactFlow
  useEffect(() => {
    const flowNodes: WorkflowNode[] = workflowBlocks.map((block, index) => ({
      id: block.id,
      type: 'workflowBlock',
      position: { x: 200 + (index % 3) * 350, y: 100 + Math.floor(index / 3) * 200 },
      data: {
        ...block,
        onEdit: handleEditBlock,
        onDelete: handleDeleteBlock,
        onExecute: handleExecuteBlock,
        onToggle: handleToggleBlock
      }
    }));
    
    setNodes(flowNodes);
  }, [workflowBlocks]);

  // Convertir les connexions en edges ReactFlow
  useEffect(() => {
    const flowEdges: Edge[] = initialConnections.map(conn => ({
      id: conn.id,
      source: conn.sourceBlockId,
      target: conn.targetBlockId,
      sourceHandle: conn.sourceHandle,
      targetHandle: conn.targetHandle,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 }
    }));
    
    setEdges(flowEdges);
  }, [initialConnections]);

  // Gestionnaires d'événements
  const handleAddBlock = useCallback((template: BlockTemplate, position: { x: number, y: number }) => {
    const newBlock: WorkflowBlockData = {
      id: `block_${Date.now()}`,
      title: template.title,
      description: template.description,
      blockType: template.blockType,
      application: template.application,
      action: {
        id: `action_${Date.now()}`,
        type: template.application,
        operation: template.action.operation || '',
        config: template.action.config || {},
        description: template.action.description || ''
      },
      status: 'idle',
      executionCount: 0
    };

    setWorkflowBlocks(prev => [...prev, newBlock]);
    setShowPalette(false);
  }, []);

  const handleEditBlock = useCallback((blockId: string) => {
    console.log('Édition du bloc:', blockId);
    // TODO: Ouvrir un modal de configuration
  }, []);

  const handleDeleteBlock = useCallback((blockId: string) => {
    setWorkflowBlocks(prev => prev.filter(block => block.id !== blockId));
    setNodes(prev => prev.filter(node => node.id !== blockId));
    setEdges(prev => prev.filter(edge => 
      edge.source !== blockId && edge.target !== blockId
    ));
  }, [setNodes, setEdges]);

  const handleExecuteBlock = useCallback(async (blockId: string) => {
    const block = workflowBlocks.find(b => b.id === blockId);
    if (!block) return;

    try {
      // Mettre à jour le statut
      setWorkflowBlocks(prev => prev.map(b => 
        b.id === blockId ? { ...b, status: 'running' } : b
      ));

      await workflowEngine.executeBlock(block);

      // Mettre à jour les statistiques
      setWorkflowBlocks(prev => prev.map(b => 
        b.id === blockId ? { 
          ...b, 
          status: 'success', 
          executionCount: b.executionCount + 1,
          lastRun: new Date()
        } : b
      ));
    } catch (error) {
      setWorkflowBlocks(prev => prev.map(b => 
        b.id === blockId ? { ...b, status: 'error' } : b
      ));
    }
  }, [workflowBlocks, workflowEngine]);

  const handleToggleBlock = useCallback((blockId: string) => {
    const block = workflowBlocks.find(b => b.id === blockId);
    if (!block) return;

    const newStatus = block.status === 'running' ? 'paused' : 'idle';
    setWorkflowBlocks(prev => prev.map(b => 
      b.id === blockId ? { ...b, status: newStatus } : b
    ));
  }, [workflowBlocks]);

  const handleExecuteWorkflow = useCallback(async () => {
    if (isExecuting) return;

    setIsExecuting(true);
    try {
      const connections = edges.map(edge => ({
        id: edge.id,
        sourceBlockId: edge.source,
        targetBlockId: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle
      }));

      await workflowEngine.executeWorkflow(workflowBlocks, connections);
    } catch (error) {
      console.error('Erreur d\'exécution du workflow:', error);
    } finally {
      setIsExecuting(false);
    }
  }, [workflowBlocks, edges, workflowEngine, isExecuting]);

  const handleStopWorkflow = useCallback(() => {
    workflowEngine.cancelAllExecutions();
    setIsExecuting(false);
  }, [workflowEngine]);

  const handleConnect = useCallback((params: Connection) => {
    const newEdge: Edge = {
      ...params,
      id: `edge_${Date.now()}`,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 }
    };
    setEdges(eds => addEdge(newEdge, eds));
  }, [setEdges]);

  const handleSave = useCallback(() => {
    const connections = edges.map(edge => ({
      id: edge.id,
      sourceBlockId: edge.source,
      targetBlockId: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    }));

    onSave?.(workflowBlocks, connections);
  }, [workflowBlocks, edges, onSave]);

  // Statistiques du canvas
  const canvasStats = useMemo(() => {
    const triggerBlocks = workflowBlocks.filter(b => b.blockType === 'trigger').length;
    const actionBlocks = workflowBlocks.filter(b => b.blockType === 'action').length;
    const connectedBlocks = new Set([
      ...edges.map(e => e.source),
      ...edges.map(e => e.target)
    ]).size;

    return {
      totalBlocks: workflowBlocks.length,
      triggerBlocks,
      actionBlocks,
      connections: edges.length,
      connectedBlocks
    };
  }, [workflowBlocks, edges]);

  return (
    <div className={cn('h-full w-full relative', className)}>
      {/* Barre d'outils principale */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white rounded-lg shadow-lg border px-4 py-2 flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPalette(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
          
          <div className="h-4 w-px bg-gray-300" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExecuteWorkflow}
            disabled={isExecuting || workflowBlocks.length === 0}
          >
            <Play className="w-4 h-4 mr-2" />
            {isExecuting ? 'En cours...' : 'Exécuter'}
          </Button>
          
          <div className="h-4 w-px bg-gray-300" />
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {canvasStats.totalBlocks} blocs
            </Badge>
            <Badge variant="outline" className="text-xs">
              {canvasStats.connections} connexions
            </Badge>
            {canvasStats.triggerBlocks > 0 && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                <Zap className="w-3 h-3 mr-1" />
                {canvasStats.triggerBlocks} déclencheur{canvasStats.triggerBlocks > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="h-4 w-px bg-gray-300" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={workflowBlocks.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExecutionPanel(!showExecutionPanel)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Monitoring
          </Button>
        </div>
      </div>

      {/* Canvas ReactFlow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={16} 
          size={1}
          color="#e2e8f0"
        />
        <Controls 
          position="bottom-right"
          showInteractive={false}
        />
        <MiniMap 
          position="bottom-left"
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            const data = node.data as WorkflowBlockData;
            switch (data.blockType) {
              case 'trigger': return '#10b981';
              case 'action': return '#3b82f6';
              case 'condition': return '#f59e0b';
              case 'transformer': return '#8b5cf6';
              default: return '#6b7280';
            }
          }}
        />
      </ReactFlow>

      {/* Palette de blocs */}
      <WorkflowPalette
        onAddBlock={handleAddBlock}
        isVisible={showPalette}
        onToggleVisibility={() => setShowPalette(!showPalette)}
      />

      {/* Panneau d'exécution */}
      {showExecutionPanel && (
        <WorkflowExecutionPanel
          blocks={workflowBlocks}
          connections={edges.map(edge => ({
            id: edge.id,
            sourceBlockId: edge.source,
            targetBlockId: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle
          }))}
          onExecuteWorkflow={handleExecuteWorkflow}
          onStopWorkflow={handleStopWorkflow}
          isExecuting={isExecuting}
        />
      )}

      {/* Instructions pour utilisateur vide */}
      {workflowBlocks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-white bg-opacity-80 rounded-lg shadow-lg max-w-md">
            <Zap className="w-12 h-12 mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-semibold mb-2">Créez votre premier workflow</h3>
            <p className="text-muted-foreground mb-4">
              Ajoutez des blocs depuis la palette pour connecter vos applications 
              et automatiser vos processus de design thinking.
            </p>
            <Button 
              onClick={() => setShowPalette(true)}
              className="pointer-events-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Commencer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}