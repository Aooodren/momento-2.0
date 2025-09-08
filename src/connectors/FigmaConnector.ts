import { ApplicationConnector } from '../hooks/useWorkflowEngine';

// Interfaces pour les données Figma
export interface FigmaFile {
  key: string;
  name: string;
  thumbnail_url?: string;
  last_modified: string;
  version: string;
}

export interface FigmaFrame {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  export_url?: string;
}

export interface FigmaComponent {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface FigmaExport {
  id: string;
  format: 'PNG' | 'JPG' | 'SVG' | 'PDF';
  url: string;
  size: string;
}

// Connecteur Figma pour les designs
export class FigmaConnector implements ApplicationConnector {
  type = 'figma' as const;

  constructor(private accessToken?: string) {}

  async execute(operation: string, config: Record<string, any>, input?: any): Promise<any> {
    console.log(`[Figma] Exécution de l'opération: ${operation}`, { config, input });

    switch (operation) {
      case 'get_file':
        return this.getFile(config.fileKey);
      
      case 'get_frames':
        return this.getFrames(config.fileKey, config.nodeIds);
      
      case 'export_frames':
        return this.exportFrames(config.fileKey, config.nodeIds, config.format, config.scale);
      
      case 'get_comments':
        return this.getComments(config.fileKey);
      
      case 'post_comment':
        return this.postComment(config.fileKey, config.message, config.position, input);
      
      case 'get_components':
        return this.getComponents(config.fileKey);
      
      case 'get_styles':
        return this.getStyles(config.fileKey);
      
      case 'get_team_projects':
        return this.getTeamProjects(config.teamId);
      
      case 'analyze_design':
        return this.analyzeDesign(input);
      
      case 'extract_assets':
        return this.extractAssets(config.fileKey, config.nodeIds);
      
      default:
        throw new Error(`Opération Figma non supportée: ${operation}`);
    }
  }

  validate(operation: string, config: Record<string, any>): boolean {
    switch (operation) {
      case 'get_file':
      case 'get_frames':
      case 'export_frames':
      case 'get_comments':
      case 'get_components':
      case 'get_styles':
      case 'extract_assets':
        return !!config.fileKey;
      
      case 'post_comment':
        return !!config.fileKey && !!config.message;
      
      case 'get_team_projects':
        return !!config.teamId;
      
      case 'analyze_design':
        return true; // Utilise l'input
      
      default:
        return false;
    }
  }

  getOperations(): string[] {
    return [
      'get_file',
      'get_frames',
      'export_frames',
      'get_comments',
      'post_comment',
      'get_components',
      'get_styles',
      'get_team_projects',
      'analyze_design',
      'extract_assets'
    ];
  }

