// Database types generated from Supabase schema
// This file contains all the TypeScript types for the canvas and blocks system

export type BlockStatus = 'draft' | 'active' | 'inactive' | 'archived' | 'error';
export type BlockType = 'standard' | 'logic' | 'claude' | 'claude-figma' | 'claude-notion' | 'notion' | 'openai' | 'figma' | 'custom';
export type ProjectStatus = 'active' | 'archived' | 'template';
export type RelationType = 'connection' | 'dependency' | 'data_flow' | 'trigger';
export type UserRole = 'owner' | 'editor' | 'viewer';

// Base database record interface
interface DatabaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

// Project interfaces
export interface Project extends DatabaseRecord {
  title: string;
  description?: string;
  type: string;
  status: ProjectStatus;
  metadata: Record<string, any>;
  canvas_config: Record<string, any>;
  created_by?: string;
  deleted_at?: string;
}

export interface ProjectMember extends DatabaseRecord {
  project_id: string;
  user_id: string;
  role: UserRole;
  can_edit_blocks: boolean;
  can_manage_members: boolean;
  can_delete_project: boolean;
  invited_at: string;
  invited_by?: string;
  joined_at?: string;
}

// Block interfaces
export interface BlockInputOutput {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  default_value?: any;
  description?: string;
  validation?: Record<string, any>;
}

export interface Block extends DatabaseRecord {
  project_id: string;
  title: string;
  description?: string;
  type: BlockType;
  status: BlockStatus;
  
  // Canvas positioning
  position_x: number;
  position_y: number;
  width?: number;
  height?: number;
  z_index: number;
  
  // Visual properties
  color?: string;
  collapsed: boolean;
  hidden: boolean;
  locked: boolean;
  
  // Configuration and data
  config: Record<string, any>;
  inputs: BlockInputOutput[];
  outputs: BlockInputOutput[];
  metadata: Record<string, any>;
  
  // Execution context
  execution_config: Record<string, any>;
  last_execution_at?: string;
  execution_status?: string;
  
  // Audit
  created_by?: string;
  version: number;
  deleted_at?: string;
}

// Relation interfaces
export interface BlockRelation extends DatabaseRecord {
  project_id: string;
  source_block_id: string;
  target_block_id: string;
  type: RelationType;
  label?: string;
  
  // Connection points
  source_handle?: string;
  target_handle?: string;
  
  // Visual properties
  style: Record<string, any>;
  animated: boolean;
  
  // Data flow
  data_mapping: Record<string, any>;
  conditions: Record<string, any>;
  
  // Metadata
  metadata: Record<string, any>;
  
  // Audit
  created_by?: string;
  deleted_at?: string;
  
  // Populated relations (optional)
  source_block?: Block;
  target_block?: Block;
}

// Canvas snapshot interface
export interface CanvasSnapshot extends DatabaseRecord {
  project_id: string;
  name?: string;
  description?: string;
  canvas_data: {
    blocks: Block[];
    relations: BlockRelation[];
    timestamp: string;
    [key: string]: any;
  };
  is_auto_save: boolean;
  is_checkpoint: boolean;
  blocks_count: number;
  relations_count: number;
  created_by?: string;
  expires_at?: string;
}

// Activity log interface
export interface BlockActivityLog {
  id: string;
  project_id: string;
  block_id?: string;
  action: string;
  description?: string;
  changes: Record<string, any>;
  user_id?: string;
  session_id?: string;
  created_at: string;
}

// Project dashboard view
export interface ProjectDashboard {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  user_role: UserRole;
  can_edit_blocks: boolean;
  can_manage_members: boolean;
  blocks_count: number;
  relations_count: number;
  members_count: number;
}

// API request/response types
export interface CreateProjectRequest {
  title: string;
  description?: string;
  type?: string;
  metadata?: Record<string, any>;
  canvas_config?: Record<string, any>;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  type?: string;
  status?: ProjectStatus;
  metadata?: Record<string, any>;
  canvas_config?: Record<string, any>;
}

export interface CreateBlockRequest {
  title: string;
  description?: string;
  type: BlockType;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  color?: string;
  config?: Record<string, any>;
  inputs?: BlockInputOutput[];
  outputs?: BlockInputOutput[];
  metadata?: Record<string, any>;
}

export interface UpdateBlockRequest {
  title?: string;
  description?: string;
  type?: BlockType;
  status?: BlockStatus;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  z_index?: number;
  color?: string;
  collapsed?: boolean;
  hidden?: boolean;
  locked?: boolean;
  config?: Record<string, any>;
  inputs?: BlockInputOutput[];
  outputs?: BlockInputOutput[];
  metadata?: Record<string, any>;
  execution_config?: Record<string, any>;
}

export interface CreateRelationRequest {
  source_block_id: string;
  target_block_id: string;
  type?: RelationType;
  label?: string;
  source_handle?: string;
  target_handle?: string;
  style?: Record<string, any>;
  animated?: boolean;
  data_mapping?: Record<string, any>;
  conditions?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface BatchUpdatePositionsRequest {
  updates: Array<{
    id: string;
    position_x: number;
    position_y: number;
  }>;
}

export interface InviteMemberRequest {
  user_id?: string;
  email?: string;
  role: UserRole;
  can_edit_blocks?: boolean;
  can_manage_members?: boolean;
}

export interface UpdateMemberRequest {
  role?: UserRole;
  can_edit_blocks?: boolean;
  can_manage_members?: boolean;
  can_delete_project?: boolean;
}

// Utility types for React Flow integration
export interface ReactFlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Block & {
    onEdit?: (blockId: string) => void;
    onDelete?: (blockId: string) => void;
    onToggleCollapse?: (blockId: string) => void;
  };
  selected?: boolean;
  hidden?: boolean;
  width?: number;
  height?: number;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
  selected?: boolean;
  data?: BlockRelation;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Project statistics type
export interface ProjectStats {
  blocks_count: number;
  relations_count: number;
  members_count: number;
  last_updated?: string;
  snapshots_count: number;
  activity_count: number;
}

// Canvas data type for saving/loading
export interface CanvasData {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  nodePositions: Record<string, { x: number; y: number }>;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  metadata?: Record<string, any>;
}

// Error types
export interface DatabaseError {
  message: string;
  code?: string;
  details?: any;
  hint?: string;
}

// Realtime types for collaboration
export interface RealtimeEvent {
  type: 'block_updated' | 'block_created' | 'block_deleted' | 'relation_created' | 'relation_deleted' | 'user_cursor' | 'user_selection';
  payload: any;
  user_id: string;
  timestamp: string;
}

export interface CollaboratorCursor {
  user_id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export interface CollaboratorSelection {
  user_id: string;
  name: string;
  color: string;
  block_id: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Form validation schemas (for use with libraries like Zod or Yup)
export interface ValidationSchema {
  project: {
    title: { required: boolean; minLength: number; maxLength: number };
    description: { maxLength: number };
  };
  block: {
    title: { required: boolean; minLength: number; maxLength: number };
    description: { maxLength: number };
    position_x: { required: boolean };
    position_y: { required: boolean };
    color: { pattern: string };
  };
  relation: {
    source_block_id: { required: boolean };
    target_block_id: { required: boolean };
    type: { required: boolean; enum: RelationType[] };
  };
}

// Export all types as a namespace for easier importing
export namespace Database {
  export type Projects = Project;
  export type ProjectMembers = ProjectMember;
  export type Blocks = Block;
  export type BlockRelations = BlockRelation;
  export type CanvasSnapshots = CanvasSnapshot;
  export type BlockActivityLog = BlockActivityLog;
}