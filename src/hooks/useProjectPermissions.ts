import { useCallback, useMemo } from 'react';
import { useAuthContext } from './useAuth';

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ProjectPermissions {
  canView: boolean;
  canEdit: boolean;
  canManageMembers: boolean;
  canDeleteProject: boolean;
  canManageSettings: boolean;
  canCreateBlocks: boolean;
  canEditBlocks: boolean;
  canDeleteBlocks: boolean;
  canCreateConnections: boolean;
  canEditConnections: boolean;
  canDeleteConnections: boolean;
  canShare: boolean;
  canExport: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, ProjectPermissions> = {
  owner: {
    canView: true,
    canEdit: true,
    canManageMembers: true,
    canDeleteProject: true,
    canManageSettings: true,
    canCreateBlocks: true,
    canEditBlocks: true,
    canDeleteBlocks: true,
    canCreateConnections: true,
    canEditConnections: true,
    canDeleteConnections: true,
    canShare: true,
    canExport: true,
  },
  admin: {
    canView: true,
    canEdit: true,
    canManageMembers: true,
    canDeleteProject: false,
    canManageSettings: true,
    canCreateBlocks: true,
    canEditBlocks: true,
    canDeleteBlocks: true,
    canCreateConnections: true,
    canEditConnections: true,
    canDeleteConnections: true,
    canShare: true,
    canExport: true,
  },
  editor: {
    canView: true,
    canEdit: true,
    canManageMembers: false,
    canDeleteProject: false,
    canManageSettings: false,
    canCreateBlocks: true,
    canEditBlocks: true,
    canDeleteBlocks: true,
    canCreateConnections: true,
    canEditConnections: true,
    canDeleteConnections: true,
    canShare: false,
    canExport: true,
  },
  viewer: {
    canView: true,
    canEdit: false,
    canManageMembers: false,
    canDeleteProject: false,
    canManageSettings: false,
    canCreateBlocks: false,
    canEditBlocks: false,
    canDeleteBlocks: false,
    canCreateConnections: false,
    canEditConnections: false,
    canDeleteConnections: false,
    canShare: false,
    canExport: true,
  },
};

export function useProjectPermissions(projectOwnerId?: string, userRole?: UserRole) {
  const { user } = useAuthContext();

  // Déterminer le rôle effectif de l'utilisateur
  const effectiveRole = useMemo(() => {
    if (!user || !projectOwnerId) return 'viewer';
    
    // Si l'utilisateur est le propriétaire du projet
    if (user.id === projectOwnerId) return 'owner';
    
    // Sinon, utilise le rôle fourni ou par défaut 'viewer'
    return userRole || 'viewer';
  }, [user, projectOwnerId, userRole]);

  // Obtenir les permissions basées sur le rôle
  const permissions = useMemo(() => {
    return ROLE_PERMISSIONS[effectiveRole];
  }, [effectiveRole]);

  // Fonctions utilitaires pour vérifier les permissions
  const hasPermission = useCallback((permission: keyof ProjectPermissions) => {
    return permissions[permission];
  }, [permissions]);

  const canPerformAction = useCallback((action: keyof ProjectPermissions) => {
    return hasPermission(action);
  }, [hasPermission]);

  // Fonction pour vérifier si l'utilisateur peut éditer (utilisée fréquemment)
  const canEdit = useMemo(() => permissions.canEdit, [permissions.canEdit]);
  
  // Fonction pour vérifier si l'utilisateur est propriétaire
  const isOwner = useMemo(() => effectiveRole === 'owner', [effectiveRole]);
  
  // Fonction pour vérifier si l'utilisateur peut gérer les membres
  const canManageMembers = useMemo(() => permissions.canManageMembers, [permissions.canManageMembers]);

  return {
    role: effectiveRole,
    permissions,
    hasPermission,
    canPerformAction,
    canEdit,
    isOwner,
    canManageMembers,
  };
}

// Fonction utilitaire pour obtenir le texte du rôle en français
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'owner': return 'Propriétaire';
    case 'admin': return 'Administrateur';
    case 'editor': return 'Éditeur';
    case 'viewer': return 'Lecteur';
    default: return role;
  }
}

// Fonction utilitaire pour obtenir la couleur du rôle
export function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'owner': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'admin': return 'bg-red-100 text-red-700 border-red-200';
    case 'editor': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'viewer': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}