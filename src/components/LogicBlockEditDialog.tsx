import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, X } from 'lucide-react';
import { Block } from '../hooks/useCanvasAPI';

interface LogicBlockEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: Block | null;
  onSave: (blockData: Partial<Block>) => void;
  isCreating?: boolean;
}

const logicBlockTypes = [
  { 
    value: 'group', 
    label: 'Groupe', 
    description: 'Conteneur pour regrouper plusieurs blocs',
    category: 'Organisation'
  },
  { 
    value: 'condition', 
    label: 'Condition', 
    description: 'Bloc de logique conditionnelle IF/THEN/ELSE',
    category: 'Logique'
  },
  { 
    value: 'loop', 
    label: 'Boucle', 
    description: 'Répétition d\'actions avec itérations',
    category: 'Contrôle'
  },
  { 
    value: 'decision', 
    label: 'Décision', 
    description: 'Point de décision avec multiples sorties',
    category: 'Logique'
  },
  { 
    value: 'filter', 
    label: 'Filtre', 
    description: 'Filtrage de données selon des critères',
    category: 'Traitement'
  },
  { 
    value: 'merge', 
    label: 'Fusion', 
    description: 'Combinaison de plusieurs entrées',
    category: 'Traitement'
  },
  { 
    value: 'workflow', 
    label: 'Flux de travail', 
    description: 'Séquence d\'étapes organisées',
    category: 'Organisation'
  },
  { 
    value: 'validator', 
    label: 'Validateur', 
    description: 'Validation de données selon des règles',
    category: 'Contrôle'
  },
];

const statusOptions = [
  { value: 'active', label: 'Actif', description: 'Bloc fonctionnel et utilisé' },
  { value: 'inactive', label: 'Inactif', description: 'Bloc temporairement désactivé' },
  { value: 'running', label: 'En cours', description: 'Bloc en cours d\'exécution' },
  { value: 'completed', label: 'Terminé', description: 'Bloc complété avec succès' },
  { value: 'error', label: 'Erreur', description: 'Bloc en erreur' },
  { value: 'pending', label: 'En attente', description: 'Bloc en attente d\'activation' },
];

