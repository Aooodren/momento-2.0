-- Migration: Setup Row Level Security (RLS) policies
-- Description: Comprehensive security policies for canvas and blocks data

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_activity_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is project member with specific role
CREATE OR REPLACE FUNCTION is_project_member(project_uuid UUID, min_role user_role DEFAULT 'viewer')
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = project_uuid
          AND pm.user_id = auth.uid()
          AND pm.role::TEXT >= min_role::TEXT
          AND pm.joined_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can edit blocks in project
CREATE OR REPLACE FUNCTION can_edit_project_blocks(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = project_uuid
          AND pm.user_id = auth.uid()
          AND (pm.can_edit_blocks = TRUE OR pm.role IN ('owner', 'editor'))
          AND pm.joined_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is project owner
CREATE OR REPLACE FUNCTION is_project_owner(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = project_uuid
          AND pm.user_id = auth.uid()
          AND pm.role = 'owner'
          AND pm.joined_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PROJECTS TABLE POLICIES
-- =====================================================

-- Users can view projects they're members of
CREATE POLICY "Users can view member projects" ON projects
    FOR SELECT USING (
        is_project_member(id, 'viewer') AND deleted_at IS NULL
    );

-- Users can create projects (they become owners automatically)
CREATE POLICY "Authenticated users can create projects" ON projects
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND created_by = auth.uid()
    );

-- Only project owners can update project details
CREATE POLICY "Project owners can update projects" ON projects
    FOR UPDATE USING (
        is_project_owner(id)
    ) WITH CHECK (
        is_project_owner(id)
    );

-- Only project owners can delete projects (soft delete)
CREATE POLICY "Project owners can delete projects" ON projects
    FOR DELETE USING (
        is_project_owner(id)
    );

-- =====================================================
-- PROJECT_MEMBERS TABLE POLICIES
-- =====================================================

-- Members can view other members of projects they belong to
CREATE POLICY "Project members can view other members" ON project_members
    FOR SELECT USING (
        is_project_member(project_id, 'viewer')
    );

-- Project owners and users with manage_members permission can invite new members
CREATE POLICY "Authorized users can invite members" ON project_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = NEW.project_id
              AND pm.user_id = auth.uid()
              AND (pm.role = 'owner' OR pm.can_manage_members = TRUE)
              AND pm.joined_at IS NOT NULL
        )
    );

-- Project owners and users with manage_members permission can update member roles
CREATE POLICY "Authorized users can manage members" ON project_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = OLD.project_id
              AND pm.user_id = auth.uid()
              AND (pm.role = 'owner' OR pm.can_manage_members = TRUE)
              AND pm.joined_at IS NOT NULL
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = NEW.project_id
              AND pm.user_id = auth.uid()
              AND (pm.role = 'owner' OR pm.can_manage_members = TRUE)
              AND pm.joined_at IS NOT NULL
        )
    );

-- Users can accept invitations (update their own joined_at)
CREATE POLICY "Users can accept invitations" ON project_members
    FOR UPDATE USING (
        user_id = auth.uid() AND joined_at IS NULL
    ) WITH CHECK (
        user_id = auth.uid() AND NEW.joined_at IS NOT NULL
    );

-- Project owners and users with manage_members permission can remove members
CREATE POLICY "Authorized users can remove members" ON project_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = OLD.project_id
              AND pm.user_id = auth.uid()
              AND (pm.role = 'owner' OR pm.can_manage_members = TRUE)
              AND pm.joined_at IS NOT NULL
        ) OR user_id = auth.uid() -- Users can remove themselves
    );

-- =====================================================
-- BLOCKS TABLE POLICIES
-- =====================================================

-- Project members can view blocks
CREATE POLICY "Project members can view blocks" ON blocks
    FOR SELECT USING (
        is_project_member(project_id, 'viewer') AND deleted_at IS NULL
    );

-- Users with edit permissions can create blocks
CREATE POLICY "Authorized users can create blocks" ON blocks
    FOR INSERT WITH CHECK (
        can_edit_project_blocks(project_id) AND created_by = auth.uid()
    );

-- Users with edit permissions can update blocks
CREATE POLICY "Authorized users can update blocks" ON blocks
    FOR UPDATE USING (
        can_edit_project_blocks(project_id)
    ) WITH CHECK (
        can_edit_project_blocks(project_id)
    );

-- Users with edit permissions can delete blocks
CREATE POLICY "Authorized users can delete blocks" ON blocks
    FOR DELETE USING (
        can_edit_project_blocks(project_id)
    );

-- =====================================================
-- BLOCK_RELATIONS TABLE POLICIES
-- =====================================================

-- Project members can view relations
CREATE POLICY "Project members can view relations" ON block_relations
    FOR SELECT USING (
        is_project_member(project_id, 'viewer') AND deleted_at IS NULL
    );

-- Users with edit permissions can create relations
CREATE POLICY "Authorized users can create relations" ON block_relations
    FOR INSERT WITH CHECK (
        can_edit_project_blocks(project_id) AND created_by = auth.uid()
    );

-- Users with edit permissions can update relations
CREATE POLICY "Authorized users can update relations" ON block_relations
    FOR UPDATE USING (
        can_edit_project_blocks(project_id)
    ) WITH CHECK (
        can_edit_project_blocks(project_id)
    );

-- Users with edit permissions can delete relations
CREATE POLICY "Authorized users can delete relations" ON block_relations
    FOR DELETE USING (
        can_edit_project_blocks(project_id)
    );

