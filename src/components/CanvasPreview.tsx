import { useState, useEffect, useCallback } from "react";
import { Star, Zap, Briefcase } from "lucide-react";
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  BackgroundVariant,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

interface ProjectDetails {
  id: number;
  title: string;
  type: string;
  from: 'myproject' | 'liked';
}

interface CanvasPreviewProps {
  project: ProjectDetails;
  className?: string;
}

interface NodeData {
  id: string;
  label: string;
  description: string;
  category: string;
  metadata?: {
    impact?: number;
    feasibility?: number;
    businessValue?: number;
  };
}

interface EdgeData {
  source: string;
  target: string;
  type: string;
}

interface CanvasData {
  nodes: NodeData[];
  edges: EdgeData[];
  nodePositions?: { [nodeId: string]: { x: number; y: number } };
  viewport?: { x: number; y: number; zoom: number };
}

// Nœud personnalisé en mode lecture seule (version simplifiée)
const PreviewNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const categories = {
    problem: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', icon: '🚩' },
    idea: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', icon: '💡' },
    solution: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', icon: '✅' },
    risk: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', icon: '⚠️' },
    default: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800', icon: '📝' }
  };

  const category = categories[data.category] || categories.default;

  return (
    <div 
      className={`rounded-xl p-3 shadow-md border-2 transition-all duration-200 min-w-[180px] max-w-[280px] ${
        category.bg
      } ${category.border} ${
        selected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
      }`}
    >
      {/* Header avec icône et titre */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{category.icon}</span>
        <div className={`text-sm font-semibold ${category.text} truncate`}>
          {data.label}
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <div className="text-sm text-gray-700 mb-2 line-clamp-2">
          {data.description}
        </div>
      )}

      {/* Métadonnées (version compacte) */}
      {data.metadata && (
        <div className="space-y-1">
          {data.metadata.impact !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Star className="w-2.5 h-2.5" />
                <span>Impact:</span>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div
                    key={num}
                    className={`w-2.5 h-2.5 rounded-full text-xs ${
                      num <= (data.metadata.impact || 0) 
                        ? 'bg-orange-400' 
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {data.metadata.feasibility !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Zap className="w-2.5 h-2.5" />
                <span>Faisabilité:</span>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div
                    key={num}
                    className={`w-2.5 h-2.5 rounded-full text-xs ${
                      num <= (data.metadata.feasibility || 0) 
                        ? 'bg-green-400' 
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {data.metadata.businessValue !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Briefcase className="w-2.5 h-2.5" />
                <span>Valeur:</span>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div
                    key={num}
                    className={`w-2.5 h-2.5 rounded-full text-xs ${
                      num <= (data.metadata.businessValue || 0) 
                        ? 'bg-purple-400' 
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Score total si plusieurs métriques */}
      {data.metadata && Object.keys(data.metadata).length > 1 && (
        <div className="text-xs bg-white rounded px-2 py-1 text-center font-medium mt-2">
          Score: {(data.metadata.impact || 0) + (data.metadata.feasibility || 0) + (data.metadata.businessValue || 0)}/15
        </div>
      )}

      {/* Handles de connexion (inactifs) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-2 h-2 bg-blue-400 border border-white opacity-50"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-2 h-2 bg-blue-400 border border-white opacity-50"
      />
    </div>
  );
};

// Types de nœuds pour la preview
const previewNodeTypes: NodeTypes = {
  preview: PreviewNode,
};

// Styles pour les arêtes
const getEdgeStyle = (type: string) => {
  switch (type) {
    case 'cause':
      return { 
        stroke: '#f97316', 
        strokeWidth: 2,
        strokeDasharray: 'none'
      };
    case 'inspire':
      return { 
        stroke: '#3b82f6', 
        strokeWidth: 2,
        strokeDasharray: 'none'
      };
    case 'contradict':
      return { 
        stroke: '#ef4444', 
        strokeWidth: 2,
        strokeDasharray: '8 4'
      };
    case 'depend':
      return { 
        stroke: '#8b5cf6', 
        strokeWidth: 2,
        strokeDasharray: '4 4'
      };
    case 'support':
      return { 
        stroke: '#10b981', 
        strokeWidth: 2,
        strokeDasharray: 'none'
      };
    default:
      return { 
        stroke: '#6b7280', 
        strokeWidth: 1.5,
        strokeDasharray: 'none'
      };
  }
};

// Données par défaut si pas de sauvegarde
const defaultCanvasData: CanvasData = {
  nodes: [
    {
      id: '1',
      label: 'Problème Client',
      description: 'Difficulté à visualiser les relations entre idées',
      category: 'problem'
    },
    {
      id: '2',
      label: 'Canvas Interactif',
      description: 'Outil de brainstorming visuel avec métadonnées',
      category: 'idea',
      metadata: { impact: 4, feasibility: 3, businessValue: 5 }
    },
    {
      id: '3',
      label: 'Solution MVP',
      description: 'Version simplifiée avec fonctionnalités essentielles',
      category: 'solution'
    }
  ],
  edges: [
    { source: '1', target: '2', type: 'cause' },
    { source: '2', target: '3', type: 'inspire' }
  ],
  nodePositions: {
    '1': { x: 50, y: 50 },
    '2': { x: 300, y: 50 },
    '3': { x: 550, y: 50 }
  }
};

export default function CanvasPreview({ project, className = "" }: CanvasPreviewProps) {
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les données sauvegardées depuis localStorage
  const loadCanvasData = useCallback(() => {
    try {
      const storageKey = `canvas_project_${project.id}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('Données de preview chargées:', parsedData);
        return parsedData;
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la preview:', error);
    }
    return null;
  }, [project.id]);

  // Convertir les données en nœuds et arêtes ReactFlow (mode preview)
  const convertToPreviewFlow = useCallback((data: CanvasData) => {
    const previewNodes: Node[] = data.nodes.map((nodeData, index) => {
      // Utiliser les positions sauvegardées ou générer des positions par défaut
      const savedPosition = data.nodePositions?.[nodeData.id];
      const defaultPosition = { 
        x: (index % 3) * 200 + 50,
        y: Math.floor(index / 3) * 150 + 50
      };

      return {
        id: nodeData.id,
        type: 'preview',
        position: savedPosition || defaultPosition,
        data: nodeData,
        draggable: false, // Empêcher le déplacement
        selectable: false, // Empêcher la sélection
        deletable: false, // Empêcher la suppression
        connectable: false // Empêcher les nouvelles connexions
      };
    });

    const previewEdges: Edge[] = data.edges.map((edgeData, index) => ({
      id: `preview-e-${index}`,
      source: edgeData.source,
      target: edgeData.target,
      type: 'smoothstep',
      style: getEdgeStyle(edgeData.type),
      data: { type: edgeData.type },
      deletable: false, // Empêcher la suppression
      selectable: false, // Empêcher la sélection
      focusable: false // Empêcher le focus
    }));

    return { previewNodes, previewEdges };
  }, []);

  // Initialiser la preview
  useEffect(() => {
    setIsLoading(true);
    
    // Petite pause pour l'effet de chargement
    setTimeout(() => {
      const savedData = loadCanvasData();
      const dataToUse = savedData || defaultCanvasData;
      
      setCanvasData(dataToUse);
      const { previewNodes, previewEdges } = convertToPreviewFlow(dataToUse);
      setNodes(previewNodes);
      setEdges(previewEdges);
      setIsLoading(false);
    }, 300);
  }, [project.id, loadCanvasData, convertToPreviewFlow, setNodes, setEdges]);

  // Calcul des statistiques du canvas
  const getCanvasStats = () => {
    if (!canvasData) return { nodes: 0, edges: 0, ideas: 0, problems: 0, solutions: 0, risks: 0 };
    
    const categories = canvasData.nodes.reduce((acc, node) => {
      acc[node.category] = (acc[node.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      nodes: canvasData.nodes.length,
      edges: canvasData.edges.length,
      ideas: categories.idea || 0,
      problems: categories.problem || 0,
      solutions: categories.solution || 0,
      risks: categories.risk || 0
    };
  };

  const stats = getCanvasStats();

  if (isLoading) {
    return (
      <div className={`bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
          </div>
          <p className="text-sm text-gray-600">Chargement de la preview...</p>
        </div>
      </div>
    );
  }

  if (!canvasData || canvasData.nodes.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <Star className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="mb-2">Canvas vide</h3>
          <p className="text-sm text-muted-foreground">
            Ce projet ne contient pas encore d'éléments sur le canvas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-lg border border-gray-200 relative ${className}`}>
      {/* Header avec statistiques */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm px-3 py-2">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{stats.nodes} éléments</span>
            <span>•</span>
            <span>{stats.edges} connexions</span>
          </div>
        </div>
      </div>



      {/* Canvas ReactFlow en mode lecture seule */}
      <ReactFlow 
        nodes={nodes} 
        edges={edges}
        nodeTypes={previewNodeTypes}
        className="bg-gray-50 rounded-lg"
        fitView
        fitViewOptions={{
          padding: 0.15,
          includeHiddenNodes: false,
          minZoom: 0.5,
          maxZoom: 1.5
        }}
        // Désactiver toutes les interactions d'édition
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        selectNodesOnDrag={false}
        panOnDrag={true} // Permettre le déplacement de la vue
        zoomOnScroll={true} // Permettre le zoom
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        deleteKeyCode={null} // Désactiver la suppression
        multiSelectionKeyCode={null} // Désactiver la sélection multiple
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#d1d5db"
        />
        
        <Controls 
          position="bottom-right"
          className="bg-white shadow-lg rounded-lg border border-gray-200"
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />
        
        <MiniMap 
          position="top-right"
          className="bg-white shadow-lg rounded-lg border border-gray-200 opacity-75"
          nodeColor={(node) => {
            switch (node.data?.category) {
              case 'problem': return '#fca5a5';
              case 'idea': return '#93c5fd';
              case 'solution': return '#86efac';
              case 'risk': return '#fde047';
              default: return '#e5e7eb';
            }
          }}
          maskColor="rgba(255, 255, 255, 0.8)"
          pannable={false}
          zoomable={false}
        />
      </ReactFlow>

      {/* Statistiques détaillées en bas */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm px-3 py-2">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            {stats.problems > 0 && <span>🚩 {stats.problems}</span>}
            {stats.ideas > 0 && <span>💡 {stats.ideas}</span>}
            {stats.solutions > 0 && <span>✅ {stats.solutions}</span>}
            {stats.risks > 0 && <span>⚠️ {stats.risks}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}