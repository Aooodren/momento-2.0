import { useState, useCallback } from 'react';

export interface FigmaFile {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
  version: string;
}

export interface FigmaProject {
  id: string;
  name: string;
}

export interface FigmaFrame {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FigmaDesignData {
  frames: FigmaFrame[];
  images: Array<{
    id: string;
    url: string;
    name: string;
  }>;
  metadata: {
    fileName: string;
    fileKey: string;
    lastModified: string;
    version: string;
  };
}

export function useFigmaAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(() => {
    const token = localStorage.getItem('figma_personal_token') || 
                  localStorage.getItem('figma_access_token');
    if (!token) {
      throw new Error('Token Figma non configuré');
    }
    return token;
  }, []);

  const callFigmaAPI = useCallback(async (endpoint: string, options?: RequestInit) => {
    const token = getToken();
    
    const response = await fetch(`https://api.figma.com/v1${endpoint}`, {
      ...options,
      headers: {
        'X-Figma-Token': token,
        ...options?.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur API Figma: ${response.status}`);
    }

    return response.json();
  }, [getToken]);

  // Récupérer les projets de l'utilisateur
  const getUserProjects = useCallback(async (): Promise<FigmaProject[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Récupérer les équipes de l'utilisateur
      const teamsResponse = await callFigmaAPI('/me');
      const teams = teamsResponse.teams || [];

      const allProjects: FigmaProject[] = [];

      // Pour chaque équipe, récupérer les projets
      for (const team of teams) {
        try {
          const projectsResponse = await callFigmaAPI(`/teams/${team.id}/projects`);
          if (projectsResponse.projects) {
            allProjects.push(...projectsResponse.projects);
          }
        } catch (err) {
          console.warn(`Erreur lors de la récupération des projets pour l'équipe ${team.id}:`, err);
        }
      }

      return allProjects;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la récupération des projets';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [callFigmaAPI]);

  // Récupérer les fichiers d'un projet
  const getProjectFiles = useCallback(async (projectId: string): Promise<FigmaFile[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await callFigmaAPI(`/projects/${projectId}/files`);
      return response.files || [];
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la récupération des fichiers';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [callFigmaAPI]);

  // Récupérer les détails d'un fichier
  const getFileDetails = useCallback(async (fileKey: string): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await callFigmaAPI(`/files/${fileKey}`);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la récupération du fichier';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [callFigmaAPI]);

  // Extraire les frames d'un fichier Figma
  const extractFrames = useCallback((fileData: any): FigmaFrame[] => {
    const frames: FigmaFrame[] = [];

    const traverseNode = (node: any) => {
      if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
        frames.push({
          id: node.id,
          name: node.name,
          type: node.type,
          absoluteBoundingBox: node.absoluteBoundingBox
        });
      }

      if (node.children) {
        node.children.forEach(traverseNode);
      }
    };

    if (fileData.document?.children) {
      fileData.document.children.forEach(traverseNode);
    }

    return frames;
  }, []);

  // Récupérer les images des frames
  const getFrameImages = useCallback(async (
    fileKey: string, 
    nodeIds: string[]
  ): Promise<Array<{ id: string; url: string; name: string }>> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await callFigmaAPI(
        `/images/${fileKey}?ids=${nodeIds.join(',')}&format=png&scale=2`
      );

      const images = [];
      for (const [nodeId, imageUrl] of Object.entries(response.images || {})) {
        if (imageUrl) {
          images.push({
            id: nodeId,
            url: imageUrl as string,
            name: `Frame ${nodeId}`
          });
        }
      }

      return images;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la récupération des images';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [callFigmaAPI]);

  // Importer un design complet (frames + images)
  const importDesign = useCallback(async (fileKey: string): Promise<FigmaDesignData> => {
    setIsLoading(true);
    setError(null);

    try {
      // Récupérer les détails du fichier
      const fileData = await getFileDetails(fileKey);
      
      // Extraire les frames
      const frames = extractFrames(fileData);
      
      // Récupérer les images des frames principales (limiter à 10 pour éviter les quotas)
      const mainFrames = frames.slice(0, 10);
      const nodeIds = mainFrames.map(frame => frame.id);
      
      let images: Array<{ id: string; url: string; name: string }> = [];
      
      if (nodeIds.length > 0) {
        try {
          images = await getFrameImages(fileKey, nodeIds);
          
          // Associer les noms des frames aux images
          images = images.map(image => {
            const frame = frames.find(f => f.id === image.id);
            return {
              ...image,
              name: frame?.name || `Frame ${image.id}`
            };
          });
        } catch (imageError) {
          console.warn('Erreur lors de la récupération des images:', imageError);
          // Continuer sans les images si ça échoue
        }
      }

      return {
        frames,
        images,
        metadata: {
          fileName: fileData.name,
          fileKey: fileKey,
          lastModified: fileData.lastModified,
          version: fileData.version
        }
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'import du design';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getFileDetails, extractFrames, getFrameImages]);

  // Récupérer les commentaires sur un fichier
  const getFileComments = useCallback(async (fileKey: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await callFigmaAPI(`/files/${fileKey}/comments`);
      return response.comments || [];
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la récupération des commentaires';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [callFigmaAPI]);

  // Vérifier si Figma est connecté
  const isConnected = useCallback(() => {
    try {
      getToken();
      return true;
    } catch {
      return false;
    }
  }, [getToken]);

  // Tester la connexion
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      await callFigmaAPI('/me');
      return true;
    } catch {
      return false;
    }
  }, [callFigmaAPI]);

  return {
    isLoading,
    error,
    getUserProjects,
    getProjectFiles,
    getFileDetails,
    importDesign,
    getFileComments,
    isConnected,
    testConnection
  };
}