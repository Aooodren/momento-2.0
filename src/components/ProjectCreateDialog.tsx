import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Tag, 
  FileText, 
  Settings,
  X,
  Save,
  Loader2
} from 'lucide-react';

interface ProjectCreateDialogProps {
  trigger?: React.ReactNode;
  onProjectCreate: (projectData: {
    title: string;
    description: string;
    type: string;
    startDate?: Date;
    endDate?: Date;
    tags: string[];
  }) => Promise<void>;
}

interface ProjectFormData {
  title: string;
  description: string;
  type: string;
  startDate: Date;
  endDate: Date;
  tags: string[];
}

export default function ProjectCreateDialog({ 
  trigger, 
  onProjectCreate 
}: ProjectCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Valeurs par défaut pour un nouveau projet
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    type: 'Design Thinking',
    startDate: new Date(),
    endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // +25 jours
    tags: ['Design', 'Brainstorming']
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      return; // Validation basique
    }

    setIsCreating(true);
    try {
      await onProjectCreate({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        tags: formData.tags
      });
      
      // Reset du formulaire et fermeture
      setFormData({
        title: '',
        description: '',
        type: 'Design Thinking',
        startDate: new Date(),
        endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        tags: ['Design', 'Brainstorming']
      });
      setOpen(false);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getTagColor = (tag: string) => {
    const tagColors = [
      'bg-red-50 text-red-700 border-red-200',
      'bg-green-50 text-green-700 border-green-200',
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-yellow-50 text-yellow-700 border-yellow-200',
      'bg-purple-50 text-purple-700 border-purple-200',
      'bg-indigo-50 text-indigo-700 border-indigo-200',
    ];
    
    const tagIndex = formData.tags.indexOf(tag);
    return tagColors[tagIndex % tagColors.length] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau projet
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Créer un nouveau projet
          </DialogTitle>
          <DialogDescription>
            Configurez les détails de votre nouveau projet avant de commencer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Project Title */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Informations générales</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Titre du projet *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nom de votre projet"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="type" className="text-sm font-medium">
                  Type de projet
                </Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  placeholder="Type de projet"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Description</h3>
            </div>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez les objectifs et le contexte de votre projet..."
              className="min-h-[100px] resize-y"
            />
          </div>

          {/* Dates */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Calendrier</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">
                  Date de début
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate.toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label className="text-sm font-medium">
                  Date de fin
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate.toLocaleDateString('fr-FR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, endDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Tags</h3>
            </div>
            
            {/* Current Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag) => (
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
                placeholder="Ajouter un tag..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button onClick={addTag} disabled={!newTag.trim()} size="sm">
                Ajouter
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title.trim() || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Créer le projet
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}