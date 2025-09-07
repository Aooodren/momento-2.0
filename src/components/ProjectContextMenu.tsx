import { ReactNode, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Copy, Trash2, ImageIcon, Upload } from "lucide-react";
import { useThumbnails } from "../hooks/useThumbnails";

interface ProjectDetails {
  id: number;
  title: string;
  type: string;
  from: 'myproject' | 'liked';
}

interface ProjectContextMenuProps {
  children: ReactNode;
  project: ProjectDetails;
  onDuplicate?: (project: ProjectDetails) => void;
  onDelete?: (project: ProjectDetails) => void;
  onThumbnailImported?: (projectId: number, thumbnailUrl: string) => void;
}

export default function ProjectContextMenu({ 
  children, 
  project, 
  onDuplicate, 
  onDelete,
  onThumbnailImported 
}: ProjectContextMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showThumbnailDialog, setShowThumbnailDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { saveThumbnail, removeThumbnail } = useThumbnails();

  const handleDuplicate = () => {
    // Créer une copie du projet avec un nouvel ID
    const duplicatedProject: ProjectDetails = {
      ...project,
      id: Date.now(), // Générer un nouvel ID basé sur le timestamp
      title: `${project.title} (Copie)`
    };
    
    // Dupliquer aussi les données canvas si elles existent
    const originalCanvasData = localStorage.getItem(`canvas_project_${project.id}`);
    if (originalCanvasData) {
      localStorage.setItem(`canvas_project_${duplicatedProject.id}`, originalCanvasData);
    }
    
    // Dupliquer aussi la miniature si elle existe (en utilisant le hook approprié)
    try {
      const originalThumbnailKey = `project_thumbnail_${project.id}`;
      const originalThumbnail = localStorage.getItem(originalThumbnailKey);
      if (originalThumbnail) {
        // Vérifier si c'est déjà au bon format JSON
        let thumbnailUrl: string;
        try {
          const parsed = JSON.parse(originalThumbnail);
          thumbnailUrl = parsed.thumbnailUrl || parsed; // Support des deux formats
        } catch {
          // Si ce n'est pas du JSON, c'est probablement une URL directe
          thumbnailUrl = originalThumbnail;
        }
        
        // Sauvegarder avec le hook approprié
        saveThumbnail(duplicatedProject.id, thumbnailUrl, 'custom-upload');
      }
    } catch (error) {
      console.warn('Erreur lors de la duplication de la miniature:', error);
    }
    
    onDuplicate?.(duplicatedProject);
    console.log('Projet dupliqué:', duplicatedProject);
  };

  const handleDelete = () => {
    // Supprimer les données associées au projet
    localStorage.removeItem(`canvas_project_${project.id}`);
    removeThumbnail(project.id); // Utiliser le hook approprié
    
    onDelete?.(project);
    setShowDeleteDialog(false);
    console.log('Projet supprimé:', project);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    }
  };

  const handleThumbnailImport = () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Sauvegarder la miniature en utilisant le hook approprié
        const success = saveThumbnail(project.id, result, 'custom-upload');
        if (success) {
          onThumbnailImported?.(project.id, result);
          console.log('Miniature importée pour le projet:', project.id);
        } else {
          console.error('Erreur lors de la sauvegarde de la miniature');
        }
      }
    };
    reader.readAsDataURL(selectedFile);
    
    setShowThumbnailDialog(false);
    setSelectedFile(null);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem onClick={handleDuplicate} className="gap-2">
            <Copy className="w-4 h-4" />
            Dupliquer le projet
          </ContextMenuItem>
          
          <ContextMenuItem onClick={() => setShowThumbnailDialog(true)} className="gap-2">
            <ImageIcon className="w-4 h-4" />
            Importer une miniature
          </ContextMenuItem>
          
          <ContextMenuSeparator />
          
          <ContextMenuItem 
            onClick={() => setShowDeleteDialog(true)} 
            className="gap-2 text-destructive focus:text-destructive-foreground focus:bg-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer le projet
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le projet</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le projet "{project.title}" ? 
              Cette action est irréversible et supprimera toutes les données associées.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'import de miniature */}
      <Dialog open={showThumbnailDialog} onOpenChange={setShowThumbnailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importer une miniature</DialogTitle>
            <DialogDescription>
              Sélectionnez une image à utiliser comme miniature pour le projet "{project.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="thumbnail-file">Fichier image</Label>
              <Input
                id="thumbnail-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Formats supportés : JPG, PNG, GIF, WebP
              </p>
            </div>

            {selectedFile && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Taille : {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setShowThumbnailDialog(false);
              setSelectedFile(null);
            }}>
              Annuler
            </Button>
            <Button 
              onClick={handleThumbnailImport} 
              disabled={!selectedFile}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Importer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}