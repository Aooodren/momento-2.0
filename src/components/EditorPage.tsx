import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Plus, Save, AlertCircle, Loader2, RefreshCw, ChevronDown, Sparkles, Layers, Eye, EyeOff, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
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
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useCanvasAPI, Block, Relation } from '../hooks/useCanvasAPI';
import { useAutoLayout } from '../hooks/useAutoLayout';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { useProjectPermissions } from '../hooks/useProjectPermissions';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { useAuthContext } from '../hooks/useAuth';
import { useRealtimeCollaboration, CollaboratorCursor, CollaboratorSelection } from '../hooks/useRealtimeCollaboration';
import { AdvancedCanvasBlock } from './AdvancedCanvasBlock';
import { LogicBlock } from './LogicBlock';
import ClaudeBlock from './ClaudeBlock';
import ClaudeFigmaBlock from './ClaudeFigmaBlock';
import ClaudeNotionBlock from './ClaudeNotionBlock';
import AdvancedBlockEditDialog from './AdvancedBlockEditDialog';
import LogicBlockEditDialog from './LogicBlockEditDialog';
import CollaboratorCursors from './CollaboratorCursors';
import { useNotify } from './ui/notifications';
import { CanvasGridSkeleton } from './ui/skeletons';
import { EmptyCanvasEmptyState } from './ui/empty-states';
import { FadeIn, PressableButton, HoverCard, ScrollTrigger } from './ui/animations';
import { useCanvasShortcuts } from '../hooks/useKeyboardShortcuts';

interface ProjectDetails {
  id: string;
  title: string;
  type: string;
  from: 'myproject' | 'liked';
}

interface EditorPageProps {
  project: ProjectDetails;
  onBack: () => void;
  onProjectUpdate?: (updatedProject: ProjectDetails) => void;
}

// Types de nœuds personnalisés
const nodeTypes: NodeTypes = {
  block: AdvancedCanvasBlock,
  logic: LogicBlock,
  claude: ClaudeBlock,
  'claude-figma': ClaudeFigmaBlock,
  'claude-notion': ClaudeNotionBlock,
};

