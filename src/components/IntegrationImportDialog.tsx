import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Loader2,
  Download,
  FileText,
  Image,
  Lightbulb,
  BarChart3,
  AlertCircle,
  Check,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { useClaudeAPI } from "../hooks/useClaudeAPI";
import { useFigmaAPI } from "../hooks/useFigmaAPI";
import type { FigmaFile, FigmaProject, FigmaDesignData } from "../hooks/useFigmaAPI";
import type { ClaudeProjectAnalysis, ClaudeIdeaGeneration } from "../hooks/useClaudeAPI";

interface IntegrationImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationType: 'claude' | 'figma' | 'notion';
  onImportComplete: (data: any) => void;
}

export default function IntegrationImportDialog({
  open,
  onOpenChange,
  integrationType,
  onImportComplete
}: IntegrationImportDialogProps) {
  const [activeTab, setActiveTab] = useState('browse');
  const [error, setError] = useState<string | null>(null);
  
  // Claude hooks
  const {
    isLoading: claudeLoading,
    error: claudeError,
    analyzeProject,
    generateIdeas,
    improveContent,
    isConnected: isClaudeConnected
  } = useClaudeAPI();

  // Figma hooks
  const {
    isLoading: figmaLoading,
    error: figmaError,
    getUserProjects,
    getProjectFiles,
    importDesign,
    isConnected: isFigmaConnected
  } = useFigmaAPI();

  // States pour les données
  const [figmaProjects, setFigmaProjects] = useState<FigmaProject[]>([]);
  const [figmaFiles, setFigmaFiles] = useState<FigmaFile[]>([]);
  const [selectedProject, setSelectedProject] = useState<FigmaProject | null>(null);
  const [selectedFile, setSelectedFile] = useState<FigmaFile | null>(null);
  const [importedDesign, setImportedDesign] = useState<FigmaDesignData | null>(null);

  // States pour Claude
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState('brainstorming');
  const [claudeAnalysis, setClaudeAnalysis] = useState<ClaudeProjectAnalysis | null>(null);
  const [claudeIdeas, setClaudeIdeas] = useState<ClaudeIdeaGeneration | null>(null);
  const [ideaContext, setIdeaContext] = useState('');

  const isLoading = claudeLoading || figmaLoading;

  // Charger les projets Figma au montage
  useEffect(() => {
    if (open && integrationType === 'figma' && isFigmaConnected()) {
      loadFigmaProjects();
    }
  }, [open, integrationType]);

  const loadFigmaProjects = async () => {
    try {
      const projects = await getUserProjects();
      setFigmaProjects(projects);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadProjectFiles = async (project: FigmaProject) => {
    try {
      setSelectedProject(project);
      const files = await getProjectFiles(project.id);
      setFigmaFiles(files);
      setActiveTab('files');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFigmaImport = async (file: FigmaFile) => {
    try {
      setSelectedFile(file);
      const design = await importDesign(file.key);
      setImportedDesign(design);
      
      // Préparer les données pour l'import
      const importData = {
        type: 'figma-design',
        source: 'figma',
        metadata: design.metadata,
        content: {
          frames: design.frames,
          images: design.images
        }
      };
      
      onImportComplete(importData);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClaudeAnalyze = async () => {
    if (!projectTitle.trim() || !projectDescription.trim()) {
      setError('Veuillez remplir le titre et la description du projet');
      return;
    }

    try {
      const analysis = await analyzeProject(projectTitle, projectDescription, projectType);
      setClaudeAnalysis(analysis);
      
      const importData = {
        type: 'claude-analysis',
        source: 'claude',
        metadata: {
          projectTitle,
          projectType,
          analyzedAt: new Date().toISOString()
        },
        content: analysis
      };
      
      onImportComplete(importData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClaudeIdeas = async () => {
    if (!ideaContext.trim()) {
      setError('Veuillez décrire le contexte pour la génération d\'idées');
      return;
    }

    try {
      const ideas = await generateIdeas(ideaContext, 'design-thinking', 5);
      setClaudeIdeas(ideas);
      
      const importData = {
        type: 'claude-ideas',
        source: 'claude',
        metadata: {
          context: ideaContext,
          generatedAt: new Date().toISOString()
        },
        content: ideas
      };
      
      onImportComplete(importData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const renderClaudeContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="analyze" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analyser projet
        </TabsTrigger>
        <TabsTrigger value="ideas" className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Générer idées
        </TabsTrigger>
      </TabsList>

      <TabsContent value="analyze" className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="project-title">Titre du projet</Label>
            <Input
              id="project-title"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Ex: Application mobile de covoiturage"
            />
          </div>

          <div>
            <Label htmlFor="project-type">Type de projet</Label>
            <select
              id="project-type"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full p-2 border border-input rounded-md bg-background"
            >
              <option value="brainstorming">Brainstorming</option>
              <option value="user-research">Recherche utilisateur</option>
              <option value="product-design">Design produit</option>
              <option value="service-design">Design service</option>
              <option value="innovation">Innovation</option>
            </select>
          </div>

          <div>
            <Label htmlFor="project-description">Description du projet</Label>
            <textarea
              id="project-description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Décrivez votre projet, ses objectifs, le public cible..."
              rows={4}
              className="w-full p-2 border border-input rounded-md bg-background resize-none"
            />
          </div>

          <Button onClick={handleClaudeAnalyze} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyser le projet
              </>
            )}
          </Button>
        </div>

        {claudeAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Analyse terminée
              </CardTitle>
              <CardDescription>{claudeAnalysis.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Badge variant="outline" className="mb-2">Forces</Badge>
                <ul className="text-sm space-y-1">
                  {claudeAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">Suggestions</Badge>
                <ul className="text-sm space-y-1">
                  {claudeAnalysis.suggestions.slice(0, 3).map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="ideas" className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="idea-context">Contexte pour la génération d'idées</Label>
            <textarea
              id="idea-context"
              value={ideaContext}
              onChange={(e) => setIdeaContext(e.target.value)}
              placeholder="Ex: Comment améliorer l'expérience utilisateur lors du premier usage de l'application..."
              rows={4}
              className="w-full p-2 border border-input rounded-md bg-background resize-none"
            />
          </div>

          <Button onClick={handleClaudeIdeas} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Générer des idées
              </>
            )}
          </Button>
        </div>

        {claudeIdeas && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                {claudeIdeas.ideas.length} idées générées
              </CardTitle>
              <CardDescription>{claudeIdeas.context}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-60">
                <div className="space-y-3">
                  {claudeIdeas.ideas.map((idea, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{idea.title}</h4>
                        <div className="flex gap-1">
                          <Badge variant={idea.feasibility === 'high' ? 'default' : 'secondary'} className="text-xs">
                            {idea.feasibility}
                          </Badge>
                          <Badge variant={idea.impact === 'high' ? 'default' : 'secondary'} className="text-xs">
                            Impact {idea.impact}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{idea.description}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );

  const renderFigmaContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="browse">Parcourir</TabsTrigger>
        <TabsTrigger value="files" disabled={!selectedProject}>
          Fichiers {selectedProject ? `(${selectedProject.name})` : ''}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="browse">
        <ScrollArea className="max-h-96">
          <div className="space-y-2">
            {figmaProjects.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Chargement des projets...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              figmaProjects.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => loadProjectFiles(project)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Projet Figma
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="files">
        <ScrollArea className="max-h-96">
          <div className="space-y-2">
            {figmaFiles.map((file) => (
              <Card
                key={file.key}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleFigmaImport(file)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {file.thumbnail_url ? (
                        <img
                          src={file.thumbnail_url}
                          alt={file.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium">{file.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Modifié le {new Date(file.last_modified).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );

  const getDialogTitle = () => {
    switch (integrationType) {
      case 'claude':
        return 'Import depuis Claude';
      case 'figma':
        return 'Import depuis Figma';
      case 'notion':
        return 'Import depuis Notion';
      default:
        return 'Import de données';
    }
  };

  const getDialogDescription = () => {
    switch (integrationType) {
      case 'claude':
        return 'Utilisez Claude pour analyser vos projets et générer des idées créatives.';
      case 'figma':
        return 'Importez vos designs et prototypes Figma dans votre projet de design thinking.';
      case 'notion':
        return 'Synchronisez vos espaces de travail Notion avec vos projets.';
      default:
        return 'Importez des données depuis vos outils connectés.';
    }
  };

  // Vérifier si l'intégration est connectée
  const isIntegrationConnected = () => {
    switch (integrationType) {
      case 'claude':
        return isClaudeConnected();
      case 'figma':
        return isFigmaConnected();
      case 'notion':
        return true; // Suppose que Notion est déjà géré
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isIntegrationConnected() ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {integrationType.charAt(0).toUpperCase() + integrationType.slice(1)} n'est pas connecté. 
                Veuillez vous connecter d'abord dans la page d'intégrations.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              {integrationType === 'claude' && renderClaudeContent()}
              {integrationType === 'figma' && renderFigmaContent()}
              {integrationType === 'notion' && (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">
                    Fonctionnalités d'import Notion à venir...
                  </p>
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}