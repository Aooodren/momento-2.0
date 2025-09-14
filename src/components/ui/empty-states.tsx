import { Button } from "./button";
import { Card } from "./card";
import { 
  Plus, 
  FolderOpen, 
  Lightbulb, 
  Zap, 
  Target, 
  Users,
  FileText,
  Settings,
  Search
} from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  illustration?: React.ReactNode;
}

// Composant empty state générique
export function EmptyState({ title, description, icon, actions, illustration }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      {illustration && (
        <div className="mb-8">
          {illustration}
        </div>
      )}
      
      {icon && !illustration && (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          {icon}
        </div>
      )}
      
      <div className="text-center max-w-md">
        <h3 className="font-medium text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 leading-relaxed">{description}</p>
        
        {actions && (
          <div className="space-y-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Empty state pour projets
export function NoProjectsEmptyState({ 
  onCreateProject, 
  onInitDemo 
}: { 
  onCreateProject: () => void;
  onInitDemo: () => void;
}) {
  return (
    <EmptyState
      title="Créez votre premier projet"
      description="Organisez vos idées, collaborez avec votre équipe et donnez vie à vos projets avec Momento."
      illustration={
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
            <FolderOpen className="h-10 w-10 text-blue-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
            <Plus className="h-4 w-4 text-yellow-800" />
          </div>
        </div>
      }
      actions={
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onInitDemo} variant="outline" className="gap-2">
            <Zap className="h-4 w-4" />
            Voir la démo
          </Button>
          <Button onClick={onCreateProject} className="gap-2">
            <Plus className="h-4 w-4" />
            Créer un projet
          </Button>
        </div>
      }
    />
  );
}

// Empty state pour canvas
export function EmptyCanvasEmptyState({ 
  onCreateBlock 
}: { 
  onCreateBlock: () => void;
}) {
  return (
    <EmptyState
      title="Canvas vierge"
      description="Commencez par créer votre premier bloc pour structurer votre projet. Chaque bloc peut avoir des inputs et outputs configurables."
      illustration={
        <div className="relative">
          <Card className="w-20 h-14 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full" />
          </Card>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <Plus className="h-3 w-3 text-white" />
          </div>
        </div>
      }
      actions={
        <div className="space-y-2">
          <Button onClick={onCreateBlock} className="gap-2">
            <Plus className="h-4 w-4" />
            Créer un bloc
          </Button>
          <p className="text-xs text-muted-foreground">
            Ou faites glisser un élément depuis la palette
          </p>
        </div>
      }
    />
  );
}

// Empty state pour recherche
export function NoSearchResultsEmptyState({ 
  searchQuery 
}: { 
  searchQuery: string;
}) {
  return (
    <EmptyState
      title="Aucun résultat trouvé"
      description={`Nous n'avons trouvé aucun résultat pour "${searchQuery}". Essayez avec d'autres termes de recherche.`}
      icon={<Search className="h-8 w-8 text-muted-foreground" />}
    />
  );
}

// Empty state pour notifications
export function NoNotificationsEmptyState() {
  return (
    <EmptyState
      title="Tout est à jour !"
      description="Vous n'avez aucune nouvelle notification. Nous vous tiendrons informé des activités importantes."
      icon={<Target className="h-8 w-8 text-green-600" />}
    />
  );
}

// Empty state pour intégrations
export function NoIntegrationsEmptyState({ 
  onConnect 
}: { 
  onConnect: () => void;
}) {
  return (
    <EmptyState
      title="Connectez vos outils"
      description="Intégrez Momento avec vos applications préférées pour un workflow plus fluide."
      icon={<Zap className="h-8 w-8 text-blue-600" />}
      actions={
        <Button onClick={onConnect} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter une intégration
        </Button>
      }
    />
  );
}

// Empty state pour collaborateurs
export function NoCollaboratorsEmptyState({ 
  onInvite 
}: { 
  onInvite: () => void;
}) {
  return (
    <EmptyState
      title="Invitez votre équipe"
      description="Collaborez en temps réel avec vos collègues sur ce projet."
      icon={<Users className="h-8 w-8 text-purple-600" />}
      actions={
        <Button onClick={onInvite} className="gap-2">
          <Plus className="h-4 w-4" />
          Inviter des collaborateurs
        </Button>
      }
    />
  );
}

// Mini empty state pour listes
export function MiniEmptyState({ 
  title, 
  description, 
  icon,
  action 
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <h4 className="font-medium text-sm mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      {action}
    </div>
  );
}