import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Mail, 
  Building2, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield,
  Clock
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { useAuthContext } from "../hooks/useAuth";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { supabase } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";

interface TokenInvitationPageProps {
  token: string;
  onAccepted: (project: any) => void;
  onCancel: () => void;
}

interface InvitationInfo {
  project: {
    id: string;
    title: string;
    description: string;
    type: string;
  };
  email: string;
  role: 'editor' | 'viewer';
  expires_at: string;
  method: string;
}

export default function TokenInvitationPage({ token, onAccepted, onCancel }: TokenInvitationPageProps) {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitationInfo();
  }, [token]);

  const fetchInvitationInfo = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e/invitations/${token}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invitation non trouvée');
      }

      const data = await response.json();
      setInvitationInfo(data.invitation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de l\'invitation';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitationInfo || !user) return;

    try {
      setAccepting(true);
      setError(null);

      // Get access token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No valid session found');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e/invitations/${token}/accept`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'acceptation');
      }

      const data = await response.json();
      
      toast.success('Invitation acceptée avec succès !');
      onAccepted(data.project);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'acceptation de l\'invitation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAccepting(false);
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'editor': return 'Éditeur';
      case 'viewer': return 'Lecteur';
      default: return role;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'editor':
        return 'Vous pourrez modifier les blocs et les connexions du projet';
      case 'viewer':
        return 'Vous pourrez consulter le projet mais pas le modifier';
      default:
        return '';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'editor':
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case 'viewer':
        return <Shield className="w-5 h-5 text-gray-600" />;
      default:
        return <UserPlus className="w-5 h-5 text-gray-600" />;
    }
  };

  const isExpired = invitationInfo ? new Date() > new Date(invitationInfo.expires_at) : false;
  const emailMismatch = invitationInfo && user ? invitationInfo.email.toLowerCase() !== user.email?.toLowerCase() : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground text-center">
              Chargement de l'invitation...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitationInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invitation invalide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Cette invitation est invalide ou a expiré.'}
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={onCancel} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Invitation à rejoindre un projet</CardTitle>
          <p className="text-muted-foreground">
            Vous avez été invité(e) à collaborer sur un projet
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Informations du projet */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{invitationInfo.project.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {invitationInfo.project.description || 'Projet collaboratif'}
                </p>
              </div>
            </div>
          </div>

          {/* Expiration */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              Expire le {new Date(invitationInfo.expires_at).toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          <Separator />

          {/* Rôle et permissions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Votre rôle :</span>
              <div className="flex items-center gap-2">
                {getRoleIcon(invitationInfo.role)}
                <Badge variant="outline" className="text-sm">
                  {getRoleText(invitationInfo.role)}
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {getRoleDescription(invitationInfo.role)}
            </p>
          </div>

          {/* Compte utilisateur */}
          {user && (
            <div className={`border rounded-lg p-3 ${emailMismatch ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {emailMismatch ? (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
                <span className={`text-sm font-medium ${emailMismatch ? 'text-yellow-900' : 'text-green-900'}`}>
                  {emailMismatch ? 'Attention - Email différent' : 'Connecté en tant que :'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    {user.name?.split(' ').map(n => n[0]).join('') || user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className={`text-sm font-medium ${emailMismatch ? 'text-yellow-900' : 'text-green-900'}`}>
                    {user.name || user.email}
                  </p>
                  <p className={`text-xs ${emailMismatch ? 'text-yellow-700' : 'text-green-700'}`}>
                    {user.email}
                  </p>
                </div>
              </div>
              {emailMismatch && (
                <p className="text-xs text-yellow-800 mt-2">
                  Cette invitation est pour <strong>{invitationInfo.email}</strong>. 
                  Connectez-vous avec le bon compte ou contactez l'inviteur.
                </p>
              )}
            </div>
          )}

          {/* Messages d'erreur/warnings */}
          {isExpired && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cette invitation a expiré. Contactez la personne qui vous a invité pour recevoir une nouvelle invitation.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={handleAcceptInvitation} 
              disabled={accepting || isExpired || emailMismatch}
              className="w-full"
            >
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Acceptation en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Accepter l'invitation
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={onCancel} disabled={accepting}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}