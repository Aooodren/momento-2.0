import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Mail,
  TestTube,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { supabase } from "../utils/supabase/client";

export default function InvitationTestComponent() {
  const [testEmail, setTestEmail] = useState("");
  const [testRole, setTestRole] = useState<'editor' | 'viewer'>('editor');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const runInvitationTest = async () => {
    if (!testEmail.trim()) {
      toast.error("Veuillez saisir une adresse email de test");
      return;
    }

    if (!testEmail.includes('@')) {
      toast.error("Veuillez saisir une adresse email valide");
      return;
    }

    setTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      // Get access token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('Aucune session active');
      }

      console.log('🧪 Test d\'invitation démarré');
      console.log('📧 Email:', testEmail);
      console.log('👤 Rôle:', testRole);
      console.log('🔑 Access Token:', accessToken ? 'Présent' : 'Absent');
      console.log('🌐 Origin:', window.location.origin);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e/test/invitation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Origin': window.location.origin,
            'Referer': window.location.href,
          },
          body: JSON.stringify({
            email: testEmail.trim(),
            role: testRole,
            message: 'Test d\'invitation depuis le composant de diagnostic'
          }),
        }
      );

      const responseText = await response.text();
      console.log('📡 Response Status:', response.status);
      console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
      console.log('📡 Response Text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        data = { rawResponse: responseText };
      }

      if (!response.ok) {
        console.error('❌ Test échoué:', data);
        setTestError(data.error || `HTTP ${response.status}: ${responseText}`);
        setTestResult({
          success: false,
          status: response.status,
          data,
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log('✅ Test réussi:', data);
      setTestResult({
        success: true,
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      });

      toast.success('Test d\'invitation réussi !');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('💥 Erreur pendant le test:', error);
      setTestError(errorMessage);
      setTestResult({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papiers');
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-blue-600" />
          Test d'invitation en temps réel
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Testez le système d'invitation pour diagnostiquer les problèmes
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Interface de test */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email de test</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="test@example.com"
                className="pl-10"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    runInvitationTest();
                  }
                }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Rôle</label>
            <select 
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={testRole}
              onChange={(e) => setTestRole(e.target.value as 'editor' | 'viewer')}
            >
              <option value="editor">Éditeur</option>
              <option value="viewer">Lecteur</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Action</label>
            <Button 
              onClick={runInvitationTest}
              disabled={testing || !testEmail.trim()}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Lancer le test
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Informations de configuration */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-sm">Configuration actuelle</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Supabase Project ID:</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-background px-2 py-1 rounded text-xs">{projectId}</code>
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
            <div>
              <span className="text-muted-foreground">Origin:</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-background px-2 py-1 rounded text-xs">{window.location.origin}</code>
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

        {/* Résultats du test */}
        {testError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erreur de test :</strong> {testError}
            </AlertDescription>
          </Alert>
        )}

        {testResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <h4 className="font-medium">
                Résultat du test
              </h4>
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? 'Succès' : 'Échec'}
              </Badge>
              {testResult.status && (
                <Badge variant="outline">
                  HTTP {testResult.status}
                </Badge>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Réponse détaillée</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(testResult, null, 2))}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </Button>
              </div>
              <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>

            {testResult.success && testResult.data?.invitation_link && (
              <Alert>
                <ExternalLink className="h-4 w-4" />
                <AlertDescription>
                  <strong>Lien d'invitation généré :</strong>
                  <br />
                  <a 
                    href={testResult.data.invitation_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {testResult.data.invitation_link}
                  </a>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Instructions de débogage */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Conseils de débogage :</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Vérifiez les logs dans la console du navigateur</li>
              <li>Assurez-vous que l'URL {window.location.origin} est autorisée dans Supabase</li>
              <li>Vérifiez que les templates d'email sont configurés</li>
              <li>Testez avec un email qui n'existe pas encore dans Supabase</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}