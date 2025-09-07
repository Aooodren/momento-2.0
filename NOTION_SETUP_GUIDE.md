# Guide de configuration Notion OAuth - Momento 2.0

## 🎯 Objectif
Permettre à vos utilisateurs de **se connecter à Notion** et d'autoriser Momento à accéder à leurs pages et databases.

## 📋 Étapes de configuration

### **Étape 1 : Créer une intégration Notion**

1. **Allez sur** https://www.notion.so/my-integrations
2. **Cliquez** "Create new integration"
3. **Remplissez les informations** :
   - **Name** : `Momento 2.0`
   - **Logo** : (optionnel - vous pouvez uploader votre logo)
   - **Description** : `Design thinking workspace with AI-powered content analysis`

### **Étape 2 : Configuration de base**

1. **Type d'intégration** : Sélectionnez **"Public integration"**
   - Cela permet à n'importe quel utilisateur Notion de se connecter
   - ✅ Nécessaire pour votre app grand public

2. **Workspace** : Sélectionnez votre workspace principal
   - C'est juste pour les tests, les utilisateurs autoriseront leurs propres workspaces

### **Étape 3 : Permissions (Capabilities)**

Cochez les permissions suivantes :
- ✅ **Read content** - Lire les pages et databases
- ✅ **Update content** - Modifier le contenu existant  
- ✅ **Insert content** - Créer de nouvelles pages
- ⚠️ **Read user information** - (optionnel) Nom et email utilisateur

### **Étape 4 : URLs de redirection OAuth**

Dans la section **"OAuth Domain & URIs"** :

```
Development:
http://localhost:3000/integrations/callback/notion

Production:
https://votre-domaine.vercel.app/integrations/callback/notion
```

**⚠️ Remplacez `votre-domaine.vercel.app` par votre vrai domaine Vercel**

### **Étape 5 : Récupérer vos identifiants**

Une fois l'intégration créée, vous obtenez :

1. **OAuth client ID** 
   - Format : `1234abcd-5678-90ef-ghij-klmnopqrstuv`
   - ✅ **Public** - peut être dans le code frontend

2. **OAuth client secret**
   - Format : `secret_ABC123...`
   - 🔒 **Secret** - uniquement côté serveur

3. **Integration ID** 
   - Pour référence interne Notion

## 🔧 Configuration dans votre code

### **Variables d'environnement**

Créez/modifiez votre `.env.local` :

```env
# Notion OAuth (OBLIGATOIRE)
NEXT_PUBLIC_NOTION_CLIENT_ID=votre_client_id_ici
NOTION_CLIENT_SECRET=votre_client_secret_ici

# Supabase (déjà configuré)
NEXT_PUBLIC_SUPABASE_URL=https://blgkhkfegcfnauovglis.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_supabase
```

### **Variables Vercel (pour production)**

Dans votre dashboard Vercel :
1. **Projet** → **Settings** → **Environment Variables**
2. Ajoutez :
   - `NEXT_PUBLIC_NOTION_CLIENT_ID` = votre client ID
   - `NOTION_CLIENT_SECRET` = votre client secret

## 🧪 Test de la configuration

### **Test local (localhost:3000)**

1. **Démarrez votre app** : `npm run dev`
2. **Allez dans "Intégrations"** 
3. **Cliquez "Connecter" sur Notion**
4. **Popup s'ouvre** → vous demande d'autoriser l'accès
5. **Acceptez** → redirection vers callback
6. ✅ **"Connecté"** affiché dans l'interface

### **Ce que voit l'utilisateur :**

```
🔒 Momento 2.0 demande l'accès à :
   • Lire vos pages et databases
   • Créer et modifier du contenu  
   • Accéder aux informations de base

[ Autoriser l'accès ] [ Annuler ]
```

## 🚨 Dépannage

### **"Client ID not found"**
- ✅ Vérifiez le `.env.local`
- ✅ Redémarrez le serveur de dev (`npm run dev`)
- ✅ Vérifiez que la variable commence par `NEXT_PUBLIC_`

### **"Redirect URI mismatch"**
- ✅ URLs exactement identiques dans Notion et votre code
- ✅ `http://` pour localhost, `https://` pour production
- ✅ Pas de slash `/` à la fin

### **"Unauthorized client"**
- ✅ Client secret correct côté serveur
- ✅ Intégration de type "Public" dans Notion

### **Popup bloquée**
- ✅ Autoriser les popups dans le navigateur
- ✅ Tester dans un onglet de navigation privée

## 📈 Mise en production

### **Review Notion (pour app publique)**
Si vous avez beaucoup d'utilisateurs, Notion peut demander une review de sécurité :
- ✅ **Politique de confidentialité** claire
- ✅ **Conditions d'utilisation** 
- ✅ **Description** détaillée de l'usage des données

### **Monitoring**
- Dashboard Notion : https://www.notion.so/my-integrations
- Statistiques d'utilisation et erreurs OAuth
- Logs des connexions utilisateur

---

## ✅ **Checklist finale**

- [ ] Intégration créée sur https://www.notion.so/my-integrations
- [ ] Permissions `read`, `update`, `insert` activées
- [ ] URLs de callback configurées (dev + prod)
- [ ] Variables d'environnement ajoutées
- [ ] Test local fonctionnel
- [ ] Variables Vercel configurées pour production

**Une fois cette configuration terminée, vos utilisateurs pourront se connecter à Notion en 1 clic !** 🎉