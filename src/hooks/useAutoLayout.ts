import { useCallback } from 'react';
import { Node, Edge } from 'reactflow';

interface LayoutOptions {
  spacing?: number;
  gridColumns?: number;
  startX?: number;
  startY?: number;
}

interface UseAutoLayoutProps {
  onNodesChange: (nodes: Node[]) => void;
  onBatchUpdatePositions?: (updates: Array<{id: string, position_x: number, position_y: number}>) => void;
}

export function useAutoLayout({ onNodesChange, onBatchUpdatePositions }: UseAutoLayoutProps) {

  // Layout en grille avec espacement généreux
  const gridLayout = useCallback((nodes: Node[], options: LayoutOptions = {}) => {
    const { 
      spacing = 350,  // Espacement généreux par défaut
      gridColumns = Math.ceil(Math.sqrt(nodes.length)), // Colonnes automatiques basées sur le nombre de nœuds
      startX = 150,   // Position de départ X
      startY = 150    // Position de départ Y
    } = options;
    
    const updatedNodes = nodes.map((node, index) => {
      const row = Math.floor(index / gridColumns);
      const col = index % gridColumns;
      
      return {
        ...node,
        position: {
          x: startX + col * spacing,
          y: startY + row * spacing
        }
      };
    });
    
    return updatedNodes;
  }, []);

  // Fonction principale d'autolayout (grille simple)
  const applyGridLayout = useCallback((
    nodes: Node[],
    options: LayoutOptions = {}
  ) => {
    console.log('Applying grid layout to', nodes.length, 'nodes');
    
    // Calculer le nombre optimal de colonnes pour une disposition équilibrée
    const nodeCount = nodes.length;
    let optimalColumns;
    
    if (nodeCount <= 4) {
      optimalColumns = Math.min(nodeCount, 2); // 1-2 colonnes pour peu de blocs
    } else if (nodeCount <= 9) {
      optimalColumns = 3; // 3 colonnes pour 5-9 blocs
    } else if (nodeCount <= 16) {
      optimalColumns = 4; // 4 colonnes pour 10-16 blocs
    } else {
      optimalColumns = Math.min(5, Math.ceil(Math.sqrt(nodeCount))); // Max 5 colonnes
    }
    
    // Options optimisées
    const layoutOptions = {
      spacing: 350,  // Espacement généreux entre les blocs
      gridColumns: optimalColumns,
      startX: 150,   // Marge depuis le bord gauche
      startY: 150,   // Marge depuis le bord haut
      ...options
    };
    
    // Appliquer le layout en grille
    const updatedNodes = gridLayout(nodes, layoutOptions);
    
    // Mettre à jour les nœuds dans ReactFlow
    onNodesChange(updatedNodes);
    
    // Si une fonction de mise à jour des positions est fournie, l'utiliser
    if (onBatchUpdatePositions) {
      const positionUpdates = updatedNodes.map(node => ({
        id: node.id,
        position_x: node.position.x,
        position_y: node.position.y,
      }));
      onBatchUpdatePositions(positionUpdates);
    }
    
    return {
      nodes: updatedNodes,
      gridInfo: {
        columns: layoutOptions.gridColumns,
        spacing: layoutOptions.spacing,
        totalNodes: nodes.length
      }
    };
  }, [gridLayout, onNodesChange, onBatchUpdatePositions]);

  return {
    applyGridLayout,
    gridLayout
  };
}