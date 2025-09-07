# Configuration Claude Code - Momento 2.0

## MCP Server - Notion Integration

### Installation

```bash
cd mcp-server
npm install
```

### Configuration MCP

Ajoutez dans vos paramètres Claude Code :

```json
{
  "mcpServers": {
    "momento-notion": {
      "command": "node",
      "args": ["/Users/aodrensarlat/Desktop/Momento2.0/mcp-server/index.js"],
      "env": {
        "NOTION_INTEGRATION_TOKEN": "secret_pqXV5eOMqEC1dHpLCWH1JEBoykvuDUxmI9z7I3IWU7Q"
      }
    }
  }
}
```

### Outils disponibles

- `notion_list_pages` - Liste les pages Notion
- `notion_get_page` - Récupère le contenu d'une page
- `notion_create_page` - Crée une nouvelle page
- `notion_search_databases` - Recherche dans les databases

### Templates Design Thinking

Le serveur MCP inclut des templates prêts à l'emploi :
- Empathy Map
- User Journey
- Personas
- Brainstorming Canvas

### Utilisation

Une fois configuré, vous pourrez demander à Claude :
- "Liste mes pages Notion"
- "Crée une Empathy Map pour mon projet"
- "Récupère le contenu de ma page de brainstorming"