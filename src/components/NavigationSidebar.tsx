import React, { useState, useEffect, useMemo } from "react";
import { 
  X, 
  Edit3, 
  MoreHorizontal, 
  Copy, 
  Eye, 
  ArrowLeft, 
  LogOut, 
  Search,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Settings,
  Plus,
  FileText,
  Star,
  Link2
} from "lucide-react";
import Vector from "../imports/Vector";
import { useAuthContext } from "../hooks/useAuth";
import { useSupabaseProjects } from "../hooks/useSupabaseProjects";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import ProjectContextMenu from "./ProjectContextMenu";

interface ProjectDetails {
  id: string;
  title: string;
  type: string;
  from: 'myproject';
}

interface EditorTab {
  id: string;
  project: ProjectDetails;
  isActive: boolean;
  hasUnsavedChanges?: boolean;
  lastModified?: number;
}

interface NavigationSidebarProps {
  currentPage: string;
  onPageChange: (page: 'myproject' | 'integrations') => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedProject?: ProjectDetails | null;
  onProjectSelect?: (project: ProjectDetails) => void;
  onSettingsClick?: () => void;
  onProjectTabClose?: () => void;
  isOnProjectPage?: boolean;
  previousPage?: 'myproject';
}

export default function NavigationSidebar({ 
  currentPage, 
  onPageChange, 
  collapsed, 
  onToggleCollapse,
  selectedProject,
  onProjectSelect,
  onSettingsClick,
  onProjectTabClose,
  isOnProjectPage = false,
  previousPage = 'myproject'
}: NavigationSidebarProps) {
  const [editorTabs, setEditorTabs] = useState<EditorTab[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [thumbnailVersion, setThumbnailVersion] = useState(0);
  
  // Hook pour récupérer les projets depuis Supabase
  const { projects, loading: projectsLoading, createProject, deleteProject } = useSupabaseProjects();

  // Filtrer les projets selon la recherche
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    return projects.filter(project => 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  // Ajouter un onglet quand un projet est sélectionné
  const addEditorTab = (project: ProjectDetails) => {
    const existingTab = editorTabs.find(tab => tab.project.id === project.id);
    if (!existingTab) {
      const newTab: EditorTab = {
        id: `tab_${project.id}_${Date.now()}`,
        project,
        isActive: true,
        hasUnsavedChanges: false,
        lastModified: Date.now()
      };
      setEditorTabs(prev => [
        ...prev.map(tab => ({ ...tab, isActive: false })),
        newTab
      ]);
    } else {
      setEditorTabs(prev => prev.map(tab => ({
        ...tab,
        isActive: tab.id === existingTab.id
      })));
    }
  };

  // Fermer un onglet
  const closeEditorTab = (tabId: string) => {
    const tabToClose = editorTabs.find(tab => tab.id === tabId);
    
    setEditorTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId);
      if (filtered.length > 0 && prev.find(tab => tab.id === tabId)?.isActive) {
        filtered[filtered.length - 1].isActive = true;
        // Naviguer vers le dernier onglet actif
        if (onProjectSelect) {
          onProjectSelect(filtered[filtered.length - 1].project);
        }
      } else if (tabToClose?.isActive && onProjectTabClose) {
        // Si on ferme l'onglet actif et qu'il n'y en a plus, revenir à la page précédente
        onProjectTabClose();
      }
      return filtered;
    });
  };

  // Changer d'onglet actif
  const switchEditorTab = (tabId: string) => {
    setEditorTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })));
    
    const tab = editorTabs.find(t => t.id === tabId);
    if (tab && onProjectSelect) {
      onProjectSelect(tab.project);
    }
  };

  // Fermer tous les onglets
  const closeAllEditorTabs = () => {
    setEditorTabs([]);
    if (isOnProjectPage && onProjectTabClose) {
      onProjectTabClose();
    }
  };

  // Navigation vers les pages principales sans fermer les onglets
  const handleMainPageNavigation = (page: 'myproject' | 'integrations') => {
    // Ne plus fermer automatiquement les onglets - les garder persistants
    onPageChange(page);
  };

  // Gestion des autres fonctions...
  const handleProjectDuplicate = (duplicatedProject: ProjectDetails) => {
    const newTab: EditorTab = {
      id: `tab_${duplicatedProject.id}_${Date.now()}`,
      project: duplicatedProject,
      isActive: true,
      hasUnsavedChanges: false,
      lastModified: Date.now()
    };
    setEditorTabs(prev => [
      ...prev.map(t => ({ ...t, isActive: false })),
      newTab
    ]);
    
    if (onProjectSelect) {
      onProjectSelect(duplicatedProject);
    }
  };

  const handleProjectDelete = async (projectToDelete: ProjectDetails) => {
    try {
      // Supprimer le projet de Supabase
      await deleteProject(projectToDelete.id);
      
      // Fermer tous les onglets de ce projet
      setEditorTabs(prev => {
        const filtered = prev.filter(tab => tab.project.id !== projectToDelete.id);
        
        // Si l'onglet supprimé était actif et qu'il reste des onglets
        if (filtered.length > 0) {
          const wasActiveTabDeleted = prev.some(tab => 
            tab.project.id === projectToDelete.id && tab.isActive
          );
          
          if (wasActiveTabDeleted) {
            // Activer le dernier onglet restant
            filtered[filtered.length - 1].isActive = true;
            if (onProjectSelect) {
              onProjectSelect(filtered[filtered.length - 1].project);
            }
          }
        } else if (onProjectTabClose) {
          // Plus d'onglets, retourner à la page principale
          onProjectTabClose();
        }
        
        return filtered;
      });
      
      // Si le projet supprimé était le projet actuellement sélectionné
      if (selectedProject && selectedProject.id === projectToDelete.id && onProjectTabClose) {
        onProjectTabClose();
      }
      
    } catch (error) {
      console.error('Erreur lors de la suppression du projet:', error);
    }
  };

  const handleThumbnailImported = (projectId: string, thumbnailUrl: string) => {
    setThumbnailVersion(prev => prev + 1);
  };

  const duplicateEditorTab = (tabId: string) => {
    const tab = editorTabs.find(t => t.id === tabId);
    if (tab) {
      const newTab: EditorTab = {
        id: `tab_${tab.project.id}_${Date.now()}`,
        project: tab.project,
        isActive: true,
        hasUnsavedChanges: false,
        lastModified: Date.now()
      };
      setEditorTabs(prev => [
        ...prev.map(t => ({ ...t, isActive: false })),
        newTab
      ]);
    }
  };

  const closeOtherEditorTabs = (tabId: string) => {
    setEditorTabs(prev => prev.filter(tab => tab.id === tabId).map(tab => ({ ...tab, isActive: true })));
  };

  // Créer un nouveau projet
  const handleCreateProject = async () => {
    try {
      await createProject({
        title: "untitled1",
        description: "Un nouveau projet",
        type: "canvas"
      });
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error);
    }
  };

  // Sélectionner un projet depuis la recherche
  const handleProjectFromSearch = (project: any) => {
    const projectDetails: ProjectDetails = {
      id: project.id,
      title: project.title,
      type: project.type,
      from: 'myproject'
    };
    onProjectSelect?.(projectDetails);
  };

  // Navigation vers le mode vue pour un onglet
  const handleTabViewMode = (tab: EditorTab) => {
    // Activer l'onglet et naviguer vers la vue
    setEditorTabs(prev => prev.map(t => ({
      ...t,
      isActive: t.id === tab.id
    })));
    
    if (onProjectSelect) {
      // Utiliser une fonction de callback spéciale pour forcer le mode vue
      const projectWithViewMode = {
        ...tab.project,
        _forceViewMode: true
      };
      onProjectSelect(projectWithViewMode as ProjectDetails);
    }
  };

  // Navigation vers le mode édition pour un onglet
  const handleTabEditMode = (tab: EditorTab) => {
    // Activer l'onglet et naviguer vers l'édition
    setEditorTabs(prev => prev.map(t => ({
      ...t,
      isActive: t.id === tab.id
    })));
    
    if (onProjectSelect) {
      // Utiliser une fonction de callback spéciale pour forcer le mode édition
      const projectWithEditMode = {
        ...tab.project,
        _forceEditMode: true
      };
      onProjectSelect(projectWithEditMode as ProjectDetails);
    }
  };

  // Ajouter l'onglet quand on est sur une page de projet
  useEffect(() => {
    if ((currentPage === 'editor' || currentPage === 'detail') && selectedProject) {
      addEditorTab(selectedProject);
    }
  }, [currentPage, selectedProject]);

  return (
    <TooltipProvider>
      <div className={`bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-80'
      }`}>
        {/* Header */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4">
                    <Vector />
                  </div>
                </div>
                <div>
                  <h2 className="font-medium text-sidebar-foreground">Momento 2.0</h2>
                  <p className="text-xs text-sidebar-foreground/60">Améliore vos projets.</p>
                </div>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCollapse}
                  className="h-8 w-8 p-0 hover:bg-sidebar-accent"
                >
                  {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {collapsed ? 'Étendre la sidebar' : 'Réduire la sidebar'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Barre de recherche */}
          {!collapsed && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un projet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 bg-sidebar-accent/50 border-sidebar-border"
              />
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 space-y-4">
            {/* Navigation principale */}
            <div className="space-y-2">
              <NavigationItem
                icon={FolderOpen}
                label="My Projects"
                isActive={currentPage === 'myproject'}
                onClick={() => handleMainPageNavigation('myproject')}
                collapsed={collapsed}
                count={projects.length}
              />
              <NavigationItem
                icon={Link2}
                label="Intégrations"
                isActive={currentPage === 'integrations'}
                onClick={() => handleMainPageNavigation('integrations')}
                collapsed={collapsed}
              />
            </div>

            {!collapsed && <Separator className="bg-sidebar-border" />}

            {/* Recherche de projets */}
            {!collapsed && searchQuery && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-sidebar-foreground">
                    Résultats ({filteredProjects.length})
                  </span>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleProjectFromSearch(project)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer group"
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-sidebar-foreground truncate">
                          {project.title}
                        </div>
                        <div className="text-xs text-sidebar-foreground/60 truncate">
                          {project.type} • {new Date(project.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredProjects.length === 0 && (
                    <div className="text-center py-4 text-sm text-sidebar-foreground/60">
                      Aucun projet trouvé
                    </div>
                  )}
                </div>
                <Separator className="bg-sidebar-border" />
              </div>
            )}

            {/* Onglets de projets ouverts */}
            {editorTabs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-muted-foreground" />
                    {!collapsed && (
                      <>
                        <span className="text-sm font-medium text-sidebar-foreground">Projets ouverts</span>
                        <Badge variant="secondary" className="text-xs">
                          {editorTabs.length}
                        </Badge>
                      </>
                    )}
                  </div>
                  {!collapsed && editorTabs.length > 1 && (
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={closeAllEditorTabs}>
                          <X className="w-4 h-4 mr-2" />
                          Fermer tous les onglets
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  )}
                </div>
                
                <div className="space-y-1">
                  {editorTabs.map((tab) => (
                    <EditorTabItem
                      key={tab.id}
                      tab={tab}
                      collapsed={collapsed}
                      isActive={(currentPage === 'editor' || currentPage === 'detail') && tab.isActive}
                      currentPage={currentPage}
                      onSwitch={() => switchEditorTab(tab.id)}
                      onClose={() => closeEditorTab(tab.id)}
                      onDuplicate={() => duplicateEditorTab(tab.id)}
                      onCloseOthers={() => closeOtherEditorTabs(tab.id)}
                      onViewMode={() => handleTabViewMode(tab)}
                      onEditMode={() => handleTabEditMode(tab)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actions rapides */}
            {!collapsed && (
              <>
                <Separator className="bg-sidebar-border" />
                <div className="space-y-2">
                  <span className="text-sm font-medium text-sidebar-foreground px-2">Actions</span>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9"
                    onClick={handleCreateProject}
                  >
                    <Plus className="h-4 w-4" />
                    Nouveau projet
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer avec profil utilisateur */}
        <div className="p-4 pt-2 border-t border-sidebar-border">
          <UserProfile collapsed={collapsed} onSettingsClick={onSettingsClick} />
        </div>
      </div>
    </TooltipProvider>
  );
}

// Helper components

interface NavigationItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
  collapsed: boolean;
  count?: number;
}

function NavigationItem({ icon: Icon, label, isActive, onClick, collapsed, count }: NavigationItemProps) {
  const content = (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={`w-full justify-start gap-3 h-10 ${
        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent'
      } ${collapsed ? 'px-2' : 'px-3'}`}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {count !== undefined && (
            <Badge variant="outline" className="text-xs">
              {count}
            </Badge>
          )}
        </>
      )}
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
          {count !== undefined && <p className="text-xs">({count} projets)</p>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

interface EditorTabItemProps {
  tab: EditorTab;
  collapsed: boolean;
  isActive: boolean;
  currentPage: string;
  onSwitch: () => void;
  onClose: () => void;
  onDuplicate: () => void;
  onCloseOthers: () => void;
  onViewMode: () => void;
  onEditMode: () => void;
}

function EditorTabItem({ 
  tab, 
  collapsed, 
  isActive, 
  currentPage, 
  onSwitch, 
  onClose, 
  onDuplicate, 
  onCloseOthers,
  onViewMode,
  onEditMode
}: EditorTabItemProps) {
  const content = (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 cursor-pointer group ${
            isActive 
              ? 'bg-sidebar-accent border border-sidebar-border' 
              : 'hover:bg-sidebar-accent/50'
          } ${collapsed ? 'justify-center' : ''}`}
          onClick={onSwitch}
        >
          <div className={`flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 ${
            isActive ? 'bg-primary/10' : 'bg-sidebar-accent'
          }`}>
            {currentPage === 'detail' ? (
              <Eye className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-sidebar-foreground/60'}`} />
            ) : (
              <Edit3 className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-sidebar-foreground/60'}`} />
            )}
          </div>
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium truncate ${
                  isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/80'
                }`}>
                  {tab.project.title}
                </span>
                {tab.hasUnsavedChanges && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-sidebar-foreground/60 truncate">
                  {tab.project.type}
                </span>
                <Badge variant="outline" className="text-xs">
                  {currentPage === 'detail' ? 'Vue' : 'Édition'}
                </Badge>
              </div>
            </div>
          )}
          
          {!collapsed && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Bouton Vue */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ${
                      currentPage === 'detail' && isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-sidebar-accent'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewMode();
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mode Vue</p>
                </TooltipContent>
              </Tooltip>

              {/* Bouton Édition */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ${
                      currentPage === 'editor' && isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-sidebar-accent'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditMode();
                    }}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mode Édition</p>
                </TooltipContent>
              </Tooltip>

              {/* Bouton Fermer */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fermer l'onglet</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onViewMode}>
          <Eye className="w-4 h-4 mr-2" />
          Mode Vue
        </ContextMenuItem>
        <ContextMenuItem onClick={onEditMode}>
          <Edit3 className="w-4 h-4 mr-2" />
          Mode Édition
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDuplicate}>
          <Copy className="w-4 h-4 mr-2" />
          Dupliquer l'onglet
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onCloseOthers}>
          Fermer les autres
        </ContextMenuItem>
        <ContextMenuItem onClick={onClose}>
          <X className="w-4 h-4 mr-2" />
          Fermer
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" className="p-3">
          <p className="font-medium">{tab.project.title}</p>
          <p className="text-xs text-muted-foreground mb-2">{tab.project.type}</p>
          <Badge variant="outline" className="text-xs mb-3">
            {currentPage === 'detail' ? 'Vue' : 'Édition'}
          </Badge>
          <div className="flex gap-1 mt-2">
            <Button
              variant="outline"
              size="sm"
              className={`h-7 px-2 text-xs ${
                currentPage === 'detail' && isActive 
                  ? 'bg-primary/10 text-primary' 
                  : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onViewMode();
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              Vue
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`h-7 px-2 text-xs ${
                currentPage === 'editor' && isActive 
                  ? 'bg-primary/10 text-primary' 
                  : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onEditMode();
              }}
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Édition
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function UserProfile({ collapsed, onSettingsClick }: { collapsed: boolean; onSettingsClick?: () => void }) {
  const { user, signOut } = useAuthContext();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const content = (
    <div className="flex items-center gap-3 w-full">
      <Button
        variant="ghost"
        className={`flex items-center gap-3 hover:bg-sidebar-accent h-auto ${
          collapsed ? 'p-2 w-10' : 'p-3 flex-1'
        }`}
        onClick={onSettingsClick}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-primary">
            {getInitials(user?.name)}
          </span>
        </div>
        {!collapsed && (
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || 'Utilisateur'}
            </div>
            <div className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email}
            </div>
          </div>
        )}
      </Button>
      
      {!collapsed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Se déconnecter</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{content}</div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-medium">{user?.name || 'Utilisateur'}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}