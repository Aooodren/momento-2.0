import { useState, useCallback, useEffect } from 'react';

interface ProjectThumbnail {
  projectId: number;
  thumbnailUrl: string;
  thumbnailType: 'canvas-capture' | 'custom-upload';
  createdAt: string;
}

export function useThumbnails() {
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());

  // Charger les miniatures depuis localStorage
  const loadThumbnails = useCallback(() => {
    const thumbnailMap = new Map<number, string>();
    
    // Parcourir toutes les clés du localStorage pour trouver les miniatures
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('project_thumbnail_')) {
        try {
          const projectId = parseInt(key.replace('project_thumbnail_', ''));
          const thumbnailData = localStorage.getItem(key);
          
          if (thumbnailData) {
            let thumbnailUrl: string;
            
            // Essayer de parser comme JSON d'abord (nouveau format)
            try {
              const parsed = JSON.parse(thumbnailData);
              // Si c'est un objet avec la structure complète
              if (parsed.thumbnailUrl && typeof parsed.thumbnailUrl === 'string') {
                thumbnailUrl = parsed.thumbnailUrl;
              }
              // Si c'est juste une chaîne JSON
              else if (typeof parsed === 'string') {
                thumbnailUrl = parsed;
              }
              // Format invalide
              else {
                console.warn(`Format de miniature invalide pour le projet ${projectId}:`, parsed);
                continue;
              }
            } catch {
              // Si le parsing JSON échoue, c'est probablement une URL directe (ancien format)
              if (thumbnailData.startsWith('data:image/') || thumbnailData.startsWith('http')) {
                thumbnailUrl = thumbnailData;
                // Migrer vers le nouveau format
                const thumbnail: ProjectThumbnail = {
                  projectId,
                  thumbnailUrl: thumbnailData,
                  thumbnailType: 'custom-upload',
                  createdAt: new Date().toISOString()
                };
                localStorage.setItem(key, JSON.stringify(thumbnail));
                console.log(`Miniature migrée vers le nouveau format pour le projet ${projectId}`);
              } else {
                console.warn(`Données de miniature invalides pour le projet ${projectId}:`, thumbnailData);
                continue;
              }
            }
            
            thumbnailMap.set(projectId, thumbnailUrl);
          }
        } catch (error) {
          console.error('Erreur lors du chargement de la miniature:', key, error);
          // Nettoyer les données corrompues
          if (key) {
            localStorage.removeItem(key);
            console.log(`Miniature corrompue supprimée: ${key}`);
          }
        }
      }
    }
    
    setThumbnails(thumbnailMap);
    return thumbnailMap;
  }, []);

  // Obtenir la miniature d'un projet spécifique
  const getThumbnail = useCallback((projectId: number): string | null => {
    try {
      const thumbnailKey = `project_thumbnail_${projectId}`;
      const savedThumbnail = localStorage.getItem(thumbnailKey);
      
      if (savedThumbnail) {
        // Essayer de parser comme JSON d'abord
        try {
          const parsed = JSON.parse(savedThumbnail);
          
          // Si c'est un objet avec la structure complète
          if (parsed.thumbnailUrl && typeof parsed.thumbnailUrl === 'string') {
            return parsed.thumbnailUrl;
          }
          // Si c'est juste une chaîne JSON
          else if (typeof parsed === 'string') {
            return parsed;
          }
        } catch {
          // Si le parsing JSON échoue, c'est probablement une URL directe
          if (savedThumbnail.startsWith('data:image/') || savedThumbnail.startsWith('http')) {
            return savedThumbnail;
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la miniature:', projectId, error);
      // En cas d'erreur, nettoyer les données corrompues
      const thumbnailKey = `project_thumbnail_${projectId}`;
      localStorage.removeItem(thumbnailKey);
      console.log(`Miniature corrompue supprimée pour le projet ${projectId}`);
    }
    return null;
  }, []);

  // Sauvegarder une miniature
  const saveThumbnail = useCallback((
    projectId: number, 
    thumbnailUrl: string, 
    type: 'canvas-capture' | 'custom-upload'
  ): boolean => {
    try {
      // Valider l'URL de la miniature
      if (!thumbnailUrl || typeof thumbnailUrl !== 'string') {
        console.error('URL de miniature invalide:', thumbnailUrl);
        return false;
      }

      // Valider que c'est bien une image
      if (!thumbnailUrl.startsWith('data:image/') && !thumbnailUrl.startsWith('http')) {
        console.error('Format d\'URL de miniature non supporté:', thumbnailUrl.substring(0, 50) + '...');
        return false;
      }

      const thumbnailKey = `project_thumbnail_${projectId}`;
      const thumbnail: ProjectThumbnail = {
        projectId,
        thumbnailUrl,
        thumbnailType: type,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(thumbnailKey, JSON.stringify(thumbnail));
      
      // Mettre à jour l'état local
      setThumbnails(prev => new Map(prev).set(projectId, thumbnailUrl));
      
      console.log('Miniature sauvegardée:', { projectId, type, urlLength: thumbnailUrl.length });
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la miniature:', error);
      return false;
    }
  }, []);

  // Supprimer une miniature
  const removeThumbnail = useCallback((projectId: number): boolean => {
    try {
      const thumbnailKey = `project_thumbnail_${projectId}`;
      localStorage.removeItem(thumbnailKey);
      
      // Mettre à jour l'état local
      setThumbnails(prev => {
        const newMap = new Map(prev);
        newMap.delete(projectId);
        return newMap;
      });
      
      console.log('Miniature supprimée pour le projet:', projectId);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la miniature:', error);
      return false;
    }
  }, []);

  // Obtenir toutes les miniatures
  const getAllThumbnails = useCallback((): Map<number, string> => {
    return thumbnails;
  }, [thumbnails]);

  // Vérifier si un projet a une miniature
  const hasThumbnail = useCallback((projectId: number): boolean => {
    return thumbnails.has(projectId);
  }, [thumbnails]);

  // Obtenir les informations complètes d'une miniature
  const getThumbnailInfo = useCallback((projectId: number): ProjectThumbnail | null => {
    try {
      const thumbnailKey = `project_thumbnail_${projectId}`;
      const savedThumbnail = localStorage.getItem(thumbnailKey);
      
      if (savedThumbnail) {
        try {
          const parsed = JSON.parse(savedThumbnail);
          // Vérifier que c'est un objet avec la structure complète
          if (parsed.projectId && parsed.thumbnailUrl && parsed.thumbnailType && parsed.createdAt) {
            return parsed;
          }
        } catch {
          // Format ancien ou invalide
          console.warn(`Format de miniature ancien/invalide pour le projet ${projectId}`);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des infos de miniature:', projectId, error);
    }
    return null;
  }, []);

  // Nettoyer les miniatures orphelines (projets qui n'existent plus)
  const cleanupThumbnails = useCallback((existingProjectIds: number[]) => {
    const existingIds = new Set(existingProjectIds);
    let cleaned = 0;
    
    // Parcourir toutes les miniatures
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('project_thumbnail_')) {
        try {
          const projectId = parseInt(key.replace('project_thumbnail_', ''));
          
          if (!isNaN(projectId) && !existingIds.has(projectId)) {
            localStorage.removeItem(key);
            cleaned++;
          }
        } catch (error) {
          console.error('Erreur lors du nettoyage de la miniature:', key, error);
          // Supprimer les clés corrompues
          if (key) {
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      }
    }
    
    if (cleaned > 0) {
      console.log(`${cleaned} miniature(s) orpheline(s) ou corrompue(s) supprimée(s)`);
      loadThumbnails(); // Recharger après nettoyage
    }
    
    return cleaned;
  }, [loadThumbnails]);

  // Migrer les anciennes miniatures vers le nouveau format
  const migrateThumbnails = useCallback(() => {
    let migrated = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('project_thumbnail_')) {
        try {
          const projectId = parseInt(key.replace('project_thumbnail_', ''));
          const thumbnailData = localStorage.getItem(key);
          
          if (thumbnailData) {
            try {
              // Essayer de parser comme JSON
              JSON.parse(thumbnailData);
              // Si ça marche, c'est déjà au nouveau format
            } catch {
              // Si ça échoue, c'est probablement l'ancien format (URL directe)
              if (thumbnailData.startsWith('data:image/') || thumbnailData.startsWith('http')) {
                const thumbnail: ProjectThumbnail = {
                  projectId,
                  thumbnailUrl: thumbnailData,
                  thumbnailType: 'custom-upload',
                  createdAt: new Date().toISOString()
                };
                localStorage.setItem(key, JSON.stringify(thumbnail));
                migrated++;
              }
            }
          }
        } catch (error) {
          console.error('Erreur lors de la migration de la miniature:', key, error);
        }
      }
    }
    
    if (migrated > 0) {
      console.log(`${migrated} miniature(s) migrée(s) vers le nouveau format`);
      loadThumbnails(); // Recharger après migration
    }
    
    return migrated;
  }, [loadThumbnails]);

  // Charger les miniatures au montage et migrer si nécessaire
  useEffect(() => {
    migrateThumbnails();
    loadThumbnails();
  }, [migrateThumbnails, loadThumbnails]);

  return {
    // État
    thumbnails,
    
    // Actions
    getThumbnail,
    saveThumbnail,
    removeThumbnail,
    loadThumbnails,
    
    // Utilitaires
    getAllThumbnails,
    hasThumbnail,
    getThumbnailInfo,
    cleanupThumbnails,
    migrateThumbnails
  };
}