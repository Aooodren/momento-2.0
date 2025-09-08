import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase/client';
import { useAuthContext } from './useAuth';

export interface CollaboratorCursor {
  userId: string;
  userName: string;
  userColor: string;
  position: { x: number; y: number };
  lastSeen: number;
}

export interface CollaboratorSelection {
  userId: string;
  userName: string;
  userColor: string;
  selectedNodeId?: string;
  selectionBounds?: { x: number; y: number; width: number; height: number };
}

export interface RealtimeActivity {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  action: 'node_created' | 'node_updated' | 'node_deleted' | 'edge_created' | 'edge_deleted' | 'user_joined' | 'user_left';
  target?: string;
  timestamp: number;
  data?: any;
}

interface UseRealtimeCollaborationProps {
  projectId: string;
  canvasRef?: React.RefObject<HTMLDivElement>;
}

export const useRealtimeCollaboration = ({ 
  projectId, 
  canvasRef 
}: UseRealtimeCollaborationProps) => {
  const { user } = useAuthContext();
  const [cursors, setCursors] = useState<Map<string, CollaboratorCursor>>(new Map());
  const [selections, setSelections] = useState<Map<string, CollaboratorSelection>>(new Map());
  const [activities, setActivities] = useState<RealtimeActivity[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<any>(null);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const throttleRef = useRef<NodeJS.Timeout>();

  // Couleurs prédéfinies pour les collaborateurs
  const userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD',
    '#00D2D3', '#FF9F43', '#EE5A24', '#009432'
  ];

  const getUserColor = useCallback((userId: string) => {
    const index = parseInt(userId.slice(-2), 16) % userColors.length;
    return userColors[index];
  }, []);

  // Initialiser le canal temps réel
  useEffect(() => {
    if (!user || !projectId) return;

    const channelName = `project:${projectId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    // Écouter les événements de présence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = new Set<string>();
        
        Object.keys(state).forEach(userId => {
          if (userId !== user.id) {
            users.add(userId);
            const presence = state[userId][0];
            
            // Mettre à jour le curseur
            if (presence.cursor) {
              setCursors(prev => new Map(prev).set(userId, {
                userId,
                userName: presence.user_name,
                userColor: getUserColor(userId),
                position: presence.cursor,
                lastSeen: Date.now()
              }));
            }

            // Mettre à jour la sélection
            if (presence.selection) {
              setSelections(prev => new Map(prev).set(userId, {
                userId,
                userName: presence.user_name,
                userColor: getUserColor(userId),
                selectedNodeId: presence.selection.nodeId,
                selectionBounds: presence.selection.bounds
              }));
            }
          }
        });

        setConnectedUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== user.id) {
          const presence = newPresences[0];
          addActivity({
            action: 'user_joined',
            userId: key,
            userName: presence.user_name,
            userColor: getUserColor(key),
            timestamp: Date.now(),
            id: `join_${key}_${Date.now()}`,
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (key !== user.id) {
          const presence = leftPresences[0];
          
          // Nettoyer les données du collaborateur
          setCursors(prev => {
            const newCursors = new Map(prev);
            newCursors.delete(key);
            return newCursors;
          });
          
          setSelections(prev => {
            const newSelections = new Map(prev);
            newSelections.delete(key);
            return newSelections;
          });

          addActivity({
            action: 'user_left',
            userId: key,
            userName: presence.user_name,
            userColor: getUserColor(key),
            timestamp: Date.now(),
            id: `leave_${key}_${Date.now()}`,
          });
        }
      })
      .on('broadcast', { event: 'canvas_activity' }, (payload) => {
        if (payload.userId !== user.id) {
          addActivity(payload.activity);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          
          // Envoyer la présence initiale
          await channel.track({
            user_id: user.id,
            user_name: user.name || user.email?.split('@')[0] || 'Utilisateur',
            online_at: new Date().toISOString(),
            cursor: { x: 0, y: 0 },
            selection: null
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user, projectId, getUserColor]);

  // Suivre la souris sur le canvas
  useEffect(() => {
    if (!canvasRef?.current || !isConnected) return;

    const canvas = canvasRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      lastMousePosition.current = { x, y };
      
      // Throttle les mises à jour du curseur
      if (throttleRef.current) clearTimeout(throttleRef.current);
      
      throttleRef.current = setTimeout(() => {
        if (channelRef.current && user) {
          channelRef.current.track({
            user_id: user.id,
            user_name: user.name || user.email?.split('@')[0] || 'Utilisateur',
            online_at: new Date().toISOString(),
            cursor: { x, y },
            selection: null // TODO: intégrer avec la sélection ReactFlow
          });
        }
      }, 50); // 20 FPS
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (throttleRef.current) clearTimeout(throttleRef.current);
    };
  }, [canvasRef, isConnected, user]);

  // Nettoyer les curseurs inactifs
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCursors(prev => {
        const newCursors = new Map(prev);
        for (const [userId, cursor] of newCursors) {
          if (now - cursor.lastSeen > 10000) { // 10 secondes d'inactivité
            newCursors.delete(userId);
          }
        }
        return newCursors;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Ajouter une activité au journal
  const addActivity = useCallback((activity: RealtimeActivity) => {
    setActivities(prev => {
      const newActivities = [activity, ...prev].slice(0, 50); // Garder seulement les 50 dernières
      return newActivities;
    });
  }, []);

  // Diffuser une activité canvas
  const broadcastCanvasActivity = useCallback(async (
    action: RealtimeActivity['action'],
    target?: string,
    data?: any
  ) => {
    if (!channelRef.current || !user) return;

    const activity: RealtimeActivity = {
      id: `${action}_${Date.now()}_${Math.random()}`,
      userId: user.id,
      userName: user.name || user.email?.split('@')[0] || 'Utilisateur',
      userColor: getUserColor(user.id),
      action,
      target,
      timestamp: Date.now(),
      data
    };

    await channelRef.current.send({
      type: 'broadcast',
      event: 'canvas_activity',
      payload: { activity }
    });

    // Ajouter aussi à notre état local
    addActivity(activity);
  }, [user, getUserColor, addActivity]);

  // Mettre à jour la sélection d'un nœud
  const updateSelection = useCallback(async (nodeId?: string, bounds?: { x: number; y: number; width: number; height: number }) => {
    if (!channelRef.current || !user) return;

    await channelRef.current.track({
      user_id: user.id,
      user_name: user.name || user.email?.split('@')[0] || 'Utilisateur',
      online_at: new Date().toISOString(),
      cursor: lastMousePosition.current,
      selection: nodeId ? { nodeId, bounds } : null
    });
  }, [user]);

  // Obtenir la liste des collaborateurs connectés
  const getConnectedCollaborators = useCallback(() => {
    return Array.from(connectedUsers).map(userId => {
      const cursor = cursors.get(userId);
      return {
        userId,
        userName: cursor?.userName || 'Utilisateur',
        userColor: getUserColor(userId),
        isActive: cursor ? (Date.now() - cursor.lastSeen < 10000) : false
      };
    });
  }, [connectedUsers, cursors, getUserColor]);

  return {
    // État de la collaboration
    cursors: Array.from(cursors.values()),
    selections: Array.from(selections.values()),
    activities,
    connectedUsers: getConnectedCollaborators(),
    isConnected,
    
    // Actions
    broadcastCanvasActivity,
    updateSelection,
    
    // Utilitaires
    getUserColor
  };
};