export default function EditorPage({ project, onBack, onProjectUpdate }: EditorPageProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [showAdvancedEditDialog, setShowAdvancedEditDialog] = useState(false);
  const [showLogicEditDialog, setShowLogicEditDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [blockTypeToCreate, setBlockTypeToCreate] = useState<'standard' | 'logic' | 'claude' | 'claude-figma' | 'claude-notion'>('standard');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyingLayout, setIsApplyingLayout] = useState(false);
  // const [lastLayoutInfo, setLastLayoutInfo] = useState<{columns: number, spacing: number, totalNodes: number} | null>(null);
  const notify = useNotify();
  
  // États pour l'édition du nom de projet
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [projectName, setProjectName] = useState(project.title || 'untitled1');
  const [isSavingProjectName, setIsSavingProjectName] = useState(false);
  
  // États pour le panneau calques
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [hiddenBlocks, setHiddenBlocks] = useState<Set<string>>(new Set());
  
  // Configuration des raccourcis clavier du canvas
  const { shortcuts: canvasShortcuts } = useCanvasShortcuts({
    onCreateBlock: () => {
      handleCreateStandardBlock();
    },
    onDeleteSelection: () => {
      // TODO: Implémenter la suppression des éléments sélectionnés
      console.log('Suppression des éléments sélectionnés à implémenter');
    },
    onAutoLayout: () => {
      if (autoLayout) {
        autoLayout();
      }
    },
    onFitView: () => {
      // TODO: Accéder aux méthodes ReactFlow pour ajuster la vue
      console.log('Ajuster à la vue à implémenter');
    },
    onToggleGrid: () => {
      // TODO: Basculer l'affichage de la grille
      console.log('Basculer la grille à implémenter');
    },
    onToggleMinimap: () => {
      // TODO: Basculer l'affichage de la minimap
      console.log('Basculer la minimap à implémenter');
    },
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const layoutInfoTimeoutRef = useRef<NodeJS.Timeout>();
  const positionUpdatesRef = useRef<Map<string, { position_x: number; position_y: number }>>(new Map());

  const {
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
    saveCanvasData,
  } = useCanvasAPI();

  // Hook pour les projets
  const { updateProject } = useSupabaseProjects();

  // Hooks pour les membres et permissions
  const { user } = useAuthContext();
  const { members } = useProjectMembers(project.id);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Get project owner and user role
  const projectOwner = members.find(m => m.role === 'owner');
  const currentUserMember = user ? members.find(m => m.id === user.id) : null;

  // Hook pour la collaboration temps réel
  const {
    cursors,
    selections,
    broadcastCanvasActivity,
    updateSelection
  } = useRealtimeCollaboration({ 
    projectId: project.id,
    canvasRef 
  });
  const {} = useProjectPermissions(
    projectOwner?.id, 
    currentUserMember?.role as any
  );

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
  // useEffect(() => {
  //   if (lastLayoutInfo) {
  //     // Nettoyer le timeout précédent s'il existe
  //     if (layoutInfoTimeoutRef.current) {
  //       clearTimeout(layoutInfoTimeoutRef.current);
  //     }
  //     
  //     // Programmer la disparition de l'alerte après 3 secondes
  //     layoutInfoTimeoutRef.current = setTimeout(() => {
  //       setLastLayoutInfo(null);
  //     }, 3000);
  //   }
  //   
  //   return () => {
  //     if (layoutInfoTimeoutRef.current) {
  //       clearTimeout(layoutInfoTimeoutRef.current);
  //     }
  //   };
  // }, [lastLayoutInfo]);

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

  // Mettre à jour le nom local si le projet change
  useEffect(() => {
    setProjectName(project.title || 'untitled1');
  }, [project.title]);

  // Gestion de l'édition du nom de projet
  const handleProjectNameDoubleClick = () => {
    setIsEditingProjectName(true);
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
  };

  const handleProjectNameKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await saveProjectName();
    } else if (e.key === 'Escape') {
      setProjectName(project.title || 'untitled1');
      setIsEditingProjectName(false);
    }
  };

  const handleProjectNameBlur = async () => {
    await saveProjectName();
  };

  const saveProjectName = async () => {
    if (!projectName.trim()) {
      setProjectName(project.title || 'untitled1');
      setIsEditingProjectName(false);
      return;
    }

    if (projectName.trim() === project.title) {
      setIsEditingProjectName(false);
      return;
    }

    try {
      setIsSavingProjectName(true);
      const updatedProject = await updateProject(project.id, { title: projectName.trim() });
      
      // Notifier le parent du changement
      if (onProjectUpdate && updatedProject) {
        onProjectUpdate({
          ...project,
          title: updatedProject.title
        });
      }
      
      setIsEditingProjectName(false);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du nom de projet:', err);
      setProjectName(project.title || 'untitled1');
      setIsEditingProjectName(false);
    } finally {
      setIsSavingProjectName(false);
    }
  };

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
      console.log('📍 EditorPage - Loading blocks with positions:', 
        blocksData.map(b => `${b.title}: (${b.position_x}, ${b.position_y})`));
      
      const flowNodes: Node[] = blocksData.map((block) => {
        const isLogicBlock = block.type === 'logic' || block.metadata?.logicType;
        const isClaudeBlock = block.type === 'claude';
        const isClaudeFigmaBlock = block.type === 'claude-figma';
        const isClaudeNotionBlock = block.type === 'claude-notion';
        
        let nodeType = 'block'; // défaut
        if (isLogicBlock) nodeType = 'logic';
        else if (isClaudeBlock) nodeType = 'claude';
        else if (isClaudeFigmaBlock) nodeType = 'claude-figma';
        else if (isClaudeNotionBlock) nodeType = 'claude-notion';
        
        return {
          id: block.id,
          type: nodeType,
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
        sourceHandle: relation.source_handle || undefined,
        targetHandle: relation.target_handle || undefined,
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
      const createdBlocks: Block[] = [];
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
        await createRelation(project.id, {
          source_block_id: createdBlocks[0].id,
          target_block_id: createdBlocks[1].id,
          type: 'connection',
        });

        // Relation entre le deuxième et le troisième bloc (si il existe)
        if (createdBlocks.length >= 3) {
          await createRelation(project.id, {
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

  // Helper pour construire les données du canvas
  const buildCanvasData = useCallback(() => {
    const nodePositions: { [key: string]: { x: number; y: number } } = {};
    nodes.forEach((n) => {
      nodePositions[n.id] = { x: n.position.x, y: n.position.y };
    });

    const minimalNodes = nodes.map((n) => ({
      id: n.id,
      label: (n as any).data?.title || (n as any).data?.label,
      description: (n as any).data?.description,
      category: (n as any).data?.category,
      metadata: (n as any).data?.metadata,
    }));

    const minimalEdges = edges.map((e) => ({
      source: e.source,
      target: e.target,
      type: (e as any).data?.type || 'connection',
    }));

    return {
      nodes: minimalNodes,
      edges: minimalEdges,
      nodePositions,
    };
  }, [nodes, edges]);

  // Sauvegarde automatique des positions avec debounce
  const savePositions = useCallback(() => {
    const entries = Array.from(positionUpdatesRef.current.entries()) as Array<[string, { position_x: number; position_y: number }]>;
    const updates = entries.map(([id, position]) => ({
      id,
      ...position,
    }));

    if (updates.length > 0) {
      console.log('📤 EditorPage - Saving position updates:', updates);
      
      // Timeout de sécurité de 10 secondes
      const saveTimeout = setTimeout(() => {
        console.warn('⚠️ EditorPage - Save timeout, resetting pending state');
        setPendingChanges(false);
        setError('Sauvegarde timeout - veuillez réessayer');
      }, 10000);
      
      batchUpdatePositions(updates)
        .then((success: boolean) => {
          clearTimeout(saveTimeout);
          if (success) {
            console.log('✅ EditorPage - Position updates saved successfully');
            setLastSaved(new Date());
            setPendingChanges(false);
            positionUpdatesRef.current.clear();
            setError(null); // Clear any previous error
            
            // Sauvegarder aussi l'état complet du canvas côté serveur
            const canvasData = buildCanvasData();
            saveCanvasData(project.id, canvasData).catch((err: Error) => {
              console.error('EditorPage - Failed to save canvas data after positions:', err);
            });
          } else {
            console.error('❌ EditorPage - Failed to save position updates');
            setPendingChanges(false);
            setError('Échec de la sauvegarde des positions');
          }
        })
        .catch((err: Error) => {
          clearTimeout(saveTimeout);
          console.error('💥 EditorPage - Error saving positions:', err);
          setPendingChanges(false);
          setError('Erreur lors de la sauvegarde: ' + err.message);
        });
    }
  }, [batchUpdatePositions, buildCanvasData, saveCanvasData, project.id]);

  // Debounced save
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(savePositions, 800);
  }, [savePositions]);

  // Gestionnaire de déplacement de nœuds
  const handleNodeDragStop = useCallback((_, node: Node) => {
    const blockId = node.id;
    console.log(`EditorPage - Position update for block: ${blockId} to (${node.position.x}, ${node.position.y})`);
    
    // Mettre à jour immédiatement dans l'état local
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.id === blockId
          ? { ...block, position_x: node.position.x, position_y: node.position.y }
          : block
      )
    );
    
    positionUpdatesRef.current.set(blockId, {
      position_x: Math.round(node.position.x),
      position_y: Math.round(node.position.y),
    });
    
    setPendingChanges(true);
    debouncedSave();
  }, [debouncedSave]);

  // Gestionnaire de connexion entre nœuds
  const onConnect: OnConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return;

    try {
      console.log('EditorPage - Creating relation between:', 
        connection.source, '(', connection.sourceHandle, ') ->',
        connection.target, '(', connection.targetHandle, ')');
      
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
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        };

        setEdges((eds) => addEdge(newEdge, eds));
        setRelations((rels) => [...rels, relation]);
        console.log('EditorPage - Relation created successfully:', relation.id);
        // Sauvegarder l'état complet du canvas côté serveur
        const canvasData = buildCanvasData();
        saveCanvasData(project.id, canvasData).catch((err: Error) => {
          console.error('EditorPage - Failed to save canvas data after connect:', err);
        });
      }
    } catch (err) {
      console.error('EditorPage - Error creating relation:', err);
    }
  }, [project.id, createRelation, buildCanvasData, saveCanvasData]);

  // Gestionnaire de suppression d'arête
  const handleEdgeDelete = useCallback(async (edgeId: string) => {
    try {
      console.log('EditorPage - Deleting edge:', edgeId);
      const success = await deleteRelation(edgeId);
      if (success) {
        setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
        setRelations((rels) => rels.filter((rel) => rel.id !== edgeId));
        console.log('EditorPage - Edge deleted successfully:', edgeId);
        // Sauvegarder l'état complet du canvas côté serveur
        const canvasData = buildCanvasData();
        saveCanvasData(project.id, canvasData).catch((err: Error) => {
          console.error('EditorPage - Failed to save canvas data after edge delete:', err);
        });
      }
    } catch (err) {
      console.error('EditorPage - Error deleting relation:', err);
    }
  }, [deleteRelation, buildCanvasData, saveCanvasData, project.id]);

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
      
      // Afficher la notification de layout
      notify.layout(result.gridInfo.columns, result.gridInfo.totalNodes, result.gridInfo.spacing);
      
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

  // Créer un bloc Claude générique
  const handleCreateClaudeBlock = async () => {
    try {
      const claudeBlock = await createBlock(project.id, {
        title: "Claude AI",
        description: "Assistant IA pour traitement de texte",
        type: "claude",
        position_x: Math.random() * 400 + 100,
        position_y: Math.random() * 300 + 100,
        metadata: {
          claudeType: 'prompt',
          prompt: '',
          systemPrompt: '',
          model: 'claude-3-sonnet',
          temperature: 0.7,
          maxTokens: 4000
        }
      });

      if (claudeBlock) {
        const newNode: Node = {
          id: claudeBlock.id,
          type: 'claude',
          position: { x: claudeBlock.position_x, y: claudeBlock.position_y },
          data: {
            ...claudeBlock,
            onEdit: handleEditBlock,
            onDelete: handleDeleteBlock,
          },
        };

        setNodes((nds) => [...nds, newNode]);
        setBlocks((blocks) => [...blocks, claudeBlock]);
        
        // Diffuser l'activité de création
        broadcastCanvasActivity('node_created', claudeBlock.title);
      }
    } catch (err) {
      console.error('Erreur création bloc Claude:', err);
    }
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
        
        // Diffuser l'activité de suppression
        const deletedBlock = blocks.find(b => b.id === blockId);
        broadcastCanvasActivity('node_deleted', deletedBlock?.title || 'Bloc');
        
        // Marquer comme ayant des changements en cours et déclencher la sauvegarde
        setPendingChanges(true);
        debouncedSave();
        
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
    if (error && error.includes('sauvegarde')) {
      return { text: 'Erreur sauvegarde', color: 'text-red-600', icon: AlertCircle };
    }
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

  // Fonctions pour la gestion des calques
  const toggleBlockVisibility = (blockId: string) => {
    setHiddenBlocks((prev) => {
      const newHidden = new Set(prev);
      if (newHidden.has(blockId)) {
        newHidden.delete(blockId);
      } else {
        newHidden.add(blockId);
      }
      return newHidden;
    });

    // Mettre à jour la visibilité du nœud
    setNodes((nds) =>
      nds.map((node) =>
        node.id === blockId
          ? { ...node, hidden: !hiddenBlocks.has(blockId) }
          : node
      )
    );
  };

  const focusOnBlock = (blockId: string) => {
    // Désélectionner tous les nœuds et sélectionner celui cliqué
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: node.id === blockId
      }))
    );
    
    // Désélectionner toutes les arêtes
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        selected: false
      }))
    );
  };

  // Organiser les blocs par type pour le panneau calques
  const organizedBlocks = blocks.reduce((acc, block) => {
    const isLogic = block.type === 'logic' || block.metadata?.logicType;
    const category = isLogic ? 'logic' : 'standard';
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(block);
    return acc;
  }, {} as { standard?: Block[], logic?: Block[] });

  // Trouver le bloc actuellement sélectionné sur le canvas
  const selectedBlockId = nodes.find(node => node.selected)?.id;

  return (
    <div className="w-full h-full bg-gray-50 flex">
      {/* Contenu principal */}
      <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <PressableButton variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </PressableButton>
          <div className="border-l border-gray-300 h-6"></div>
          {/* Nom du projet éditable */}
          {isEditingProjectName ? (
            <Input
              value={projectName}
              onChange={handleProjectNameChange}
              onKeyDown={handleProjectNameKeyDown}
              onBlur={handleProjectNameBlur}
              autoFocus
              disabled={isSavingProjectName}
              className="text-lg font-medium h-auto px-2 py-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            />
          ) : (
            <h2 
              className="text-lg font-medium text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors" 
              onDoubleClick={handleProjectNameDoubleClick}
              title="Double-cliquez pour modifier le nom du projet"
            >
              {projectName}
            </h2>
          )}
          
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
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          

          {/* Bouton Calques */}
          <DropdownMenu open={showLayersPanel} onOpenChange={setShowLayersPanel}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Layers className="w-4 h-4" />
                Calques
                <Badge variant="secondary" className="ml-1 text-xs">
                  {blocks.length}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
              <div className="p-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Calques du canvas</span>
                  <span className="text-xs text-muted-foreground">
                    {blocks.length} bloc{blocks.length > 1 ? 's' : ''} • {relations.length} relation{relations.length > 1 ? 's' : ''}
                  </span>
                </div>
                
                {blocks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun bloc sur le canvas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Blocs Standards */}
                    {organizedBlocks.standard && organizedBlocks.standard.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-gray-500 rounded"></div>
                          <span className="text-sm font-medium">Blocs Standard</span>
                          <Badge variant="outline" className="text-xs">
                            {organizedBlocks.standard.length}
                          </Badge>
                        </div>
                        <div className="space-y-1 ml-5">
                          {organizedBlocks.standard.map((block) => (
                            <div 
                              key={block.id} 
                              className={`flex items-center gap-2 p-2 rounded-md group transition-colors ${
                                selectedBlockId === block.id 
                                  ? 'bg-blue-50 border border-blue-200' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-6 w-6"
                                onClick={() => toggleBlockVisibility(block.id)}
                              >
                                {hiddenBlocks.has(block.id) ? (
                                  <EyeOff className="w-3 h-3" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                              </Button>
                              <div className="flex-1 min-w-0" onClick={() => focusOnBlock(block.id)}>
                                <p className={`text-sm font-medium truncate cursor-pointer transition-colors ${
                                  selectedBlockId === block.id 
                                    ? 'text-blue-700' 
                                    : ''
                                }`}>
                                  {block.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {block.type}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Blocs Logiques */}
                    {organizedBlocks.logic && organizedBlocks.logic.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-indigo-500 rounded"></div>
                          <span className="text-sm font-medium">Blocs Logiques</span>
                          <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                            {organizedBlocks.logic.length}
                          </Badge>
                        </div>
                        <div className="space-y-1 ml-5">
                          {organizedBlocks.logic.map((block) => (
                            <div 
                              key={block.id} 
                              className={`flex items-center gap-2 p-2 rounded-md group transition-colors ${
                                selectedBlockId === block.id 
                                  ? 'bg-blue-50 border border-blue-200' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-6 w-6"
                                onClick={() => toggleBlockVisibility(block.id)}
                              >
                                {hiddenBlocks.has(block.id) ? (
                                  <EyeOff className="w-3 h-3" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                              </Button>
                              <div className="flex-1 min-w-0" onClick={() => focusOnBlock(block.id)}>
                                <p className={`text-sm font-medium truncate cursor-pointer transition-colors ${
                                  selectedBlockId === block.id 
                                    ? 'text-blue-700' 
                                    : ''
                                }`}>
                                  {block.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {block.metadata?.logicType || 'logic'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Menu de création de blocs */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PressableButton size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau bloc
                <ChevronDown className="w-3 h-3" />
              </PressableButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onClick={handleCreateStandardBlock}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">Bloc standard</span>
                  <span className="text-xs text-muted-foreground">
                    Notion, OpenAI, Figma, etc.
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCreateClaudeBlock}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">Bloc Claude AI</span>
                  <span className="text-xs text-muted-foreground">
                    Assistant IA généraliste avec prompts personnalisés
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
      <div 
        className="flex-1 relative"
        ref={canvasRef}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Chargement du canvas...</span>
            </div>
          </div>
        ) : (
          <>
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
              onNodeSelectionChange={(nodes) => {
                const selectedNode = nodes[0];
                if (selectedNode) {
                  const nodeBounds = {
                    x: selectedNode.position.x,
                    y: selectedNode.position.y,
                    width: selectedNode.width || 200,
                    height: selectedNode.height || 100
                  };
                  updateSelection(selectedNode.id, nodeBounds);
                } else {
                  updateSelection();
                }
              }}
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
          
          {/* Curseurs des collaborateurs */}
          <CollaboratorCursors 
            cursors={cursors as CollaboratorCursor[]} 
            selections={selections as CollaboratorSelection[]} 
          />
          </>
        )}
      </div>


      {/* Loading state pour canvas */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-50">
          <div className="flex items-center gap-3 p-6">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">Chargement du canvas...</span>
          </div>
          <CanvasGridSkeleton count={3} />
        </div>
      )}

      {/* Canvas vide */}
      {!isLoading && nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <FadeIn>
            <EmptyCanvasEmptyState onCreateBlock={handleCreateStandardBlock} />
          </FadeIn>
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
    </div>
  );
}