import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Plus, Save, AlertCircle, Loader2, RefreshCw, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  NodeTypes,
  BackgroundVariant,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  OnNodeDrag,
  OnNodeDragStop,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useCanvasAPI, Block, Relation } from '../hooks/useCanvasAPI';
import { useAutoLayout } from '../hooks/useAutoLayout';
import { AdvancedCanvasBlock } from './AdvancedCanvasBlock';
import { LogicBlock } from './LogicBlock';
import AdvancedBlockEditDialog from './AdvancedBlockEditDialog';
import LogicBlockEditDialog from './LogicBlockEditDialog';

interface ProjectDetails {
  id: string;
  title: string;
  type: string;
  from: 'myproject' | 'liked';
}

interface EditorPageProps {
  project: ProjectDetails;
  onBack: () => void;
}

// Types de nœuds personnalisés
const nodeTypes: NodeTypes = {
  block: AdvancedCanvasBlock,
  logic: LogicBlock,
};

export default function EditorPage({ project, onBack }: EditorPageProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [showAdvancedEditDialog, setShowAdvancedEditDialog] = useState(false);
  const [showLogicEditDialog, setShowLogicEditDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [blockTypeToCreate, setBlockTypeToCreate] = useState<'standard' | 'logic'>('standard');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyingLayout, setIsApplyingLayout] = useState(false);
  const [lastLayoutInfo, setLastLayoutInfo] = useState<{columns: number, spacing: number, totalNodes: number} | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const layoutInfoTimeoutRef = useRef<NodeJS.Timeout>();
  const positionUpdatesRef = useRef<Map<string, { position_x: number; position_y: number }>>(new Map());

  const {
    loading,
    error,
    getBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    batchUpdatePositions,
    getRelations,
    createRelation,
    deleteRelation,
    checkHealth,
    initDemo,
  } = useCanvasAPI();

  // Hook d'autolayout
  const { applyGridLayout } = useAutoLayout({
    onNodesChange: setNodes,
    onBatchUpdatePositions: batchUpdatePositions,
  });

  // Charger les données initiales - logique simplifiée
  useEffect(() => {
    loadCanvasData();
  }, [project.id]);

  // Auto-masquer l'information de layout après 3 secondes
  useEffect(() => {
    if (lastLayoutInfo) {
      // Nettoyer le timeout précédent s'il existe
      if (layoutInfoTimeoutRef.current) {
        clearTimeout(layoutInfoTimeoutRef.current);
      }
      
      // Programmer la disparition de l'alerte après 3 secondes
      layoutInfoTimeoutRef.current = setTimeout(() => {
        setLastLayoutInfo(null);
      }, 3000);
    }
    
    return () => {
      if (layoutInfoTimeoutRef.current) {
        clearTimeout(layoutInfoTimeoutRef.current);
      }
    };
  }, [lastLayoutInfo]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (layoutInfoTimeoutRef.current) {
        clearTimeout(layoutInfoTimeoutRef.current);
      }
    };
  }, []);

  const loadCanvasData = async () => {
    try {
      setIsLoading(true);
      console.log('EditorPage - Loading canvas data for project:', project.id);
      
      const [blocksData, relationsData] = await Promise.all([
        getBlocks(project.id),
        getRelations(project.id),
      ]);

      console.log('EditorPage - Loaded blocks:', blocksData);
      console.log('EditorPage - Loaded relations:', relationsData);

      setBlocks(blocksData);
      setRelations(relationsData);

      // Convertir les blocs en nœuds ReactFlow
      const flowNodes: Node[] = blocksData.map((block) => {
        const isLogicBlock = block.type === 'logic' || block.metadata?.logicType;
        
        return {
          id: block.id,
          type: isLogicBlock ? 'logic' : 'block',
          position: { x: block.position_x, y: block.position_y },
          data: {
            ...block,
            onEdit: handleEditBlock,
            onDelete: handleDeleteBlock,
            onToggleCollapse: isLogicBlock ? handleToggleCollapse : undefined,
          },
        };
      });

      // Convertir les relations en arêtes ReactFlow
      const flowEdges: Edge[] = relationsData.map((relation) => ({
        id: relation.id,
        source: relation.source_block_id,
        target: relation.target_block_id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
      
    } catch (err) {
      console.error('EditorPage - Error loading canvas data:', err);
      // En cas d'erreur, on continue avec un canvas vide
      setBlocks([]);
      setRelations([]);
      setNodes([]);
      setEdges([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Créer des données de démonstration personnalisées
  const handleCreateDemoData = async () => {
    try {
      setIsLoading(true);
      console.log('EditorPage - Creating demo data...');

      // Créer 3 blocs : 2 standards et 1 logique
      const demoBlocks = [
        {
          title: "Notion - Base de données",
          description: "Récupération des données depuis une page Notion",
          type: "notion",
          position_x: 100,
          position_y: 100,
        },
        {
          title: "OpenAI - Génération IA",
          description: "Traitement du texte avec l'IA OpenAI",
          type: "openai", 
          position_x: 450,
          position_y: 100,
        },
        {
          title: "Figma - Export designs",
          type: "figma",
          position_x: 800,
          position_y: 100,
          description: "Export des composants depuis Figma"
        }
      ];

      // Créer les blocs un par un
      const createdBlocks = [];
      for (const blockData of demoBlocks) {
        const block = await createBlock(project.id, blockData);
        if (block) {
          createdBlocks.push(block);
        }
      }

      console.log('EditorPage - Created demo blocks:', createdBlocks);

      // Créer les relations entre les blocs (si au moins 2 blocs créés)
      if (createdBlocks.length >= 2) {
        // Relation entre le premier et le deuxième bloc
        const relation1 = await createRelation(project.id, {
          source_block_id: createdBlocks[0].id,
          target_block_id: createdBlocks[1].id,
          type: 'connection',
        });

        // Relation entre le deuxième et le troisième bloc (si il existe)
        if (createdBlocks.length >= 3) {
          const relation2 = await createRelation(project.id, {
            source_block_id: createdBlocks[1].id,
            target_block_id: createdBlocks[2].id,
            type: 'connection',
          });
        }
      }

      // Recharger les données du canvas
      setTimeout(async () => {
        await loadCanvasData();
      }, 500);

    } catch (err) {
      console.error('EditorPage - Failed to create demo data:', err);
      setIsLoading(false);
    }
  };

  // Sauvegarde automatique des positions avec debounce
  const savePositions = useCallback(() => {
    const updates = Array.from(positionUpdatesRef.current.entries()).map(([id, position]) => ({
      id,
      ...position,
    }));

    if (updates.length > 0) {
      console.log('EditorPage - Saving position updates:', updates);
      batchUpdatePositions(updates).then((success) => {
        if (success) {
          console.log('EditorPage - Position updates saved successfully');
          setLastSaved(new Date());
          setPendingChanges(false);
          positionUpdatesRef.current.clear();
        } else {
          console.error('EditorPage - Failed to save position updates');
        }
      }).catch((err) => {
        console.error('EditorPage - Error saving positions:', err);
      });
    }
  }, [batchUpdatePositions]);

  // Debounced save
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(savePositions, 800);
  }, [savePositions]);

  // Gestionnaire de déplacement de nœuds
  const handleNodeDragStop: OnNodeDragStop = useCallback((_, node) => {
    const blockId = node.id;
    console.log(`EditorPage - Position update for block: ${blockId}`);
    
    positionUpdatesRef.current.set(blockId, {
      position_x: node.position.x,
      position_y: node.position.y,
    });
    
    setPendingChanges(true);
    debouncedSave();
  }, [debouncedSave]);

  // Gestionnaire de connexion entre nœuds
  const onConnect: OnConnect = useCallback(async (connection) => {
    if (!connection.source || !connection.target) return;

    try {
      console.log('EditorPage - Creating relation between:', connection.source, '->', connection.target);
      
      const relation = await createRelation(project.id, {
        source_block_id: connection.source,
        target_block_id: connection.target,
        type: 'connection',
      });

      if (relation) {
        const newEdge: Edge = {
          id: relation.id,
          source: connection.source,
          target: connection.target,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        };

        setEdges((eds) => addEdge(newEdge, eds));
        setRelations((rels) => [...rels, relation]);
        console.log('EditorPage - Relation created successfully:', relation.id);
      }
    } catch (err) {
      console.error('EditorPage - Error creating relation:', err);
    }
  }, [project.id, createRelation]);

  // Gestionnaire de suppression d'arête
  const handleEdgeDelete = useCallback(async (edgeId: string) => {
    try {
      console.log('EditorPage - Deleting edge:', edgeId);
      const success = await deleteRelation(edgeId);
      if (success) {
        setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
        setRelations((rels) => rels.filter((rel) => rel.id !== edgeId));
        console.log('EditorPage - Edge deleted successfully:', edgeId);
      }
    } catch (err) {
      console.error('EditorPage - Error deleting relation:', err);
    }
  }, [deleteRelation]);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Supprimer les arêtes sélectionnées
        const selectedEdges = edges.filter((edge) => edge.selected);
        selectedEdges.forEach((edge) => handleEdgeDelete(edge.id));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [edges, handleEdgeDelete]);

  // Appliquer un layout en grille
  const handleApplyGridLayout = async () => {
    setIsApplyingLayout(true);
    
    try {
      console.log('EditorPage - Applying grid layout...');
      
      // Appliquer le layout en grille
      const result = applyGridLayout(nodes);
      
      console.log('EditorPage - Applied grid layout:', result.gridInfo);
      
      // Stocker les informations du layout appliqué
      setLastLayoutInfo(result.gridInfo);
      
      // Marquer comme ayant des changements en cours
      setPendingChanges(true);
      
      // Programmer la sauvegarde après le layout
      setTimeout(() => {
        const positionUpdates = result.nodes.map(node => ({
          id: node.id,
          position_x: node.position.x,
          position_y: node.position.y,
        }));
        
        batchUpdatePositions(positionUpdates).then((success) => {
          if (success) {
            console.log('EditorPage - Grid layout positions saved successfully');
            setLastSaved(new Date());
            setPendingChanges(false);
          }
        }).catch((err) => {
          console.error('EditorPage - Error saving grid layout positions:', err);
        });
      }, 500);
      
    } catch (err) {
      console.error('EditorPage - Error applying grid layout:', err);
    } finally {
      setIsApplyingLayout(false);
    }
  };

  // Créer un nouveau bloc standard
  const handleCreateStandardBlock = () => {
    setEditingBlock(null);
    setIsCreating(true);
    setBlockTypeToCreate('standard');
    setShowAdvancedEditDialog(true);
  };

  // Créer un nouveau bloc logique
  const handleCreateLogicBlock = () => {
    setEditingBlock(null);
    setIsCreating(true);
    setBlockTypeToCreate('logic');
    setShowLogicEditDialog(true);
  };

  // Éditer un bloc existant
  const handleEditBlock = (blockId: string) => {
    console.log('EditorPage - Editing block:', blockId);
    const block = blocks.find((b) => b.id === blockId);
    if (block) {
      setEditingBlock(block);
      setIsCreating(false);
      
      const isLogicBlock = block.type === 'logic' || block.metadata?.logicType;
      if (isLogicBlock) {
        console.log('EditorPage - Opening logic edit dialog');
        setShowLogicEditDialog(true);
      } else {
        console.log('EditorPage - Opening advanced edit dialog');
        setShowAdvancedEditDialog(true);
      }
    }
  };

  // Basculer l'état de réduction d'un groupe
  const handleToggleCollapse = async (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.metadata) {
      const updatedBlock = await updateBlock(blockId, {
        metadata: {
          ...block.metadata,
          collapsed: !block.metadata.collapsed,
        },
      });

      if (updatedBlock) {
        // Mettre à jour le nœud dans le canvas
        setNodes((nds) =>
          nds.map((node) =>
            node.id === blockId
              ? { 
                  ...node, 
                  data: { 
                    ...updatedBlock, 
                    onEdit: handleEditBlock, 
                    onDelete: handleDeleteBlock,
                    onToggleCollapse: handleToggleCollapse,
                  } 
                }
              : node
          )
        );
        
        setBlocks((blocks) =>
          blocks.map((block) => (block.id === blockId ? updatedBlock : block))
        );
      }
    }
  };

  // Supprimer un bloc
  const handleDeleteBlock = async (blockId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bloc ?')) return;

    try {
      console.log(`EditorPage - Deleting block: ${blockId}`);
      const success = await deleteBlock(blockId);
      if (success) {
        // Supprimer le nœud du canvas
        setNodes((nds) => nds.filter((node) => node.id !== blockId));
        
        // Supprimer les arêtes liées
        setEdges((eds) => eds.filter((edge) => 
          edge.source !== blockId && edge.target !== blockId
        ));
        
        // Mettre à jour les états locaux
        setBlocks((blocks) => blocks.filter((b) => b.id !== blockId));
        setRelations((rels) => rels.filter((rel) => 
          rel.source_block_id !== blockId && rel.target_block_id !== blockId
        ));

        // Nettoyer les updates de position
        positionUpdatesRef.current.delete(blockId);
        
        console.log(`EditorPage - Block ${blockId} deleted successfully`);
      }
    } catch (err) {
      console.error('EditorPage - Error deleting block:', err);
    }
  };

  // Sauvegarder un bloc (création ou modification)
  const handleSaveBlock = async (blockData: Partial<Block>) => {
    try {
      let savedBlock: Block | null = null;

      if (isCreating) {
        console.log('EditorPage - Creating new block:', blockData);
        // Créer un nouveau bloc
        savedBlock = await createBlock(project.id, {
          ...blockData,
          position_x: Math.random() * 400 + 100,
          position_y: Math.random() * 300 + 100,
        });
      } else if (editingBlock) {
        console.log('EditorPage - Updating block:', editingBlock.id, blockData);
        // Mettre à jour un bloc existant
        savedBlock = await updateBlock(editingBlock.id, blockData);
      }

      if (savedBlock) {
        const isLogicBlock = savedBlock.type === 'logic' || savedBlock.metadata?.logicType;
        
        if (isCreating) {
          // Ajouter le nouveau nœud au canvas
          const newNode: Node = {
            id: savedBlock.id,
            type: isLogicBlock ? 'logic' : 'block',
            position: { x: savedBlock.position_x, y: savedBlock.position_y },
            data: {
              ...savedBlock,
              onEdit: handleEditBlock,
              onDelete: handleDeleteBlock,
              onToggleCollapse: isLogicBlock ? handleToggleCollapse : undefined,
            },
          };

          setNodes((nds) => [...nds, newNode]);
          setBlocks((blocks) => [...blocks, savedBlock]);
          console.log('EditorPage - New block added to canvas:', savedBlock.id);
        } else {
          // Mettre à jour le nœud existant
          setNodes((nds) =>
            nds.map((node) =>
              node.id === savedBlock.id
                ? { 
                    ...node, 
                    type: isLogicBlock ? 'logic' : 'block',
                    data: { 
                      ...savedBlock, 
                      onEdit: handleEditBlock, 
                      onDelete: handleDeleteBlock,
                      onToggleCollapse: isLogicBlock ? handleToggleCollapse : undefined,
                    } 
                  }
                : node
            )
          );
          setBlocks((blocks) =>
            blocks.map((block) => (block.id === savedBlock.id ? savedBlock : block))
          );
          console.log('EditorPage - Block updated in canvas:', savedBlock.id);
        }
      }
    } catch (err) {
      console.error('EditorPage - Error saving block:', err);
    }
  };

  // Statut de sauvegarde
  const getSaveStatus = () => {
    if (pendingChanges) {
      return { text: 'Sauvegarde...', color: 'text-yellow-600', icon: Loader2 };
    }
    if (lastSaved) {
      const timeAgo = Math.round((Date.now() - lastSaved.getTime()) / 1000);
      if (timeAgo < 10) {
        return { text: 'Sauvegardé', color: 'text-green-600', icon: Save };
      }
    }
    return null;
  };

  const saveStatus = getSaveStatus();

  // Compter les blocs par type
  const blockCounts = blocks.reduce((acc, block) => {
    const isLogic = block.type === 'logic' || block.metadata?.logicType;
    acc[isLogic ? 'logic' : 'standard']++;
    return acc;
  }, { standard: 0, logic: 0 });

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <div className="border-l border-gray-300 h-6"></div>
          <h2 className="text-lg font-medium text-gray-900">{project.title}</h2>
          <span className="text-sm text-gray-500">• Canvas interactif</span>
          
          {/* Statut de sauvegarde */}
          {saveStatus && (
            <div className="flex items-center gap-2">
              <saveStatus.icon className={`w-4 h-4 ${saveStatus.color} ${pendingChanges ? 'animate-spin' : ''}`} />
              <span className={`text-sm ${saveStatus.color}`}>
                {saveStatus.text}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            {blockCounts.standard} bloc{blockCounts.standard > 1 ? 's' : ''} standard
          </Badge>
          <Badge variant="outline" className="gap-1 bg-indigo-50 text-indigo-700 border-indigo-200">
            {blockCounts.logic} bloc{blockCounts.logic > 1 ? 's' : ''} logique
          </Badge>
          <Badge variant="outline" className="gap-1">
            {relations.length} relation{relations.length > 1 ? 's' : ''}
          </Badge>
          
          {/* Bouton Autolayout Grille */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2" 
                  disabled={isApplyingLayout || nodes.length === 0}
                  onClick={handleApplyGridLayout}
                >
                  {isApplyingLayout ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Organiser en grille
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">Disposition en grille</p>
                  <p className="text-xs text-muted-foreground">
                    Aligne tous les blocs sur une grille régulière avec un espacement généreux de 350px entre chaque bloc.
                  </p>
                  {lastLayoutInfo && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs font-medium">
                        Dernière grille: {lastLayoutInfo.columns} colonnes
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lastLayoutInfo.totalNodes} blocs • Espacement: {lastLayoutInfo.spacing}px
                      </p>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Menu de création de blocs */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau bloc
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleCreateStandardBlock}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">Bloc standard</span>
                  <span className="text-xs text-muted-foreground">
                    Notion, OpenAI, Figma, etc.
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCreateLogicBlock}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">Bloc logique</span>
                  <span className="text-xs text-muted-foreground">
                    Groupes, conditions, boucles, etc.
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <Alert className="mx-6 mt-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Canvas ReactFlow */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Chargement du canvas...</span>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={handleNodeDragStop}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#3b82f6', strokeWidth: 2 },
            }}
            className="relative"
            style={{ zIndex: 1 }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            
            <Controls 
              position="bottom-right"
              className="bg-white shadow-lg rounded-lg border"
            />
            
            <MiniMap
              position="top-right"
              className="bg-white shadow-lg rounded-xl border overflow-hidden"
              nodeColor={(node) => {
                if (node.type === 'logic') {
                  const logicType = node.data?.logicType || 'group';
                  const logicColors = {
                    group: '#6366f1',
                    condition: '#f59e0b',
                    loop: '#10b981',
                    decision: '#3b82f6',
                    filter: '#8b5cf6',
                    transform: '#06b6d4',
                    validator: '#10b981',
                  };
                  return logicColors[logicType] || '#6366f1';
                }
                return '#e5e7eb';
              }}
            />
          </ReactFlow>
        )}
      </div>

      {/* Informations sur le layout automatique (affiché temporairement) */}
      {lastLayoutInfo && (
        <div className="absolute bottom-4 left-4 bg-white shadow-lg rounded-lg border p-3 text-sm animate-in slide-in-from-left-2 duration-300">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Layout appliqué !</span>
          </div>
          <div className="text-muted-foreground">
            Organisation en grille {lastLayoutInfo.columns} colonnes • {lastLayoutInfo.totalNodes} blocs • Espacement {lastLayoutInfo.spacing}px
          </div>
        </div>
      )}

      {/* Canvas vide */}
      {!isLoading && nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md p-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Canvas vide</h3>
            <p className="text-muted-foreground mb-6">
              Commencez par créer votre premier bloc pour structurer votre projet avec des inputs/outputs configurables.
            </p>
            
            <div className="flex flex-col gap-2">
              <Button onClick={handleCreateStandardBlock} className="gap-2">
                <Plus className="w-4 h-4" />
                Créer un bloc avancé
              </Button>
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCreateDemoData}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Ou créer des blocs d'exemple (Notion, OpenAI, Figma)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialogue d'édition de bloc avancé */}
      <AdvancedBlockEditDialog
        open={showAdvancedEditDialog}
        onOpenChange={setShowAdvancedEditDialog}
        block={editingBlock}
        onSave={handleSaveBlock}
        isCreating={isCreating}
      />

      {/* Dialogue d'édition de bloc logique */}
      <LogicBlockEditDialog
        open={showLogicEditDialog}
        onOpenChange={setShowLogicEditDialog}
        block={editingBlock}
        onSave={handleSaveBlock}
        isCreating={isCreating}
      />
    </div>
  );
}