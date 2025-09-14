import { Skeleton } from "./skeleton";
import { Card } from "./card";

// Skeleton pour un projet dans la liste - Version moderne
export function ProjectCardSkeleton() {
  return (
    <Card className="p-0 rounded-xl overflow-hidden">
      {/* Skeleton pour la miniature */}
      <div className="aspect-video bg-gray-200 animate-pulse rounded-t-xl" />
      
      {/* Contenu */}
      <div className="p-5 space-y-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

// Skeleton pour un bloc dans le canvas
export function CanvasBlockSkeleton() {
  return (
    <Card className="w-80 p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      </div>
    </Card>
  );
}

// Skeleton pour la sidebar
export function SidebarProjectSkeleton() {
  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-md" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

// Skeleton pour les paramètres
export function SettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
  );
}

// Skeleton pour liste de notifications
export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 border-b">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

// Skeleton pour grille de projets
export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Skeleton pour canvas loading
export function CanvasGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-8 p-8">
      {Array.from({ length: count }).map((_, i) => (
        <CanvasBlockSkeleton key={i} />
      ))}
    </div>
  );
}