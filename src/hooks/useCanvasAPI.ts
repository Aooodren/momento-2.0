import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { 
  Block, 
  BlockRelation as Relation, 
  Project, 
  CreateBlockRequest,
  UpdateBlockRequest,
  CreateRelationRequest,
  BatchUpdatePositionsRequest,
  CanvasData
} from '../types/database';

export function useCanvasAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Direct Supabase client calls - more reliable than edge functions
  const handleError = (error: any, defaultMessage: string) => {
    console.error(defaultMessage, error);
    const message = error?.message || error?.error_description || defaultMessage;
    setError(message);
    return null;
  };

  const clearError = () => setError(null);

  // Projects API
  const getProjects = useCallback(async (): Promise<Project[]> => {
    setLoading(true);
    clearError();
    try {
      const { data, error } = await supabase
        .from('project_dashboard')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Project[] || [];
    } catch (err) {
      return handleError(err, 'Failed to fetch projects') || [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (project: Partial<Project>): Promise<Project | null> => {
    setLoading(true);
    clearError();
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...project,
          created_by: user.user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Project;
    } catch (err) {
      return handleError(err, 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }, []);

  const getProject = useCallback(async (projectId: string): Promise<Project | null> => {
    setLoading(true);
    clearError();
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data as Project;
    } catch (err) {
      return handleError(err, 'Failed to fetch project');
    } finally {
      setLoading(false);
    }
  }, []);

  // Blocks API
  const getBlocks = useCallback(async (projectId: string): Promise<Block[]> => {
    setLoading(true);
    clearError();
    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Block[] || [];
    } catch (err) {
      return handleError(err, 'Failed to fetch blocks') || [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createBlock = useCallback(async (projectId: string, blockData: CreateBlockRequest): Promise<Block | null> => {
    setLoading(true);
    clearError();
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('blocks')
        .insert({
          title: blockData.title,
          description: blockData.description,
          type: blockData.type || 'standard',
          project_id: projectId,
          position_x: blockData.position_x || Math.random() * 400 + 100,
          position_y: blockData.position_y || Math.random() * 300 + 100,
          config: blockData.config || {},
          inputs: blockData.inputs || [],
          outputs: blockData.outputs || [],
          metadata: blockData.metadata || {}
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Block;
    } catch (err) {
      return handleError(err, 'Failed to create block');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBlock = useCallback(async (blockId: string, updates: UpdateBlockRequest): Promise<Block | null> => {
    clearError();
    try {
      const { data, error } = await supabase
        .from('blocks')
        .update(updates)
        .eq('id', blockId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Block;
    } catch (err) {
      return handleError(err, 'Failed to update block');
    }
  }, []);

  const deleteBlock = useCallback(async (blockId: string): Promise<boolean> => {
    setLoading(true);
    clearError();
    try {
      // Soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from('blocks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', blockId);
      
      if (error) throw error;
      return true;
    } catch (err) {
      handleError(err, 'Failed to delete block');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const batchUpdatePositions = useCallback(async (updates: BatchUpdatePositionsRequest['updates']): Promise<boolean> => {
    try {
      // Use Supabase's batch update functionality
      const updatePromises = updates.map(update => 
        supabase
          .from('blocks')
          .update({ 
            position_x: update.position_x, 
            position_y: update.position_y 
          })
          .eq('id', update.id)
      );
      
      const results = await Promise.all(updatePromises);
      const hasError = results.some(result => result.error);
      
      if (hasError) {
        console.error('Some position updates failed');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Failed to batch update positions:', err);
      return false;
    }
  }, []);

  // Canvas API
  const saveCanvasData = useCallback(async (projectId: string, canvasData: CanvasData): Promise<boolean> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      // Create a canvas snapshot
      const { error } = await supabase
        .from('canvas_snapshots')
        .insert({
          project_id: projectId,
          canvas_data: canvasData,
          is_auto_save: true,
          blocks_count: canvasData.nodes?.length || 0,
          relations_count: canvasData.edges?.length || 0,
          created_by: user.user?.id
        });
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Failed to save canvas data:', err);
      return false;
    }
  }, []);

  // Relations API
  const getRelations = useCallback(async (projectId: string): Promise<Relation[]> => {
    setLoading(true);
    clearError();
    try {
      const { data, error } = await supabase
        .from('block_relations')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Relation[] || [];
    } catch (err) {
      return handleError(err, 'Failed to fetch relations') || [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createRelation = useCallback(async (projectId: string, relationData: CreateRelationRequest): Promise<Relation | null> => {
    setLoading(true);
    clearError();
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('block_relations')
        .insert({
          ...relationData,
          project_id: projectId,
          created_by: user.user.id,
          type: relationData.type || 'connection',
          style: relationData.style || {},
          animated: relationData.animated || false,
          data_mapping: relationData.data_mapping || {},
          conditions: relationData.conditions || {},
          metadata: relationData.metadata || {}
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Relation;
    } catch (err) {
      return handleError(err, 'Failed to create relation');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRelation = useCallback(async (relationId: string): Promise<boolean> => {
    setLoading(true);
    clearError();
    try {
      // Soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from('block_relations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', relationId);
      
      if (error) throw error;
      return true;
    } catch (err) {
      handleError(err, 'Failed to delete relation');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize demo data
  const initDemo = useCallback(async (): Promise<any> => {
    setLoading(true);
    clearError();
    try {
      // This would be implemented as needed
      console.log('Demo initialization not implemented yet');
      return { success: true };
    } catch (err) {
      return handleError(err, 'Failed to initialize demo');
    } finally {
      setLoading(false);
    }
  }, []);

  // Health check
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from('projects').select('id').limit(1);
      return !error;
    } catch (err) {
      return false;
    }
  }, []);

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
    // Canvas
    saveCanvasData,
    // Relations
    getRelations,
    createRelation,
    deleteRelation,
    // Utils
    checkHealth,
    initDemo,
  };
}

// Re-export types for backward compatibility
export type { Block, BlockRelation as Relation, Project } from '../types/database';