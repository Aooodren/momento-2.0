import { useState, useEffect } from "react";
import { useThumbnails } from "../hooks/useThumbnails";
import { Heart } from "lucide-react";

interface ProjectThumbnailProps {
  projectId: number;
  projectTitle: string;
  projectType: string;
  className?: string;
  showOverlay?: boolean;
  isLikedProject?: boolean;
}

export default function ProjectThumbnail({ 
  projectId, 
  projectTitle, 
  projectType,
  className = "",
  showOverlay = true,
  isLikedProject = false
}: ProjectThumbnailProps) {
  const { getThumbnail } = useThumbnails();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger la miniature
  useEffect(() => {
    const thumbnail = getThumbnail(projectId);
    setThumbnailUrl(thumbnail);
  }, [projectId, getThumbnail]);

  // Fallback si pas de miniature personnalisée
  if (!thumbnailUrl) {
    // Fallback spécial pour les projets likés
    if (isLikedProject) {
      return (
        <div className={`bg-gradient-to-br from-pink-100 to-red-200 flex items-center justify-center relative ${className}`}>
          {showOverlay && (
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
              <Heart className="w-8 h-8 text-red-400 mb-2" />
            </div>
          )}
          {!showOverlay && (
            <Heart className="w-8 h-8 text-red-400" />
          )}
        </div>
      );
    }
    
    // Fallback standard pour mes projets
    return (
      <div className={`bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center relative ${className}`}>
        {showOverlay && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="text-white font-semibold text-lg text-center px-4 drop-shadow-md">
              {projectTitle}
            </span>
          </div>
        )}
        {!showOverlay && (
          <span className="text-white font-semibold text-lg text-center px-4 drop-shadow-md">
            {projectTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={thumbnailUrl}
        alt={`Miniature de ${projectTitle}`}
        className="w-full h-full object-cover"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          // En cas d'erreur de chargement, supprimer la miniature cassée
          console.warn(`Miniature cassée pour le projet ${projectId}, suppression...`);
          localStorage.removeItem(`project_thumbnail_${projectId}`);
          setThumbnailUrl(null);
        }}
      />
      
      {/* Overlay optionnel */}
      {showOverlay && isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
          <div className="p-3 text-white">
            <div className="text-sm font-medium mb-1">{projectTitle}</div>
            <div className="text-xs opacity-90">{projectType}</div>
          </div>
        </div>
      )}
      
      {/* Badge indiquant une miniature personnalisée */}
      {thumbnailUrl && !showOverlay && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          Personnalisé
        </div>
      )}
    </div>
  );
}