  private async getFile(fileKey: string): Promise<FigmaFile> {
    if (this.accessToken) {
      try {
        const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
          headers: {
            'X-Figma-Token': this.accessToken
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erreur API Figma: ${response.statusText}`);
        }
        
        const data = await response.json();
        return {
          key: fileKey,
          name: data.name,
          thumbnail_url: data.thumbnail_url,
          last_modified: data.last_modified,
          version: data.version
        };
      } catch (error) {
        console.warn('API Figma non disponible, utilisation de la simulation');
      }
    }

    // Simulation pour la démo
    return {
      key: fileKey,
      name: `Fichier Figma simulé ${fileKey}`,
      thumbnail_url: `https://via.placeholder.com/400x300?text=Figma+${fileKey}`,
      last_modified: new Date().toISOString(),
      version: "1.0"
    };
  }

  private async getFrames(fileKey: string, nodeIds?: string[]): Promise<FigmaFrame[]> {
    if (this.accessToken) {
      try {
        let url = `https://api.figma.com/v1/files/${fileKey}`;
        if (nodeIds && nodeIds.length > 0) {
          url += `?ids=${nodeIds.join(',')}`;
        }
        
        const response = await fetch(url, {
          headers: {
            'X-Figma-Token': this.accessToken
          }
        });
        
        const data = await response.json();
        // Parser les frames depuis la réponse réelle
        return this.extractFramesFromFileData(data);
      } catch (error) {
        console.warn('API Figma non disponible, utilisation de la simulation');
      }
    }

    // Simulation
    const simulatedFrames: FigmaFrame[] = [
      {
        id: 'frame_1',
        name: 'Homepage Design',
        type: 'FRAME',
        width: 1440,
        height: 900,
        export_url: 'https://via.placeholder.com/1440x900?text=Homepage'
      },
      {
        id: 'frame_2',
        name: 'Mobile View',
        type: 'FRAME',
        width: 375,
        height: 812,
        export_url: 'https://via.placeholder.com/375x812?text=Mobile'
      },
      {
        id: 'frame_3',
        name: 'Dashboard',
        type: 'FRAME',
        width: 1200,
        height: 800,
        export_url: 'https://via.placeholder.com/1200x800?text=Dashboard'
      }
    ];

    return nodeIds ? 
      simulatedFrames.filter(frame => nodeIds.includes(frame.id)) : 
      simulatedFrames;
  }

  private async exportFrames(fileKey: string, nodeIds: string[], format: string = 'PNG', scale: number = 1): Promise<FigmaExport[]> {
    if (this.accessToken) {
      try {
        const response = await fetch(
          `https://api.figma.com/v1/images/${fileKey}?ids=${nodeIds.join(',')}&format=${format}&scale=${scale}`,
          {
            headers: {
              'X-Figma-Token': this.accessToken
            }
          }
        );
        
        const data = await response.json();
        return Object.entries(data.images).map(([id, url]) => ({
          id,
          format: format as any,
          url: url as string,
          size: `${scale}x`
        }));
      } catch (error) {
        console.warn('API Figma non disponible, utilisation de la simulation');
      }
    }

    // Simulation
    return nodeIds.map(nodeId => ({
      id: nodeId,
      format: format as any,
      url: `https://via.placeholder.com/800x600?text=Export+${nodeId}`,
      size: `${scale}x`
    }));
  }

  private async getComments(fileKey: string): Promise<any[]> {
    if (this.accessToken) {
      try {
        const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments`, {
          headers: {
            'X-Figma-Token': this.accessToken
          }
        });
        
        const data = await response.json();
        return data.comments;
      } catch (error) {
        console.warn('API Figma non disponible, utilisation de la simulation');
      }
    }

    // Simulation
    return [
      {
        id: 'comment_1',
        message: 'Super design ! J\'aime beaucoup la palette de couleurs.',
        user: { handle: 'designer1', img_url: '' },
        created_at: new Date(Date.now() - 3600000).toISOString(),
        client_meta: { x: 100, y: 200 }
      },
      {
        id: 'comment_2',
        message: 'Peut-on ajuster la taille de la police pour la version mobile ?',
        user: { handle: 'reviewer1', img_url: '' },
        created_at: new Date(Date.now() - 1800000).toISOString(),
        client_meta: { x: 200, y: 300 }
      }
    ];
  }

  private async postComment(fileKey: string, message: string, position?: { x: number, y: number }, input?: any): Promise<any> {
    // Enrichir le message avec l'input si fourni
    let finalMessage = message;
    if (input && typeof input === 'string') {
      finalMessage = `${message}\n\nContexte: ${input}`;
    }

    if (this.accessToken) {
      try {
        const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/comments`, {
          method: 'POST',
          headers: {
            'X-Figma-Token': this.accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: finalMessage,
            client_meta: position || { x: 0, y: 0 }
          })
        });
        
        return await response.json();
      } catch (error) {
        console.warn('API Figma non disponible, utilisation de la simulation');
      }
    }

    // Simulation
    return {
      id: `comment_${Date.now()}`,
      message: finalMessage,
      user: { handle: 'current_user', img_url: '' },
      created_at: new Date().toISOString(),
      client_meta: position || { x: 0, y: 0 }
    };
  }

