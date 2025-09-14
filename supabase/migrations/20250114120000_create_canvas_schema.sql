-- Migration: Create comprehensive canvas and blocks schema
-- Description: Professional database schema for managing projects, blocks, and canvas data

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for better data integrity
CREATE TYPE block_status AS ENUM ('draft', 'active', 'inactive', 'archived', 'error');
CREATE TYPE block_type AS ENUM ('standard', 'logic', 'claude', 'claude-figma', 'claude-notion', 'notion', 'openai', 'figma', 'custom');
CREATE TYPE project_status AS ENUM ('active', 'archived', 'template');
CREATE TYPE relation_type AS ENUM ('connection', 'dependency', 'data_flow', 'trigger');
CREATE TYPE user_role AS ENUM ('owner', 'editor', 'viewer');

-- Projects table - Enhanced with better structure
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL CHECK (length(title) >= 1),
    description TEXT,
    type VARCHAR(100) DEFAULT 'design-thinking',
    status project_status DEFAULT 'active',
    
    -- Metadata and configuration
    metadata JSONB DEFAULT '{}',
    canvas_config JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    -- Performance indexes
    CONSTRAINT projects_title_not_empty CHECK (length(trim(title)) > 0)
);

-- Project members table for collaboration
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'viewer',
    
    -- Permissions
    can_edit_blocks BOOLEAN DEFAULT FALSE,
    can_manage_members BOOLEAN DEFAULT FALSE,
    can_delete_project BOOLEAN DEFAULT FALSE,
    
    -- Audit
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ DEFAULT NULL,
    
    -- Constraints
    UNIQUE(project_id, user_id)
);

-- Blocks table - Enhanced with comprehensive metadata
CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Basic properties
    title VARCHAR(255) NOT NULL CHECK (length(title) >= 1),
    description TEXT,
    type block_type NOT NULL DEFAULT 'standard',
    status block_status DEFAULT 'active',
    
    -- Canvas positioning
    position_x DECIMAL(12,2) NOT NULL DEFAULT 0,
    position_y DECIMAL(12,2) NOT NULL DEFAULT 0,
    width DECIMAL(8,2) DEFAULT NULL,
    height DECIMAL(8,2) DEFAULT NULL,
    z_index INTEGER DEFAULT 0,
    
    -- Visual properties
    color VARCHAR(7) DEFAULT NULL, -- Hex color code
    collapsed BOOLEAN DEFAULT FALSE,
    hidden BOOLEAN DEFAULT FALSE,
    locked BOOLEAN DEFAULT FALSE,
    
    -- Configuration and data
    config JSONB DEFAULT '{}', -- Block-specific configuration
    inputs JSONB DEFAULT '[]', -- Input/output definitions
    outputs JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}', -- Extended metadata
    
    -- Execution context (for workflow automation in future)
    execution_config JSONB DEFAULT '{}',
    last_execution_at TIMESTAMPTZ DEFAULT NULL,
    execution_status VARCHAR(50) DEFAULT NULL,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    version INTEGER DEFAULT 1,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    -- Performance indexes and constraints
    CONSTRAINT blocks_title_not_empty CHECK (length(trim(title)) > 0),
    CONSTRAINT blocks_valid_color CHECK (color IS NULL OR color ~ '^#[A-Fa-f0-9]{6}$'),
    CONSTRAINT blocks_positive_dimensions CHECK (
        (width IS NULL OR width > 0) AND 
        (height IS NULL OR height > 0)
    )
);

-- Block relations table - Enhanced for complex relationships
CREATE TABLE block_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Source and target blocks
    source_block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    target_block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    
    -- Relation properties
    type relation_type DEFAULT 'connection',
    label VARCHAR(255),
    
    -- Connection points (handles)
    source_handle VARCHAR(100),
    target_handle VARCHAR(100),
    
    -- Visual properties
    style JSONB DEFAULT '{}', -- Line style, color, etc.
    animated BOOLEAN DEFAULT FALSE,
    
    -- Data flow configuration
    data_mapping JSONB DEFAULT '{}', -- How data flows between blocks
    conditions JSONB DEFAULT '{}', -- Conditional logic
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    
    -- Constraints
    CONSTRAINT block_relations_no_self_reference CHECK (source_block_id != target_block_id),
    UNIQUE(source_block_id, target_block_id, type, source_handle, target_handle)
);

-- Canvas snapshots table - For version control and recovery
CREATE TABLE canvas_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Snapshot data
    name VARCHAR(255),
    description TEXT,
    canvas_data JSONB NOT NULL, -- Full canvas state
    
    -- Snapshot metadata
    is_auto_save BOOLEAN DEFAULT TRUE,
    is_checkpoint BOOLEAN DEFAULT FALSE,
    blocks_count INTEGER DEFAULT 0,
    relations_count INTEGER DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Retention policy helper
    expires_at TIMESTAMPTZ DEFAULT NULL
);

