import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Search, 
  Calendar, 
  MessageCircle,
  MoreHorizontal,
  User,
  MapPin,
  Smartphone,
  Shield,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Share,
  UserPlus,
  Mail,
  Loader2,
  X
} from "lucide-react";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { useProjectMembers } from "../hooks/useProjectMembers";
import { useAuthContext } from "../hooks/useAuth";
import { toast } from "sonner@2.0.3";

interface SharePageProps {
  project: {
    id: string;
    title: string;
    type: string;
    from: 'myproject' | 'liked';
  };
  onBack: () => void;
}

interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status: 'active' | 'pending' | 'invited';
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: string;
  lastActiveAt?: string;
}



export default function SharePage({ project, onBack }: SharePageProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  
  const { user: currentUser } = useAuthContext();
  const { 
    members, 
    loading, 
    error, 
    getMembers, 
    inviteMember, 
    removeMember, 
    updateMemberRole 
  } = useProjectMembers(project.id);

  useEffect(() => {
    getMembers().catch(console.error);
  }, [getMembers]);

  // Créer la liste complète des membres avec l'utilisateur actuel en premier
  const allMembers = () => {
    if (!currentUser) return members;

    // Créer un membre pour l'utilisateur actuel
    const currentUserMember: Member = {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      avatarUrl: currentUser.avatar_url || undefined,
      status: 'active',
      role: members.find(m => m.id === currentUser.id)?.role || 'owner',
      joinedAt: currentUser.created_at,
      lastActiveAt: new Date().toISOString(), // Utilisateur actuel = maintenant
    };

    // Vérifier si l'utilisateur actuel est déjà dans la liste des membres
    const isCurrentUserInMembers = members.some(m => m.id === currentUser.id);
    
    if (isCurrentUserInMembers) {
      // Remplacer l'entrée existante et la mettre en premier
      const otherMembers = members.filter(m => m.id !== currentUser.id);
      return [currentUserMember, ...otherMembers];
    } else {
      // Ajouter l'utilisateur actuel en premier
      return [currentUserMember, ...members];
    }
  };

  const membersWithCurrentUser = allMembers();

  // Sélectionner automatiquement le premier membre (utilisateur actuel) quand les données sont chargées
  useEffect(() => {
    if (membersWithCurrentUser.length > 0 && !selectedMember) {
      setSelectedMember(membersWithCurrentUser[0]);
    }
  }, [membersWithCurrentUser, selectedMember]);

  const filteredMembers = membersWithCurrentUser.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Veuillez saisir une adresse email");
      return;
    }

    if (!inviteEmail.includes('@')) {
      toast.error("Veuillez saisir une adresse email valide");
      return;
    }

    try {
      setInviting(true);
      const response = await inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole
      });
      
      setInviteEmail("");
      
      if (response.existing_user) {
        toast.success(`Invitation créée pour ${inviteEmail}`, {
          description: "Cet utilisateur a déjà un compte. Un lien d'invitation a été créé."
        });
      } else {
        toast.success(`Invitation envoyée à ${inviteEmail}`, {
          description: "Un email d'invitation a été envoyé via Supabase Auth."
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    // Empêcher la suppression de l'utilisateur actuel
    if (currentUser && memberId === currentUser.id) {
      toast.error("Vous ne pouvez pas vous retirer du projet");
      return;
    }

    try {
      // Sauvegarder si le membre supprimé était sélectionné
      const wasSelectedMember = selectedMember?.id === memberId;
      
      await removeMember(memberId);
      
      // Si le membre supprimé était sélectionné, sélectionner l'utilisateur actuel ou le premier membre disponible
      if (wasSelectedMember) {
        // Attendre un peu pour que la liste soit mise à jour
        setTimeout(() => {
          const updatedMembers = allMembers();
          if (currentUser) {
            // Sélectionner l'utilisateur actuel en premier
            const currentUserInList = updatedMembers.find(m => m.id === currentUser.id);
            setSelectedMember(currentUserInList || updatedMembers[0] || null);
          } else {
            setSelectedMember(updatedMembers[0] || null);
          }
        }, 100);
      }
      
      toast.success("Membre supprimé du projet");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      
      // Afficher un message d'erreur plus détaillé
      if (error instanceof Error) {
        // Essayer de parser une réponse JSON si possible
        try {
          const errorData = error.message.includes('HTTP error!') ? 
            'Erreur de permissions ou membre introuvable' : 
            error.message;
          toast.error(`Erreur lors de la suppression: ${errorData}`);
        } catch {
          toast.error(`Erreur lors de la suppression: ${error.message}`);
        }
      } else {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const confirmRemoveMember = async () => {
    if (memberToRemove) {
      await handleRemoveMember(memberToRemove.id);
      setMemberToRemove(null);
    }
  };

  const openRemoveDialog = (member: Member) => {
    setMemberToRemove(member);
  };

  const handleRoleChange = async (memberId: string, newRole: Member['role']) => {
    try {
      await updateMemberRole(memberId, newRole);
      toast.success("Rôle modifié avec succès");
    } catch (error) {
      toast.error("Erreur lors de la modification du rôle");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'invited': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'pending': return 'En attente';
      case 'invited': return 'Invité';
      default: return 'Inconnu';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'editor': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'owner': return 'Propriétaire';
      case 'admin': return 'Admin';
      case 'editor': return 'Éditeur';
      case 'viewer': return 'Lecteur';
      default: return role;
    }
  };

  const getLastActiveText = (lastActiveAt: string) => {
    const now = new Date();
    const lastActive = new Date(lastActiveAt);
    const diffInMs = now.getTime() - lastActive.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'À l\'instant';
    } else if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else if (diffInDays === 1) {
      return 'Hier';
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays}j`;
    } else {
      return lastActive.toLocaleDateString();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
              <Share className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-medium">Partager "{project.title}"</h1>
              <p className="text-sm text-muted-foreground">
                Gérez les membres et les permissions d'accès à ce projet
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Section gauche - Recent Members */}
        <div className="w-96 border-r border-border bg-muted/30">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-muted-foreground">Membres du projet</h3>
            </div>
            
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un membre..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Section d'invitation */}
            <div className="mb-6 p-4 bg-card border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Inviter un membre</span>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Adresse email..."
                    className="pl-10"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleInviteMember();
                      }
                    }}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={inviteRole} onValueChange={(value: 'editor' | 'viewer') => setInviteRole(value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Éditeur</SelectItem>
                      <SelectItem value="viewer">Lecteur</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={handleInviteMember}
                    disabled={inviting || !inviteEmail.trim()}
                    size="sm"
                  >
                    {inviting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Inviter"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="mb-6" />

            <ScrollArea className="h-[calc(100vh-400px)]">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Chargement...</span>
                </div>
              )}

              {error && (
                <div className="text-center py-8 text-sm text-destructive">
                  Erreur : {error}
                </div>
              )}

              {!loading && !error && (
                <div className="space-y-3">
                  {filteredMembers.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      {searchTerm ? 'Aucun membre trouvé' : 'Aucun membre dans ce projet'}
                    </div>
                  ) : (
                    filteredMembers.map((member, index) => {
                      const isCurrentUser = currentUser && member.id === currentUser.id;
                      const showSeparator = index === 1 && currentUser && filteredMembers[0]?.id === currentUser.id && filteredMembers.length > 1;
                      
                      return (
                        <div key={member.id}>
                          {showSeparator && (
                            <div className="flex items-center gap-3 my-3">
                              <Separator className="flex-1" />
                              <span className="text-xs text-muted-foreground px-2">Autres membres</span>
                              <Separator className="flex-1" />
                            </div>
                          )}
                          <div
                            className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                              selectedMember?.id === member.id
                                ? 'bg-primary/10 border border-primary/20'
                                : 'hover:bg-accent/50'
                            } ${isCurrentUser ? 'bg-accent/30 border border-primary/10' : ''}`}
                            onClick={() => setSelectedMember(member)}
                          >
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatarUrl} alt={member.name} />
                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          {member.status === 'active' && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {member.name}
                              {isCurrentUser && <span className="text-xs text-primary ml-1 font-medium">(Vous)</span>}
                            </p>
                            <Badge variant="outline" className={`text-xs ${getRoleColor(member.role)}`}>
                              {getRoleText(member.role)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`}></div>
                            <span className="text-xs text-muted-foreground">{getStatusText(member.status)}</span>
                            {member.lastActiveAt && (
                              <>
                                <span className="text-xs text-muted-foreground mx-1">•</span>
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {isCurrentUser ? "En ligne" : getLastActiveText(member.lastActiveAt)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Section droite - Member Details */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-muted-foreground">Détails du membre</h3>
            </div>
          </div>

          {selectedMember ? (
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto">
                {/* En-tête du membre */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedMember.avatarUrl} alt={selectedMember.name} />
                        <AvatarFallback>{selectedMember.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      {selectedMember.status === 'active' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        {selectedMember.name}
                        {currentUser && selectedMember.id === currentUser.id && (
                          <span className="text-sm text-muted-foreground ml-2">(Vous)</span>
                        )}
                      </h2>
                      <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedMember.status)}`}></div>
                      <span className="text-sm font-medium">
                        {getStatusText(selectedMember.status)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(selectedMember.joinedAt).toLocaleDateString()}
                    </div>
                    {currentUser && selectedMember.id !== currentUser.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRemoveDialog(selectedMember)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Rôle et permissions */}
                <div className="mb-8">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={`${getRoleColor(selectedMember.role)}`}>
                      {getRoleText(selectedMember.role)}
                    </Badge>
                    
                    {selectedMember.role !== 'owner' && (!currentUser || selectedMember.id !== currentUser.id) && (
                      <Select 
                        value={selectedMember.role} 
                        onValueChange={(newRole: Member['role']) => handleRoleChange(selectedMember.id, newRole)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Éditeur</SelectItem>
                          <SelectItem value="viewer">Lecteur</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Informations d'accès */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Rôle</div>
                    <div className="font-medium">{getRoleText(selectedMember.role)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Statut</div>
                    <div className="font-medium">{getStatusText(selectedMember.status)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {selectedMember.status === 'invited' ? 'Invité le' : 'Rejoint le'}
                    </div>
                    <div className="font-medium">{new Date(selectedMember.joinedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Dernière activité</div>
                    <div className="font-medium">
                      {currentUser && selectedMember.id === currentUser.id 
                        ? 'En ligne' 
                        : selectedMember.lastActiveAt 
                          ? getLastActiveText(selectedMember.lastActiveAt) 
                          : 'Inconnue'
                      }
                    </div>
                  </div>
                </div>

                <Separator className="mb-8" />

                {/* Permissions détaillées */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-4">Permissions</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className={`w-4 h-4 ${selectedMember.role === 'viewer' ? 'text-muted-foreground' : 'text-green-500'}`} />
                        <span className="text-sm font-medium">Lecture</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Peut voir le projet et ses détails
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className={`w-4 h-4 ${['editor', 'admin', 'owner'].includes(selectedMember.role) ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">Édition</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Peut modifier les blocs et connexions
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className={`w-4 h-4 ${['admin', 'owner'].includes(selectedMember.role) ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">Gestion</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Peut gérer les membres et paramètres
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className={`w-4 h-4 ${selectedMember.role === 'owner' ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">Propriété</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Peut supprimer le projet
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Sélectionnez un membre pour voir ses détails</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border bg-muted/30">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {membersWithCurrentUser.length} membre{membersWithCurrentUser.length !== 1 ? 's' : ''} • {filteredMembers.length} affiché{filteredMembers.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack}>
              Fermer
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <span className="font-medium">{memberToRemove?.name}</span> ({memberToRemove?.email}) du projet "{project.title}" ? 
              <br /><br />
              Cette action est irréversible et le membre perdra immédiatement l'accès au projet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}