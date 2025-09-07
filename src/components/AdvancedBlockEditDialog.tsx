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
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Block } from '../hooks/useCanvasAPI';
import { BlockPort, DataType, blockConfigurations } from './AdvancedCanvasBlock';
import { 
  Plus, 
  Trash2, 
  Settings, 
  Code, 
  Database,
  Zap,
  FileText,
  Figma,
  Brain,
  Globe
} from 'lucide-react';

interface AdvancedBlockEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: Block | null;
  onSave: (blockData: Partial<Block>) => void;
  isCreating?: boolean;
}

const blockTypes = [
  { 
    value: 'notion', 
    label: 'Notion', 
    description: 'Documentation et bases de données',
    icon: FileText,
    category: 'Productivity'
  },
  { 
    value: 'openai', 
    label: 'OpenAI', 
    description: 'Intelligence artificielle et génération de contenu',
    icon: Brain,
    category: 'AI'
  },
  { 
    value: 'figma', 
    label: 'Figma', 
    description: 'Design files et prototypes',
    icon: Figma,
    category: 'Design'
  },
  { 
    value: 'database', 
    label: 'Database', 
    description: 'Bases de données et requêtes',
    icon: Database,
    category: 'Data'
  },
  { 
    value: 'api', 
    label: 'API', 
    description: 'Services web et APIs',
    icon: Globe,
    category: 'Development'
  },
  { 
    value: 'code', 
    label: 'Code', 
    description: 'Scripts et fonctions personnalisées',
    icon: Code,
    category: 'Development'
  },
];

const dataTypes: { value: DataType; label: string; description: string }[] = [
  { value: 'text', label: 'Text', description: 'Chaîne de caractères' },
  { value: 'number', label: 'Number', description: 'Nombre' },
  { value: 'boolean', label: 'Boolean', description: 'Vrai/Faux' },
  { value: 'object', label: 'Object', description: 'Objet JSON' },
  { value: 'array', label: 'Array', description: 'Liste/Tableau' },
  { value: 'file', label: 'File', description: 'Fichier' },
  { value: 'image', label: 'Image', description: 'Image/Photo' },
];

const statusOptions = [
  { value: 'connected', label: 'Connected', description: 'Connecté et opérationnel' },
  { value: 'disconnected', label: 'Disconnected', description: 'Non connecté' },
  { value: 'configuring', label: 'Configuring', description: 'En cours de configuration' },
  { value: 'error', label: 'Error', description: 'Erreur de configuration' },
];

// Composants de configuration spécifiques par type
const NotionConfig = ({ config, onChange }: { config: any, onChange: (config: any) => void }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="notion-token">Token d'accès Notion</Label>
      <Input
        id="notion-token"
        type="password"
        value={config.notion_token || ''}
        onChange={(e) => onChange({ ...config, notion_token: e.target.value })}
        placeholder="secret_xxxxxxxxxx"
        className="mt-1"
      />
    </div>
    <div>
      <Label htmlFor="workspace-id">ID de l'espace de travail</Label>
      <Input
        id="workspace-id"
        value={config.workspace_id || ''}
        onChange={(e) => onChange({ ...config, workspace_id: e.target.value })}
        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        className="mt-1"
      />
    </div>
  </div>
);

const OpenAIConfig = ({ config, onChange }: { config: any, onChange: (config: any) => void }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="openai-key">Clé API OpenAI</Label>
      <Input
        id="openai-key"
        type="password"
        value={config.api_key || ''}
        onChange={(e) => onChange({ ...config, api_key: e.target.value })}
        placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        className="mt-1"
      />
    </div>
    <div>
      <Label htmlFor="model">Modèle par défaut</Label>
      <Select
        value={config.default_model || 'gpt-4'}
        onValueChange={(value) => onChange({ ...config, default_model: value })}
      >
        <SelectTrigger className="mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt-4">GPT-4</SelectItem>
          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label htmlFor="temperature">Température par défaut</Label>
      <Input
        id="temperature"
        type="number"
        min="0"
        max="2"
        step="0.1"
        value={config.default_temperature || '0.7'}
        onChange={(e) => onChange({ ...config, default_temperature: parseFloat(e.target.value) })}
        className="mt-1"
      />
    </div>
  </div>
);

