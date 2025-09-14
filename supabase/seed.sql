-- Seed file for development data
-- This file populates the database with sample data for testing and development

-- Note: This data will be reset every time you run `supabase db reset`
-- Only use this for development and testing

-- Insert sample user (this would normally be handled by auth)
-- INSERT INTO auth.users (id, email) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'demo@example.com')
-- ON CONFLICT (id) DO NOTHING;

-- Sample projects (using fixed UUIDs for consistency in development)
INSERT INTO projects (id, title, description, type, status, metadata, created_by) VALUES 
(
  '11111111-1111-1111-1111-111111111111', 
  'Conception App Mobile', 
  'Projet de design thinking pour une application mobile de productivité', 
  'design-thinking', 
  'active',
  '{
    "industry": "productivity",
    "target_audience": "professionals",
    "stage": "ideation"
  }',
  NULL
),
(
  '22222222-2222-2222-2222-222222222222',
  'Site E-commerce', 
  'Refonte complète de l\'expérience utilisateur d\'un site e-commerce', 
  'ux-design', 
  'active',
  '{
    "industry": "retail",
    "target_audience": "consumers",
    "stage": "prototyping"
  }',
  NULL
),
(
  '33333333-3333-3333-3333-333333333333',
  'Template Design System', 
  'Template de base pour créer un design system complet', 
  'design-system', 
  'template',
  '{
    "components_count": 25,
    "tokens_defined": true,
    "documentation_level": "complete"
  }',
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Sample blocks for first project
INSERT INTO blocks (id, project_id, title, description, type, position_x, position_y, color, config, inputs, outputs, metadata) VALUES 
(
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'Recherche Utilisateurs',
  'Interviews et questionnaires pour comprendre les besoins des utilisateurs',
  'standard',
  100, 100,
  '#3B82F6',
  '{
    "method": "interviews",
    "participants": 12,
    "duration": "2 weeks"
  }',
  '[]',
  '[
    {
      "id": "insights",
      "name": "User Insights",
      "type": "document",
      "description": "Key findings from user research"
    }
  ]',
  '{
    "category": "research",
    "priority": "high",
    "status": "completed"
  }'
),
(
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'Personas',
  'Profils types des utilisateurs cibles basés sur la recherche',
  'standard',
  450, 100,
  '#10B981',
  '{
    "personas_count": 3,
    "detail_level": "high"
  }',
  '[
    {
      "id": "user_insights",
      "name": "User Insights",
      "type": "document",
      "required": true
    }
  ]',
  '[
    {
      "id": "personas",
      "name": "User Personas",
      "type": "document",
      "description": "Detailed user personas"
    }
  ]',
  '{
    "category": "analysis",
    "priority": "high",
    "status": "in_progress"
  }'
),
(
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  'Claude + Notion',
  'Traitement automatique des insights utilisateurs avec Claude et stockage dans Notion',
  'claude-notion',
  800, 100,
  '#8B5CF6',
  '{
    "model": "claude-3-sonnet",
    "prompt": "Analyse les insights utilisateurs et créé un résumé structuré",
    "notion_database_id": "exemple_db_id",
    "auto_process": true
  }',
  '[
    {
      "id": "raw_insights",
      "name": "Raw Insights",
      "type": "text",
      "required": true
    }
  ]',
  '[
    {
      "id": "processed_insights",
      "name": "Processed Insights",
      "type": "document",
      "description": "Structured insights processed by Claude"
    }
  ]',
  '{
    "ai_model": "claude-3-sonnet",
    "integration": "notion",
    "automation_level": "high"
  }'
),
(
  '77777777-7777-7777-7777-777777777777',
  '11111111-1111-1111-1111-111111111111',
  'Brainstorming',
  'Session de génération d\'idées basée sur les personas',
  'logic',
  100, 350,
  '#F59E0B',
  '{
    "logic_type": "group",
    "min_ideas": 50,
    "time_limit": "45min"
  }',
  '[
    {
      "id": "personas_input",
      "name": "Personas",
      "type": "document",
      "required": true
    }
  ]',
  '[
    {
      "id": "ideas_list",
      "name": "Ideas List",
      "type": "list",
      "description": "Generated ideas from brainstorming"
    }
  ]',
  '{
    "category": "ideation",
    "priority": "medium",
    "logicType": "group",
    "collapsed": false
  }'
)
ON CONFLICT (id) DO NOTHING;

