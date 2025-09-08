import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { 
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
  Settings,
  Crown,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { toast } from 'sonner@2.0.3';

interface EnhancedInviteDialogProps {
  projectId: string;
  projectTitle: string;
  trigger?: React.ReactNode;
  onInviteSuccess?: (member: any) => void;
}

export default function EnhancedInviteDialog({ 
  projectId, 
  projectTitle, 
  trigger,
  onInviteSuccess 
}: EnhancedInviteDialogProps) {
  const [open, setOpen] = useState(false);
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
      
      if (onInviteSuccess) {
        onInviteSuccess(result);
      }
      
      toast.success(`Invitation envoyée à ${inviteEmail}`);
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

  const handleClose = () => {
    setOpen(false);
    // Reset après un délai pour permettre l'animation
    setTimeout(() => {
      setInviteEmail('');
      setInviteRole('editor');
      setInviteMessage('');
      setInviteResult(null);
      setCopiedLink(false);
    }, 200);
  };

  const getRoleInfo = (role: 'editor' | 'viewer') => {
    switch (role) {
      case 'editor':
        return {
          icon: <Edit className="w-4 h-4" />,
          title: 'Éditeur',
          description: 'Peut voir, modifier et créer des éléments',
          permissions: ['Voir le projet', 'Modifier les blocs', 'Créer des connexions', 'Commenter']
        };
      case 'viewer':
        return {
          icon: <Eye className="w-4 h-4" />,
          title: 'Lecteur',
          description: 'Peut uniquement consulter le projet',
          permissions: ['Voir le projet', 'Commenter', 'Exporter en lecture seule']
        };
    }
  };

  const currentRoleInfo = getRoleInfo(inviteRole);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Inviter un collaborateur
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Inviter au projet
          </DialogTitle>
          <DialogDescription>
            Invitez une nouvelle personne à collaborer sur "{projectTitle}"
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!inviteResult ? (
            <motion.div
              key="invite-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Email */}
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

              {/* Rôle */}
              <div className="space-y-2">
                <Label htmlFor="role">Rôle et permissions</Label>
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
                
                {/* Détail des permissions */}
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    {currentRoleInfo.icon}
                    <span className="font-medium text-sm">{currentRoleInfo.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {currentRoleInfo.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {currentRoleInfo.permissions.map((permission) => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message personnel */}
              <div className="space-y-2">
                <Label htmlFor="message">Message personnel (optionnel)</Label>
                <Input
                  id="message"
                  placeholder="Un message d'accompagnement..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="invite-success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  <strong>Invitation envoyée avec succès !</strong>
                </AlertDescription>
              </Alert>

              {/* Informations du membre invité */}
              <div className="bg-muted/50 p-3 rounded-md">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {inviteEmail.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{inviteEmail}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getRoleInfo(inviteRole).title}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-orange-600">
                        <Clock className="w-3 h-3 mr-1" />
                        En attente
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions selon le type d'invitation */}
              {inviteResult.existing_user && inviteResult.invitation_link && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <strong>Utilisateur existant détecté</strong>
                      <p className="text-xs mt-1">
                        Cette personne a déjà un compte. Partagez le lien ci-dessous pour qu'elle accède directement au projet.
                      </p>
                    </div>
                  </div>

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
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(inviteResult.invitation_link, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ouvrir le lien
                    </Button>
                  </div>
                </div>
              )}

              {inviteResult.supabase_invitation && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Un email d'invitation automatique a été envoyé via Supabase.
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter>
          {!inviteResult ? (
            <>
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
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              <Check className="w-4 h-4 mr-2" />
              Terminé
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}