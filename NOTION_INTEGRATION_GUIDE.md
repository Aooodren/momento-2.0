# Guide d'intégration Notion - Momento 2.0

Ce guide explique comment utiliser l'intégration Notion complète dans votre canvas Momento 2.0.

## 🎯 Fonctionnalités

### ✅ **Ce qui est implémenté :**
- **Authentification OAuth** réelle avec Notion
- **Récupération des pages** et databases utilisateur  
- **Bloc Notion** pour le canvas avec sélection de contenu
- **Bloc Claude AI** avec templates de prompts
- **Liaison automatique** Notion → Claude → Nouveau contenu
- **Persistance Supabase** de tous les tokens et connexions

## 🔐 Configuration OAuth Notion

### 1. **Créer une application Notion**

1. Allez sur https://developers.notion.com/my-integrations
2. Cliquez **"+ New integration"**
3. Configurez votre intégration :
   - **Name** : "Momento 2.0"
   - **Logo** : (optionnel)
   - **Organization** : Votre workspace

### 2. **Configuration OAuth**

Dans les paramètres de votre intégration :

```json
{
  "redirect_uris": [
    "http://localhost:3000/integrations/callback/notion",
    "https://votre-domaine.vercel.app/integrations/callback/notion"
  ],
  "request_url": "https://api.notion.com/v1/oauth/authorize",
  "access_token_url": "https://api.notion.com/v1/oauth/token"
}
```

### 3. **Variables d'environnement**

Ajoutez dans votre `.env.local` :

```env
# Notion OAuth
NEXT_PUBLIC_NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
```

## 📱 **Utilisation dans l'interface**

### **Étape 1 : Connexion**
1. Allez dans **"Intégrations"** (sidebar)
2. Cliquez **"Connecter"** sur la carte Notion
3. Une popup s'ouvre → autorisez Momento 2.0
4. ✅ **Statut : Connecté**

### **Étape 2 : Dans le Canvas**
1. Créez un projet ou ouvrez l'éditeur
2. Ajoutez un **"Bloc Notion"**
3. Cliquez **"Sélectionner"** → liste de vos pages
4. Choisissez une page → contenu chargé automatiquement

### **Étape 3 : Traitement avec Claude**  
1. Ajoutez un **"Bloc Claude AI"**
2. Connectez la sortie du bloc Notion vers Claude
3. Configurez le prompt (templates disponibles)
4. **"Exécuter"** → Claude analyse votre contenu Notion

### **Étape 4 : Sauvegarde automatique**
- Claude peut créer une nouvelle page Notion
- Ou mettre à jour une page existante
- Liaison automatique des blocs dans le canvas

## 🔧 **Templates Claude disponibles**

| Template | Description | Prompt |
|----------|-------------|---------|
| **Résumer** | Synthèse concise | "Résume le contenu suivant..." |
| **Améliorer** | Restructurer le texte | "Améliore et restructure..." |  
| **Traduire** | Traduction française | "Traduis le texte suivant..." |
| **Analyser** | Insights et analyse | "Analyse le contenu et donne..." |
| **Questions** | Génération Q&A | "Génère 5 questions pertinentes..." |
| **Plan** | Structure détaillée | "Crée un plan détaillé..." |

## 🛠️ **Flux de travail typique**

### **Exemple : Analyse de document**

1. **Bloc Notion** → Sélectionner votre document de recherche
2. **Bloc Claude** → Template "Analyser" 
3. **Connexion** → Notion alimente Claude automatiquement
4. **Exécution** → Claude génère l'analyse
5. **Sauvegarde** → Nouvelle page "Analyse - [Date]" créée dans Notion

### **Exemple : Amélioration de contenu**

1. **Bloc Notion A** → Page brouillon à améliorer
2. **Bloc Claude** → Template "Améliorer" avec prompt personnalisé
3. **Bloc Notion B** → Création d'une nouvelle page améliorée
4. **Résultat** → Version optimisée sauvegardée automatiquement

## 🔒 **Sécurité et permissions**

### **Ce qui est stocké :**
- ✅ **Tokens OAuth** chiffrés dans Supabase
- ✅ **Métadonnées** workspace (nom, icône)
- ✅ **Historique** des connexions et synchros

### **Ce qui N'est PAS stocké :**
- ❌ **Contenu complet** des pages (seulement extraits)
- ❌ **Données sensibles** non chiffrées
- ❌ **Accès permanent** sans autorisation utilisateur

### **Permissions Notion demandées :**
- `read_content` : Lire vos pages et databases
- `update_content` : Modifier le contenu existant  
- `insert_content` : Créer de nouvelles pages

## 📊 **Monitoring et debug**

### **Vérifier la connexion :**
```javascript
// Console navigateur
notionService.isConnected().then(connected => 
  console.log('Notion connecté:', connected)
);
```

### **Logs utiles :**
- **Popup bloquée** : Vérifiez les paramètres anti-popup
- **Token expiré** : Reconnectez-vous via "Intégrations"
- **Permissions** : Vérifiez les autorisations dans Notion

### **Dashboard Supabase :**
- Table `user_integrations` pour voir les connexions
- Logs des requêtes API Notion
- Monitoring des erreurs de synchronisation

## 🚀 **Déploiement production**

### **Checklist :**
- [ ] Variables d'environnement configurées sur Vercel
- [ ] URLs de callback mises à jour dans Notion
- [ ] Table `user_integrations` créée dans Supabase  
- [ ] Tests de bout en bout avec comptes réels

### **URLs de production à configurer :**
```
https://votre-domaine.vercel.app/integrations/callback/notion
```

## 🔄 **Développements futurs**

### **Prochaines fonctionnalités :**
- 📄 **Templates Notion** prédéfinis pour différents cas d'usage
- 🔄 **Synchronisation bidirectionnelle** en temps réel
- 📊 **Analytics** des utilisations Claude ↔ Notion  
- 🤖 **Workflows automatisés** triggers sur changements Notion
- 📱 **Mobile app** avec même intégration

### **Intégrations supplémentaires :**
- **Figma** → Import automatique de maquettes dans Notion
- **GitHub** → Documentation automatique des projets
- **Slack** → Notifications des analyses Claude

---

## ✅ **Votre système est maintenant prêt !**

🎉 **Vous disposez d'une intégration Notion complète** permettant à vos utilisateurs de :
- Se connecter en 1 clic via OAuth sécurisé
- Importer leurs contenus Notion dans le canvas  
- Les traiter avec Claude AI automatiquement
- Sauvegarder les résultats dans de nouvelles pages

**Cette intégration transforme Momento 2.0 en véritable hub de design thinking connecté !** 🚀