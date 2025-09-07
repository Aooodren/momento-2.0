# Architecture Momento 2.0 - Plateforme d'orchestration Design Thinking

## Vision

Momento 2.0 = **Zapier pour le Design Thinking**
- Canvas visuel avec blocs interconnectés
- Orchestration d'outils (Figma, Notion, Claude, etc.)
- Workflows automatisés entre services

## Architecture technique

### Frontend (React/Vite)
```
┌─────────────────────────────────────────────┐
│               Interface Web                 │
├─────────────────────────────────────────────┤
│  Canvas ReactFlow  │  Toolbar │  Settings   │
│  ┌──────┐ ┌──────┐ │         │             │
│  │Figma │─│Claude│ │ + Block │ OAuth Mgmt  │
│  │Block │ │Block │ │         │             │
│  └──────┘ └──────┘ │         │             │
└─────────────────────────────────────────────┘
```

### Backend (Hub d'orchestration)
```
┌─────────────────────────────────────────────┐
│            Momento Hub Server               │
├─────────────────────────────────────────────┤
│  Workflow Engine    │    Integration Layer  │
│  ┌────────────────┐ │  ┌─────┐ ┌─────┐     │
│  │ Block Executor │ │  │OAuth│ │APIs │     │
│  │ Data Pipeline  │ │  │Mgmt │ │Mgmt │     │
│  │ Event System   │ │  └─────┘ └─────┘     │
│  └────────────────┘ │                      │
└─────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │  Figma  │   │ Notion  │   │ Claude  │
   │   API   │   │   API   │   │   API   │
   └─────────┘   └─────────┘   └─────────┘
```

## Flux utilisateur type

### Exemple : "Analyser une maquette Figma"

1. **User crée workflow** :
   ```
   [Figma Block] → [Claude Block] → [Notion Block]
   ```

2. **Configuration** :
   - Figma Block : Sélection du fichier à analyser
   - Claude Block : Prompt d'analyse UX
   - Notion Block : Page de destination du rapport

3. **Exécution** :
   ```javascript
   // Pseudo-code workflow
   const figmaData = await figmaBlock.export({ fileId, format: 'png' })
   const analysis = await claudeBlock.analyze({ 
     image: figmaData, 
     prompt: "Analyse UX de cette maquette" 
   })
   const report = await notionBlock.createPage({ 
     title: "Analyse UX", 
     content: analysis 
   })
   ```

## Types de blocs

### Input Blocks
- **Web Scraper Block** : Récupère contenu web
- **File Upload Block** : Upload fichiers locaux
- **Database Query Block** : Requêtes SQL/API
- **User Input Block** : Formulaires dynamiques

### Processing Blocks
- **Claude Analysis Block** : Analyse de contenu
- **Image Processing Block** : Manipulation d'images
- **Data Transform Block** : Transformation de données
- **Logic Block** : Conditions if/then/else

### Output Blocks  
- **Notion Page Block** : Création pages/bases
- **Figma Component Block** : Création composants
- **Email Block** : Envoi d'emails
- **Webhook Block** : Appels API externes

### Integration Blocks
- **Figma Block** : Export/import designs
- **Notion Block** : CRUD pages/databases  
- **Slack Block** : Messages/notifications
- **Google Drive Block** : Fichiers cloud
- **GitHub Block** : Code/documentation

## Gestion des authentifications

### OAuth centralisé
```javascript
// Chaque utilisateur connecte ses comptes une fois
const userIntegrations = {
  notion: { token: 'xxx', workspace: 'My Team' },
  figma: { token: 'yyy', team: 'Design Team' },
  openai: { apiKey: 'zzz' }
}
```

### Execution avec permissions utilisateur
```javascript
// Chaque bloc utilise les tokens de l'utilisateur
const executeWorkflow = async (userId, workflow) => {
  const userTokens = await getUserIntegrations(userId)
  
  for (const block of workflow.blocks) {
    const result = await block.execute({
      data: previousResults,
      auth: userTokens[block.service]
    })
  }
}
```

## Stack technique recommandé

### Frontend
- ✅ React + Vite (existant)
- ✅ ReactFlow pour canvas (existant)
- ✅ Supabase auth (existant)
- ➕ Zustand pour state management
- ➕ React Query pour API calls

### Backend  
- ➕ Node.js Express server
- ➕ PostgreSQL + Prisma ORM
- ➕ Queue system (Bull/Redis)
- ➕ WebSocket pour real-time

### Deployment
- Frontend: Vercel (existant)  
- Backend: Railway/Render
- Database: Supabase PostgreSQL
- Queue: Redis Cloud

## Phases de développement

### Phase 1 : Core Blocks ⭐
- Notion Block (CRUD)
- Claude Block (Analysis)
- Basic workflow execution

### Phase 2 : Visual Blocks
- Figma Block  
- Image Processing Block
- Web Scraper Block

### Phase 3 : Advanced Features
- Conditions et loops
- Error handling
- Monitoring et logs

### Phase 4 : Marketplace
- Block templates
- Community blocks  
- Sharing workflows

## Différentiation concurrentielle

### vs Zapier
- ✅ **Visuel** : Canvas au lieu de formulaires
- ✅ **Design focus** : Outils créatifs intégrés
- ✅ **AI-native** : Claude dans tous les workflows

### vs n8n  
- ✅ **Simplicity** : Interface grand public
- ✅ **Templates** : Workflows design thinking prêts
- ✅ **Cloud-first** : Pas d'auto-hébergement requis

### vs Retool
- ✅ **No-code** : Pas de SQL/JavaScript requis
- ✅ **Creative tools** : Figma, Adobe, etc.
- ✅ **Collaboration** : Workflows partagés

## ROI Business

### Monétisation
- **Freemium** : 3 workflows, 10 exécutions/mois
- **Pro** : Unlimited workflows, 1000 exécutions ($29/mois)  
- **Team** : Collaboration + analytics ($99/mois)
- **Enterprise** : On-premise + SLA ($500+/mois)

### Métriques clés
- **Adoption** : Workflows créés par utilisateur
- **Retention** : Workflows actifs mensuellement  
- **Value** : Temps économisé vs coût abonnement

Cette architecture vous permettrait de créer la plateforme d'orchestration que vous envisagez ! 🚀