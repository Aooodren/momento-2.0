# Base de Données Momento 2.0

Ce document décrit la structure de base de données professionnelle mise en place pour gérer les projets, blocs, et canvas dans Momento 2.0.

## 🏗️ Architecture de la Base de Données

### Schéma Général

La base de données est conçue selon les meilleures pratiques pour assurer :
- **Sécurité** : Row Level Security (RLS) pour protéger les données
- **Performance** : Index optimisés et requêtes efficaces
- **Audit** : Logs automatiques des activités
- **Collaboration** : Système de membres et permissions
- **Versioning** : Snapshots automatiques du canvas
- **Soft Delete** : Suppression sécurisée sans perte de données

## 📊 Tables Principales

### 1. `projects`
Table principale contenant les projets de design thinking.

```sql
- id (UUID, PK) - Identifiant unique du projet
- title (VARCHAR) - Nom du projet
- description (TEXT) - Description détaillée
- type (VARCHAR) - Type de projet (design-thinking, ux-design, etc.)
- status (ENUM) - Statut: active, archived, template
- metadata (JSONB) - Métadonnées flexibles
- canvas_config (JSONB) - Configuration du canvas
- created_at/updated_at (TIMESTAMPTZ) - Timestamps automatiques
- created_by (UUID) - Référence vers l'utilisateur créateur
- deleted_at (TIMESTAMPTZ) - Soft delete
```

### 2. `project_members`
Gestion des membres et permissions par projet.

```sql
- id (UUID, PK)
- project_id (UUID, FK) - Référence vers le projet
- user_id (UUID, FK) - Référence vers l'utilisateur
- role (ENUM) - owner, editor, viewer
- can_edit_blocks (BOOLEAN) - Permission d'édition des blocs
- can_manage_members (BOOLEAN) - Permission de gestion des membres
- can_delete_project (BOOLEAN) - Permission de suppression
- invited_at/joined_at (TIMESTAMPTZ) - Gestion des invitations
```

### 3. `blocks`
Blocs individuels avec leur configuration et position sur le canvas.

```sql
- id (UUID, PK)
- project_id (UUID, FK)
- title (VARCHAR) - Nom du bloc
- description (TEXT) - Description
- type (ENUM) - standard, logic, claude, claude-figma, claude-notion, etc.
- status (ENUM) - draft, active, inactive, archived, error
- position_x/position_y (DECIMAL) - Position sur le canvas
- width/height (DECIMAL) - Dimensions optionnelles
- z_index (INTEGER) - Ordre d'affichage
- color (VARCHAR) - Couleur hex (#RRGGBB)
- collapsed/hidden/locked (BOOLEAN) - États visuels
- config (JSONB) - Configuration spécifique au bloc
- inputs/outputs (JSONB) - Définition des entrées/sorties
- metadata (JSONB) - Métadonnées extensibles
- execution_config (JSONB) - Configuration pour l'exécution future
- version (INTEGER) - Version du bloc
```

### 4. `block_relations`
Relations entre les blocs (connexions, dépendances, flux de données).

```sql
- id (UUID, PK)
- project_id (UUID, FK)
- source_block_id/target_block_id (UUID, FK) - Blocs source et cible
- type (ENUM) - connection, dependency, data_flow, trigger
- label (VARCHAR) - Libellé optionnel
- source_handle/target_handle (VARCHAR) - Points de connexion
- style (JSONB) - Style visuel de la connexion
- animated (BOOLEAN) - Animation de la connexion
- data_mapping (JSONB) - Mapping des données
- conditions (JSONB) - Conditions logiques
```

### 5. `canvas_snapshots`
Snapshots automatiques pour versioning et récupération.

```sql
- id (UUID, PK)
- project_id (UUID, FK)
- name/description (TEXT) - Métadonnées du snapshot
- canvas_data (JSONB) - État complet du canvas
- is_auto_save (BOOLEAN) - Snapshot automatique ou manuel
- is_checkpoint (BOOLEAN) - Point de contrôle important
- blocks_count/relations_count (INTEGER) - Statistiques
```

### 6. `block_activity_log`
Journal d'activité pour l'audit et la collaboration.

```sql
- id (UUID, PK)
- project_id (UUID, FK)
- block_id (UUID, FK) - Bloc concerné (optionnel)
- action (VARCHAR) - Action: created, updated, deleted, moved, etc.
- description (TEXT) - Description de l'action
- changes (JSONB) - Détail des changements
- user_id (UUID) - Utilisateur qui a effectué l'action
```

