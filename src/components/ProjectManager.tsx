import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Calendar, FolderOpen, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { projectId } from '../utils/supabase/info';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface ProjectManagerProps {
  onProjectSelect: (project: Project) => void;
  accessToken: string | null;
}

export default function ProjectManager({ onProjectSelect, accessToken }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  // Fetch projects from backend
  const fetchProjects = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server/projects`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Create new project
  const createProject = async () => {
    if (!accessToken || !formData.name.trim() || !formData.description.trim()) return;

    try {
      setError(null);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create project');
      }

      const data = await response.json();
      setProjects(prev => [data.project, ...prev]);
      setShowCreateDialog(false);
      setFormData({ name: '', description: '' });
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  // Update project
  const updateProject = async () => {
    if (!accessToken || !editingProject || !formData.name.trim() || !formData.description.trim()) return;

    try {
      setError(null);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update project');
      }

      const data = await response.json();
      setProjects(prev => prev.map(p => p.id === editingProject.id ? data.project : p));
      setShowEditDialog(false);
      setEditingProject(null);
      setFormData({ name: '', description: '' });
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  // Delete project
  const deleteProject = async (projectToDelete: Project) => {
    if (!accessToken || !confirm(`Êtes-vous sûr de vouloir supprimer "${projectToDelete.name}" ?`)) return;

    try {
      setError(null);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete project');
      }

      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  // Open edit dialog
  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({ name: project.name, description: project.description });
    setShowEditDialog(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchProjects();
  }, [accessToken]);

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connexion requise</h3>
          <p className="text-gray-600">Veuillez vous connecter pour gérer vos projets.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes Projets Innovation</h2>
          <p className="text-gray-600 mt-1">Gérez vos canvas d'innovation et vos idées</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau Projet
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-xs mt-2 underline"
          >
            Masquer
          </button>
        </div>
      )}

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1 line-clamp-1">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(project)}
                    className="p-2 h-8 w-8"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteProject(project)}
                    className="p-2 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Créé {formatDate(project.created_at)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Settings className="w-3 h-3" />
                  <span>Mis à jour {formatDate(project.updated_at)}</span>
                </div>
              </div>

              <Button 
                onClick={() => onProjectSelect(project)}
                className="w-full gap-2"
                variant="outline"
              >
                <FolderOpen className="w-4 h-4" />
                Ouvrir le Canvas
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {projects.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet pour l'instant</h3>
          <p className="text-gray-600 mb-6">Créez votre premier projet d'innovation pour commencer.</p>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Créer un projet
          </Button>
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un nouveau projet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Nom du projet *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Mon Canvas Innovation"
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Description *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre projet d'innovation..."
                className="min-h-[100px]"
                maxLength={500}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={createProject}
                disabled={!formData.name.trim() || !formData.description.trim()}
                className="flex-1"
              >
                Créer le projet
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  setFormData({ name: '', description: '' });
                }}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Nom du projet *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Mon Canvas Innovation"
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Description *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre projet d'innovation..."
                className="min-h-[100px]"
                maxLength={500}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={updateProject}
                disabled={!formData.name.trim() || !formData.description.trim()}
                className="flex-1"
              >
                Sauvegarder
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingProject(null);
                  setFormData({ name: '', description: '' });
                }}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}