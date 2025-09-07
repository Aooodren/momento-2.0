import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle, XCircle, Database, Server } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface TestResult {
  test: string;
  status: 'loading' | 'success' | 'error';
  message: string;
  data?: any;
}

export default function SupabaseTestComponent() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTestResult = (testName: string, status: TestResult['status'], message: string, data?: any) => {
    setTests(prev => {
      const existing = prev.find(t => t.test === testName);
      if (existing) {
        return prev.map(t => t.test === testName ? { ...t, status, message, data } : t);
      } else {
        return [...prev, { test: testName, status, message, data }];
      }
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setTests([]);

    // Test 1: Configuration check
    updateTestResult('Configuration', 'loading', 'Vérification de la configuration...');
    
    try {
      if (!projectId || !publicAnonKey) {
        throw new Error('Configuration manquante');
      }
      updateTestResult('Configuration', 'success', `Project ID: ${projectId.substring(0, 8)}...`);
    } catch (error) {
      updateTestResult('Configuration', 'error', `Erreur: ${error.message}`);
      setIsRunning(false);
      return;
    }

    // Test 2: Server health check
    updateTestResult('Server Health', 'loading', 'Test de connectivité serveur...');
    
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      updateTestResult('Server Health', 'success', `Serveur opérationnel - ${data.storage}`, data);
    } catch (error) {
      updateTestResult('Server Health', 'error', `Erreur serveur: ${error.message}`);
    }

    // Test 3: Database operations
    updateTestResult('Database Test', 'loading', 'Test des opérations base de données...');
    
    try {
      // Test création d'un projet
      const testProject = {
        title: 'Test Project ' + Date.now(),
        description: 'Projet de test pour la connexion Supabase',
        type: 'canvas'
      };

      const createResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testProject)
      });

      if (!createResponse.ok) {
        throw new Error(`Échec création: ${createResponse.status}`);
      }

      const createdProject = await createResponse.json();
      
      // Test récupération des projets
      const listResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e/projects`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!listResponse.ok) {
        throw new Error(`Échec lecture: ${listResponse.status}`);
      }

      const projects = await listResponse.json();
      
      updateTestResult('Database Test', 'success', `CRUD OK - ${projects.projects.length} projet(s)`, {
        created: createdProject.project.title,
        total: projects.projects.length
      });
    } catch (error) {
      updateTestResult('Database Test', 'error', `Erreur DB: ${error.message}`);
    }

    // Test 4: Demo data
    updateTestResult('Demo Data', 'loading', 'Initialisation des données de démonstration...');
    
    try {
      const demoResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6c8ffc9e/init-demo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!demoResponse.ok) {
        throw new Error(`HTTP ${demoResponse.status}`);
      }

      const demoData = await demoResponse.json();
      updateTestResult('Demo Data', 'success', demoData.message, demoData);
    } catch (error) {
      updateTestResult('Demo Data', 'error', `Erreur démo: ${error.message}`);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return <Badge variant="secondary">En cours...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Succès</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Test de Connexion Supabase
          </CardTitle>
          <CardDescription>
            Vérification de la connectivité et des fonctionnalités Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tests en cours...
              </>
            ) : (
              <>
                <Server className="mr-2 h-4 w-4" />
                Lancer les tests
              </>
            )}
          </Button>

          {tests.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Résultats des tests :</h3>
              {tests.map((test, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  {getStatusIcon(test.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{test.test}</span>
                      {getStatusBadge(test.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{test.message}</p>
                    {test.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          Voir les détails
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tests.length > 0 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Informations de connexion :</h4>
              <div className="text-sm space-y-1">
                <p><strong>Project ID:</strong> {projectId}</p>
                <p><strong>URL Serveur:</strong> https://{projectId}.supabase.co/functions/v1/make-server-6c8ffc9e</p>
                <p><strong>Status:</strong> {tests.every(t => t.status === 'success') ? '✅ Tous les tests réussis' : 
                  tests.some(t => t.status === 'error') ? '❌ Certains tests ont échoué' : '🔄 Tests en cours'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}