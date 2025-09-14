import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Search, 
  FileText, 
  Folder, 
  Users, 
  Settings, 
  Clock, 
  Hash, 
  ArrowRight,
  Loader2 
} from 'lucide-react';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { FadeIn, StaggeredList } from './ui/animations';

interface SearchResult {
  id: string;
  title: string;
  type: 'project' | 'block' | 'user' | 'setting';
  description?: string;
  category: string;
  metadata?: {
    projectType?: string;
    lastUpdated?: string;
    author?: string;
    tags?: string[];
  };
  action: () => void;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProject?: (project: any) => void;
  onNavigateToPage?: (page: string) => void;
}

const searchCategories = [
  { key: 'all', label: 'Tout', icon: Search },
  { key: 'projects', label: 'Projets', icon: Folder },
  { key: 'blocks', label: 'Blocs', icon: FileText },
  { key: 'settings', label: 'Paramètres', icon: Settings },
];

const resultIcons = {
  project: Folder,
  block: FileText,
  user: Users,
  setting: Settings,
};

export default function GlobalSearch({ 
  isOpen, 
  onClose, 
  onNavigateToProject, 
  onNavigateToPage 
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const { projects, loading: projectsLoading } = useSupabaseProjects();

  // Suggestions par défaut quand il n'y a pas de recherche
  const getDefaultSuggestions = useCallback((): SearchResult[] => {
    const suggestions: SearchResult[] = [];
    
    // Projets récents (3 premiers)
    projects.slice(0, 3).forEach(project => {
      suggestions.push({
        id: `project-${project.id}`,
        title: project.title,
        type: 'project',
        category: 'Projets récents',
        description: project.description || 'Aucune description',
        metadata: {
          projectType: project.type,
          lastUpdated: new Date(project.updated_at).toLocaleDateString('fr-FR'),
        },
        action: () => {
          onNavigateToProject?.(project);
          onClose();
        }
      });
    });

    // Actions rapides
    suggestions.push(
      {
        id: 'new-project',
        title: 'Nouveau projet',
        type: 'setting',
        category: 'Actions rapides',
        description: 'Créer un nouveau projet',
        action: () => {
          // TODO: Trigger new project creation
          onClose();
        }
      },
      {
        id: 'settings',
        title: 'Paramètres',
        type: 'setting',
        category: 'Actions rapides',
        description: 'Accéder aux paramètres',
        action: () => {
          onNavigateToPage?.('settings');
          onClose();
        }
      },
      {
        id: 'integrations',
        title: 'Intégrations',
        type: 'setting',
        category: 'Actions rapides',
        description: 'Gérer les intégrations',
        action: () => {
          onNavigateToPage?.('integrations');
          onClose();
        }
      }
    );

    return suggestions;
  }, [projects, onNavigateToProject, onNavigateToPage, onClose]);

  // Fonction de recherche
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(getDefaultSuggestions());
      return;
    }

    setIsSearching(true);
    const searchResults: SearchResult[] = [];
    
    try {
      // Recherche dans les projets
      const projectResults = projects.filter(project => {
        const searchTerm = searchQuery.toLowerCase();
        return (
          project.title.toLowerCase().includes(searchTerm) ||
          project.description?.toLowerCase().includes(searchTerm) ||
          project.type.toLowerCase().includes(searchTerm)
        );
      });

      projectResults.forEach(project => {
        searchResults.push({
          id: `search-project-${project.id}`,
          title: project.title,
          type: 'project',
          category: 'Projets',
          description: project.description || 'Aucune description',
          metadata: {
            projectType: project.type,
            lastUpdated: new Date(project.updated_at).toLocaleDateString('fr-FR'),
          },
          action: () => {
            onNavigateToProject?.(project);
            addToRecentSearches(searchQuery);
            onClose();
          }
        });
      });

      // TODO: Recherche dans les blocs (nécessite une API backend)
      // TODO: Recherche dans les utilisateurs collaborateurs
      
      // Recherche dans les paramètres/actions
      const settingsResults = [
        { key: 'settings', title: 'Paramètres', description: 'Configuration de l\'application' },
        { key: 'integrations', title: 'Intégrations', description: 'Connecter des applications' },
        { key: 'profile', title: 'Profil', description: 'Gérer votre profil utilisateur' },
        { key: 'notifications', title: 'Notifications', description: 'Paramètres de notification' },
      ].filter(setting => 
        setting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

      settingsResults.forEach(setting => {
        searchResults.push({
          id: `search-setting-${setting.key}`,
          title: setting.title,
          type: 'setting',
          category: 'Paramètres',
          description: setting.description,
          action: () => {
            onNavigateToPage?.(setting.key);
            addToRecentSearches(searchQuery);
            onClose();
          }
        });
      });

      setResults(searchResults);
      
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [projects, getDefaultSuggestions, onNavigateToProject, onNavigateToPage, onClose]);

  // Ajouter à l'historique de recherche
  const addToRecentSearches = (searchQuery: string) => {
    setRecentSearches(prev => {
      const updated = [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 5);
      localStorage.setItem('momento-recent-searches', JSON.stringify(updated));
      return updated;
    });
  };

  // Charger l'historique au montage
  useEffect(() => {
    const saved = localStorage.getItem('momento-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
      }
    }
  }, []);

  // Effectuer la recherche avec debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query, performSearch]);

  // Initialiser avec les suggestions par défaut
  useEffect(() => {
    if (isOpen && results.length === 0 && !query) {
      setResults(getDefaultSuggestions());
    }
  }, [isOpen, results.length, query, getDefaultSuggestions]);

  // Réinitialiser lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveCategory('all');
      setResults(getDefaultSuggestions());
    }
  }, [isOpen, getDefaultSuggestions]);

  // Filtrer par catégorie
  const filteredResults = results.filter(result => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'projects') return result.type === 'project';
    if (activeCategory === 'blocks') return result.type === 'block';
    if (activeCategory === 'settings') return result.type === 'setting';
    return true;
  });

  // Grouper par catégorie
  const groupedResults = filteredResults.reduce((acc, result) => {
    const category = result.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche globale
          </DialogTitle>
          <DialogDescription>
            Recherchez dans vos projets, blocs et paramètres
          </DialogDescription>
        </DialogHeader>

        {/* Barre de recherche */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-4"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Filtres par catégorie */}
        <div className="px-6 pb-4">
          <div className="flex gap-2">
            {searchCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.key}
                  variant={activeCategory === category.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(category.key)}
                  className="gap-1.5"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Historique des recherches récentes */}
        {!query && recentSearches.length > 0 && (
          <div className="px-6 pb-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recherches récentes
            </h4>
            <div className="flex gap-2 flex-wrap">
              {recentSearches.map((search, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setQuery(search)}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Résultats de recherche */}
        <ScrollArea className="max-h-[400px]">
          <div className="px-6 pb-6">
            {Object.keys(groupedResults).length === 0 ? (
              <FadeIn>
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun résultat trouvé</p>
                  {query && (
                    <p className="text-sm mt-2">
                      Essayez avec d'autres termes de recherche
                    </p>
                  )}
                </div>
              </FadeIn>
            ) : (
              <StaggeredList className="space-y-4">
                {Object.entries(groupedResults).map(([category, categoryResults]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {categoryResults.map((result) => {
                        const Icon = resultIcons[result.type];
                        return (
                          <Card
                            key={result.id}
                            className="p-3 hover:bg-accent cursor-pointer transition-colors group"
                            onClick={result.action}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium truncate">
                                    {result.title}
                                  </h5>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {result.description && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {result.description}
                                  </p>
                                )}
                                {result.metadata && (
                                  <div className="flex items-center gap-2 mt-2">
                                    {result.metadata.projectType && (
                                      <Badge variant="outline" className="text-xs">
                                        {result.metadata.projectType}
                                      </Badge>
                                    )}
                                    {result.metadata.lastUpdated && (
                                      <span className="text-xs text-muted-foreground">
                                        Mis à jour le {result.metadata.lastUpdated}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                    {Object.keys(groupedResults).length > 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </StaggeredList>
            )}
          </div>
        </ScrollArea>

        {/* Footer avec raccourci */}
        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Appuyez sur <Badge variant="outline" className="font-mono">Ctrl + K</Badge> pour ouvrir la recherche
            </span>
            <span>
              {filteredResults.length} résultat{filteredResults.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}