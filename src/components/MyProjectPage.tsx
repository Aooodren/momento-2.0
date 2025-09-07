import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import ProjectThumbnail from "./ProjectThumbnail";
import ProjectContextMenu from "./ProjectContextMenu";
import { useSupabaseProjects } from "../hooks/useSupabaseProjects";
import { Button } from "./ui/button";
import { Plus, Loader2, AlertCircle, RefreshCw, Eye, Edit3, Share2 } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import ShareProjectDialog from "./ShareProjectDialog";

interface ProjectDetails {
  id: string; // Changed to string
  title: string;
  type: string;
  from: 'myproject' | 'liked';
}

interface MyProjectPageProps {
  onProjectSelect: (project: ProjectDetails) => void;
}

export default function MyProjectPage({ onProjectSelect }: MyProjectPageProps) {
  const { 
    projects: supabaseProjects, 
    loading, 
    error, 
    loadProjects, 
    createProject, 
    deleteProject,
    initDemoData 
  } = useSupabaseProjects();
  
  const [thumbnailVersion, setThumbnailVersion] = useState(0);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [projectToShare, setProjectToShare] = useState<any>(null);

  const handleCardClick = (project: any) => {
    onProjectSelect({
      id: project.id,
      title: project.title,
      type: project.type,
      from: 'myproject'
    });
  };

  const handleCreateProject = async () => {
    setIsCreatingProject(true);
    try {
      await createProject({
        title: "untitled1",
        description: "Un nouveau projet créé avec Supabase",
        type: "canvas"
      });
    } catch (err) {
      console.error('Erreur lors de la création du projet:', err);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleInitDemo = async () => {
    try {
      await initDemoData();
    } catch (err) {
      console.error('Erreur lors de l\'initialisation des données de démo:', err);
    }
  };

  const handleDuplicate = (duplicatedProject: ProjectDetails) => {
    // Cette fonction sera mise à jour plus tard pour utiliser Supabase
    console.log('Duplication à implémenter avec Supabase:', duplicatedProject);
  };

  const handleDelete = async (projectToDelete: ProjectDetails) => {
    try {
      // Supprimer le projet avec Supabase
      await deleteProject(projectToDelete.id);
      console.log('Projet supprimé avec succès:', projectToDelete);
    } catch (error) {
      console.error('Erreur lors de la suppression du projet:', error);
    }
  };

  const handleThumbnailImported = (projectId: string, thumbnailUrl: string) => {
    // Forcer le re-render des miniatures
    setThumbnailVersion(prev => prev + 1);
  };

  const handleShareProject = (project: any) => {
    setProjectToShare(project);
    setShareDialogOpen(true);
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête moderne */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Mes Projets</h1>
              <p className="text-muted-foreground">
                Gérez et visualisez tous vos projets créatifs • {supabaseProjects.length} projet{supabaseProjects.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={async () => await loadProjects()}
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
              <Button 
                onClick={handleCreateProject}
                disabled={isCreatingProject}
                className="gap-2"
              >
                {isCreatingProject ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Nouveau projet
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </div>
            <h3 className="font-medium mb-2">Chargement de vos projets</h3>
            <p className="text-sm text-muted-foreground">Veuillez patienter...</p>
          </div>
        ) : supabaseProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">Aucun projet trouvé</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Créez votre premier projet pour commencer à organiser vos idées et collaborer avec votre équipe.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleInitDemo} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Charger les données de démo
              </Button>
              <Button onClick={handleCreateProject} className="gap-2">
                <Plus className="h-4 w-4" />
                Créer un projet
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {supabaseProjects.map((project, index) => (
            <ProjectContextMenu
              key={`${project.id}-${thumbnailVersion}`}
                project={{
                  id: project.id,
                  title: project.title,
                  type: project.type,
                  from: 'myproject'
                }}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onThumbnailImported={handleThumbnailImported}
              >
              <Card 
                className="group relative overflow-hidden bg-card border border-border hover:border-primary/20 transition-colors duration-200 cursor-pointer p-0"
                onClick={() => handleCardClick(project)}
              >

                {/* Miniature avec overlay gradient */}
                <div className="relative overflow-hidden">
                  <ProjectThumbnail
                    projectId={project.id}
                    projectTitle={project.title}
                    projectType={project.type}
                    className="aspect-video"
                    showOverlay={false}
                  />
                </div>
                
                {/* Contenu */}
                <div className="pt-[0px] pr-[17px] pb-[17px] pl-[17px]">
                  {/* En-tête avec titre et type */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground mb-1 line-clamp-1">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs py-0.5 px-2">
                          {project.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 m-[0px] min-h-[2.5rem]">
                    {project.description || "Aucune description disponible pour ce projet."}
                  </p>

                  {/* Métadonnées du footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span>Mis à jour {new Date(project.updated_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    
                    {/* Indicateur d'activité récente */}
                    {new Date(project.updated_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                      <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                        Récent
                      </Badge>
                    )}
                  </div>
                </div>


              </Card>
              </ProjectContextMenu>
            ))}
          </div>
        )}
      </div>

      {/* Dialogue de partage */}
      {projectToShare && (
        <ShareProjectDialog
          isOpen={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false);
            setProjectToShare(null);
          }}
          projectTitle={projectToShare.title}
        />
      )}
    </div>
  );
}