-- Activity log for audit trail
CREATE TABLE block_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    block_id UUID REFERENCES blocks(id) ON DELETE SET NULL,
    
    -- Activity details
    action VARCHAR(50) NOT NULL, -- created, updated, deleted, moved, connected, etc.
    description TEXT,
    changes JSONB DEFAULT '{}', -- What changed
    
    -- User context
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(255),
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);

CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_role ON project_members(role);

CREATE INDEX idx_blocks_project_id ON blocks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_blocks_type ON blocks(type);
CREATE INDEX idx_blocks_status ON blocks(status);
CREATE INDEX idx_blocks_position ON blocks(project_id, position_x, position_y);
CREATE INDEX idx_blocks_updated_at ON blocks(updated_at DESC);
CREATE INDEX idx_blocks_metadata_gin ON blocks USING gin(metadata);

CREATE INDEX idx_block_relations_project_id ON block_relations(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_block_relations_source ON block_relations(source_block_id);
CREATE INDEX idx_block_relations_target ON block_relations(target_block_id);
CREATE INDEX idx_block_relations_type ON block_relations(type);

CREATE INDEX idx_canvas_snapshots_project_id ON canvas_snapshots(project_id);
CREATE INDEX idx_canvas_snapshots_created_at ON canvas_snapshots(created_at DESC);
CREATE INDEX idx_canvas_snapshots_auto_save ON canvas_snapshots(is_auto_save);

CREATE INDEX idx_activity_log_project_id ON block_activity_log(project_id);
CREATE INDEX idx_activity_log_block_id ON block_activity_log(block_id);
CREATE INDEX idx_activity_log_created_at ON block_activity_log(created_at DESC);
CREATE INDEX idx_activity_log_user_id ON block_activity_log(user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_block_relations_updated_at BEFORE UPDATE ON block_relations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create activity log entries automatically
CREATE OR REPLACE FUNCTION log_block_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO block_activity_log (project_id, block_id, action, description, user_id)
        VALUES (NEW.project_id, NEW.id, 'created', 'Block created: ' || NEW.title, NEW.created_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log if significant changes occurred
        IF OLD.title != NEW.title OR 
           OLD.description != NEW.description OR 
           OLD.type != NEW.type OR
           OLD.status != NEW.status OR
           OLD.config != NEW.config THEN
            INSERT INTO block_activity_log (project_id, block_id, action, description, changes)
            VALUES (NEW.project_id, NEW.id, 'updated', 'Block updated: ' || NEW.title, 
                   jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO block_activity_log (project_id, block_id, action, description)
        VALUES (OLD.project_id, OLD.id, 'deleted', 'Block deleted: ' || OLD.title);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply activity logging triggers
CREATE TRIGGER log_block_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON blocks
    FOR EACH ROW EXECUTE FUNCTION log_block_activity();

-- Function to automatically create canvas snapshots
CREATE OR REPLACE FUNCTION create_auto_snapshot()
RETURNS TRIGGER AS $$
DECLARE
    snapshot_data JSONB;
    blocks_count INT;
    relations_count INT;
BEGIN
    -- Only create snapshot for significant changes
    IF TG_OP = 'INSERT' OR 
       (TG_OP = 'UPDATE' AND (OLD.position_x != NEW.position_x OR OLD.position_y != NEW.position_y OR OLD.title != NEW.title)) THEN
        
        -- Get current counts
        SELECT COUNT(*) INTO blocks_count FROM blocks WHERE project_id = NEW.project_id AND deleted_at IS NULL;
        SELECT COUNT(*) INTO relations_count FROM block_relations WHERE project_id = NEW.project_id AND deleted_at IS NULL;
        
        -- Build snapshot data
        snapshot_data := jsonb_build_object(
            'blocks', (SELECT jsonb_agg(to_jsonb(b)) FROM blocks b WHERE b.project_id = NEW.project_id AND b.deleted_at IS NULL),
            'relations', (SELECT jsonb_agg(to_jsonb(r)) FROM block_relations r WHERE r.project_id = NEW.project_id AND r.deleted_at IS NULL),
            'timestamp', NOW()
        );
        
        -- Create snapshot (with deduplication logic)
        INSERT INTO canvas_snapshots (project_id, canvas_data, blocks_count, relations_count, created_by)
        SELECT NEW.project_id, snapshot_data, blocks_count, relations_count, NEW.created_by
        WHERE NOT EXISTS (
            SELECT 1 FROM canvas_snapshots cs 
            WHERE cs.project_id = NEW.project_id 
              AND cs.created_at > NOW() - INTERVAL '5 minutes'
              AND cs.is_auto_save = TRUE
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply auto-snapshot triggers (with rate limiting)
CREATE TRIGGER create_auto_snapshot_trigger
    AFTER INSERT OR UPDATE ON blocks
    FOR EACH ROW EXECUTE FUNCTION create_auto_snapshot();