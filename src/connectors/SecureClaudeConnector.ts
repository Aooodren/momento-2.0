// Connecteur Claude ultra-sécurisé utilisant le backend unifié
import { ApplicationConnector } from '../hooks/useWorkflowEngine';
import { secureIntegrationsService } from '../services/secureIntegrationsService';

export class SecureClaudeConnector implements ApplicationConnector {
  type = 'claude' as const;

  async execute(operation: string, config: Record<string, any>, input?: any): Promise<any> {
    console.log(`[SecureClaude] Exécution sécurisée: ${operation}`, { config, input });

    switch (operation) {
      case 'generate_text':
        return this.generateText(config.prompt, input, config);
      
      case 'analyze_content':
        return this.analyzeContent(input, config.analysisType);
      
      case 'summarize':
        return this.summarize(input, config.maxLength);
      
      case 'extract_insights':
        return this.extractInsights(input);
      
      case 'generate_ideas':
        return this.generateIdeas(config.topic, config.context, input);
      
      case 'improve_text':
        return this.improveText(input, config.style);
      
      case 'translate':
        return this.translate(input, config.targetLanguage);
      
      case 'answer_question':
        return this.answerQuestion(config.question, input);
      
      default:
        throw new Error(`Opération Claude sécurisée non supportée: ${operation}`);
    }
  }

  validate(operation: string, config: Record<string, any>): boolean {
    switch (operation) {
      case 'generate_text':
        return !!config.prompt;
      
      case 'analyze_content':
      case 'summarize':
      case 'extract_insights':
      case 'improve_text':
      case 'translate':
        return true; // Ces opérations utilisent l'input
      
      case 'generate_ideas':
        return !!config.topic;
      
      case 'answer_question':
        return !!config.question;
      
      default:
        return false;
    }
  }

  getOperations(): string[] {
    return [
      'generate_text',
      'analyze_content',
      'summarize',
      'extract_insights',
      'generate_ideas',
      'improve_text',
      'translate',
      'answer_question'
    ];
  }

  // Implémentations sécurisées

  private async generateText(prompt: string, input?: any, config: Record<string, any> = {}) {
    try {
      const response = await secureIntegrationsService.claude_generateText(
        prompt,
        typeof input === 'string' ? input : JSON.stringify(input),
        {
          model: config.model,
          maxTokens: config.maxTokens,
          temperature: config.temperature
        }
      );

      return {
        id: response.id,
        content: response.content,
        model: response.model,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Impossible de générer le texte: ${error.message}`);
    }
  }

  private async analyzeContent(input: any, analysisType: string = 'general') {
    try {
      const content = typeof input === 'string' ? input : JSON.stringify(input);
      
      const analysis = await secureIntegrationsService.claude_analyzeContent(content);
      
      return {
        analysis,
        analysisType,
        originalContent: content,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Impossible d'analyser le contenu: ${error.message}`);
    }
  }

  private async summarize(input: any, maxLength: number = 200) {
    try {
      const content = typeof input === 'string' ? input : JSON.stringify(input);
      
      const summary = await secureIntegrationsService.claude_summarize(content, maxLength);
      
      return {
        summary,
        originalLength: content.length,
        maxLength,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Impossible de résumer: ${error.message}`);
    }
  }

  private async extractInsights(input: any) {
    try {
      // Utiliser l'analyse pour extraire des insights
      const analysisResult = await this.analyzeContent(input, 'insights');
      
      // Parser les insights de l'analyse
      const insights = this.parseInsightsFromAnalysis(analysisResult.analysis);
      
      return {
        insights,
        source: 'claude_analysis',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Impossible d'extraire les insights: ${error.message}`);
    }
  }

  private async generateIdeas(topic: string, context?: string, input?: any) {
    try {
      const prompt = this.buildIdeasPrompt(topic, context, input);
      
      const response = await secureIntegrationsService.claude_generateText(prompt);
      
      // Parser les idées de la réponse
      const ideas = this.parseIdeasFromResponse(response.content);
      
      return {
        ideas,
        topic,
        context,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Impossible de générer des idées: ${error.message}`);
    }
  }

  private async improveText(input: any, style: string = 'professional') {
    try {
      const text = typeof input === 'string' ? input : JSON.stringify(input);
      
      const prompt = `Améliorez le texte suivant selon le style "${style}":\n\n${text}`;
      
      const response = await secureIntegrationsService.claude_generateText(prompt);
      
      return {
        improvedText: response.content,
        originalText: text,
        style,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Impossible d'améliorer le texte: ${error.message}`);
    }
  }

  private async translate(input: any, targetLanguage: string) {
    try {
      const text = typeof input === 'string' ? input : JSON.stringify(input);
      
      const prompt = `Traduisez le texte suivant en ${targetLanguage}:\n\n${text}`;
      
      const response = await secureIntegrationsService.claude_generateText(prompt);
      
      return {
        translatedText: response.content,
        originalText: text,
        targetLanguage,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Impossible de traduire: ${error.message}`);
    }
  }

  private async answerQuestion(question: string, input?: any) {
    try {
      const context = input ? (typeof input === 'string' ? input : JSON.stringify(input)) : '';
      
      let prompt = `Répondez à la question suivante: ${question}`;
      if (context) {
        prompt += `\n\nContexte:\n${context}`;
      }
      
      const response = await secureIntegrationsService.claude_generateText(prompt);
      
      return {
        answer: response.content,
        question,
        context: context || null,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Impossible de répondre à la question: ${error.message}`);
    }
  }

  // Méthodes utilitaires

  private buildIdeasPrompt(topic: string, context?: string, input?: any): string {
    let prompt = `Générez 5-7 idées créatives et pratiques sur le sujet: "${topic}"`;
    
    if (context) {
      prompt += `\n\nContexte: ${context}`;
    }
    
    if (input) {
      prompt += `\n\nInformations supplémentaires: ${typeof input === 'string' ? input : JSON.stringify(input)}`;
    }
    
    prompt += '\n\nFormat: Une liste numérotée avec des idées concises et actionables.';
    
    return prompt;
  }

  private parseInsightsFromAnalysis(analysis: string): string[] {
    // Parser les insights depuis l'analyse Claude
    const lines = analysis.split('\n').filter(line => line.trim());
    const insights: string[] = [];
    
    for (const line of lines) {
      // Chercher les lignes qui semblent être des insights
      if (line.includes('insight') || line.includes('observation') || line.includes('•') || line.includes('-')) {
        const cleaned = line.replace(/^[•\-\*\d\.]+\s*/, '').trim();
        if (cleaned.length > 10) {
          insights.push(cleaned);
        }
      }
    }
    
    return insights.slice(0, 10); // Limiter à 10 insights
  }

  private parseIdeasFromResponse(response: string): string[] {
    // Parser les idées depuis la réponse Claude
    const lines = response.split('\n').filter(line => line.trim());
    const ideas: string[] = [];
    
    for (const line of lines) {
      // Chercher les lignes numérotées ou avec des puces
      if (/^\d+\./.test(line) || line.includes('•') || line.includes('-')) {
        const cleaned = line.replace(/^[\d\.\-•\*\s]+/, '').trim();
        if (cleaned.length > 5) {
          ideas.push(cleaned);
        }
      }
    }
    
    return ideas.slice(0, 10); // Limiter à 10 idées
  }
}

export default SecureClaudeConnector;