import { useState, useCallback, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { supabase } from '../utils/supabase/client';
import { projectId as supabaseProjectId, publicAnonKey } from '../utils/supabase/info';

interface CanvasData {
  nodes: any[];
  edges: any[];
  nodePositions?: { [nodeId: string]: { x: number; y: number } };
  viewport?: { x: number; y: number; zoom: number };
  lastSaved?: string;
  projectId?: number;
}

interface UseCanvasPersistenceOptions {
  projectId: number;
  autoSaveDelay?: number; // en millisecondes
  enableAutoSave?: boolean;
}

const API_BASE = `https://${supabaseProjectId}.supabase.co/functions/v1/make-server-6c8ffc9e`;

export function useCanvasPersistence({
  projectId,
  autoSaveDelay = 2000,
  enableAutoSave = true
}: UseCanvasPersistenceOptions) {
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoSaveTimeoutId, setAutoSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Générer la clé de stockage pour le projet
  const getStorageKey = useCallback(() => `canvas_project_${projectId}`, [projectId]);

  // Charger les données depuis localStorage
  const loadCanvasData = useCallback((): CanvasData | null => {
    try {
      const savedData = localStorage.getItem(getStorageKey());
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log(`Données du canvas restaurées pour le projet ${projectId}:`, parsedData);
        setLastSavedAt(parsedData.lastSaved || null);
        return parsedData;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du canvas:', error);
    }
    return null;
  }, [getStorageKey, projectId]);

  // Sauvegarder dans localStorage
  const saveToLocalStorage = useCallback((data: CanvasData) => {
    try {
      const dataWithMetadata = {
        ...data,
        lastSaved: new Date().toISOString(),
        projectId: projectId
      };
      
      localStorage.setItem(getStorageKey(), JSON.stringify(dataWithMetadata));
      setLastSavedAt(dataWithMetadata.lastSaved);
      setHasUnsavedChanges(false);
      
      console.log(`Canvas sauvegardé pour le projet ${projectId}:`, dataWithMetadata);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde localStorage:', error);
      return false;
    }
  }, [getStorageKey, projectId]);

  // Sauvegarder sur le serveur (Supabase)
  const saveToServer = useCallback(async (data: CanvasData): Promise<boolean> => {
    try {
      // Get access token (session) or fallback to anon for public endpoints
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || publicAnonKey;

      const response = await fetch(`${API_BASE}/projects/${String(projectId)}/canvas`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ canvas_data: data })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({} as any));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Sauvegarde serveur réussie:', result);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde serveur:', error);
      return false;
    }
  }, [projectId]);

  // Convertir les nœuds et edges ReactFlow en format de sauvegarde
  const convertFlowToCanvasData = useCallback((
    flowNodes: Node[], 
    flowEdges: Edge[], 
    viewport?: { x: number; y: number; zoom: number }
  ): CanvasData => {
    // Extraire les données des nœuds
    const nodes = flowNodes.map(node => ({
      id: node.id,
      label: node.data.label,
      description: node.data.description,
      category: node.data.category,
      metadata: node.data.metadata
    }));

    // Extraire les données des edges
    const edges = flowEdges.map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.data?.type || 'inspire'
    }));

    // Sauvegarder les positions des nœuds
    const nodePositions: { [nodeId: string]: { x: number; y: number } } = {};
    flowNodes.forEach(node => {
      nodePositions[node.id] = {
        x: node.position.x,
        y: node.position.y
      };
    });

    return {
      nodes,
      edges,
      nodePositions,
      viewport
    };
  }, []);

  // Sauvegarder les données (localStorage + serveur)
  const saveCanvasData = useCallback(async (
    flowNodes: Node[], 
    flowEdges: Edge[], 
    viewport?: { x: number; y: number; zoom: number },
    forceServerSave = false
  ): Promise<boolean> => {
    setIsAutoSaving(true);
    
    const canvasData = convertFlowToCanvasData(flowNodes, flowEdges, viewport);
    
    // Toujours sauvegarder en local
    const localSuccess = saveToLocalStorage(canvasData);
    
    // Sauvegarder sur le serveur si demandé ou pour auto-save online
    let serverSuccess = true;
    if (forceServerSave) {
      serverSuccess = await saveToServer(canvasData);
    }
    
    setIsAutoSaving(false);
    return localSuccess && serverSuccess;
  }, [convertFlowToCanvasData, saveToLocalStorage, saveToServer]);

  // Marquer comme modifié et programmer une auto-sauvegarde
  const markAsModified = useCallback(() => {
    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }

    // Annuler l'auto-sauvegarde précédente
    if (autoSaveTimeoutId) {
      clearTimeout(autoSaveTimeoutId);
    }

    // Programmer une nouvelle auto-sauvegarde si activée
    if (enableAutoSave) {
      const newTimeoutId = setTimeout(() => {
        // Cette callback sera appelée par le composant parent
        // qui a accès aux nodes et edges actuels
        console.log('Auto-sauvegarde déclenchée');
      }, autoSaveDelay);
      
      setAutoSaveTimeoutId(newTimeoutId);
    }
  }, [hasUnsavedChanges, autoSaveTimeoutId, enableAutoSave, autoSaveDelay]);

  // Auto-sauvegarde avec les données actuelles
  const triggerAutoSave = useCallback(async (
    flowNodes: Node[], 
    flowEdges: Edge[], 
    viewport?: { x: number; y: number; zoom: number }
  ) => {
    if (hasUnsavedChanges && !isAutoSaving) {
      // Enregistrer aussi en ligne lors des autosauvegardes
      await saveCanvasData(flowNodes, flowEdges, viewport, true);
    }
  }, [hasUnsavedChanges, isAutoSaving, saveCanvasData]);

  // Supprimer les données sauvegardées (utile pour nettoyer)
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey());
      setLastSavedAt(null);
      setHasUnsavedChanges(false);
      console.log(`Données du canvas supprimées pour le projet ${projectId}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error);
      return false;
    }
  }, [getStorageKey, projectId]);

  // Obtenir les statistiques de sauvegarde
  const getSaveStatus = useCallback(() => {
    if (isAutoSaving) {
      return {
        status: 'saving' as const,
        message: 'Sauvegarde en cours...',
        color: 'bg-blue-100 text-blue-800'
      };
    }
    
    if (hasUnsavedChanges) {
      return {
        status: 'unsaved' as const,
        message: 'Modifications non sauvegardées',
        color: 'bg-orange-100 text-orange-800'
      };
    }
    
    if (lastSavedAt) {
      const timeAgo = Math.round((Date.now() - new Date(lastSavedAt).getTime()) / 1000);
      if (timeAgo < 60) {
        return {
          status: 'saved' as const,
          message: 'Sauvegardé automatiquement',
          color: 'bg-green-100 text-green-800'
        };
      } else {
        return {
          status: 'saved' as const,
          message: `Sauvé il y a ${Math.round(timeAgo / 60)}min`,
          color: 'bg-green-100 text-green-800'
        };
      }
    }
    
    return null;
  }, [isAutoSaving, hasUnsavedChanges, lastSavedAt]);

  // Nettoyer les timeouts au démontage
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutId) {
        clearTimeout(autoSaveTimeoutId);
      }
    };
  }, [autoSaveTimeoutId]);

  return {
    // État
    lastSavedAt,
    hasUnsavedChanges,
    isAutoSaving,
    
    // Actions
    loadCanvasData,
    saveCanvasData,
    markAsModified,
    triggerAutoSave,
    clearSavedData,
    
    // Utilitaires
    getSaveStatus,
    convertFlowToCanvasData,
    
    // Méthodes de sauvegarde spécifiques
    saveToLocalStorage,
    saveToServer
  };
}