-- Sample blocks for second project (e-commerce)
INSERT INTO blocks (id, project_id, title, description, type, position_x, position_y, color, config, metadata) VALUES 
(
  '88888888-8888-8888-8888-888888888888',
  '22222222-2222-2222-2222-222222222222',
  'Audit UX Existant',
  'Analyse de l\'expérience utilisateur actuelle du site',
  'standard',
  150, 120,
  '#EF4444',
  '{
    "audit_type": "heuristic",
    "pages_count": 15,
    "criteria": "Nielsen"
  }',
  '{
    "category": "audit",
    "priority": "high",
    "status": "draft"
  }'
),
(
  '99999999-9999-9999-9999-999999999999',
  '22222222-2222-2222-2222-222222222222',
  'Claude + Figma',
  'Analyse automatique des maquettes Figma avec recommandations IA',
  'claude-figma',
  500, 120,
  '#06B6D4',
  '{
    "figma_file_id": "exemple_figma_file",
    "analysis_type": "design-critique",
    "model": "claude-3-sonnet"
  }',
  '{
    "ai_model": "claude-3-sonnet",
    "integration": "figma",
    "automation_level": "medium"
  }'
)
ON CONFLICT (id) DO NOTHING;

-- Sample relations
INSERT INTO block_relations (id, project_id, source_block_id, target_block_id, type, animated, style) VALUES 
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  'data_flow',
  true,
  '{"stroke": "#3B82F6", "strokeWidth": 2}'
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  '66666666-6666-6666-6666-666666666666',
  'data_flow',
  true,
  '{"stroke": "#8B5CF6", "strokeWidth": 2}'
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  '55555555-5555-5555-5555-555555555555',
  '77777777-7777-7777-7777-777777777777',
  'dependency',
  false,
  '{"stroke": "#10B981", "strokeWidth": 2}'
)
ON CONFLICT (id) DO NOTHING;

-- Sample canvas snapshot
INSERT INTO canvas_snapshots (id, project_id, name, description, canvas_data, is_auto_save, is_checkpoint, blocks_count, relations_count) VALUES 
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '11111111-1111-1111-1111-111111111111',
  'Configuration initiale',
  'Première version du canvas avec les blocs de base',
  '{
    "blocks": [],
    "relations": [],
    "viewport": {"x": 0, "y": 0, "zoom": 1},
    "metadata": {"created": "2025-01-14T12:00:00Z"}
  }',
  false,
  true,
  4,
  3
)
ON CONFLICT (id) DO NOTHING;

-- Sample activity logs
INSERT INTO block_activity_log (project_id, block_id, action, description) VALUES 
('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'created', 'Block created: Recherche Utilisateurs'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'created', 'Block created: Personas'),
('11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'created', 'Block created: Claude + Notion'),
('11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'created', 'Block created: Brainstorming'),
('22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', 'created', 'Block created: Audit UX Existant'),
('22222222-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', 'created', 'Block created: Claude + Figma');

-- Create some indexes that might be helpful for development
-- (These should ideally be in migrations but are useful for testing)
CREATE INDEX IF NOT EXISTS idx_dev_blocks_type_status ON blocks(type, status);
CREATE INDEX IF NOT EXISTS idx_dev_relations_source_target ON block_relations(source_block_id, target_block_id);

-- Add some helpful comments
COMMENT ON TABLE projects IS 'Main projects table containing design thinking projects';
COMMENT ON TABLE blocks IS 'Individual blocks/components within projects with their canvas positions and configurations';
COMMENT ON TABLE block_relations IS 'Connections between blocks representing data flow, dependencies, or logical relationships';
COMMENT ON TABLE canvas_snapshots IS 'Versioned snapshots of canvas state for backup and recovery';
COMMENT ON TABLE block_activity_log IS 'Audit trail of all actions performed on blocks and projects';

-- Development helper: Create a function to reset demo data
CREATE OR REPLACE FUNCTION reset_demo_data()
RETURNS void AS $$
BEGIN
  -- Clear existing data
  DELETE FROM block_activity_log;
  DELETE FROM canvas_snapshots;
  DELETE FROM block_relations;
  DELETE FROM blocks;
  DELETE FROM project_members;
  DELETE FROM projects;
  
  -- Re-run this seed script content
  -- (This would need to be implemented based on requirements)
  RAISE NOTICE 'Demo data cleared. Run seed.sql again to repopulate.';
END;
$$ LANGUAGE plpgsql;