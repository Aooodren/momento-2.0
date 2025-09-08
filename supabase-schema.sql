-- Schema SQL pour les nouvelles fonctionnalités projet
-- À exécuter dans l'éditeur SQL de Supabase

-- Extension pour UUID si pas déjà activée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table pour les fichiers de projet
CREATE TABLE IF NOT EXISTS project_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les membres du projet
CREATE TABLE IF NOT EXISTS project_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Table pour l'activité du projet
CREATE TABLE IF NOT EXISTS project_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'share', 'comment', 'download', 'upload')),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('project', 'block', 'relation', 'file')),
    resource_id UUID,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les analytics du projet
CREATE TABLE IF NOT EXISTS project_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL UNIQUE,
    total_blocks INTEGER DEFAULT 0,
    total_relations INTEGER DEFAULT 0,
    complexity_score INTEGER DEFAULT 0,
    contributors_count INTEGER DEFAULT 0,
    files_count INTEGER DEFAULT 0,
    storage_used BIGINT DEFAULT 0,
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by ON project_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_project_id ON project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_user_id ON project_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_created_at ON project_activities(created_at DESC);

-- RLS (Row Level Security) Policies

-- Project Files Policies
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files from projects they have access to" ON project_files
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload files to projects they have edit access" ON project_files
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
        )
    );

CREATE POLICY "Users can delete their own files or if they're admin/owner" ON project_files
    FOR DELETE USING (
        uploaded_by = auth.uid() OR
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Project Members Policies
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of projects they belong to" ON project_members
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Only owners and admins can manage members" ON project_members
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Only owners and admins can update member roles" ON project_members
    FOR UPDATE USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Only owners and admins can remove members" ON project_members
    FOR DELETE USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Project Activities Policies
ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities from projects they have access to" ON project_activities
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create activities for projects they have access to" ON project_activities
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

-- Project Analytics Policies
ALTER TABLE project_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics from projects they have access to" ON project_analytics
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

-- Fonction pour mettre à jour automatiquement les analytics
CREATE OR REPLACE FUNCTION update_project_analytics(p_project_id UUID)
RETURNS void AS $$
DECLARE
    v_total_blocks INTEGER;
    v_total_relations INTEGER;
    v_contributors_count INTEGER;
    v_files_count INTEGER;
    v_storage_used BIGINT;
    v_complexity_score INTEGER;
BEGIN
    -- Calculer les statistiques
    SELECT COUNT(*) INTO v_total_blocks FROM blocks WHERE project_id = p_project_id;
    SELECT COUNT(*) INTO v_total_relations FROM relations WHERE project_id = p_project_id;
    SELECT COUNT(DISTINCT user_id) INTO v_contributors_count FROM project_members WHERE project_id = p_project_id;
    SELECT COUNT(*), COALESCE(SUM(file_size), 0) INTO v_files_count, v_storage_used FROM project_files WHERE project_id = p_project_id;
    
    -- Calculer le score de complexité (simple: ratio relations/blocs * 100)
    v_complexity_score := CASE 
        WHEN v_total_blocks > 0 THEN LEAST(100, (v_total_relations::FLOAT / v_total_blocks * 100)::INTEGER)
        ELSE 0
    END;
    
    -- Mettre à jour ou insérer les analytics
    INSERT INTO project_analytics (
        project_id, total_blocks, total_relations, complexity_score,
        contributors_count, files_count, storage_used, last_calculated
    ) VALUES (
        p_project_id, v_total_blocks, v_total_relations, v_complexity_score,
        v_contributors_count, v_files_count, v_storage_used, NOW()
    )
    ON CONFLICT (project_id) 
    DO UPDATE SET
        total_blocks = v_total_blocks,
        total_relations = v_total_relations,
        complexity_score = v_complexity_score,
        contributors_count = v_contributors_count,
        files_count = v_files_count,
        storage_used = v_storage_used,
        last_calculated = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour automatiquement les analytics
CREATE OR REPLACE FUNCTION trigger_update_project_analytics()
RETURNS trigger AS $$
BEGIN
    -- Utilise TG_OP pour déterminer quelle ligne utiliser
    IF TG_OP = 'DELETE' THEN
        PERFORM update_project_analytics(OLD.project_id);
        RETURN OLD;
    ELSE
        PERFORM update_project_analytics(NEW.project_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers sur les tables qui affectent les analytics
CREATE TRIGGER blocks_analytics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON blocks
    FOR EACH ROW EXECUTE FUNCTION trigger_update_project_analytics();

CREATE TRIGGER relations_analytics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON relations
    FOR EACH ROW EXECUTE FUNCTION trigger_update_project_analytics();

CREATE TRIGGER project_files_analytics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON project_files
    FOR EACH ROW EXECUTE FUNCTION trigger_update_project_analytics();

CREATE TRIGGER project_members_analytics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON project_members
    FOR EACH ROW EXECUTE FUNCTION trigger_update_project_analytics();

-- Fonction pour créer un bucket de stockage (à exécuter manuellement)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);

-- Politique de storage pour le bucket project-files
-- CREATE POLICY "Users can upload files to their projects" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'project-files' AND
--         auth.role() = 'authenticated' AND
--         (storage.foldername(name))[1] IN (
--             SELECT project_id::text FROM project_members 
--             WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
--         )
--     );

-- CREATE POLICY "Users can view files from their projects" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'project-files' AND
--         auth.role() = 'authenticated' AND
--         (storage.foldername(name))[1] IN (
--             SELECT project_id::text FROM project_members 
--             WHERE user_id = auth.uid()
--         )
--     );

-- CREATE POLICY "Users can delete files from their projects" ON storage.objects
--     FOR DELETE USING (
--         bucket_id = 'project-files' AND
--         auth.role() = 'authenticated' AND
--         (storage.foldername(name))[1] IN (
--             SELECT project_id::text FROM project_members 
--             WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
--         )
--     );