import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e`;

interface Block {
  id: string; // Changed to string for KV store
  project_id: string; // Changed to string for KV store
  title: string;
  description?: string;
  type: string;
  status: string;
  position_x: number;
  position_y: number;
  width?: number;
  height?: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface Relation {
  id: string; // Changed to string for KV store
  project_id: string; // Changed to string for KV store
  source_block_id: string; // Changed to string for KV store
  target_block_id: string; // Changed to string for KV store
  type: string;
  metadata?: any;
  created_at: string;
  source_block?: Block;
  target_block?: Block;
}

interface Project {
  id: string; // Changed to string for KV store
  title: string;
  description?: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useCanvasAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE}${endpoint}`;
    
    // Get access token from current session
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token || publicAnonKey;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  }, []);

  // Projects API
  const getProjects = useCallback(async (): Promise<Project[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/projects');
      return data.projects || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const createProject = useCallback(async (project: Partial<Project>): Promise<Project | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/projects', {
        method: 'POST',
        body: JSON.stringify(project),
      });
      return data.project;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const getProject = useCallback(async (projectId: string): Promise<Project | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/projects/${projectId}`);
      return data.project;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Blocks API
  const getBlocks = useCallback(async (projectId: string): Promise<Block[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/projects/${projectId}/blocks`);
      return data.blocks || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blocks');
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const createBlock = useCallback(async (projectId: string, block: Partial<Block>): Promise<Block | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/projects/${projectId}/blocks`, {
        method: 'POST',
        body: JSON.stringify(block),
      });
      return data.block;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create block');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const updateBlock = useCallback(async (blockId: string, updates: Partial<Block>): Promise<Block | null> => {
    setError(null);
    try {
      const data = await apiCall(`/blocks/${blockId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return data.block;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update block');
      return null;
    }
  }, [apiCall]);

  const deleteBlock = useCallback(async (blockId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiCall(`/blocks/${blockId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete block');
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const batchUpdatePositions = useCallback(async (updates: Array<{id: string, position_x: number, position_y: number}>): Promise<boolean> => {
    try {
      const response = await apiCall('/blocks/batch-update-positions', {
        method: 'POST',
        body: JSON.stringify({ updates }),
      });
      return response.success || true;
    } catch (err) {
      console.error('Failed to batch update positions:', err);
      return false;
    }
  }, [apiCall]);

  // Relations API
  const getRelations = useCallback(async (projectId: string): Promise<Relation[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/projects/${projectId}/relations`);
      return data.relations || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch relations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const createRelation = useCallback(async (projectId: string, relation: Partial<Relation>): Promise<Relation | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/projects/${projectId}/relations`, {
        method: 'POST',
        body: JSON.stringify(relation),
      });
      return data.relation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create relation');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const deleteRelation = useCallback(async (relationId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiCall(`/relations/${relationId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete relation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Initialize demo data
  const initDemo = useCallback(async (): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/init-demo', {
        method: 'POST',
      });
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize demo');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Health check
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      await apiCall('/health');
      return true;
    } catch (err) {
      return false;
    }
  }, [apiCall]);

  return {
    loading,
    error,
    // Projects
    getProjects,
    createProject,
    getProject,
    // Blocks
    getBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    batchUpdatePositions,
    // Relations
    getRelations,
    createRelation,
    deleteRelation,
    // Utils
    checkHealth,
    initDemo,
  };
}

export type { Block, Relation, Project };