const FigmaConfig = ({ config, onChange }: { config: any, onChange: (config: any) => void }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="figma-token">Token d'accès Figma</Label>
      <Input
        id="figma-token"
        type="password"
        value={config.access_token || ''}
        onChange={(e) => onChange({ ...config, access_token: e.target.value })}
        placeholder="figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        className="mt-1"
      />
    </div>
    <div>
      <Label htmlFor="team-id">ID de l'équipe (optionnel)</Label>
      <Input
        id="team-id"
        value={config.team_id || ''}
        onChange={(e) => onChange({ ...config, team_id: e.target.value })}
        placeholder="xxxxxxxxx"
        className="mt-1"
      />
    </div>
  </div>
);

const DatabaseConfig = ({ config, onChange }: { config: any, onChange: (config: any) => void }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="connection-string">Chaîne de connexion</Label>
      <Input
        id="connection-string"
        type="password"
        value={config.connection_string || ''}
        onChange={(e) => onChange({ ...config, connection_string: e.target.value })}
        placeholder="postgresql://user:pass@host:port/db"
        className="mt-1"
      />
    </div>
    <div>
      <Label htmlFor="database-type">Type de base de données</Label>
      <Select
        value={config.database_type || 'postgresql'}
        onValueChange={(value) => onChange({ ...config, database_type: value })}
      >
        <SelectTrigger className="mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="postgresql">PostgreSQL</SelectItem>
          <SelectItem value="mysql">MySQL</SelectItem>
          <SelectItem value="sqlite">SQLite</SelectItem>
          <SelectItem value="mongodb">MongoDB</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

export default function AdvancedBlockEditDialog({ 
  open, 
  onOpenChange, 
  block, 
  onSave, 
  isCreating = false 
}: AdvancedBlockEditDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'notion',
    status: 'disconnected',
    inputs: [] as BlockPort[],
    outputs: [] as BlockPort[],
    configuration: {},
  });

  useEffect(() => {
    if (block) {
      const defaultConfig = blockConfigurations[block.type as keyof typeof blockConfigurations];
      setFormData({
        title: block.title || '',
        description: block.description || '',
        type: block.type || 'notion',
        status: block.status || 'disconnected',
        inputs: (block as any).inputs || defaultConfig?.inputs || [],
        outputs: (block as any).outputs || defaultConfig?.outputs || [],
        configuration: (block as any).configuration || {},
      });
    } else if (isCreating) {
      const defaultConfig = blockConfigurations.notion;
      setFormData({
        title: '',
        description: '',
        type: 'notion',
        status: 'disconnected',
        inputs: defaultConfig?.inputs || [],
        outputs: defaultConfig?.outputs || [],
        configuration: {},
      });
    }
  }, [block, isCreating]);

  // Mise à jour automatique des inputs/outputs lors du changement de type
  useEffect(() => {
    const defaultConfig = blockConfigurations[formData.type as keyof typeof blockConfigurations];
    if (defaultConfig) {
      setFormData(prev => ({
        ...prev,
        inputs: defaultConfig.inputs || [],
        outputs: defaultConfig.outputs || [],
      }));
    }
  }, [formData.type]);

  const handleSave = () => {
    if (!formData.title.trim()) return;

    onSave({
      title: formData.title,
      description: formData.description,
      type: formData.type,
      status: formData.status,
      inputs: formData.inputs,
      outputs: formData.outputs,
      configuration: formData.configuration,
    } as any);

    onOpenChange(false);
  };

  const addInput = () => {
    const newInput: BlockPort = {
      id: `input_${Date.now()}`,
      label: 'Nouveau input',
      type: 'text',
      required: false,
    };
    setFormData(prev => ({
      ...prev,
      inputs: [...prev.inputs, newInput],
    }));
  };

  const addOutput = () => {
    const newOutput: BlockPort = {
      id: `output_${Date.now()}`,
      label: 'Nouveau output',
      type: 'text',
    };
    setFormData(prev => ({
      ...prev,
      outputs: [...prev.outputs, newOutput],
    }));
  };

  const updatePort = (portType: 'inputs' | 'outputs', index: number, updates: Partial<BlockPort>) => {
    setFormData(prev => ({
      ...prev,
      [portType]: prev[portType].map((port, i) => 
        i === index ? { ...port, ...updates } : port
      ),
    }));
  };

  const removePort = (portType: 'inputs' | 'outputs', index: number) => {
    setFormData(prev => ({
      ...prev,
      [portType]: prev[portType].filter((_, i) => i !== index),
    }));
  };

  const renderConfigComponent = () => {
    const commonProps = {
      config: formData.configuration,
      onChange: (config: any) => setFormData(prev => ({ ...prev, configuration: config }))
    };

    switch (formData.type) {
      case 'notion':
        return <NotionConfig {...commonProps} />;
      case 'openai':
        return <OpenAIConfig {...commonProps} />;
      case 'figma':
        return <FigmaConfig {...commonProps} />;
      case 'database':
        return <DatabaseConfig {...commonProps} />;
      default:
        return (
          <div className="text-center text-muted-foreground py-4">
            Aucune configuration spécifique pour ce type de bloc
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {isCreating ? 'Créer un nouveau bloc' : 'Configurer le bloc'}
          </DialogTitle>
          <DialogDescription>
            {isCreating 
              ? 'Configurez les propriétés et les connexions de votre nouveau bloc.'
              : 'Modifiez la configuration de ce bloc et ses inputs/outputs.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="outputs">Outputs</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="general" className="space-y-4 m-0">
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {blockTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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

              <div>
                <Label htmlFor="status">Statut</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
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

            <TabsContent value="inputs" className="space-y-4 m-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Inputs du bloc</h4>
                <Button onClick={addInput} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un input
                </Button>
              </div>

              <div className="space-y-3">
                {formData.inputs.map((input, index) => (
                  <Card key={input.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{input.type}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePort('inputs', index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Nom</Label>
                          <Input
                            value={input.label}
                            onChange={(e) => updatePort('inputs', index, { label: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Select
                            value={input.type}
                            onValueChange={(value) => updatePort('inputs', index, { type: value as DataType })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {dataTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Input
                          value={input.description || ''}
                          onChange={(e) => updatePort('inputs', index, { description: e.target.value })}
                          placeholder="Description de ce champ"
                          className="mt-1"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={input.required || false}
                          onCheckedChange={(checked) => updatePort('inputs', index, { required: checked })}
                        />
                        <Label>Champ requis</Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="outputs" className="space-y-4 m-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Outputs du bloc</h4>
                <Button onClick={addOutput} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un output
                </Button>
              </div>

              <div className="space-y-3">
                {formData.outputs.map((output, index) => (
                  <Card key={output.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{output.type}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePort('outputs', index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Nom</Label>
                          <Input
                            value={output.label}
                            onChange={(e) => updatePort('outputs', index, { label: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Select
                            value={output.type}
                            onValueChange={(value) => updatePort('outputs', index, { type: value as DataType })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {dataTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Input
                          value={output.description || ''}
                          onChange={(e) => updatePort('outputs', index, { description: e.target.value })}
                          placeholder="Description de cette sortie"
                          className="mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4 m-0">
              <h4 className="font-medium">Configuration spécifique - {blockTypes.find(t => t.value === formData.type)?.label}</h4>
              {renderConfigComponent()}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <Separator className="my-4" />
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.title.trim()}
          >
            {isCreating ? 'Créer le bloc' : 'Sauvegarder'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}