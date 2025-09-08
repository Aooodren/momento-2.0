import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface ProjectFile {
  id: string;
  project_id: string;
  filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  metadata?: any;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joined_at: string;
  user_profile?: {
    full_name: string;
    avatar_url?: string;
    email: string;
  };
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  user_id: string;
  action_type: 'create' | 'update' | 'delete' | 'share' | 'comment';
  resource_type: 'project' | 'block' | 'relation' | 'file';
  resource_id?: string;
  description: string;
  metadata?: any;
  created_at: string;
  user_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface ProjectAnalytics {
  total_blocks: number;
  total_relations: number;
  complexity_score: number;
  last_modified: string;
  contributors_count: number;
  files_count: number;
  storage_used: number; // en bytes
}

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e`;

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token || publicAnonKey;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
};

export const useProjectDetail = (projectId: string) => {
  const [project, setProject] = useState<any>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les détails complets du projet
  const loadProjectDetail = async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Charger en parallèle toutes les données du projet
      const [
        projectData,
        filesData,
        membersData,
        activitiesData,
        analyticsData
      ] = await Promise.all([
        apiCall(`/projects/${projectId}`),
        apiCall(`/projects/${projectId}/files`),
        apiCall(`/projects/${projectId}/members`),
        apiCall(`/projects/${projectId}/activities?limit=10`),
        apiCall(`/projects/${projectId}/analytics`)
      ]);

      setProject(projectData.project);
      setFiles(filesData.files || []);
      setMembers(membersData.members || []);
      setActivities(activitiesData.activities || []);
      setAnalytics(analyticsData.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du projet');
    } finally {
      setLoading(false);
    }
  };

  // Uploader un fichier
  const uploadFile = async (file: File, onProgress?: (progress: number) => void) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Utilisateur non connecté');

      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `projects/${projectId}/${fileName}`;

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            if (onProgress) onProgress((progress.loaded / progress.total) * 100);
          }
        });

      if (uploadError) throw uploadError;

      // Enregistrer les métadonnées du fichier dans la base
      const fileData = await apiCall(`/projects/${projectId}/files`, {
        method: 'POST',
        body: JSON.stringify({
          filename: file.name,
          file_path: uploadData.path,
          file_type: file.type,
          file_size: file.size,
          metadata: {
            original_name: file.name,
            upload_date: new Date().toISOString()
          }
        }),
      });

      // Recharger la liste des fichiers
      await loadFiles();
      return fileData.file;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Erreur lors de l\'upload');
    }
  };

  // Télécharger un fichier
  const downloadFile = async (fileId: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) throw new Error('Fichier non trouvé');

      // Obtenir l'URL signée pour le téléchargement
      const { data: urlData, error: urlError } = await supabase.storage
        .from('project-files')
        .createSignedUrl(file.file_path, 60 * 60); // 1 heure

      if (urlError) throw urlError;

      // Enregistrer l'activité
      await apiCall(`/projects/${projectId}/activities`, {
        method: 'POST',
        body: JSON.stringify({
          action_type: 'download',
          resource_type: 'file',
          resource_id: fileId,
          description: `Téléchargement du fichier: ${file.filename}`
        }),
      });

      // Déclencher le téléchargement
      const link = document.createElement('a');
      link.href = urlData.signedUrl;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return urlData.signedUrl;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Erreur lors du téléchargement');
    }
  };

  // Supprimer un fichier
  const deleteFile = async (fileId: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) throw new Error('Fichier non trouvé');

      // Supprimer du storage
      const { error: deleteError } = await supabase.storage
        .from('project-files')
        .remove([file.file_path]);

      if (deleteError) throw deleteError;

      // Supprimer de la base de données
      await apiCall(`/files/${fileId}`, { method: 'DELETE' });

      // Recharger la liste
      await loadFiles();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Erreur lors de la suppression');
    }
  };

  // Charger uniquement les fichiers
  const loadFiles = async () => {
    try {
      const data = await apiCall(`/projects/${projectId}/files`);
      setFiles(data.files || []);
    } catch (err) {
      console.error('Erreur chargement fichiers:', err);
    }
  };

  // Inviter un membre
  const inviteMember = async (email: string, role: ProjectMember['role']) => {
    try {
      const data = await apiCall(`/projects/${projectId}/members/invite`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });

      // Recharger les membres
      const membersData = await apiCall(`/projects/${projectId}/members`);
      setMembers(membersData.members || []);

      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Erreur lors de l\'invitation');
    }
  };

  // Modifier le rôle d'un membre
  const updateMemberRole = async (memberId: string, role: ProjectMember['role']) => {
    try {
      await apiCall(`/projects/${projectId}/members/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });

      // Recharger les membres
      const membersData = await apiCall(`/projects/${projectId}/members`);
      setMembers(membersData.members || []);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Erreur lors de la modification du rôle');
    }
  };

  // Retirer un membre
  const removeMember = async (memberId: string) => {
    try {
      await apiCall(`/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
      });

      // Recharger les membres
      const membersData = await apiCall(`/projects/${projectId}/members`);
      setMembers(membersData.members || []);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Erreur lors de la suppression du membre');
    }
  };

  // Exporter le projet
  const exportProject = async (format: 'json' | 'pdf' | 'png') => {
    try {
      const data = await apiCall(`/projects/${projectId}/export`, {
        method: 'POST',
        body: JSON.stringify({ format }),
      });

      // Télécharger le fichier exporté
      const link = document.createElement('a');
      link.href = data.download_url;
      link.download = `${project?.title || 'project'}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Erreur lors de l\'export');
    }
  };

  // Dupliquer le projet
  const duplicateProject = async (newTitle?: string) => {
    try {
      const data = await apiCall(`/projects/${projectId}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ 
          title: newTitle || `${project?.title || 'Project'} (Copie)` 
        }),
      });

      return data.project;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Erreur lors de la duplication');
    }
  };

  useEffect(() => {
    loadProjectDetail();
  }, [projectId]);

  return {
    // Données
    project,
    files,
    members,
    activities,
    analytics,
    loading,
    error,

    // Actions sur les fichiers
    uploadFile,
    downloadFile,
    deleteFile,
    loadFiles,

    // Actions sur les membres
    inviteMember,
    updateMemberRole,
    removeMember,

    // Actions sur le projet
    exportProject,
    duplicateProject,
    loadProjectDetail,
  };
};