# Workflow Automation - Le "Zapier du Design Thinking"

## Vue d'ensemble

Cette fonctionnalité transforme Momento 2.0 en une plateforme d'automatisation de workflows pour le design thinking, permettant de connecter facilement Notion, Claude, Figma et d'autres outils dans des workflows visuels.

## Architecture

### Composants principaux

1. **WorkflowCanvas** - Canvas principal avec ReactFlow
2. **WorkflowBlock** - Blocs d'applications connectables
3. **WorkflowPalette** - Palette de blocs pré-configurés
4. **WorkflowExecutionPanel** - Monitoring et contrôle d'exécution
5. **WorkflowEngine** - Moteur d'exécution des workflows

### Connecteurs d'applications

- **NotionConnector** - Intégration avec Notion (pages, bases de données)
- **ClaudeConnector** - IA pour analyse et génération de contenu
- **FigmaConnector** - Intégration avec designs et prototypes Figma

## Fonctionnalités

### 1. Interface Canvas Visuelle
- Glisser-déposer de blocs d'applications
- Connexions visuelles entre blocs
- Palette de blocs pré-configurés
- Minimap et contrôles de navigation

### 2. Types de blocs

#### Déclencheurs (Triggers)
- **Timer** - Exécution programmée
- **Webhook** - Déclenchement via API

#### Actions
- **Notion**
  - Récupérer page/base de données
  - Créer/modifier pages
  - Recherche et requêtes
  - Génération de résumés

- **Claude**
  - Analyse de contenu
  - Génération d'idées
  - Résumé intelligent
  - Réponse à questions

- **Figma**
  - Récupération de fichiers
  - Export d'assets
  - Commentaires collaboratifs
  - Analyse de design

#### Transformateurs
- Formatage et transformation de données
- Validation et filtrage

### 3. Exécution de Workflows
- Exécution manuelle ou automatique
- Monitoring en temps réel
- Logs détaillés d'exécution
- Gestion d'erreurs et retry

## Utilisation

### Création d'un workflow

1. **Ouvrir la palette** - Cliquez sur "Ajouter" ou le bouton "+"
2. **Glisser des blocs** - Depuis la palette vers le canvas
3. **Connecter les blocs** - Reliez les sorties aux entrées
4. **Configurer** - Cliquez sur un bloc pour le configurer
5. **Exécuter** - Lancez le workflow complet

### Exemples de workflows

#### Workflow 1: Analyse de contenu Notion → Résumé Claude
```
[Page Notion] → [Extraire contenu] → [Analyser avec Claude] → [Créer résumé]
```

#### Workflow 2: Design review automatique
```
[Fichier Figma] → [Exporter frames] → [Analyser design] → [Commenter Figma]
```

#### Workflow 3: Génération d'idées programmée
```
[Timer] → [Générer idées Claude] → [Créer page Notion] → [Notifier équipe]
```

## Configuration

### Variables d'environnement requises

```bash
# Notion
NOTION_INTEGRATION_TOKEN=your_token

# Claude (Anthropic)
ANTHROPIC_API_KEY=your_key

# Figma
FIGMA_ACCESS_TOKEN=your_token
```

### Configuration MCP (si utilisé)

Le système utilise le protocole MCP existant quand disponible :

```json
{
  "mcpServers": {
    "momento-notion": {
      "command": "node",
      "args": ["./mcp-server/index.js"],
      "env": {
        "NOTION_INTEGRATION_TOKEN": "your_token"
      }
    }
  }
}
```

## API et Intégration

### Ajouter un nouveau connecteur

```typescript
import { ApplicationConnector } from '../hooks/useWorkflowEngine';

export class CustomConnector implements ApplicationConnector {
  type = 'custom' as const;

  async execute(operation: string, config: Record<string, any>, input?: any) {
    // Implémentation personnalisée
  }

  validate(operation: string, config: Record<string, any>): boolean {
    // Validation de la configuration
  }

  getOperations(): string[] {
    return ['operation1', 'operation2'];
  }
}
```

### Enregistrer le connecteur

```typescript
const customConnector = new CustomConnector();
workflowEngine.registerConnector(customConnector);
```

## Types et Interfaces

### WorkflowBlockData
```typescript
interface WorkflowBlockData {
  id: string;
  title: string;
  description?: string;
  blockType: 'trigger' | 'action' | 'condition' | 'transformer';
  application: ApplicationType;
  action: WorkflowAction;
  status: ExecutionStatus;
  executionCount: number;
  lastRun?: Date;
}
```

### WorkflowExecution
```typescript
interface WorkflowExecution {
  id: string;
  blockId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  input?: any;
  output?: any;
  error?: string;
  logs: string[];
}
```

## Monitoring et Debugging

### Logs d'exécution
- Chaque bloc génère des logs détaillés
- Visualisation en temps réel des exécutions
- Export des logs pour debugging

### Métriques
- Taux de succès par bloc
- Temps d'exécution moyen
- Nombre d'exécutions par jour

### Gestion d'erreurs
- Retry automatique configurable
- Notifications d'échec
- Mode dégradé

## Sécurité

### Tokens et authentification
- Stockage sécurisé des tokens API
- Rotation automatique des clés
- Validation des permissions

### Isolation des workflows
- Exécution sandboxée
- Limitation des ressources
- Validation des inputs

## Performance

### Optimisations
- Exécution asynchrone
- Cache des résultats intermédiaires
- Mise en parallèle des blocs indépendants

### Limitations
- Maximum 50 blocs par workflow
- Timeout de 5 minutes par bloc
- 100 exécutions simultanées

## Développement

### Structure des fichiers
```
src/
├── components/
│   ├── WorkflowCanvas.tsx
│   ├── WorkflowBlock.tsx
│   ├── WorkflowPalette.tsx
│   └── WorkflowExecutionPanel.tsx
├── hooks/
│   └── useWorkflowEngine.ts
├── connectors/
│   ├── NotionConnector.ts
│   ├── ClaudeConnector.ts
│   └── FigmaConnector.ts
└── types/
    └── workflow.ts
```

### Tests
```bash
# Tests unitaires des connecteurs
npm test src/connectors/

# Tests d'intégration des workflows
npm test src/components/WorkflowCanvas.test.tsx

# Tests E2E
npm run test:e2e
```

### Débogage
```typescript
// Activer les logs de debug
localStorage.setItem('workflow-debug', 'true');

// Voir les exécutions en cours
console.log(workflowEngine.executions);
```

## Roadmap

### Version 1.1
- [ ] Conditions avancées (if/else)
- [ ] Boucles et itérations
- [ ] Templates de workflows
- [ ] Connecteur Slack

### Version 1.2
- [ ] API REST pour workflows
- [ ] Webhooks entrants
- [ ] Connecteur Google Drive
- [ ] Analytics avancés

### Version 2.0
- [ ] IA pour suggestion de workflows
- [ ] Marketplace de connecteurs
- [ ] Workflows collaboratifs
- [ ] Version mobile

## Support

Pour toute question ou problème :
1. Consulter la documentation
2. Vérifier les logs d'exécution
3. Tester les connecteurs individuellement
4. Contacter l'équipe de développement

## Licence

Ce module est intégré à Momento 2.0 sous la même licence que le projet principal.