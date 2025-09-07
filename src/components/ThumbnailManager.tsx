import { useState, useRef, useCallback } from "react";
import { Camera, Upload, Image as ImageIcon, X, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface ProjectDetails {
  id: number;
  title: string;
  type: string;
  from: 'myproject' | 'liked';
}

interface ThumbnailManagerProps {
  project: ProjectDetails;
  onClose: () => void;
  onThumbnailSet?: (thumbnailUrl: string) => void;
}

interface ProjectThumbnail {
  projectId: number;
  thumbnailUrl: string;
  thumbnailType: 'canvas-capture' | 'custom-upload';
  createdAt: string;
}

export default function ThumbnailManager({ project, onClose, onThumbnailSet }: ThumbnailManagerProps) {
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obtenir la miniature actuelle du projet
  const getCurrentThumbnail = useCallback(() => {
    try {
      const thumbnailKey = `project_thumbnail_${project.id}`;
      const savedThumbnail = localStorage.getItem(thumbnailKey);
      if (savedThumbnail) {
        const thumbnail: ProjectThumbnail = JSON.parse(savedThumbnail);
        return thumbnail.thumbnailUrl;
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la miniature:', error);
    }
    return null;
  }, [project.id]);

  // Sauvegarder la miniature
  const saveThumbnail = useCallback((thumbnailUrl: string, type: 'canvas-capture' | 'custom-upload') => {
    try {
      const thumbnailKey = `project_thumbnail_${project.id}`;
      const thumbnail: ProjectThumbnail = {
        projectId: project.id,
        thumbnailUrl,
        thumbnailType: type,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(thumbnailKey, JSON.stringify(thumbnail));
      console.log('Miniature sauvegardée:', thumbnail);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la miniature:', error);
      return false;
    }
  }, [project.id]);

  // Capturer le canvas comme miniature (méthode native)
  const captureCanvas = useCallback(async () => {
    setIsCapturing(true);
    
    try {
      // Attendre un petit délai pour laisser le temps à l'UI de se mettre à jour
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Chercher l'élément ReactFlow viewport
      const reactFlowViewport = document.querySelector('.react-flow__viewport');
      const reactFlowElement = document.querySelector('.react-flow');
      
      if (!reactFlowViewport && !reactFlowElement) {
        throw new Error('Canvas ReactFlow non trouvé. Assurez-vous d\'être sur l\'éditeur.');
      }

      // Créer un canvas pour dessiner la capture
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Impossible de créer le contexte canvas');
      }

      // Définir les dimensions (ratio 16:9)
      const width = 800;
      const height = 450;
      canvas.width = width;
      canvas.height = height;

      // Remplir le fond
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(0, 0, width, height);

      // Rechercher les éléments SVG et les nœuds dans le DOM
      const targetElement = reactFlowViewport || reactFlowElement;
      const svgElements = targetElement?.querySelectorAll('svg');
      const nodeElements = targetElement?.querySelectorAll('.react-flow__node');

      // Si on a des éléments, essayer de les dessiner
      if (nodeElements && nodeElements.length > 0) {
        // Créer une représentation simplifiée
        ctx.fillStyle = '#3b82f6';
        ctx.font = '14px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Canvas - ${nodeElements.length} éléments`, width / 2, height / 2 - 20);
        
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.fillText(project.title, width / 2, height / 2 + 10);
        
        // Dessiner des rectangles représentant les nœuds
        const nodeCount = Math.min(nodeElements.length, 6);
        const nodeWidth = 80;
        const nodeHeight = 50;
        const spacing = 120;
        const startX = (width - (nodeCount * spacing - spacing)) / 2;
        const nodeY = height / 2 + 40;
        
        ctx.fillStyle = '#dbeafe';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < nodeCount; i++) {
          const x = startX + i * spacing;
          ctx.fillRect(x, nodeY, nodeWidth, nodeHeight);
          ctx.strokeRect(x, nodeY, nodeWidth, nodeHeight);
        }
      } else {
        // Affichage par défaut si pas de nœuds trouvés
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Canvas Innovation', width / 2, height / 2 - 10);
        ctx.fillText(project.title, width / 2, height / 2 + 20);
      }

      // Convertir en data URL
      const thumbnailUrl = canvas.toDataURL('image/png', 0.8);
      setSelectedThumbnail(thumbnailUrl);
      
    } catch (error) {
      console.error('Erreur lors de la capture:', error);
      
      // Fallback : créer une miniature générique
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = 800;
        canvas.height = 450;
        
        // Gradient de fond
        const gradient = ctx.createLinearGradient(0, 0, 800, 450);
        gradient.addColorStop(0, '#dbeafe');
        gradient.addColorStop(1, '#bfdbfe');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 450);
        
        // Texte
        ctx.fillStyle = '#1e40af';
        ctx.font = 'bold 24px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(project.title, 400, 200);
        
        ctx.fillStyle = '#3b82f6';
        ctx.font = '16px Inter, system-ui, sans-serif';
        ctx.fillText('Innovation Canvas', 400, 240);
        
        const thumbnailUrl = canvas.toDataURL('image/png', 0.8);
        setSelectedThumbnail(thumbnailUrl);
      } else {
        alert('Erreur lors de la génération de la miniature.');
      }
    } finally {
      setIsCapturing(false);
    }
  }, [project.title]);

  // Gérer l'upload de fichier
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image.');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (max 5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      setSelectedThumbnail(result);
    };
    reader.readAsDataURL(file);
  }, []);

  // Confirmer et sauvegarder la miniature
  const confirmThumbnail = useCallback(() => {
    if (!selectedThumbnail) return;

    const type: 'canvas-capture' | 'custom-upload' = uploadedImage ? 'custom-upload' : 'canvas-capture';
    const success = saveThumbnail(selectedThumbnail, type);
    
    if (success) {
      onThumbnailSet?.(selectedThumbnail);
      onClose();
    } else {
      alert('Erreur lors de la sauvegarde de la miniature.');
    }
  }, [selectedThumbnail, uploadedImage, saveThumbnail, onThumbnailSet, onClose]);

  // Supprimer la miniature actuelle
  const removeThumbnail = useCallback(() => {
    try {
      const thumbnailKey = `project_thumbnail_${project.id}`;
      localStorage.removeItem(thumbnailKey);
      onThumbnailSet?.('');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  }, [project.id, onThumbnailSet, onClose]);

  const currentThumbnail = getCurrentThumbnail();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Miniature du projet</DialogTitle>
          <DialogDescription>
            Choisissez ou créez une miniature pour votre projet "{project.title}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Miniature actuelle */}
          {currentThumbnail && (
            <div>
              <h4 className="text-sm font-medium mb-3">Miniature actuelle</h4>
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={currentThumbnail} 
                    alt="Miniature actuelle"
                    className="w-20 h-12 object-cover rounded border"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Miniature définie pour ce projet
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={removeThumbnail}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Options pour créer/choisir une miniature */}
          <div>
            <h4 className="text-sm font-medium mb-3">Créer une nouvelle miniature</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Capture du canvas */}
              <Card className="p-4">
                <div className="text-center">
                  <Camera className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <h5 className="font-medium mb-2">Générer une miniature</h5>
                  <p className="text-sm text-muted-foreground mb-4">
                    Créer une représentation visuelle de votre canvas d'innovation
                  </p>
                  <Button 
                    onClick={captureCanvas}
                    disabled={isCapturing}
                    className="w-full"
                  >
                    {isCapturing ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Générer
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚡ Fonctionne depuis n'importe quelle page
                  </p>
                </div>
              </Card>

              {/* Upload d'image */}
              <Card className="p-4">
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <h5 className="font-medium mb-2">Image personnalisée</h5>
                  <p className="text-sm text-muted-foreground mb-4">
                    Uploader votre propre image (PNG, JPG, max 5MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Choisir un fichier
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Preview de la miniature sélectionnée */}
          {selectedThumbnail && (
            <div>
              <h4 className="text-sm font-medium mb-3">Aperçu de la nouvelle miniature</h4>
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedThumbnail} 
                    alt="Nouvelle miniature"
                    className="w-32 h-20 object-cover rounded border"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">
                        {uploadedImage ? 'Image personnalisée' : 'Miniature générée'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cette image sera utilisée comme miniature dans vos listes de projets
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            {selectedThumbnail && (
              <Button onClick={confirmThumbnail}>
                <Check className="w-4 h-4 mr-2" />
                Définir comme miniature
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}