import { useState, useEffect } from 'react';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  Users, UserPlus, Mail, Send, MoreHorizontal, Crown, 
  CheckCircle, Clock, X, Settings, Eye, Edit
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { toast } from "sonner@2.0.3";

interface ProjectMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'invited';
  joinedAt: string;
  avatarUrl?: string;
}

interface ProjectMembersProps {
  projectId: string;
  projectTitle: string;
  currentUserEmail: string;
  isOwner: boolean;
}

export default function ProjectMembers({ 
  projectId, 
  projectTitle, 
  currentUserEmail, 
  isOwner 
}: ProjectMembersProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  const {
    members,
    loading,
    error,
    getMembers,
    inviteMember,
    removeMember,
    updateMemberRole,
  } = useProjectMembers(projectId);

  useEffect(() => {
    getMembers().catch(err => {
      console.error('Error loading members:', err);
      toast.error('Erreur lors du chargement des membres');
    });
  }, [getMembers]);

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Veuillez saisir une adresse email');
      return;
    }

    try {
      setInviting(true);
      
      await inviteMember({
        email: inviteEmail,
        role: inviteRole,
        message: inviteMessage || undefined,
      });
      
      // Réinitialiser le formulaire
      setInviteEmail('');
      setInviteRole('editor');
      setInviteMessage('');
      setInviteDialogOpen(false);
      
      toast.success(`Invitation envoyée à ${inviteEmail}`);
    } catch (err) {
      console.error('Error inviting member:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(memberId);
      toast.success('Membre retiré du projet');
    } catch (err) {
      console.error('Error removing member:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression du membre');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: ProjectMember['role']) => {
    try {
      await updateMemberRole(memberId, newRole);
      toast.success('Rôle mis à jour');
    } catch (err) {
      console.error('Error changing role:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la modification du rôle');
    }
  };

  const getRoleLabel = (role: ProjectMember['role']) => {
    switch (role) {
      case 'owner': return 'Propriétaire';
      case 'admin': return 'Administrateur';
      case 'editor': return 'Éditeur';
      case 'viewer': return 'Lecteur';
      default: return role;
    }
  };

  const getRoleColor = (role: ProjectMember['role']) => {
    switch (role) {
      case 'owner': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'admin': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'editor': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'viewer': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: ProjectMember['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'invited': return <Mail className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Membres du projet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Chargement des membres...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Membres du projet
            </CardTitle>
            <CardDescription>
              {members.length} membre{members.length > 1 ? 's' : ''} · Gérez l'accès et les permissions
            </CardDescription>
          </div>
          {isOwner && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Inviter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Inviter au projet</DialogTitle>
                  <DialogDescription>
                    Invitez une nouvelle personne à collaborer sur "{projectTitle}"
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Adresse email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nom@exemple.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Rôle</Label>
                    <Select value={inviteRole} onValueChange={(value: 'editor' | 'viewer') => setInviteRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">
                          <div className="flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            <div>
                              <div>Éditeur</div>
                              <div className="text-xs text-muted-foreground">Peut voir et modifier le projet</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <div>
                              <div>Lecteur</div>
                              <div className="text-xs text-muted-foreground">Peut seulement voir le projet</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="message">Message personnel (optionnel)</Label>
                    <Input
                      id="message"
                      placeholder="Un message d'accompagnement..."
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleInviteMember} disabled={inviting}>
                    {inviting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer l'invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={member.avatarUrl} alt={member.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name}</span>
                    {member.role === 'owner' && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                    {getStatusIcon(member.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">{member.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={getRoleColor(member.role)}>
                  {getRoleLabel(member.role)}
                </Badge>
                {member.status === 'invited' && (
                  <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                    Invitation envoyée
                  </Badge>
                )}
                {isOwner && member.role !== 'owner' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'admin')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Promouvoir admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'editor')}>
                        <Edit className="w-4 h-4 mr-2" />
                        Définir comme éditeur
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'viewer')}>
                        <Eye className="w-4 h-4 mr-2" />
                        Définir comme lecteur
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Retirer du projet
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>

        {members.length === 1 && isOwner && (
          <Alert className="mt-4">
            <Users className="h-4 w-4" />
            <AlertDescription>
              Vous êtes le seul membre de ce projet. Invitez des collaborateurs pour travailler ensemble !
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}