## 🔐 Sécurité (RLS)

### Politiques de Sécurité

**Projets :**
- ✅ Les utilisateurs voient uniquement leurs projets membres
- ✅ Seuls les propriétaires peuvent modifier/supprimer
- ✅ Création automatique du rôle "owner" à la création

**Blocs et Relations :**
- ✅ Visibilité limitée aux membres du projet
- ✅ Modification limitée aux utilisateurs avec permission `can_edit_blocks`
- ✅ Suppression soft automatique lors de la suppression du projet

**Collaboration :**
- ✅ Gestion fine des permissions par utilisateur
- ✅ Système d'invitation avec acceptation
- ✅ Logs d'activité automatiques

## 🚀 Utilisation

### Installation

```bash
# Lancer le script de setup
./scripts/setup-database.sh
```

### API TypeScript

```typescript
import { useCanvasAPI } from '../hooks/useCanvasAPI';

const api = useCanvasAPI();

// Créer un projet
const project = await api.createProject({
  title: "Mon Projet",
  description: "Description du projet",
  type: "design-thinking"
});

// Créer un bloc
const block = await api.createBlock(project.id, {
  title: "Recherche Utilisateurs",
  type: "standard",
  position_x: 100,
  position_y: 100,
  config: { method: "interviews" }
});

// Créer une relation
const relation = await api.createRelation(project.id, {
  source_block_id: block1.id,
  target_block_id: block2.id,
  type: "data_flow"
});
```

### Types TypeScript

```typescript
import { 
  Block, 
  BlockRelation, 
  Project,
  CreateBlockRequest,
  UpdateBlockRequest 
} from '../types/database';
```

## 📈 Fonctionnalités Avancées

### 1. Snapshots Automatiques
- Sauvegarde automatique lors de changements significatifs
- Limitation à un snapshot toutes les 5 minutes
- Récupération d'états antérieurs

### 2. Activity Logging
- Journal automatique de toutes les actions
- Tracking des changements avec différentiel
- Audit trail complet

### 3. Collaboration Temps Réel
- Permissions granulaires par projet
- Système d'invitation
- Logs partagés d'activité

### 4. Soft Delete
- Suppression sécurisée sans perte de données
- Cascade automatique (projet → blocs → relations)
- Possibilité de restauration

## 🔧 Maintenance

### Commandes Utiles

```bash
# Reset complet de la base
supabase db reset

# Appliquer nouvelles migrations
supabase db push

# Générer les types TypeScript
supabase gen types typescript --local > src/types/supabase.ts

# Voir les logs
supabase logs

# Status du projet
supabase status
```

### Requêtes de Maintenance

```sql
-- Voir les projets avec statistiques
SELECT * FROM project_dashboard;

-- Nettoyer les anciens snapshots
DELETE FROM canvas_snapshots 
WHERE created_at < NOW() - INTERVAL '30 days' 
AND is_checkpoint = FALSE;

-- Statistiques d'un projet
SELECT get_project_stats('project-id');

-- Reset des données de demo
SELECT reset_demo_data();
```

## 🎯 Performance

### Index Optimisés
- Recherche par projet : `idx_blocks_project_id`
- Position sur canvas : `idx_blocks_position`
- Relations : `idx_block_relations_source`, `idx_block_relations_target`
- Activité : `idx_activity_log_created_at`

### Optimisations
- JSONB avec index GIN pour métadonnées
- Pagination automatique via Supabase
- Requêtes optimisées avec `select` spécifiques
- Cache automatique des sessions

## 🐛 Troubleshooting

### Problèmes Courants

**Migration échoue :**
```bash
supabase db reset --debug
```

**Permissions RLS :**
```sql
-- Vérifier les politiques
SELECT * FROM pg_policies WHERE tablename = 'blocks';
```

**Performance :**
```sql
-- Analyser une requête lente
EXPLAIN ANALYZE SELECT * FROM blocks WHERE project_id = 'xxx';
```

## 📝 Exemples de Données

Le fichier `supabase/seed.sql` contient des données d'exemple :
- 3 projets types (App Mobile, E-commerce, Design System)
- Blocs variés avec différents types
- Relations connectées
- Snapshots et logs d'activité

---

*Cette documentation est maintenue à jour avec chaque évolution de la base de données.*