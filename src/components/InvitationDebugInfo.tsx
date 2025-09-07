import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Copy, Info, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";

export default function InvitationDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papiers');
  };

  const checkSupabaseConfig = async () => {
    setLoading(true);
    try {
      // Get current origin
      const origin = window.location.origin;
      const redirectUrl = `${origin}/invitation?project=test&role=editor`;

      // Test invitation endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e/projects/test/members/invite`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            role: 'editor',
            message: 'Test invitation'
          }),
        }
      );

      const data = await response.json();

      setDebugInfo({
        origin,
        redirectUrl,
        response: {
          status: response.status,
          data
        },
        supabaseProjectId: projectId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          Diagnostic des invitations Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cet outil aide à diagnostiquer les problèmes d'invitation. Utilisez-le pour identifier les problèmes de configuration.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Configuration actuelle :</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground">Project ID</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-background px-2 py-1 rounded">{projectId}</code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(projectId)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground">Origin</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-background px-2 py-1 rounded">{window.location.origin}</code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(window.location.origin)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={checkSupabaseConfig} disabled={loading}>
            {loading ? 'Diagnostic en cours...' : 'Lancer le diagnostic'}
          </Button>

          {debugInfo && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-medium mb-2">Résultats du diagnostic :</p>
                
                {debugInfo.error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Erreur : {debugInfo.error}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={debugInfo.response?.status === 200 ? "default" : "destructive"}>
                        Status: {debugInfo.response?.status}
                      </Badge>
                      {debugInfo.response?.status === 200 && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">URL de redirection testée :</p>
                      <code className="text-xs bg-background p-2 rounded block">
                        {debugInfo.redirectUrl}
                      </code>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-1">Réponse du serveur :</p>
                      <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(debugInfo.response?.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Instructions pour résoudre les problèmes :</strong>
                  <br />
                  1. Vérifiez que <code>{window.location.origin}</code> est dans la liste des "Redirect URLs" dans votre dashboard Supabase (Authentication → URL Configuration)
                  <br />
                  2. Assurez-vous que les templates d'emails sont configurés (Authentication → Email Templates)
                  <br />
                  3. Vérifiez que SMTP est configuré ou utilisez un service d'email externe
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}