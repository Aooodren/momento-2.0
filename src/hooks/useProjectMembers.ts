import { useState, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ProjectMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'invited';
  joinedAt: string;
  avatarUrl?: string;
  lastActiveAt?: string;
}

interface InviteMemberData {
  email: string;
  role: 'editor' | 'viewer';
  message?: string;
}

export function useProjectMembers(projectIdParam: string) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get access token from current session
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || publicAnonKey;
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e/projects/${projectIdParam}/members`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transformer les données pour correspondre à notre interface
      const transformedMembers: ProjectMember[] = data.members.map((member: any) => ({
        id: member.id,
        email: member.email,
        name: member.name,
        role: member.role,
        status: member.status,
        joinedAt: member.joined_at || member.invited_at,
        avatarUrl: member.avatarUrl,
        lastActiveAt: member.last_active_at,
      }));
      
      setMembers(transformedMembers);
      return transformedMembers;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des membres';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectIdParam]);

  const inviteMember = useCallback(async (data: InviteMemberData) => {
    try {
      setLoading(true);
      setError(null);

      // Get access token from current session
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || publicAnonKey;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e/projects/${projectIdParam}/members/invite`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Cette personne fait déjà partie du projet');
        }
        
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Invitation error details:', errorData);
          errorMessage = errorData.error || errorMessage;
          
          // Log additional details if available
          if (errorData.details) {
            console.error('Error details:', errorData.details);
          }
          if (errorData.redirect_url) {
            console.error('Attempted redirect URL:', errorData.redirect_url);
          }
          
          // Handle specific cases for better user experience
          if (errorData.error?.includes('A user with this email address has already been registered')) {
            errorMessage = 'Cet utilisateur a déjà un compte. Un lien d\'invitation directe sera créé.';
          }
          if (errorData.error?.includes('email_exists')) {
            errorMessage = 'Cet utilisateur a déjà un compte. Un lien d\'invitation directe sera créé.';
          }
        } catch {
          console.error('Could not parse error response as JSON');
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      const newMember: ProjectMember = {
        id: result.member.id,
        email: result.member.email,
        name: result.member.name,
        role: result.member.role,
        status: result.member.status,
        joinedAt: result.member.invited_at,
        avatarUrl: result.member.avatarUrl,
        lastActiveAt: result.member.last_active_at,
      };

      setMembers(prev => [...prev, newMember]);
      
      // Show success message based on invitation type
      if (result.existing_user) {
        console.log('✅ Invitation directe créée pour utilisateur existant');
        console.log('🔗 Lien d\'invitation:', result.invitation_link);
      } else if (result.supabase_invitation) {
        console.log('✅ Invitation Supabase envoyée avec succès');
      }
      
      // Return both member and response info for the UI
      return {
        ...newMember,
        existing_user: result.existing_user,
        invitation_link: result.invitation_link,
        invitation_method: result.invitation_method
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'invitation";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectIdParam]);

  const removeMember = useCallback(async (memberId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get access token from current session
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || publicAnonKey;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e/projects/${projectIdParam}/members/${memberId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Remove member error details:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si on ne peut pas parser la réponse JSON, garder le message d'erreur par défaut
        }
        throw new Error(errorMessage);
      }

      // Supprimer de l'état local d'abord
      setMembers(prev => prev.filter(m => m.id !== memberId));
      
      // Puis recharger depuis le serveur pour s'assurer de la cohérence
      await getMembers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectIdParam]);

  const updateMemberRole = useCallback(async (memberId: string, newRole: ProjectMember['role']) => {
    try {
      setLoading(true);
      setError(null);

      // Get access token from current session
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || publicAnonKey;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e/projects/${projectIdParam}/members/${memberId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Mettre à jour l'état local d'abord
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ));
      
      // Puis recharger depuis le serveur pour s'assurer de la cohérence
      await getMembers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la modification du rôle';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectIdParam]);

  const acceptInvitation = useCallback(async (memberId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get access token from current session
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || publicAnonKey;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e/projects/${projectIdParam}/members/${memberId}/accept`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, status: 'active' as const } : m
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'acceptation";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectIdParam]);

  return {
    members,
    loading,
    error,
    getMembers,
    inviteMember,
    removeMember,
    updateMemberRole,
    acceptInvitation
  };
}