  private async getComponents(fileKey: string): Promise<FigmaComponent[]> {
    if (this.accessToken) {
      try {
        const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/components`, {
          headers: {
            'X-Figma-Token': this.accessToken
          }
        });
        
        const data = await response.json();
        return Object.values(data.meta.components).map((comp: any) => ({
          id: comp.node_id,
          name: comp.name,
          description: comp.description,
          created_at: comp.created_at,
          updated_at: comp.updated_at
        }));
      } catch (error) {
        console.warn('API Figma non disponible, utilisation de la simulation');
      }
    }

    // Simulation
    return [
      {
        id: 'comp_1',
        name: 'Button Primary',
        description: 'Bouton principal du design system',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'comp_2',
        name: 'Card Component',
        description: 'Composant de carte réutilisable',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  private async getStyles(fileKey: string): Promise<any> {
    if (this.accessToken) {
      try {
        const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/styles`, {
          headers: {
            'X-Figma-Token': this.accessToken
          }
        });
        
        return await response.json();
      } catch (error) {
        console.warn('API Figma non disponible, utilisation de la simulation');
      }
    }

    // Simulation
    return {
      meta: {
        styles: {
          'style_1': {
            name: 'Primary Color',
            type: 'FILL',
            description: 'Couleur principale du design'
          },
          'style_2': {
            name: 'Heading Font',
            type: 'TEXT',
            description: 'Police pour les titres'
          }
        }
      }
    };
  }

  private async getTeamProjects(teamId: string): Promise<any[]> {
    if (this.accessToken) {
      try {
        const response = await fetch(`https://api.figma.com/v1/teams/${teamId}/projects`, {
          headers: {
            'X-Figma-Token': this.accessToken
          }
        });
        
        const data = await response.json();
        return data.projects;
      } catch (error) {
        console.warn('API Figma non disponible, utilisation de la simulation');
      }
    }

    // Simulation
    return [
      {
        id: 'project_1',
        name: 'Design System',
        created_at: new Date(Date.now() - 604800000).toISOString()
      },
      {
        id: 'project_2',
        name: 'Mobile App Redesign',
        created_at: new Date(Date.now() - 259200000).toISOString()
      }
    ];
  }

  private async analyzeDesign(input: any): Promise<any> {
    // Simulation d'analyse de design basée sur l'input
    const analysis = {
      colorPalette: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
      typography: ['Inter', 'Roboto', 'SF Pro Display'],
      layout: {
        gridSystem: '12-column',
        spacing: '8px base unit',
        breakpoints: ['mobile: 375px', 'tablet: 768px', 'desktop: 1440px']
      },
      accessibility: {
        contrastRatio: '4.5:1',
        fontSize: 'Minimum 16px',
        touchTargets: 'Minimum 44px'
      },
      designPrinciples: [
        'Cohérence visuelle maintenue',
        'Hiérarchie claire des informations',
        'Espacement harmonieux'
      ],
      improvements: [
        'Considérer l\'ajout d\'un mode sombre',
        'Standardiser les rayons de bordure',
        'Optimiser pour les écrans haute résolution'
      ]
    };

    // Si on a un input spécifique, l'analyser
    if (input && typeof input === 'object' && input.frames) {
      analysis['frameAnalysis'] = input.frames.map((frame: any) => ({
        id: frame.id,
        name: frame.name,
        dimensions: `${frame.width}x${frame.height}`,
        aspectRatio: (frame.width / frame.height).toFixed(2)
      }));
    }

    return analysis;
  }

  private async extractAssets(fileKey: string, nodeIds: string[]): Promise<any[]> {
    // Combiner l'export et l'analyse des assets
    const exports = await this.exportFrames(fileKey, nodeIds, 'PNG', 2);
    
    return exports.map(exp => ({
      ...exp,
      type: 'image',
      name: `Asset ${exp.id}`,
      dimensions: '800x600', // Simulation
      fileSize: '245KB' // Simulation
    }));
  }

  private extractFramesFromFileData(fileData: any): FigmaFrame[] {
    // Fonction utilitaire pour extraire les frames de la réponse API réelle
    const frames: FigmaFrame[] = [];
    
    const traverse = (node: any) => {
      if (node.type === 'FRAME') {
        frames.push({
          id: node.id,
          name: node.name,
          type: node.type,
          width: node.absoluteBoundingBox?.width || 0,
          height: node.absoluteBoundingBox?.height || 0
        });
      }
      
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    if (fileData.document) {
      traverse(fileData.document);
    }
    
    return frames;
  }
}