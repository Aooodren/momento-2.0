import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { KeyboardShortcut, formatShortcut, groupShortcutsByCategory } from '../hooks/useKeyboardShortcuts';
import { Keyboard, Search, Edit, Eye, Navigation, Settings, HelpCircle } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Navigation': <Navigation className="h-4 w-4" />,
  'Édition': <Edit className="h-4 w-4" />,
  'Vue': <Eye className="h-4 w-4" />,
  'Canvas': <Edit className="h-4 w-4" />,
  'Layout': <Navigation className="h-4 w-4" />,
  'Interface': <Settings className="h-4 w-4" />,
  'Aide': <HelpCircle className="h-4 w-4" />,
  'Autres': <Keyboard className="h-4 w-4" />,
};

export default function KeyboardShortcutsHelp({ isOpen, onClose, shortcuts }: KeyboardShortcutsHelpProps) {
  const groupedShortcuts = groupShortcutsByCategory(shortcuts);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Raccourcis clavier
          </DialogTitle>
          <DialogDescription>
            Utilisez ces raccourcis pour naviguer plus rapidement dans Momento
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  {categoryIcons[category] || <Keyboard className="h-4 w-4" />}
                  <h3 className="font-medium text-sm text-foreground">
                    {category}
                  </h3>
                  <Separator className="flex-1" />
                </div>
                
                <div className="grid gap-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <Card key={index} className="p-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">
                          {shortcut.description}
                        </span>
                        <Badge 
                          variant="outline" 
                          className="font-mono text-xs bg-background"
                        >
                          {formatShortcut(shortcut)}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {shortcuts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Keyboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun raccourci disponible pour cette page</p>
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Appuyez sur <Badge variant="outline" className="font-mono">Shift + ?</Badge> pour afficher cette aide
          </div>
          <Badge variant="secondary" className="text-xs">
            {shortcuts.length} raccourci{shortcuts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}