// Connecteur Figma ultra-sécurisé utilisant le backend unifié
import { ApplicationConnector } from '../hooks/useWorkflowEngine';
import { secureIntegrationsService } from '../services/secureIntegrationsService';

export class SecureFigmaConnector implements ApplicationConnector {
  type = 'figma' as const;

  async execute(operation: string, config: Record<string, any>, input?: any): Promise<any> {
    console.log(`[SecureFigma] Exécution sécurisée: ${operation}`, { config, input });

    // Vérifier la connexion avant toute opération
    const isConnected = await secureIntegrationsService.isIntegrationConnected('figma');
    if (!isConnected) {
      throw new Error('Non connecté à Figma. Veuillez vous connecter d\'abord.');
    }

    switch (operation) {
      case 'get_file':
        return this.getFile(config.fileKey);
      
      case 'get_frames':
        return this.getFrames(config.fileKey);
      
      case 'export_frames':
        return this.exportFrames(config.fileKey, config.nodeIds, config.format, config.scale);
      
      case 'get_comments':
        return this.getComments(config.fileKey);
      
      case 'post_comment':
        return this.postComment(config.fileKey, config.message, config.position, input);
      
      case 'analyze_design':
        return this.analyzeDesign(config.fileKey, input);
      
      case 'extract_assets':
        return this.extractAssets(config.fileKey, config.nodeIds);
      
      default:
        throw new Error(`Opération Figma sécurisée non supportée: ${operation}`);
    }
  }

  validate(operation: string, config: Record<string, any>): boolean {
    switch (operation) {
      case 'get_file':
      case 'get_frames':
      case 'get_comments':
        return !!config.fileKey;
      
      case 'export_frames':
      case 'extract_assets':
        return !!config.fileKey && !!config.nodeIds;
      
      case 'post_comment':
        return !!config.fileKey && !!config.message;
      
      case 'analyze_design':
        return !!config.fileKey;
      
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
      'analyze_design',
      'extract_assets'
    ];
  }

  // Implémentations sécurisées

  private async getFile(fileKey: string) {
    try {
      const file = await secureIntegrationsService.figma_getFile(fileKey);
      return {
        key: file.key,
        name: file.name,
        version: file.version,
        lastModified: file.lastModified,
        thumbnailUrl: file.thumbnailUrl
      };
    } catch (error: any) {
      throw new Error(`Impossible de récupérer le fichier: ${error.message}`);
    }
  }

  private async getFrames(fileKey: string) {
    try {
      const frames = await secureIntegrationsService.figma_getFrames(fileKey);
      return { frames };
    } catch (error: any) {
      throw new Error(`Impossible de récupérer les frames: ${error.message}`);
    }
  }

  private async exportFrames(fileKey: string, nodeIds: string[], format?: string, scale?: number) {
    try {
      const images = await secureIntegrationsService.figma_exportFrames(
        fileKey, 
        nodeIds, 
        format || 'PNG', 
        scale || 1
      );
      
      return {
        exports: Object.entries(images).map(([id, url]) => ({
          id,
          url,
          format: format || 'PNG',
          scale: scale || 1
        }))
      };
    } catch (error: any) {
      throw new Error(`Impossible d'exporter les frames: ${error.message}`);
    }
  }

  private async getComments(fileKey: string) {
    try {
      const comments = await secureIntegrationsService.figma_getComments(fileKey);
      return { comments };
    } catch (error: any) {
      throw new Error(`Impossible de récupérer les commentaires: ${error.message}`);
    }
  }

  private async postComment(fileKey: string, message: string, position?: { x: number, y: number }, input?: any) {
    try {
      // Enrichir le message avec l'input si fourni
      let finalMessage = message;
      if (input && typeof input === 'string') {
        finalMessage = `${message}\n\nContexte: ${input}`;
      }

      const comment = await secureIntegrationsService.figma_postComment(fileKey, finalMessage, position);
      return comment;
    } catch (error: any) {
      throw new Error(`Impossible d'ajouter le commentaire: ${error.message}`);
    }
  }

  private async analyzeDesign(fileKey: string, input?: any) {
    try {
      // Récupérer les frames du design
      const framesData = await this.getFrames(fileKey);
      
      // Construire le contexte d'analyse
      const analysisContext = {
        fileKey,
        framesCount: framesData.frames.length,
        frames: framesData.frames.slice(0, 5), // Limiter pour l'analyse
        input: input || null
      };

      // Utiliser Claude pour analyser le design
      const analysis = await secureIntegrationsService.claude_analyzeContent(
        `Analysez ce design Figma:\n\nNombre de frames: ${analysisContext.framesCount}\n\nFrames principales: ${JSON.stringify(analysisContext.frames, null, 2)}\n\nContexte supplémentaire: ${input || 'Aucun'}`
      );

      return {
        analysis,
        metadata: {
          fileKey,
          framesAnalyzed: framesData.frames.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      throw new Error(`Impossible d'analyser le design: ${error.message}`);
    }
  }

  private async extractAssets(fileKey: string, nodeIds: string[]) {
    try {
      // Exporter les assets en haute qualité
      const images = await secureIntegrationsService.figma_exportFrames(fileKey, nodeIds, 'PNG', 2);
      
      // Récupérer les détails des frames
      const framesData = await this.getFrames(fileKey);
      
      return {
        assets: Object.entries(images).map(([id, url]) => {
          const frame = framesData.frames.find(f => f.id === id);
          return {
            id,
            url,
            name: frame?.name || `Asset ${id}`,
            type: 'image',
            format: 'PNG',
            scale: '2x',
            dimensions: frame ? `${frame.width}x${frame.height}` : 'Unknown'
          };
        })
      };
    } catch (error: any) {
      throw new Error(`Impossible d'extraire les assets: ${error.message}`);
    }
  }
}

export default SecureFigmaConnector;