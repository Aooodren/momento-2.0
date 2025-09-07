# Guide de Déploiement - Momento 2.0

Ce guide vous explique comment déployer Momento 2.0 en production avec toutes les intégrations fonctionnelles.

## 📋 Prérequis

- Compte Supabase (gratuit)
- Compte Vercel (gratuit) 
- Node.js 18+ installé
- Git configuré

## 🗄️ Configuration de la Base de Données

### 1. Création du projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre `Project URL` et `anon public key`

### 2. Création des tables

1. Dans le dashboard Supabase, allez dans **SQL Editor**
2. Copiez-collez le contenu de `supabase_migrations/create_user_integrations.sql`
3. Exécutez le script

✅ **Ce que le script fait :**
- Crée la table `user_integrations`
- Configure la sécurité (RLS - Row Level Security)
- Ajoute les triggers automatiques
- Initialise les intégrations par défaut pour chaque nouvel utilisateur

### 3. Configuration des variables d'environnement

Créez un fichier `.env.local` :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-publique-anon

# Intégrations (optionnel pour la démo)
NOTION_CLIENT_ID=votre-notion-client-id
NOTION_CLIENT_SECRET=votre-notion-client-secret
FIGMA_CLIENT_ID=votre-figma-client-id  
FIGMA_CLIENT_SECRET=votre-figma-client-secret
CLAUDE_API_KEY=votre-claude-api-key
```

## 🚀 Déploiement sur Vercel

### Méthode 1: Déploiement automatique

1. Connectez votre repository GitHub à Vercel
2. Ajoutez les variables d'environnement dans Vercel
3. Déployez automatiquement à chaque push

### Méthode 2: Déploiement manuel

```bash
# Installation des dépendances
npm install

# Build de production
npm run build

# Déploiement via CLI Vercel
npx vercel --prod
```

## 🔌 Configuration des Intégrations

### Notion

1. Créez une application sur [developers.notion.com](https://developers.notion.com)
2. Configurez l'URL de redirection : `https://votre-domaine.vercel.app/integrations/callback/notion`
3. Notez le `Client ID` et `Client Secret`

### Figma

1. Créez une app sur [figma.com/developers](https://www.figma.com/developers)
2. Configurez l'URL de redirection : `https://votre-domaine.vercel.app/integrations/callback/figma`
3. Notez le `Client ID`

### Claude (Anthropic)

1. Obtenez une clé API sur [console.anthropic.com](https://console.anthropic.com)
2. La connexion se fait via token API direct

## 🔒 Sécurité en Production

### Variables sensibles

- ❌ Ne jamais commit les tokens/secrets dans le code
- ✅ Utiliser les variables d'environnement Vercel
- ✅ Chiffrer les tokens en base de données

### Supabase RLS

La sécurité est automatiquement configurée :
- Chaque utilisateur ne voit que ses propres intégrations
- Tokens stockés de manière sécurisée
- Authentification requise pour tous les accès

### HTTPS obligatoire

- Vercel fournit HTTPS automatiquement
- Les webhooks OAuth nécessitent HTTPS

## 📊 Monitoring et Maintenance

### Logs Vercel

Surveillez les déploiements dans l'onglet **Functions** de Vercel

### Métriques Supabase

Utilisez le dashboard Supabase pour :
- Surveiller l'usage de la DB
- Vérifier les connexions actives
- Analyser les performances

### Nettoyage automatique

Un trigger SQL nettoie automatiquement les tokens expirés.

## 🧪 Tests en Production

### Checklist de validation

- [ ] Inscription/connexion utilisateur fonctionne
- [ ] Page intégrations accessible
- [ ] Connexion Notion simule correctement
- [ ] Données sauvegardées dans Supabase
- [ ] Déconnexion supprime les tokens
- [ ] Synchronisation multi-appareils

### Tests de charge

La configuration gratuite supporte :
- **Supabase** : 50k requêtes DB/mois
- **Vercel** : 100GB bande passante/mois
- **Authentification** : 50k MAU (Monthly Active Users)

## 🔄 Mise à jour et Rollback

### Déploiement continu

Les commits sur `main` déclenchent automatiquement :
1. Build Vercel
2. Tests automatiques  
3. Déploiement production

### Rollback rapide

En cas de problème :
```bash
# Via CLI Vercel
vercel --prod --rollback
```

Ou via l'interface Vercel → **Deployments** → **Promote to Production**

## 📈 Scaling

### Limites gratuites atteintes

**Supabase** :
- Passez au plan Pro ($25/mois) pour :
  - 8GB database
  - 250k requêtes/mois
  - Support prioritaire

**Vercel** :
- Passez au plan Pro ($20/mois) pour :
  - Analytics avancés
  - Déploiements illimités
  - Support prioritaire

### Optimisations recommandées

1. **Cache** : Implementer du cache Redis pour les tokens fréquents
2. **CDN** : Utiliser Vercel Edge Network (inclus)
3. **Database** : Index optimisés (déjà créés par le script)
4. **Monitoring** : Sentry ou LogRocket pour les erreurs

## 🆘 Support et Debug

### Logs utiles

```bash
# Logs Vercel en temps réel
vercel logs --follow

# Logs Supabase
# Via dashboard > Logs Explorer
```

### Erreurs communes

| Erreur | Solution |
|--------|----------|
| `Table user_integrations doesn't exist` | Exécuter le script SQL migration |
| `RLS policy violation` | Vérifier l'authentification utilisateur |
| `CORS error` | Configurer les domaines autorisés dans Supabase |
| `Environment variables undefined` | Vérifier les variables dans Vercel |

### Contact

Pour des questions spécifiques au déploiement :
1. Vérifier les logs Vercel/Supabase
2. Consulter la documentation officielle
3. Créer un ticket avec les logs d'erreur

---

## ✅ Validation Post-Déploiement

Une fois déployé, votre application aura :

- 🚀 **Performance** : Temps de chargement < 2s
- 🔒 **Sécurité** : RLS activé, HTTPS obligatoire  
- 📱 **Responsive** : Fonctionne sur mobile/desktop
- 🔄 **Sync** : Données synchronisées entre appareils
- 🌍 **Global** : CDN mondial via Vercel
- 📈 **Scalable** : Prêt pour des milliers d'utilisateurs

**Votre Momento 2.0 est maintenant prêt pour le monde ! 🎉**