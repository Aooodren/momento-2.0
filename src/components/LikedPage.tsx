import { useState } from "react";
import { Card } from "./ui/card";
import ProjectThumbnail from "./ProjectThumbnail";
import ProjectContextMenu from "./ProjectContextMenu";

interface ProjectDetails {
  id: number;
  title: string;
  type: string;
  from: 'myproject' | 'liked';
}

interface LikedPageProps {
  onProjectSelect: (project: ProjectDetails) => void;
}

const initialLikedProjects = [
  { id: 101, title: "Creative Dashboard", type: "Dashboard", description: "Beautiful analytics dashboard with modern UI components and interactive charts." },
  { id: 102, title: "Social App Design", type: "Mobile App", description: "Social networking application with focus on community building and user engagement." },
  { id: 103, title: "Landing Page Pro", type: "Landing Page", description: "Professional landing page template with conversion-optimized design elements." }
];

export default function LikedPage({ onProjectSelect }: LikedPageProps) {
  const [likedProjects, setLikedProjects] = useState(initialLikedProjects);
  const [thumbnailVersion, setThumbnailVersion] = useState(0); // Pour forcer le re-render des miniatures

  const handleCardClick = (project: typeof likedProjects[0]) => {
    onProjectSelect({
      id: project.id,
      title: project.title,
      type: project.type,
      from: 'liked'
    });
  };

  const handleDuplicate = (duplicatedProject: ProjectDetails) => {
    // Ajouter le projet dupliqué à la liste des projets likés
    const newProject = {
      id: duplicatedProject.id,
      title: duplicatedProject.title,
      type: duplicatedProject.type,
      description: `Copie du projet ${duplicatedProject.title.replace(' (Copie)', '')}`
    };
    
    setLikedProjects(prevProjects => [...prevProjects, newProject]);
  };

  const handleDelete = (projectToDelete: ProjectDetails) => {
    // Retirer le projet de la liste des projets likés
    setLikedProjects(prevProjects => 
      prevProjects.filter(project => project.id !== projectToDelete.id)
    );
  };

  const handleThumbnailImported = (projectId: number, thumbnailUrl: string) => {
    // Forcer le re-render des miniatures
    setThumbnailVersion(prev => prev + 1);
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="mb-2">Liked Projects</h1>
          <p className="text-muted-foreground">Projects you've liked and saved for inspiration</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {likedProjects.map((project) => (
            <ProjectContextMenu
              key={`${project.id}-${thumbnailVersion}`}
              project={{
                id: project.id,
                title: project.title,
                type: project.type,
                from: 'liked'
              }}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onThumbnailImported={handleThumbnailImported}
            >
              <Card 
                className="hover:shadow-md transition-shadow overflow-hidden cursor-pointer group"
                onClick={() => handleCardClick(project)}
              >
                {/* Miniature avec gestion personnalisée pour les projets likés */}
                <ProjectThumbnail
                  projectId={project.id}
                  projectTitle={project.title}
                  projectType={project.type}
                  className="aspect-video transition-transform group-hover:scale-105"
                  showOverlay={false}
                  isLikedProject={true}
                />
                
                {/* Contenu avec padding réduit en haut */}
                <div className="px-4 pb-4 pt-3">
                  <h3 className="mb-1">{project.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{project.type}</span>
                    <span>Liked project</span>
                  </div>
                </div>
              </Card>
            </ProjectContextMenu>
          ))}
        </div>
      </div>
    </div>
  );
}