import React, { useState, useEffect } from "react";
import NavigationSidebar from "./components/NavigationSidebar";
import MyProjectPage from "./components/MyProjectPage";
import LikedPage from "./components/LikedPage";
import ProjectDetailPage from "./components/ProjectDetailPage";
import EditorPage from "./components/EditorPage";
import SettingsPage from "./components/SettingsPage";
import SharePage from "./components/SharePage";
import ProjectEditPage from "./components/ProjectEditPage";
import AuthPage from "./components/AuthPage";
import InvitationPageSupabase from "./components/InvitationPageSupabase";
import TokenInvitationPage from "./components/TokenInvitationPage";
import IntegrationsPage from "./components/IntegrationsPage";
import NotionOAuthCallback from "./components/NotionOAuthCallback";
import { Loader2 } from "lucide-react";
import { useAuth, AuthContext } from "./hooks/useAuth";

type PageType = 'myproject' | 'liked' | 'detail' | 'editor' | 'settings' | 'share' | 'project-edit' | 'invitation' | 'integrations' | 'oauth-callback';

interface ProjectDetails {
  id: string; // Changed to string for consistency with KV store
  title: string;
  type: string;
  from: 'myproject' | 'liked';
}

export default function App() {
  const auth = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>('myproject');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDetails | null>(null);
  const [previousPage, setPreviousPage] = useState<'myproject' | 'liked'>('myproject');
  const [invitationToken, setInvitationToken] = useState<string | null>(null);

  // Check for invitation parameters in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectParam = urlParams.get('project');
    const roleParam = urlParams.get('role');
    const token = urlParams.get('token');
    
    // Check for OAuth callback (Notion, etc.)
    if (window.location.pathname.includes('/integrations/callback/')) {
      setCurrentPage('oauth-callback');
      return;
    }
    
    // Check for token-based invitations (for existing users)
    if (token) {
      setInvitationToken(token);
      setCurrentPage('invitation');
      // Clean URL without reloading the page
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    
    // Check for Supabase invitation flow (for new users)
    if (projectParam && roleParam) {
      setCurrentPage('invitation');
      // Clean URL without reloading the page
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
  }, []);

  // Navigation vers une page principale (sans fermeture des onglets)
  const navigateToPage = (page: PageType) => {
    // Sauvegarder la page précédente si c'est une page principale
    if (page === 'myproject' || page === 'liked') {
      setPreviousPage(page);
    }
    
    setCurrentPage(page);
    
    // Ne plus reset le projet sélectionné - garder les onglets ouverts
    // Seuls les settings reset le projet sélectionné
    if (page === 'settings') {
      setSelectedProject(null);
    }
  };

  // Navigation vers les détails d'un projet (depuis les pages de liste)
  const navigateToProject = (project: ProjectDetails) => {
    // Sauvegarder d'où on vient
    setPreviousPage(project.from);
    setSelectedProject(project);
    setCurrentPage('detail');
  };

  // Navigation vers les détails d'un projet depuis la sidebar
  const navigateToProjectFromSidebar = (project: ProjectDetails) => {
    // Vérifier si on force un mode spécifique
    const projectWithoutModeFlags = {
      id: project.id,
      title: project.title,
      type: project.type,
      from: project.from
    };
    
    setSelectedProject(projectWithoutModeFlags);
    
    // Forcer le mode vue si demandé
    if ((project as any)._forceViewMode) {
      setCurrentPage('detail');
      return;
    }
    
    // Forcer le mode édition si demandé
    if ((project as any)._forceEditMode) {
      setCurrentPage('editor');
      return;
    }
    
    // Comportement par défaut : si on était déjà sur ce projet, rester sur la même page
    // Sinon, aller vers la page de détail
    if (selectedProject?.id !== project.id || currentPage === 'myproject' || currentPage === 'liked') {
      setCurrentPage('detail');
    }
  };

  // Navigation vers l'éditeur (depuis la page de détail)
  const navigateToEditor = (project: ProjectDetails) => {
    setSelectedProject(project);
    setCurrentPage('editor');
  };

  // Navigation vers la page de partage
  const navigateToShare = (project: ProjectDetails) => {
    setSelectedProject(project);
    setCurrentPage('share');
  };

  // Navigation vers la page d'édition des propriétés
  const navigateToProjectEdit = (project: ProjectDetails) => {
    setSelectedProject(project);
    setCurrentPage('project-edit');
  };

  // Mise à jour du projet sélectionné
  const handleProjectUpdate = (updatedProject: ProjectDetails) => {
    setSelectedProject(updatedProject);
  };

  // Navigation vers les réglages
  const navigateToSettings = () => {
    navigateToPage('settings');
  };

  // Navigation de retour depuis l'éditeur
  const handleEditorBack = () => {
    if (selectedProject) {
      // Toujours retourner vers la page de détail du projet
      setCurrentPage('detail');
    }
  };

  // Navigation de retour depuis la page de détail
  const handleDetailBack = () => {
    if (selectedProject) {
      // Retourner vers la page d'origine du projet
      navigateToPage(selectedProject.from);
    } else {
      // Fallback vers la page précédente
      navigateToPage(previousPage);
    }
  };

  // Navigation de retour depuis la page de partage
  const handleShareBack = () => {
    if (selectedProject) {
      // Retourner vers la page de détail du projet
      setCurrentPage('detail');
    } else {
      // Fallback vers la page précédente
      navigateToPage(previousPage);
    }
  };

  // Navigation de retour depuis la page d'édition des propriétés
  const handleProjectEditBack = () => {
    if (selectedProject) {
      // Retourner vers la page de détail du projet
      setCurrentPage('detail');
    } else {
      // Fallback vers la page précédente
      navigateToPage(previousPage);
    }
  };

  // Fermeture d'un onglet projet depuis la sidebar
  const handleProjectTabClose = () => {
    // Si on ferme l'onglet du projet actuellement ouvert, retourner à la page précédente
    if (currentPage === 'detail' || currentPage === 'editor' || currentPage === 'share' || currentPage === 'project-edit') {
      setSelectedProject(null);
      navigateToPage(previousPage);
    }
  };

  // Gérer la suppression du projet actuellement sélectionné
  const handleProjectDeleted = (deletedProjectId: string) => {
    // Si le projet supprimé est celui actuellement sélectionné, réinitialiser
    if (selectedProject && selectedProject.id === deletedProjectId) {
      setSelectedProject(null);
      if (currentPage === 'detail' || currentPage === 'editor' || currentPage === 'share' || currentPage === 'project-edit') {
        navigateToPage(previousPage);
      }
    }
  };

  // Gérer l'acceptation d'une invitation
  const handleInvitationAccepted = (project: any) => {
    // Créer l'objet projet pour la navigation
    const projectDetails: ProjectDetails = {
      id: project.id,
      title: project.title,
      type: project.type,
      from: 'myproject', // Les projets acceptés apparaissent dans "Mes projets"
    };
    
    setSelectedProject(projectDetails);
    setCurrentPage('detail');
    setInvitationToken(null);
  };

  // Gérer l'annulation d'une invitation
  const handleInvitationCancel = () => {
    setInvitationToken(null);
    setCurrentPage('myproject');
  };

  // Détermine si on est sur une page de projet (pour l'état de la sidebar)
  const isOnProjectPage = currentPage === 'detail' || currentPage === 'editor' || currentPage === 'share' || currentPage === 'project-edit';

  // Rendu de la page courante
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'myproject':
        return <MyProjectPage onProjectSelect={navigateToProject} />;
      
      case 'liked':
        return <LikedPage onProjectSelect={navigateToProject} />;
      
      case 'detail':
        if (!selectedProject) return <MyProjectPage onProjectSelect={navigateToProject} />;
        return (
          <ProjectDetailPage 
            project={selectedProject} 
            onEdit={() => navigateToEditor(selectedProject)}
            onEditProperties={() => navigateToProjectEdit(selectedProject)}
            onShare={() => navigateToShare(selectedProject)}
            onBack={handleDetailBack}
          />
        );
      
      case 'editor':
        if (!selectedProject) return <MyProjectPage onProjectSelect={navigateToProject} />;
        return (
          <EditorPage 
            project={selectedProject}
            onBack={handleEditorBack}
            onProjectUpdate={handleProjectUpdate}
          />
        );

      case 'settings':
        return <SettingsPage onBack={() => navigateToPage(previousPage)} />;

      case 'integrations':
        return <IntegrationsPage onBack={() => navigateToPage(previousPage)} />;

      case 'oauth-callback':
        // Déterminer quel service OAuth selon l'URL
        if (window.location.pathname.includes('/notion')) {
          return <NotionOAuthCallback />;
        }
        // Fallback vers la page d'intégrations
        return <IntegrationsPage onBack={() => navigateToPage(previousPage)} />;

      case 'share':
        if (!selectedProject) return <MyProjectPage onProjectSelect={navigateToProject} />;
        return (
          <SharePage 
            project={selectedProject} 
            onBack={handleShareBack}
          />
        );

      case 'project-edit':
        if (!selectedProject) return <MyProjectPage onProjectSelect={navigateToProject} />;
        return (
          <ProjectEditPage 
            project={selectedProject} 
            onBack={handleProjectEditBack}
            onProjectUpdate={handleProjectUpdate}
          />
        );

      case 'invitation':
        // If we have a token, it's a direct invitation for existing users
        if (invitationToken) {
          return (
            <TokenInvitationPage
              token={invitationToken}
              onAccepted={handleInvitationAccepted}
              onCancel={handleInvitationCancel}
            />
          );
        }
        // Otherwise, it's a Supabase Auth invitation for new users
        return (
          <InvitationPageSupabase
            onAccepted={handleInvitationAccepted}
            onCancel={handleInvitationCancel}
          />
        );
      
      default:
        return <MyProjectPage onProjectSelect={navigateToProject} />;
    }
  };

  // Écran de chargement pendant l'initialisation de l'auth
  if (auth.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Afficher la page d'authentification si l'utilisateur n'est pas connecté
  if (!auth.isAuthenticated) {
    return (
      <AuthContext.Provider value={auth}>
        <AuthPage />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      <div className="flex h-screen bg-background">

        {/* Sidebar de navigation */}
        <NavigationSidebar
          currentPage={currentPage}
          onPageChange={navigateToPage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          selectedProject={selectedProject}
          onProjectSelect={navigateToProjectFromSidebar}
          onSettingsClick={navigateToSettings}
          onProjectTabClose={handleProjectTabClose}
          isOnProjectPage={isOnProjectPage}
          previousPage={previousPage}
        />

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Zone de contenu */}
          <div className="flex-1 overflow-auto">
            {renderCurrentPage()}
          </div>
        </div>
      </div>
    </AuthContext.Provider>
  );
}