# 🚀 Étapes Concrètes de Migration - Guide Simple

## 📋 Ce que vous devez faire maintenant

### Étape 1: Préparer le projet Supabase (5 min)

```bash
# Aller dans votre dossier projet
cd /Users/aodrensarlat/Desktop/Momento2.0

# Vérifier que Supabase est initialisé
supabase status
```

Si ça ne marche pas, d'abord installer Supabase CLI :
```bash
npm install -g supabase
supabase login
supabase init
```

### Étape 2: Créer la structure pour les fonctions Edge (2 min)

```bash
# Créer le dossier pour les fonctions Supabase si pas déjà fait
mkdir -p supabase/functions

# Copier notre fonction sécurisée au bon endroit
cp -r src/supabase/functions/integrations-api supabase/functions/
```

### Étape 3: Configurer les secrets (5 min)

Dans le dashboard Supabase (https://app.supabase.com) :

1. Allez dans votre projet
2. Settings > Edge Functions
3. Ajoutez ces secrets :

```
CLAUDE_API_KEY = votre_clé_claude_si_vous_en_avez_une
NOTION_CLIENT_ID = votre_notion_client_id
NOTION_CLIENT_SECRET = votre_notion_client_secret
SITE_URL = http://localhost:3000 (ou votre domaine)
```

**OU** via la ligne de commande :
```bash
supabase secrets set CLAUDE_API_KEY=votre_clé
supabase secrets set NOTION_CLIENT_ID=votre_id
supabase secrets set NOTION_CLIENT_SECRET=votre_secret
supabase secrets set SITE_URL=http://localhost:3000
```

### Étape 4: Déployer la fonction Edge (2 min)

```bash
# Déployer la fonction unified integrations-api
supabase functions deploy integrations-api
```

Si ça marche, vous verrez quelque chose comme :
```
✅ Successfully deployed function integrations-api
🔗 Function URL: https://votre-projet.supabase.co/functions/v1/integrations-api
```

### Étape 5: Appliquer les migrations de base de données (2 min)

```bash
# Appliquer les nouvelles tables sécurisées
supabase db push
```

### Étape 6: Tester que ça marche (2 min)

```bash
# Tester l'API
curl https://votre-projet.supabase.co/functions/v1/integrations-api/test
```

Vous devriez voir :
```json
{
  "message": "API intégrations sécurisée opérationnelle!",
  "integrations": ["figma", "claude", "notion"],
  "timestamp": "2024-09-10T..."
}
```

### Étape 7: Mettre à jour le frontend (10 min)

Maintenant, dans vos composants React, remplacez :

**AVANT (non sécurisé) :**
```typescript
// Dans vos composants
import { notionService } from '../services/notionService';
import { useFigmaAPI } from '../hooks/useFigmaAPI';

// Usage
const pages = await notionService.getPages();
const { getUserProjects } = useFigmaAPI();
```

**APRÈS (sécurisé) :**
```typescript
// Dans vos composants
import { useSecureIntegrations } from '../hooks/useSecureIntegrations';

// Usage
function MonComposant() {
  const { notion, figma, claude } = useSecureIntegrations();
  
  const handleClick = async () => {
    const pages = await notion.getPages();
    const file = await figma.getFile('fileKey');
    const response = await claude.generateText('Mon prompt');
  };
}
```

### Étape 8: Nettoyer (5 min)

Une fois que tout marche, supprimez les anciens fichiers :

```bash
# Supprimer les anciens services non sécurisés
rm src/services/notionService.ts
rm src/hooks/useFigmaAPI.ts
rm src/hooks/useClaudeAPI.ts
rm src/connectors/FigmaConnector.ts
rm src/connectors/ClaudeConnector.ts
rm src/connectors/NotionConnector.ts
```

## 🔧 Si vous avez des problèmes

### Problème : "supabase command not found"
```bash
npm install -g supabase
```

### Problème : "No Supabase project found"
```bash
supabase login
supabase link --project-ref VOTRE_PROJECT_ID
```

### Problème : "Function deployment failed"
Vérifiez que le fichier existe :
```bash
ls -la supabase/functions/integrations-api/index.ts
```

### Problème : "Database migration failed"
Vérifiez la connexion :
```bash
supabase status
```

## 🎯 Résultat Final

Après ces étapes, vous aurez :

1. ✅ **Backend sécurisé** - Toutes les APIs passent par Supabase
2. ✅ **Frontend minimal** - Plus de tokens exposés
3. ✅ **Sécurité maximale** - Architecture zero-trust
4. ✅ **Audit complet** - Tous les appels sont loggés

## 📞 Aide

Si vous êtes bloqué sur une étape, dites-moi :
1. À quelle étape vous êtes
2. Quel message d'erreur vous avez
3. Ce qui se passe quand vous lancez la commande

Je vous aiderai à résoudre le problème ! 🚀