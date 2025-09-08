import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { 
  ArrowLeft, X, Save, Calendar as CalendarIcon, 
  Tag, FileText, Settings, Trash2
} from "lucide-react";
// import { format } from "date-fns";
// import { fr } from "date-fns/locale";

interface ProjectDetails {
  id: string;
  title: string;
  type: string;
  from: 'myproject' | 'liked';
  description?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
}

interface ProjectEditPageProps {
  project: ProjectDetails;
  onBack: () => void;
  onProjectUpdate: (project: ProjectDetails) => void;
}

interface ProjectData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  tags: string[];
  type: string;
}

export default function ProjectEditPage({ project, onBack, onProjectUpdate }: ProjectEditPageProps) {
  const [projectData, setProjectData] = useState<ProjectData>({
    title: project.title,
    description: project.description || "This task focuses on preparing a high-impact visual presentation that showcases the new website design concept for Client X. The goal is to clearly communicate the updated UI direction, design system, and user flow improvements to the client in a concise and engaging format.\n\nThe presentation will include wireframes, visual mockups, user journey maps, and interactive prototypes to demonstrate the enhanced user experience and business value proposition.",
    startDate: project.startDate || new Date(2025, 5, 3), // June 3, 2025
    endDate: project.endDate || new Date(2025, 5, 28), // June 28, 2025
    tags: project.tags || ["Design", "Client Work"],
    type: project.type
  });

  const [newTag, setNewTag] = useState("");
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsModified(true);
  }, [projectData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the project with ALL new data
      const updatedProject = {
        ...project,
        title: projectData.title,
        type: projectData.type,
        description: projectData.description,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        tags: projectData.tags
      };
      
      console.log('ProjectEditPage - Saving project:', updatedProject);
      onProjectUpdate(updatedProject);
      setIsModified(false);
      
      // Go back to detail page
      onBack();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !projectData.tags.includes(newTag.trim())) {
      setProjectData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setProjectData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getTagColor = (tag: string) => {
    // Couleurs prédéfinies pour les tags (même système que ProjectDetailPage)
    const tagColors = [
      'bg-red-50 text-red-700 border-red-200',
      'bg-green-50 text-green-700 border-green-200',
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-yellow-50 text-yellow-700 border-yellow-200',
      'bg-purple-50 text-purple-700 border-purple-200',
      'bg-indigo-50 text-indigo-700 border-indigo-200',
    ];
    
    // Utilise l'index du tag dans la liste pour assigner une couleur consistante
    const tagIndex = projectData.tags.indexOf(tag);
    return tagColors[tagIndex % tagColors.length] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Client Projects</span>
              <span>/</span>
              <span>{project.title}</span>
              <span>/</span>
              <span className="text-foreground font-medium">Modifier les propriétés</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleSave}
              disabled={!isModified || isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-8">
        <div className="space-y-8">
          {/* Project Title */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-medium">Informations générales</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Titre du projet
                </label>
                <Input
                  value={projectData.title}
                  onChange={(e) => setProjectData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nom du projet"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Type de projet
                </label>
                <Input
                  value={projectData.type}
                  onChange={(e) => setProjectData(prev => ({ ...prev, type: e.target.value }))}
                  placeholder="Type de projet"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-medium">Description</h2>
            </div>
            <Textarea
              value={projectData.description}
              onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description détaillée du projet..."
              className="min-h-[150px] resize-y"
            />
          </div>

          <Separator />

          {/* Dates */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-medium">Calendrier</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Date de début
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {projectData.startDate.toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={projectData.startDate}
                      onSelect={(date) => date && setProjectData(prev => ({ ...prev, startDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Date de fin
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {projectData.endDate.toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={projectData.endDate}
                      onSelect={(date) => date && setProjectData(prev => ({ ...prev, endDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-lg font-medium">Tags</h2>
            </div>
            
            {/* Current Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {projectData.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className={`${getTagColor(tag)} pr-1`}
                >
                  <span className="w-2 h-2 bg-current rounded-full mr-2 opacity-60"></span>
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2 hover:bg-current/20"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>

            {/* Add New Tag */}
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Ajouter un nouveau tag..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button onClick={addTag} disabled={!newTag.trim()}>
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}