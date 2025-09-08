import { useState, useCallback } from 'react';

export interface ClaudeResponse {
  content: string;
  model: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeProjectAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  opportunities: string[];
  threats: string[];
  summary: string;
}

export interface ClaudeIdeaGeneration {
  ideas: Array<{
    title: string;
    description: string;
    category: string;
    feasibility: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
  }>;
  context: string;
}

export function useClaudeAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getApiKey = useCallback(() => {
    const apiKey = localStorage.getItem('claude_api_key');
    if (!apiKey) {
      throw new Error('Clé API Claude non configurée');
    }
    return apiKey;
  }, []);

  const callClaude = useCallback(async (
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt?: string
  ): Promise<ClaudeResponse> => {
    const apiKey = getApiKey();
    
    const requestBody: any = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Erreur API Claude');
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      model: data.model,
      usage: data.usage
    };
  }, [getApiKey]);

  // Analyser un projet de design thinking
  const analyzeProject = useCallback(async (
    projectTitle: string,
    projectDescription: string,
    projectType: string
  ): Promise<ClaudeProjectAnalysis> => {
    setIsLoading(true);
    setError(null);

    try {
      const systemPrompt = `Tu es un expert en design thinking et innovation. Analyse le projet fourni et génère une analyse structurée.`;
      
      const messages = [{
        role: 'user' as const,
        content: `Analyse ce projet de design thinking :

Titre: ${projectTitle}
Type: ${projectType}
Description: ${projectDescription}

Fournis une analyse structurée avec :
- Forces (strengths) : 3-5 points forts du projet
- Faiblesses (weaknesses) : 3-5 points d'amélioration
- Suggestions : 3-5 recommandations concrètes
- Opportunités : 3-5 opportunités à saisir
- Menaces/Risques : 3-5 risques à anticiper
- Résumé : synthèse en 2-3 phrases

Réponds au format JSON pur sans markdown :
{
  "strengths": ["point 1", "point 2", ...],
  "weaknesses": ["point 1", "point 2", ...],
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "opportunities": ["opportunité 1", "opportunité 2", ...],
  "threats": ["risque 1", "risque 2", ...],
  "summary": "résumé du projet"
}`
      }];

      const response = await callClaude(messages, systemPrompt);
      
      // Parser la réponse JSON
      let analysisData;
      try {
        analysisData = JSON.parse(response.content);
      } catch {
        // Si le parsing échoue, essayer d'extraire le JSON de la réponse
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Format de réponse invalide');
        }
      }

      return analysisData as ClaudeProjectAnalysis;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'analyse du projet';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [callClaude]);

  // Générer des idées pour un contexte donné
  const generateIdeas = useCallback(async (
    context: string,
    category: string = 'general',
    count: number = 5
  ): Promise<ClaudeIdeaGeneration> => {
    setIsLoading(true);
    setError(null);

    try {
      const systemPrompt = `Tu es un expert en créativité et brainstorming. Génère des idées innovantes et pratiques.`;
      
      const messages = [{
        role: 'user' as const,
        content: `Génère ${count} idées créatives pour le contexte suivant :

Contexte: ${context}
Catégorie: ${category}

Pour chaque idée, évalue :
- Faisabilité (low/medium/high)
- Impact potentiel (low/medium/high)

Réponds au format JSON pur sans markdown :
{
  "ideas": [
    {
      "title": "Titre de l'idée",
      "description": "Description détaillée",
      "category": "catégorie",
      "feasibility": "medium",
      "impact": "high"
    }
  ],
  "context": "résumé du contexte analysé"
}`
      }];

      const response = await callClaude(messages, systemPrompt);
      
      // Parser la réponse JSON
      let ideasData;
      try {
        ideasData = JSON.parse(response.content);
      } catch {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          ideasData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Format de réponse invalide');
        }
      }

      return ideasData as ClaudeIdeaGeneration;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la génération d\'idées';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [callClaude]);

  // Améliorer du contenu textuel
  const improveContent = useCallback(async (
    content: string,
    improvementType: 'clarity' | 'creativity' | 'structure' | 'engagement'
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const improvementPrompts = {
        clarity: 'Améliore la clarté et la compréhension de ce contenu',
        creativity: 'Rends ce contenu plus créatif et engageant',
        structure: 'Améliore la structure et l\'organisation de ce contenu',
        engagement: 'Rends ce contenu plus captivant et persuasif'
      };

      const systemPrompt = `Tu es un expert en rédaction et communication. ${improvementPrompts[improvementType]}.`;
      
      const messages = [{
        role: 'user' as const,
        content: `${improvementPrompts[improvementType]} :

${content}

Conserve le sens original tout en améliorant selon le critère demandé. Réponds directement avec le contenu amélioré, sans préambule.`
      }];

      const response = await callClaude(messages, systemPrompt);
      return response.content;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'amélioration du contenu';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [callClaude]);

  // Vérifier si Claude est connecté
  const isConnected = useCallback(() => {
    try {
      getApiKey();
      return true;
    } catch {
      return false;
    }
  }, [getApiKey]);

  return {
    isLoading,
    error,
    analyzeProject,
    generateIdeas,
    improveContent,
    isConnected,
    callClaude
  };
}