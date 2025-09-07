import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Mail, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  ArrowRight,
  Shield,
  Eye,
  Edit,
  Users
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { useAuthContext } from "../hooks/useAuth";
import { supabase } from "../utils/supabase/client";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";

interface InvitationPageProps {
  token: string;
  onAccepted: (project: any) => void;
  onCancel: () => void;
}

interface InvitationData {
  project: {
    id: string;
    title: string;
    description: string;
    type: string;
  };
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  expires_at: string;
}

export default function InvitationPage({ token, onAccepted, onCancel }: InvitationPageProps) {
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthContext();

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

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
        if (response.status === 404) {
          throw new Error('Invitation introuvable ou invalide.');
        }
        if (response.status === 410) {
          throw new Error('Cette invitation a expiré.');
        }
        throw new Error('Erreur lors du chargement de l\'invitation.');
      }

      const data = await response.json();
      setInvitation(data.invitation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user || !invitation) return;

    try {
      setAccepting(true);
      setError(null);

      // Get access token from current session
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || publicAnonKey;

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
        if (response.status === 403) {
          throw new Error('Votre adresse email ne correspond pas à l\'invitation. Veuillez vous connecter avec l\'adresse email invitée.');
        }
        if (response.status === 404) {
          throw new Error('Invitation introuvable.');
        }
        if (response.status === 410) {
          throw new Error('Cette invitation a expiré.');
        }
        throw new Error('Erreur lors de l\'acceptation de l\'invitation.');
      }

      const result = await response.json();
      toast.success(`Vous avez rejoint le projet "${invitation.project.title}" !`);
      onAccepted(result.project);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'acceptation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAccepting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'editor': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'editor': return 'Éditeur';
      case 'viewer': return 'Lecteur';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'editor': return Edit;
      case 'viewer': return Eye;
      default: return Users;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin': return 'Peut gérer les membres et paramètres du projet';
      case 'editor': return 'Peut modifier les blocs et connexions du projet';
      case 'viewer': return 'Peut uniquement consulter le projet';
      default: return '';
    }
  };

  const isExpired = invitation && new Date() > new Date(invitation.expires_at);
  const isWrongEmail = user && invitation && user.email?.toLowerCase() !== invitation.email.toLowerCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de l'invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invitation invalide</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onCancel} className="w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>
              Vous devez être connecté pour accepter cette invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invitation && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Invitation pour :</p>
                <p className="font-medium">{invitation.project.title}</p>
                <p className="text-sm text-muted-foreground">En tant que {getRoleText(invitation.role)}</p>
              </div>
            )}
            <Button onClick={onCancel} className="w-full">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Invitation à rejoindre un projet</CardTitle>
          <CardDescription>
            Vous êtes invité à collaborer sur un projet
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Project Info */}
          <div className="p-4 border rounded-lg bg-muted/20">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{invitation.project.title.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{invitation.project.title}</h3>
                {invitation.project.description && (
                  <p className="text-sm text-muted-foreground mb-2">{invitation.project.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{invitation.project.type}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Role Information */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              {(() => {
                const RoleIcon = getRoleIcon(invitation.role);
                return <RoleIcon className="h-5 w-5 text-primary mt-0.5" />;
              })()}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">Votre rôle :</span>
                  <Badge variant="outline" className={getRoleColor(invitation.role)}>
                    {getRoleText(invitation.role)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getRoleDescription(invitation.role)}
                </p>
              </div>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email invité</span>
              </div>
              <p className="text-sm">{invitation.email}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Expire le</span>
              </div>
              <p className="text-sm">{new Date(invitation.expires_at).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {/* Status Messages */}
          {isExpired && (
            <Alert variant="destructive">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Cette invitation a expiré le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}.
              </AlertDescription>
            </Alert>
          )}

          {isWrongEmail && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Votre adresse email ({user.email}) ne correspond pas à l'invitation ({invitation.email}). 
                Veuillez vous connecter avec l'adresse email correcte.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
              disabled={accepting}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleAcceptInvitation}
              className="flex-1"
              disabled={accepting || isExpired || isWrongEmail}
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Acceptation...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accepter l'invitation
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}