export default function LogicBlockEditDialog({ 
  open, 
  onOpenChange, 
  block, 
  onSave, 
  isCreating = false 
}: LogicBlockEditDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'logic',
    status: 'active',
    logicType: 'group',
    metadata: {},
    conditions: [] as string[],
    collapsed: false,
  });

  const [newCondition, setNewCondition] = useState('');
  const [metadataKey, setMetadataKey] = useState('');
  const [metadataValue, setMetadataValue] = useState('');

  useEffect(() => {
    if (block) {
      setFormData({
        title: block.title || '',
        description: block.description || '',
        type: block.type || 'logic',
        status: block.status || 'active',
        logicType: block.metadata?.logicType || 'group',
        metadata: block.metadata || {},
        conditions: block.metadata?.conditions || [],
        collapsed: block.metadata?.collapsed || false,
      });
    } else if (isCreating) {
      setFormData({
        title: '',
        description: '',
        type: 'logic',
        status: 'active',
        logicType: 'group',
        metadata: {},
        conditions: [],
        collapsed: false,
      });
    }
  }, [block, isCreating]);

  const handleSave = () => {
    if (!formData.title.trim()) return;

    const metadata = {
      ...formData.metadata,
      logicType: formData.logicType,
      conditions: formData.conditions,
      collapsed: formData.collapsed,
    };

    // Ajouter des métadonnées spécifiques selon le type
    switch (formData.logicType) {
      case 'loop':
        metadata.iterations = metadata.iterations || 'infinite';
        metadata.loopType = metadata.loopType || 'forEach';
        break;
      case 'filter':
        metadata.filterCount = formData.conditions.length;
        metadata.filterType = metadata.filterType || 'includes';
        break;
      case 'merge':
        metadata.inputs = metadata.inputs || 2;
        metadata.mergeType = metadata.mergeType || 'concat';
        break;
      case 'workflow':
        metadata.steps = metadata.steps || 0;
        break;
      case 'validator':
        metadata.rules = formData.conditions.length;
        metadata.validationType = metadata.validationType || 'strict';
        break;
    }

    onSave({
      title: formData.title,
      description: formData.description,
      type: formData.type,
      status: formData.status,
      metadata,
    });

    onOpenChange(false);
  };

  const addCondition = () => {
    if (!newCondition.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition.trim()],
    }));
    
    setNewCondition('');
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
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

  const selectedType = logicBlockTypes.find(t => t.value === formData.logicType);
  const shouldShowConditions = ['condition', 'decision', 'filter', 'validator'].includes(formData.logicType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? 'Créer un bloc logique' : 'Modifier le bloc logique'}
          </DialogTitle>
          <DialogDescription>
            {isCreating 
              ? 'Configurez les propriétés du nouveau bloc logique pour votre canvas.'
              : 'Modifiez les propriétés de ce bloc logique.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="logic">Logique</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            {/* Titre */}
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nom du bloc logique"
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
                placeholder="Description du bloc logique"
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Type de bloc logique */}
            <div>
              <Label htmlFor="logicType">Type de bloc logique</Label>
              <Select 
                value={formData.logicType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, logicType: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.groupBy ? (
                    // Grouper par catégorie si supporté
                    Object.entries(
                      logicBlockTypes.reduce((acc, type) => {
                        if (!acc[type.category]) acc[type.category] = [];
                        acc[type.category].push(type);
                        return acc;
                      }, {} as Record<string, typeof logicBlockTypes>)
                    ).map(([category, types]) => (
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
                    ))
                  ) : (
                    // Fallback simple
                    logicBlockTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedType && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <div className="text-sm font-medium">{selectedType.label}</div>
                  <div className="text-xs text-muted-foreground">{selectedType.description}</div>
                  <Badge variant="outline" className="mt-1">
                    {selectedType.category}
                  </Badge>
                </div>
              )}
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
          </TabsContent>

          <TabsContent value="logic" className="space-y-4">
            {/* Options spécifiques aux groupes */}
            {formData.logicType === 'group' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="collapsed"
                    checked={formData.collapsed}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, collapsed: checked }))
                    }
                  />
                  <Label htmlFor="collapsed">Groupe réduit par défaut</Label>
                </div>
              </div>
            )}

            {/* Conditions pour les blocs logiques */}
            {shouldShowConditions && (
              <div>
                <Label>
                  {formData.logicType === 'condition' && 'Conditions'}
                  {formData.logicType === 'decision' && 'Critères de décision'}
                  {formData.logicType === 'filter' && 'Règles de filtrage'}
                  {formData.logicType === 'validator' && 'Règles de validation'}
                </Label>
                
                {/* Conditions existantes */}
                {formData.conditions.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {formData.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline" className="flex-1 justify-start">
                          {condition}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCondition(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ajouter une condition */}
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder={
                      formData.logicType === 'condition' ? 'Exemple: variable > 10' :
                      formData.logicType === 'decision' ? 'Exemple: approuvé === true' :
                      formData.logicType === 'filter' ? 'Exemple: status === "active"' :
                      'Exemple: required field'
                    }
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCondition}
                    disabled={!newCondition.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Configuration spécifique aux boucles */}
            {formData.logicType === 'loop' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="loopType">Type de boucle</Label>
                  <Select
                    value={formData.metadata.loopType || 'forEach'}
                    onValueChange={(value) => 
                      setFormData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, loopType: value }
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forEach">forEach</SelectItem>
                      <SelectItem value="while">while</SelectItem>
                      <SelectItem value="for">for</SelectItem>
                      <SelectItem value="map">map</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="iterations">Nombre d'itérations</Label>
                  <Input
                    id="iterations"
                    value={formData.metadata.iterations || ''}
                    onChange={(e) => 
                      setFormData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, iterations: e.target.value }
                      }))
                    }
                    placeholder="infinite, 10, variable..."
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Configuration spécifique aux filtres */}
            {formData.logicType === 'filter' && (
              <div>
                <Label htmlFor="filterType">Type de filtre</Label>
                <Select
                  value={formData.metadata.filterType || 'includes'}
                  onValueChange={(value) => 
                    setFormData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, filterType: value }
                    }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="includes">Inclut</SelectItem>
                    <SelectItem value="excludes">Exclut</SelectItem>
                    <SelectItem value="equals">Égal à</SelectItem>
                    <SelectItem value="greaterThan">Supérieur à</SelectItem>
                    <SelectItem value="lessThan">Inférieur à</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Configuration spécifique aux fusions */}
            {formData.logicType === 'merge' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="inputs">Nombre d'entrées</Label>
                  <Input
                    id="inputs"
                    type="number"
                    min="2"
                    value={formData.metadata.inputs || 2}
                    onChange={(e) => 
                      setFormData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, inputs: parseInt(e.target.value) || 2 }
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="mergeType">Type de fusion</Label>
                  <Select
                    value={formData.metadata.mergeType || 'concat'}
                    onValueChange={(value) => 
                      setFormData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, mergeType: value }
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concat">Concaténation</SelectItem>
                      <SelectItem value="merge">Fusion</SelectItem>
                      <SelectItem value="union">Union</SelectItem>
                      <SelectItem value="intersection">Intersection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Configuration spécifique aux workflows */}
            {formData.logicType === 'workflow' && (
              <div>
                <Label htmlFor="steps">Nombre d'étapes</Label>
                <Input
                  id="steps"
                  type="number"
                  min="0"
                  value={formData.metadata.steps || 0}
                  onChange={(e) => 
                    setFormData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, steps: parseInt(e.target.value) || 0 }
                    }))
                  }
                  className="mt-1"
                />
              </div>
            )}

            {/* Configuration spécifique aux validateurs */}
            {formData.logicType === 'validator' && (
              <div>
                <Label htmlFor="validationType">Type de validation</Label>
                <Select
                  value={formData.metadata.validationType || 'strict'}
                  onValueChange={(value) => 
                    setFormData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, validationType: value }
                    }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strict">Strict</SelectItem>
                    <SelectItem value="permissive">Permissif</SelectItem>
                    <SelectItem value="warning">Avertissement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {/* Métadonnées personnalisées */}
            <div>
              <Label>Métadonnées personnalisées</Label>
              
              {/* Métadonnées existantes */}
              {Object.keys(formData.metadata).length > 0 && (
                <div className="mt-2 space-y-2">
                  {Object.entries(formData.metadata)
                    .filter(([key]) => !['logicType', 'conditions', 'collapsed', 'iterations', 'loopType', 'filterType', 'inputs', 'mergeType', 'steps', 'validationType'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Badge variant="outline" className="flex-1 justify-start">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMetadata(key)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
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
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.title.trim()}
          >
            {isCreating ? 'Créer le bloc logique' : 'Sauvegarder les modifications'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}