import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Copy,
  Globe
} from "lucide-react";
import { toast } from "sonner@2.0.3";

export default function SupabaseConfigGuide() {
  const currentOrigin = window.location.origin;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL copiée dans le presse-papiers');
  };

  const requiredUrls = [
    `${currentOrigin}/**`,
    `${currentOrigin}/invitation**`,
    `${currentOrigin}/invitation`,
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Configuration requise dans Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Pour que les invitations fonctionnent, vous devez configurer les URLs de redirection autorisées dans votre dashboard Supabase.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Badge variant="outline">Étape 1</Badge>
              URLs de redirection autorisées
            </h4>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Allez dans <strong>Authentication → URL Configuration → Redirect URLs</strong> et ajoutez ces URLs :
              </p>
              
              <div className="space-y-2">
                {requiredUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 bg-background rounded p-2">
                    <code className="text-sm flex-1">{url}</code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(url)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Important :</strong> L'URL <code>{currentOrigin}/**</code> avec les double astérisques est recommandée pour couvrir tous les chemins de redirection.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Badge variant="outline">Étape 2</Badge>
              Templates d'emails
            </h4>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Allez dans <strong>Authentication → Email Templates</strong> et configurez :
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-background rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Invite user</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Template pour les invitations de collaboration
                  </p>
                </div>
                
                <div className="bg-background rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Confirm signup</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Template pour confirmer les nouveaux comptes
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Badge variant="outline">Étape 3</Badge>
              Configuration SMTP (optionnel)
            </h4>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Pour un envoi d'emails plus fiable, configurez un serveur SMTP dans <strong>Settings → Authentication</strong> :
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-background rounded p-3 text-center">
                  <p className="text-sm font-medium">Gmail</p>
                  <p className="text-xs text-muted-foreground">Gratuit jusqu'à 500 emails/jour</p>
                </div>
                <div className="bg-background rounded p-3 text-center">
                  <p className="text-sm font-medium">SendGrid</p>
                  <p className="text-xs text-muted-foreground">100 emails/jour gratuits</p>
                </div>
                <div className="bg-background rounded p-3 text-center">
                  <p className="text-sm font-medium">Resend</p>
                  <p className="text-xs text-muted-foreground">3000 emails/mois gratuits</p>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Après configuration :</strong> Les invitations seront envoyées automatiquement par email avec un lien de redirection vers votre application.
            </AlertDescription>
          </Alert>

          <Button className="w-full" asChild>
            <a 
              href={`https://supabase.com/dashboard/project/YOUR_PROJECT/auth/url-configuration`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ouvrir le dashboard Supabase
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}