-- =====================================================
-- CANVAS_SNAPSHOTS TABLE POLICIES
-- =====================================================

-- Project members can view snapshots
CREATE POLICY "Project members can view snapshots" ON canvas_snapshots
    FOR SELECT USING (
        is_project_member(project_id, 'viewer')
    );

-- Users with edit permissions can create snapshots
CREATE POLICY "Authorized users can create snapshots" ON canvas_snapshots
    FOR INSERT WITH CHECK (
        can_edit_project_blocks(project_id) AND 
        (created_by = auth.uid() OR created_by IS NULL)
    );

-- Only project owners can delete snapshots
CREATE POLICY "Project owners can manage snapshots" ON canvas_snapshots
    FOR DELETE USING (
        is_project_owner(project_id)
    );

-- =====================================================
-- BLOCK_ACTIVITY_LOG TABLE POLICIES
-- =====================================================

-- Project members can view activity logs
CREATE POLICY "Project members can view activity" ON block_activity_log
    FOR SELECT USING (
        is_project_member(project_id, 'viewer')
    );

-- System can insert activity logs (no user restrictions on insert)
CREATE POLICY "System can log activities" ON block_activity_log
    FOR INSERT WITH CHECK (true);

-- Only project owners can delete activity logs
CREATE POLICY "Project owners can manage activity logs" ON block_activity_log
    FOR DELETE USING (
        is_project_owner(project_id)
    );

-- =====================================================
-- ADDITIONAL SECURITY FUNCTIONS
-- =====================================================

-- Function to automatically add user as project owner when creating a project
CREATE OR REPLACE FUNCTION add_project_owner()
RETURNS TRIGGER AS $$
BEGIN
    -- Add the creator as the project owner
    INSERT INTO project_members (project_id, user_id, role, can_edit_blocks, can_manage_members, can_delete_project, joined_at)
    VALUES (NEW.id, NEW.created_by, 'owner', true, true, true, NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add project owner
CREATE TRIGGER add_project_owner_trigger
    AFTER INSERT ON projects
    FOR EACH ROW EXECUTE FUNCTION add_project_owner();

-- Function to prevent orphaned blocks and relations
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS TRIGGER AS $$
BEGIN
    -- When a project is deleted, soft delete all related blocks
    IF TG_TABLE_NAME = 'projects' AND TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        UPDATE blocks SET deleted_at = NEW.deleted_at WHERE project_id = NEW.id AND deleted_at IS NULL;
        UPDATE block_relations SET deleted_at = NEW.deleted_at WHERE project_id = NEW.id AND deleted_at IS NULL;
    END IF;
    
    -- When a block is deleted, soft delete all related relations
    IF TG_TABLE_NAME = 'blocks' AND TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        UPDATE block_relations 
        SET deleted_at = NEW.deleted_at 
        WHERE (source_block_id = NEW.id OR target_block_id = NEW.id) AND deleted_at IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for cleanup
CREATE TRIGGER cleanup_project_data_trigger
    AFTER UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION cleanup_orphaned_data();

CREATE TRIGGER cleanup_block_relations_trigger
    AFTER UPDATE ON blocks
    FOR EACH ROW EXECUTE FUNCTION cleanup_orphaned_data();

-- =====================================================
-- PERFORMANCE AND MONITORING
-- =====================================================

-- Function to get project statistics
CREATE OR REPLACE FUNCTION get_project_stats(project_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check if user has access to project
    IF NOT is_project_member(project_uuid, 'viewer') THEN
        RETURN NULL;
    END IF;
    
    SELECT jsonb_build_object(
        'blocks_count', (SELECT COUNT(*) FROM blocks WHERE project_id = project_uuid AND deleted_at IS NULL),
        'relations_count', (SELECT COUNT(*) FROM block_relations WHERE project_id = project_uuid AND deleted_at IS NULL),
        'members_count', (SELECT COUNT(*) FROM project_members WHERE project_id = project_uuid AND joined_at IS NOT NULL),
        'last_updated', (SELECT MAX(updated_at) FROM blocks WHERE project_id = project_uuid),
        'snapshots_count', (SELECT COUNT(*) FROM canvas_snapshots WHERE project_id = project_uuid),
        'activity_count', (SELECT COUNT(*) FROM block_activity_log WHERE project_id = project_uuid)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for project dashboard data
CREATE VIEW project_dashboard AS
SELECT 
    p.id,
    p.title,
    p.description,
    p.type,
    p.status,
    p.created_at,
    p.updated_at,
    pm.role as user_role,
    pm.can_edit_blocks,
    pm.can_manage_members,
    COUNT(DISTINCT b.id) as blocks_count,
    COUNT(DISTINCT br.id) as relations_count,
    COUNT(DISTINCT pm2.id) as members_count
FROM projects p
JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = auth.uid() AND pm.joined_at IS NOT NULL
LEFT JOIN blocks b ON p.id = b.project_id AND b.deleted_at IS NULL
LEFT JOIN block_relations br ON p.id = br.project_id AND br.deleted_at IS NULL
LEFT JOIN project_members pm2 ON p.id = pm2.project_id AND pm2.joined_at IS NOT NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.title, p.description, p.type, p.status, p.created_at, p.updated_at, 
         pm.role, pm.can_edit_blocks, pm.can_manage_members;

-- Grant necessary permissions for the dashboard view
GRANT SELECT ON project_dashboard TO authenticated;