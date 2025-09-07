import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface Project {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  project_id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface Relation {
  id: string;
  project_id: string;
  source_block_id: string;
  target_block_id: string;
  type: string;
  metadata: any;
  created_at: string;
}

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e`;

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  // Obtenir le token d'accès de la session actuelle
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token || publicAnonKey;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
};

export const useSupabaseProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les projets
  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/projects');
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau projet
  const createProject = async (projectData: { title: string; description?: string; type?: string }) => {
    try {
      let finalTitle = projectData.title;
      
      // Si le titre est "untitled1", vérifier s'il existe déjà et incrémenter si nécessaire
      if (projectData.title === 'untitled1') {
        const existingTitles = projects.map(p => p.title.toLowerCase());
        let counter = 1;
        let baseTitle = 'untitled';
        
        while (existingTitles.includes(`${baseTitle}${counter}`)) {
          counter++;
        }
        
        finalTitle = `${baseTitle}${counter}`;
      }
      
      const data = await apiCall('/projects', {
        method: 'POST',
        body: JSON.stringify({
          ...projectData,
          title: finalTitle
        }),
      });
      
      await loadProjects(); // Recharger la liste
      return data.project;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du projet');
      throw err;
    }
  };

  // Obtenir un projet spécifique
  const getProject = async (id: string) => {
    try {
      const data = await apiCall(`/projects/${id}`);
      return data.project;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération du projet');
      throw err;
    }
  };

  // Mettre à jour un projet
  const updateProject = async (id: string, projectData: { title?: string; description?: string; type?: string }) => {
    try {
      const data = await apiCall(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(projectData),
      });
      
      // Mettre à jour localement la liste des projets
      setProjects(prev => prev.map(project => 
        project.id === id ? data.project : project
      ));
      
      return data.project;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du projet');
      throw err;
    }
  };

  // Supprimer un projet
  const deleteProject = async (id: string) => {
    try {
      await apiCall(`/projects/${id}`, { method: 'DELETE' });
      
      // Mettre à jour localement la liste des projets
      setProjects(prev => prev.filter(project => project.id !== id));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du projet');
      throw err;
    }
  };

  // Initialiser les données de démonstration
  const initDemoData = async () => {
    try {
      await apiCall('/init-demo', { method: 'POST' });
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'initialisation des données de démo');
      throw err;
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    initDemoData,
  };
};

export const useSupabaseBlocks = (projectId: string) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les blocs d'un projet
  const loadBlocks = async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/projects/${projectId}/blocks`);
      setBlocks(data.blocks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des blocs');
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau bloc
  const createBlock = async (blockData: {
    title: string;
    description?: string;
    type?: string;
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
    metadata?: any;
  }) => {
    try {
      const data = await apiCall(`/projects/${projectId}/blocks`, {
        method: 'POST',
        body: JSON.stringify(blockData),
      });
      
      await loadBlocks(); // Recharger la liste
      return data.block;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du bloc');
      throw err;
    }
  };

  // Mettre à jour un bloc
  const updateBlock = async (blockId: string, blockData: Partial<Block>) => {
    try {
      const data = await apiCall(`/blocks/${blockId}`, {
        method: 'PUT',
        body: JSON.stringify(blockData),
      });
      
      await loadBlocks(); // Recharger la liste
      return data.block;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du bloc');
      throw err;
    }
  };

  // Supprimer un bloc
  const deleteBlock = async (blockId: string) => {
    try {
      await apiCall(`/blocks/${blockId}`, { method: 'DELETE' });
      await loadBlocks(); // Recharger la liste
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du bloc');
      throw err;
    }
  };

  // Mise à jour en lot des positions
  const batchUpdatePositions = async (updates: { id: string; position_x: number; position_y: number }[]) => {
    try {
      await apiCall('/blocks/batch-update-positions', {
        method: 'POST',
        body: JSON.stringify({ updates }),
      });
      
      // Mettre à jour localement les positions sans recharger toute la liste
      setBlocks(prev => prev.map(block => {
        const update = updates.find(u => u.id === block.id);
        return update ? { ...block, position_x: update.position_x, position_y: update.position_y } : block;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour des positions');
      throw err;
    }
  };

  useEffect(() => {
    loadBlocks();
  }, [projectId]);

  return {
    blocks,
    loading,
    error,
    loadBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    batchUpdatePositions,
  };
};

export const useSupabaseRelations = (projectId: string) => {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger toutes les relations d'un projet
  const loadRelations = async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/projects/${projectId}/relations`);
      setRelations(data.relations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des relations');
    } finally {
      setLoading(false);
    }
  };

  // Créer une nouvelle relation
  const createRelation = async (relationData: {
    source_block_id: string;
    target_block_id: string;
    type?: string;
    metadata?: any;
  }) => {
    try {
      const data = await apiCall(`/projects/${projectId}/relations`, {
        method: 'POST',
        body: JSON.stringify(relationData),
      });
      
      await loadRelations(); // Recharger la liste
      return data.relation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la relation');
      throw err;
    }
  };

  // Supprimer une relation
  const deleteRelation = async (relationId: string) => {
    try {
      await apiCall(`/relations/${relationId}`, { method: 'DELETE' });
      await loadRelations(); // Recharger la liste
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de la relation');
      throw err;
    }
  };

  useEffect(() => {
    loadRelations();
  }, [projectId]);

  return {
    relations,
    loading,
    error,
    loadRelations,
    createRelation,
    deleteRelation,
  };
};