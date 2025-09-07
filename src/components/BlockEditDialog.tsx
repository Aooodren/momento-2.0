import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Block } from '../hooks/useCanvasAPI';

interface BlockEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: Block | null;
  onSave: (blockData: Partial<Block>) => void;
  isCreating?: boolean;
}

const blockTypes = [
  { value: 'figma', label: 'Figma', description: 'Design files and prototypes', category: 'Design' },
  { value: 'notion', label: 'Notion', description: 'Documentation and notes', category: 'Documentation' },
  { value: 'figjam', label: 'FigJam', description: 'Collaborative whiteboard', category: 'Design' },
  { value: 'website', label: 'Website', description: 'Web applications and sites', category: 'Development' },
  { value: 'database', label: 'Database', description: 'Data storage and queries', category: 'Development' },
  { value: 'code', label: 'Code', description: 'Source code repositories', category: 'Development' },
  { value: 'image', label: 'Image', description: 'Graphics and visual assets', category: 'Assets' },
  { value: 'video', label: 'Video', description: 'Video content and media', category: 'Assets' },
  { value: 'document', label: 'Document', description: 'Text documents and files', category: 'Documentation' },
  { value: 'api', label: 'API', description: 'API endpoints and services', category: 'Development' },
  { value: 'tool', label: 'Tool', description: 'External tools and applications', category: 'Tools' },
  { value: 'resource', label: 'Resource', description: 'External resources and references', category: 'Resources' },
  { value: 'other', label: 'Other', description: 'Other type of resource', category: 'Other' },
];

const statusOptions = [
  { value: 'connected', label: 'Connected', description: 'Successfully connected' },
  { value: 'disconnected', label: 'Disconnected', description: 'Not connected' },
  { value: 'syncing', label: 'Syncing', description: 'Currently synchronizing' },
  { value: 'error', label: 'Error', description: 'Connection error' },
  { value: 'pending', label: 'Pending', description: 'Awaiting connection' },
  { value: 'archived', label: 'Archived', description: 'Archived resource' },
];

export default function BlockEditDialog({ 
  open, 
  onOpenChange, 
  block, 
  onSave, 
  isCreating = false 
}: BlockEditDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'figma',
    status: 'disconnected',
    metadata: {},
  });

  const [metadataKey, setMetadataKey] = useState('');
  const [metadataValue, setMetadataValue] = useState('');

  useEffect(() => {
    if (block) {
      setFormData({
        title: block.title || '',
        description: block.description || '',
        type: block.type || 'figma',
        status: block.status || 'disconnected',
        metadata: block.metadata || {},
      });
    } else if (isCreating) {
      setFormData({
        title: '',
        description: '',
        type: 'figma',
        status: 'disconnected',
        metadata: {},
      });
    }
  }, [block, isCreating]);

  const handleSave = () => {
    if (!formData.title.trim()) return;

    onSave({
      title: formData.title,
      description: formData.description,
      type: formData.type,
      status: formData.status,
      metadata: formData.metadata,
    });

    onOpenChange(false);
  };

  const addMetadata = () => {
    if (!metadataKey.trim() || !metadataValue.trim()) return;

    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [metadataKey]: metadataValue,
      },
    }));

    setMetadataKey('');
    setMetadataValue('');
  };

  const removeMetadata = (key: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: Object.fromEntries(
        Object.entries(prev.metadata).filter(([k]) => k !== key)
      ),
    }));
  };

  // Grouper les types par catégorie
  const groupedTypes = blockTypes.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, typeof blockTypes>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? 'Créer un nouveau bloc' : 'Modifier le bloc'}
          </DialogTitle>
          <DialogDescription>
            {isCreating 
              ? 'Configurez les propriétés du nouveau bloc pour votre canvas.'
              : 'Modifiez les propriétés de ce bloc.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Titre */}
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Nom du bloc"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description du bloc"
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Type */}
          <div>
            <Label htmlFor="type">Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedTypes).map(([category, types]) => (
                  <div key={category}>
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      {category}
                    </div>
                    {types.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Statut */}
          <div>
            <Label htmlFor="status">Statut</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionnez un statut" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div>
                      <div className="font-medium">{status.label}</div>
                      <div className="text-xs text-muted-foreground">{status.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Métadonnées */}
          <div>
            <Label>Métadonnées</Label>
            
            {/* Métadonnées existantes */}
            {Object.keys(formData.metadata).length > 0 && (
              <div className="mt-2 space-y-2">
                {Object.entries(formData.metadata).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Badge variant="outline" className="flex-1">
                      <span className="font-medium">{key}:</span> {String(value)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMetadata(key)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Ajouter une métadonnée */}
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Clé"
                  value={metadataKey}
                  onChange={(e) => setMetadataKey(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Valeur"
                  value={metadataValue}
                  onChange={(e) => setMetadataValue(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addMetadata}
                  disabled={!metadataKey.trim() || !metadataValue.trim()}
                >
                  Ajouter
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.title.trim()}
            >
              {isCreating ? 'Créer' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}