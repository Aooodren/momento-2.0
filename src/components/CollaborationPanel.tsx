import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  Users, 
  Activity, 
  Wifi, 
  WifiOff, 
  Clock, 
  MousePointer,
  Eye,
  Plus,
  Minus,
  ChevronRight,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RealtimeActivity } from '../hooks/useRealtimeCollaboration';

interface CollaboratorInfo {
  userId: string;
  userName: string;
  userColor: string;
  isActive: boolean;
}

interface CollaborationPanelProps {
  connectedUsers: CollaboratorInfo[];
  activities: RealtimeActivity[];
  isConnected: boolean;
  onInviteClick?: () => void;
  className?: string;
}

const ActivityIcon = ({ action }: { action: RealtimeActivity['action'] }) => {
  switch (action) {
    case 'node_created':
      return <Plus className="w-3 h-3" />;
    case 'node_deleted':
      return <Minus className="w-3 h-3" />;
    case 'node_updated':
      return <Eye className="w-3 h-3" />;
    case 'user_joined':
      return <ChevronRight className="w-3 h-3" />;
    case 'user_left':
      return <Minus className="w-3 h-3" />;
    default:
      return <Activity className="w-3 h-3" />;
  }
};

const getActivityMessage = (activity: RealtimeActivity): string => {
  switch (activity.action) {
    case 'node_created':
      return 'a créé un bloc';
    case 'node_updated':
      return 'a modifié un bloc';
    case 'node_deleted':
      return 'a supprimé un bloc';
    case 'edge_created':
      return 'a créé une connexion';
    case 'edge_deleted':
      return 'a supprimé une connexion';
    case 'user_joined':
      return 'a rejoint le projet';
    case 'user_left':
      return 'a quitté le projet';
    default:
      return 'a effectué une action';
  }
};

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'à l\'instant';
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)}h`;
  return `il y a ${Math.floor(diff / 86400000)}j`;
};

const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export default function CollaborationPanel({ 
  connectedUsers, 
  activities, 
  isConnected,
  onInviteClick,
  className 
}: CollaborationPanelProps) {
  const [showActivities, setShowActivities] = useState(false);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Collaboration
          </CardTitle>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
              {isConnected ? 'En ligne' : 'Hors ligne'}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs">
          {connectedUsers.length > 0 
            ? `${connectedUsers.length} collaborateur${connectedUsers.length > 1 ? 's' : ''} en ligne`
            : 'Aucun collaborateur connecté'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Liste des collaborateurs connectés */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Utilisateurs actifs
            </span>
            {onInviteClick && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={onInviteClick}
              >
                <Plus className="w-3 h-3 mr-1" />
                Inviter
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <AnimatePresence>
              {connectedUsers.map((user) => (
                <motion.div
                  key={user.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                >
                  <div className="relative">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback 
                        className="text-[10px] text-white"
                        style={{ backgroundColor: user.userColor }}
                      >
                        {getInitials(user.userName)}
                      </AvatarFallback>
                    </Avatar>
                    {user.isActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border border-background rounded-full flex items-center justify-center">
                        <MousePointer className="w-1.5 h-1.5 text-green-800" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {user.userName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Circle 
                        className="w-2 h-2" 
                        fill={user.isActive ? '#22c55e' : '#6b7280'}
                        color={user.isActive ? '#22c55e' : '#6b7280'}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {connectedUsers.length === 0 && (
            <div className="text-center py-4">
              <Users className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">
                Aucun collaborateur connecté
              </p>
              {onInviteClick && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-xs"
                  onClick={onInviteClick}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Inviter quelqu'un
                </Button>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Activités récentes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Activité récente
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setShowActivities(!showActivities)}
            >
              <Activity className="w-3 h-3 mr-1" />
              {showActivities ? 'Masquer' : 'Voir tout'}
            </Button>
          </div>

          <ScrollArea className={showActivities ? "h-32" : "h-20"}>
            <div className="space-y-1">
              <AnimatePresence>
                {activities.slice(0, showActivities ? 20 : 5).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-2 p-2 rounded-md bg-muted/30"
                  >
                    <div 
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white mt-0.5"
                      style={{ backgroundColor: activity.userColor }}
                    >
                      <ActivityIcon action={activity.action} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-xs">
                        <span className="font-medium">{activity.userName}</span>
                        {' '}
                        <span className="text-muted-foreground">
                          {getActivityMessage(activity)}
                        </span>
                        {activity.target && (
                          <span className="font-medium"> {activity.target}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-2 h-2 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>

          {activities.length === 0 && (
            <div className="text-center py-4">
              <Activity className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">
                Aucune activité récente
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}