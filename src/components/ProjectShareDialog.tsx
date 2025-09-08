import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Share,
  UserPlus, 
  Mail, 
  Send, 
  Copy, 
  Check, 
  Clock, 
  Users,
  Link as LinkIcon,
  Eye,
  Edit,
  Crown,
  Shield,
  EyeIcon,
  User,
  AlertCircle,
  ExternalLink,
  Globe,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { toast } from 'sonner@2.0.3';

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

interface ProjectShareDialogProps {
  projectId: string;
  projectTitle: string;
  trigger?: React.ReactNode;
  members: ProjectMember[];
}

export default function ProjectShareDialog({ 
  projectId, 
  projectTitle, 
  trigger,
  members 
}: ProjectShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'invite' | 'members'>('invite');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const { inviteMember } = useProjectMembers(projectId);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Veuillez saisir une adresse email');
      return;
    }

    try {
      setInviting(true);
      
      const result = await inviteMember({
        email: inviteEmail,
        role: inviteRole,
        message: inviteMessage || undefined,
      });
      
      setInviteResult(result);
      toast.success(`Invitation envoyée à ${inviteEmail}`);
      
      // Reset form after success
      setTimeout(() => {
        setInviteEmail('');
        setInviteMessage('');
        setInviteResult(null);
        setActiveTab('members'); // Switch to members tab to show the new invite
      }, 2000);
      
    } catch (err) {
      console.error('Error inviting member:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = async () => {
    if (inviteResult?.invitation_link) {
      try {
        await navigator.clipboard.writeText(inviteResult.invitation_link);
        setCopiedLink(true);
        toast.success('Lien copié dans le presse-papier');
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {
        toast.error('Erreur lors de la copie du lien');
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-3 h-3" />;
      case 'admin': return <Shield className="w-3 h-3" />;
      case 'editor': return <Edit className="w-3 h-3" />;
      case 'viewer': return <EyeIcon className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Propriétaire';
      case 'admin': return 'Admin';
      case 'editor': return 'Éditeur';
      case 'viewer': return 'Lecteur';
      default: return role;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': 
        return <Badge variant="default" className="text-xs">Actif</Badge>;
      case 'pending': 
      case 'invited': 
        return <Badge variant="outline" className="text-xs text-orange-600 border-orange-200"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      default: 
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Partager
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="w-5 h-5" />
            Partager le projet
          </DialogTitle>
          <DialogDescription>
            Gérez l'accès et les collaborateurs pour "{projectTitle}"
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('invite')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'invite' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="w-4 h-4 mr-2 inline" />
            Inviter
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'members' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4 mr-2 inline" />
            Membres ({members.length})
          </button>
        </div>

        <div className="mt-4">
          <AnimatePresence mode="wait">
            {activeTab === 'invite' ? (
              <motion.div
                key="invite"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                {!inviteResult ? (
                  <>
                    {/* Email Input */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Adresse email</Label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="nom@exemple.com"
                          className="pl-10"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                        />
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="role">Rôle</Label>
                      <Select value={inviteRole} onValueChange={(value: 'editor' | 'viewer') => setInviteRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">
                            <div className="flex items-center gap-2">
                              <Edit className="w-4 h-4 text-blue-500" />
                              <div>
                                <div>Éditeur</div>
                                <div className="text-xs text-muted-foreground">Peut modifier le projet</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="viewer">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-gray-500" />
                              <div>
                                <div>Lecteur</div>
                                <div className="text-xs text-muted-foreground">Peut seulement consulter</div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message">Message personnel (optionnel)</Label>
                      <Input
                        id="message"
                        placeholder="Un message d'accompagnement..."
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleInvite} disabled={inviting}>
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
                    </div>
                  </>
                ) : (
                  /* Success State */
                  <div className="space-y-4">
                    <Alert>
                      <Check className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Invitation envoyée avec succès !</strong>
                      </AlertDescription>
                    </Alert>

                    {/* Invitation Link if available */}
                    {inviteResult.invitation_link && (
                      <div className="space-y-2">
                        <Label>Lien d'invitation directe</Label>
                        <div className="flex gap-2">
                          <Input
                            value={inviteResult.invitation_link}
                            readOnly
                            className="text-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyLink}
                            className="shrink-0"
                          >
                            {copiedLink ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center">
                      <Button onClick={() => setInviteResult(null)}>
                        Envoyer une autre invitation
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="members"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{member.name}</span>
                          {getRoleIcon(member.role)}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {member.email}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getRoleLabel(member.role)}
                        </Badge>
                        {getStatusBadge(member.status)}
                      </div>
                    </div>
                  ))}
                  
                  {members.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun membre pour le moment</p>
                      <p className="text-xs">Utilisez l'onglet "Inviter" pour ajouter des collaborateurs</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}