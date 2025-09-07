-- Migration pour créer la table des intégrations utilisateur
-- À exécuter dans l'éditeur SQL de Supabase en production

-- Créer la table user_integrations
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    integration_type TEXT NOT NULL,
    status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'connecting')),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    UNIQUE(user_id, integration_type),
    CONSTRAINT valid_integration_type CHECK (integration_type IN ('notion', 'claude', 'figma'))
);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_user_integrations_updated_at ON user_integrations;
CREATE TRIGGER update_user_integrations_updated_at
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_type ON user_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_user_integrations_status ON user_integrations(status);

-- Activer la sécurité au niveau des lignes (RLS)
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Politique de sécurité : les utilisateurs ne peuvent voir que leurs propres intégrations
DROP POLICY IF EXISTS "Users can view their own integrations" ON user_integrations;
CREATE POLICY "Users can view their own integrations" ON user_integrations
    FOR SELECT USING (auth.uid() = user_id);

-- Politique de sécurité : les utilisateurs peuvent insérer leurs propres intégrations
DROP POLICY IF EXISTS "Users can insert their own integrations" ON user_integrations;
CREATE POLICY "Users can insert their own integrations" ON user_integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique de sécurité : les utilisateurs peuvent mettre à jour leurs propres intégrations
DROP POLICY IF EXISTS "Users can update their own integrations" ON user_integrations;
CREATE POLICY "Users can update their own integrations" ON user_integrations
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique de sécurité : les utilisateurs peuvent supprimer leurs propres intégrations
DROP POLICY IF EXISTS "Users can delete their own integrations" ON user_integrations;
CREATE POLICY "Users can delete their own integrations" ON user_integrations
    FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour initialiser les intégrations par défaut pour un nouvel utilisateur
CREATE OR REPLACE FUNCTION initialize_user_integrations()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_integrations (user_id, integration_type, status, metadata)
    VALUES 
        (NEW.id, 'notion', 'disconnected', '{}'),
        (NEW.id, 'claude', 'disconnected', '{}'),
        (NEW.id, 'figma', 'disconnected', '{}')
    ON CONFLICT (user_id, integration_type) DO NOTHING;
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger pour initialiser les intégrations lors de la création d'un utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION initialize_user_integrations();

-- Fonction RPC pour nettoyer les tokens expirés (à exécuter périodiquement)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    UPDATE user_integrations 
    SET 
        status = 'error',
        access_token = NULL,
        updated_at = NOW()
    WHERE 
        expires_at < NOW() 
        AND status = 'connected'
        AND access_token IS NOT NULL;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Fonction RPC pour obtenir les statistiques des intégrations (optionnel)
CREATE OR REPLACE FUNCTION get_integration_stats()
RETURNS TABLE(
    total_users bigint,
    total_connections bigint,
    notion_connections bigint,
    claude_connections bigint,
    figma_connections bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(DISTINCT user_id) FROM user_integrations) as total_users,
        (SELECT COUNT(*) FROM user_integrations WHERE status = 'connected') as total_connections,
        (SELECT COUNT(*) FROM user_integrations WHERE integration_type = 'notion' AND status = 'connected') as notion_connections,
        (SELECT COUNT(*) FROM user_integrations WHERE integration_type = 'claude' AND status = 'connected') as claude_connections,
        (SELECT COUNT(*) FROM user_integrations WHERE integration_type = 'figma' AND status = 'connected') as figma_connections;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Commentaires pour la documentation
COMMENT ON TABLE user_integrations IS 'Stockage des intégrations connectées par utilisateur';
COMMENT ON COLUMN user_integrations.integration_type IS 'Type d''intégration: notion, claude, figma';
COMMENT ON COLUMN user_integrations.status IS 'Statut de la connexion: connected, disconnected, error, connecting';
COMMENT ON COLUMN user_integrations.access_token IS 'Token d''accès chiffré pour l''API (sensible)';
COMMENT ON COLUMN user_integrations.refresh_token IS 'Token de rafraîchissement (sensible)';
COMMENT ON COLUMN user_integrations.metadata IS 'Métadonnées spécifiques à l''intégration (workspace, etc.)';

-- Message de fin
DO $$
BEGIN
    RAISE NOTICE 'Migration user_integrations créée avec succès !';
    RAISE NOTICE 'La table inclut : RLS, triggers, index et fonctions utilitaires';
    RAISE NOTICE 'Les intégrations par défaut seront créées automatiquement pour les nouveaux utilisateurs';
END
$$;