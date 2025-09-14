import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import ProjectThumbnail from "./ProjectThumbnail";
import ProjectContextMenu from "./ProjectContextMenu";
import { useSupabaseProjects } from "../hooks/useSupabaseProjects";
import { Button } from "./ui/button";
import { Plus, Loader2, AlertCircle, RefreshCw, Eye, Edit3, Share2 } from "lucide-react";
import { ProjectGridSkeleton } from "./ui/skeletons";
import { NoProjectsEmptyState } from "./ui/empty-states";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import ShareProjectDialog from "./ShareProjectDialog";
import ProjectCreateDialog from "./ProjectCreateDialog";
import { FadeIn, StaggeredList, HoverCard, PressableButton } from "./ui/animations";
import { CTAButton } from "./ui/premium-button";

interface ProjectDetails {
  id: string; // Changed to string
  title: string;
  type: string;
  from: 'myproject' | 'liked';
  description?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
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

  const handleCreateProject = async (projectData: {
    title: string;
    description: string;
    type: string;
    startDate?: Date;
    endDate?: Date;
    tags: string[];
  }) => {
    setIsCreatingProject(true);
    try {
      await createProject({
        title: projectData.title,
        description: projectData.description,
        type: projectData.type
      });
      // TODO: Sauvegarder les dates et tags dans une table séparée ou étendre le modèle
      console.log('Project metadata to save separately:', {
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        tags: projectData.tags
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
    <div className="flex-1 p-8">
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
              <ProjectCreateDialog 
                onProjectCreate={handleCreateProject}
                trigger={
                  <CTAButton 
                    disabled={isCreatingProject}
                    data-testid="create-project-button"
                    className="gap-2"
                  >
                    {isCreatingProject ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Nouveau projet
                  </CTAButton>
                }
              />
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
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Chargement de vos projets...</span>
            </div>
            <ProjectGridSkeleton count={6} />
          </div>
        ) : supabaseProjects.length === 0 ? (
          <FadeIn>
            <NoProjectsEmptyState 
              onCreateProject={handleCreateProject}
              onInitDemo={handleInitDemo}
            />
          </FadeIn>
        ) : (
          <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
              <HoverCard 
                className="group relative overflow-hidden bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 cursor-pointer p-0 rounded-xl"
                onClick={() => handleCardClick(project)}
              >

                {/* Miniature avec overlay gradient */}
                <div className="relative overflow-hidden rounded-t-xl">
                  <ProjectThumbnail
                    projectId={project.id}
                    projectTitle={project.title}
                    projectType={project.type}
                    className="aspect-video w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    showOverlay={false}
                  />
                  {/* Overlay subtil au survol */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                </div>
                
                {/* Contenu */}
                <div className="p-6">
                  {/* En-tête avec titre et type */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-base line-clamp-1 group-hover:text-gray-800 transition-colors">
                        {project.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs py-1 px-2.5 bg-gray-100 text-gray-700 border-0 rounded-full font-medium">
                        {project.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Créé le {new Date(project.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                      {project.description || "Aucune description disponible pour ce projet."}
                    </p>
                  </div>

                  {/* Footer moderne */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-xs text-gray-500">
                        Mis à jour {new Date(project.updated_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    {/* Indicateur d'activité récente avec design moderne */}
                    {new Date(project.updated_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-green-600 font-medium">Récent</span>
                      </div>
                    )}
                  </div>
                </div>


              </HoverCard>
              </ProjectContextMenu>
            ))}
          </StaggeredList>
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