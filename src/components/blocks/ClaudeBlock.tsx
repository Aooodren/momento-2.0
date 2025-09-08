import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Brain, Play, Square, Loader2 } from 'lucide-react';

interface ClaudeBlockProps {
  data: {
    id: string;
    prompt: string;
    response: string;
    isProcessing: boolean;
    apiKey?: string;
  };
  selected: boolean;
}

export default function ClaudeBlock({ data, selected }: ClaudeBlockProps) {
  const [prompt, setPrompt] = useState(data.prompt || '');
  const [apiKey, setApiKey] = useState(data.apiKey || '');
  const [response, setResponse] = useState(data.response || '');
  const [isProcessing, setIsProcessing] = useState(data.isProcessing || false);
  const [showApiKey, setShowApiKey] = useState(!data.apiKey);

  const handleProcess = async () => {
    if (!prompt.trim()) {
      alert('Veuillez saisir un prompt');
      return;
    }

    if (!apiKey.trim()) {
      setShowApiKey(true);
      alert('Veuillez saisir votre clé API Claude');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simuler appel API Claude (remplacer par vraie API)
      const mockResponse = await simulateClaudeAPI(prompt);
      setResponse(mockResponse);
      
      // Propager la réponse aux autres blocs connectés
      if (window.momentoWorkflow) {
        window.momentoWorkflow.updateBlockData(data.id, {
          prompt,
          response: mockResponse,
          isProcessing: false,
          apiKey
        });
      }
    } catch (error) {
      console.error('Erreur Claude:', error);
      setResponse(`Erreur: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStop = () => {
    setIsProcessing(false);
  };

  // Simulation API Claude (à remplacer par vraie API)
  const simulateClaudeAPI = async (prompt: string): Promise<string> => {
    // Simuler délai réseau
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Réponses simulées basées sur le prompt
    if (prompt.toLowerCase().includes('design')) {
      return `# Analyse Design

Voici mon analyse de votre demande design :

## Points clés identifiés :
- **UX** : L'expérience utilisateur semble cohérente
- **UI** : Interface propre et moderne
- **Accessibilité** : Quelques améliorations possibles

## Recommandations :
1. Améliorer le contraste des couleurs
2. Ajouter des alternatives textuelles
3. Optimiser la navigation mobile

## Prochaines étapes :
- Créer des prototypes itératifs
- Tester avec des utilisateurs réels
- Documenter les décisions design`;
    }
    
    if (prompt.toLowerCase().includes('analyse')) {
      return `# Rapport d'analyse

## Résumé exécutif
Analyse complète effectuée selon vos critères.

## Méthodologie
- Approche structurée
- Données qualitatives et quantitatives
- Recommandations actionnables

## Conclusions
Les résultats indiquent des opportunités d'amélioration significatives.`;
    }

    return `# Réponse Claude

Merci pour votre demande : "${prompt}"

Voici ma réponse structurée :

## Analyse
J'ai analysé votre demande et identifié les éléments clés.

## Recommandations
- Point 1 : Approche méthodologique
- Point 2 : Considérations pratiques  
- Point 3 : Étapes suivantes

## Conclusion
N'hésitez pas à préciser votre demande pour une réponse plus ciblée.`;
  };

  return (
    <Card className={`w-80 ${selected ? 'ring-2 ring-blue-500' : ''} shadow-lg`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500"
        id="input"
      />
      
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm">Claude AI</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {isProcessing ? 'Processing...' : 'Ready'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Configuration API */}
        {showApiKey && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">
              Clé API Claude (optionnelle pour demo)
            </label>
            <Input
              type="password"
              placeholder="sk-ant-api03-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowApiKey(false)}
              className="text-xs"
            >
              Masquer
            </Button>
          </div>
        )}

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Prompt</label>
          <Textarea
            placeholder="Demandez à Claude d'analyser, expliquer, résumer..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[80px] text-sm resize-none"
            disabled={isProcessing}
          />
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isProcessing ? (
            <Button
              size="sm"
              onClick={handleProcess}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Play className="w-3 h-3 mr-1" />
              Analyser
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleStop}
              variant="outline"
              className="flex-1"
            >
              <Square className="w-3 h-3 mr-1" />
              Arrêter
            </Button>
          )}
          {!showApiKey && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowApiKey(true)}
            >
              Config
            </Button>
          )}
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-purple-50 p-2 rounded">
            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
            Claude analyse votre demande...
          </div>
        )}

        {/* Response Output */}
        {response && !isProcessing && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Réponse</label>
            <div className="bg-gray-50 p-3 rounded-lg text-sm max-h-40 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs">{response}</pre>
            </div>
          </div>
        )}
      </CardContent>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500"
        id="output"
      />
    </Card>
  );
}