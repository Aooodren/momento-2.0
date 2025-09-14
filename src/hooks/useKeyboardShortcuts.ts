import { useEffect, useCallback, useRef, useState } from 'react';

// Types pour les raccourcis clavier
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  description: string;
  category?: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  disabled?: boolean;
  target?: HTMLElement | Document;
}

/**
 * Hook pour gérer les raccourcis clavier
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { disabled = false, target = document } = options;
  const shortcutsRef = useRef<KeyboardShortcut[]>([]);

  // Mettre à jour la référence des raccourcis
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return;

    // Ignorer si on est dans un input/textarea/contenteditable
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true')
    ) {
      return;
    }

    shortcutsRef.current.forEach((shortcut) => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = Boolean(shortcut.ctrlKey) === event.ctrlKey;
      const metaMatch = Boolean(shortcut.metaKey) === event.metaKey;
      const shiftMatch = Boolean(shortcut.shiftKey) === event.shiftKey;
      const altMatch = Boolean(shortcut.altKey) === event.altKey;

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.callback();
      }
    });
  }, [disabled]);

  useEffect(() => {
    const targetElement = target instanceof HTMLElement ? target : document;
    targetElement.addEventListener('keydown', handleKeyDown);

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, target]);

  return {
    shortcuts: shortcutsRef.current,
  };
}

/**
 * Hook pour les raccourcis globaux de l'application
 */
export function useGlobalShortcuts(callbacks: {
  onNewProject?: () => void;
  onSearch?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onSelectAll?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
  onShowHelp?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    // Navigation et création
    ...(callbacks.onNewProject ? [{
      key: 'n',
      ctrlKey: true,
      callback: callbacks.onNewProject,
      description: 'Créer un nouveau projet',
      category: 'Navigation'
    }] : []),
    
    ...(callbacks.onSearch ? [{
      key: 'k',
      ctrlKey: true,
      callback: callbacks.onSearch,
      description: 'Recherche globale',
      category: 'Navigation'
    }] : []),

    // Édition
    ...(callbacks.onSave ? [{
      key: 's',
      ctrlKey: true,
      callback: callbacks.onSave,
      description: 'Sauvegarder',
      category: 'Édition'
    }] : []),

    ...(callbacks.onUndo ? [{
      key: 'z',
      ctrlKey: true,
      callback: callbacks.onUndo,
      description: 'Annuler',
      category: 'Édition'
    }] : []),

    ...(callbacks.onRedo ? [{
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      callback: callbacks.onRedo,
      description: 'Refaire',
      category: 'Édition'
    }] : []),

    ...(callbacks.onCopy ? [{
      key: 'c',
      ctrlKey: true,
      callback: callbacks.onCopy,
      description: 'Copier',
      category: 'Édition'
    }] : []),

    ...(callbacks.onPaste ? [{
      key: 'v',
      ctrlKey: true,
      callback: callbacks.onPaste,
      description: 'Coller',
      category: 'Édition'
    }] : []),

    ...(callbacks.onSelectAll ? [{
      key: 'a',
      ctrlKey: true,
      callback: callbacks.onSelectAll,
      description: 'Tout sélectionner',
      category: 'Édition'
    }] : []),

    // Vue et zoom
    ...(callbacks.onZoomIn ? [{
      key: '+',
      ctrlKey: true,
      callback: callbacks.onZoomIn,
      description: 'Zoomer',
      category: 'Vue'
    }] : []),

    ...(callbacks.onZoomOut ? [{
      key: '-',
      ctrlKey: true,
      callback: callbacks.onZoomOut,
      description: 'Dézoomer',
      category: 'Vue'
    }] : []),

    ...(callbacks.onZoomReset ? [{
      key: '0',
      ctrlKey: true,
      callback: callbacks.onZoomReset,
      description: 'Réinitialiser le zoom',
      category: 'Vue'
    }] : []),

    // Interface
    ...(callbacks.onToggleTheme ? [{
      key: 'd',
      ctrlKey: true,
      shiftKey: true,
      callback: callbacks.onToggleTheme,
      description: 'Basculer le thème',
      category: 'Interface'
    }] : []),

    ...(callbacks.onOpenSettings ? [{
      key: ',',
      ctrlKey: true,
      callback: callbacks.onOpenSettings,
      description: 'Ouvrir les paramètres',
      category: 'Interface'
    }] : []),

    // Aide
    ...(callbacks.onShowHelp ? [{
      key: '?',
      shiftKey: true,
      callback: callbacks.onShowHelp,
      description: 'Afficher l\'aide',
      category: 'Aide'
    }] : []),
  ];

  return useKeyboardShortcuts(shortcuts);
}

/**
 * Hook pour les raccourcis de l'éditeur de canvas
 */
export function useCanvasShortcuts(callbacks: {
  onCreateBlock?: () => void;
  onDuplicateSelection?: () => void;
  onDeleteSelection?: () => void;
  onAutoLayout?: () => void;
  onFitView?: () => void;
  onCenterView?: () => void;
  onToggleGrid?: () => void;
  onToggleMinimap?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    // Création et manipulation
    ...(callbacks.onCreateBlock ? [{
      key: 'b',
      ctrlKey: true,
      callback: callbacks.onCreateBlock,
      description: 'Créer un nouveau bloc',
      category: 'Canvas'
    }] : []),

    ...(callbacks.onDuplicateSelection ? [{
      key: 'd',
      ctrlKey: true,
      callback: callbacks.onDuplicateSelection,
      description: 'Dupliquer la sélection',
      category: 'Canvas'
    }] : []),

    ...(callbacks.onDeleteSelection ? [{
      key: 'Delete',
      callback: callbacks.onDeleteSelection,
      description: 'Supprimer la sélection',
      category: 'Canvas'
    }] : []),

    // Layout et navigation
    ...(callbacks.onAutoLayout ? [{
      key: 'l',
      ctrlKey: true,
      shiftKey: true,
      callback: callbacks.onAutoLayout,
      description: 'Arrangement automatique',
      category: 'Layout'
    }] : []),

    ...(callbacks.onFitView ? [{
      key: 'f',
      ctrlKey: true,
      callback: callbacks.onFitView,
      description: 'Ajuster à la vue',
      category: 'Vue'
    }] : []),

    ...(callbacks.onCenterView ? [{
      key: 'h',
      ctrlKey: true,
      callback: callbacks.onCenterView,
      description: 'Centrer la vue',
      category: 'Vue'
    }] : []),

    // Interface du canvas
    ...(callbacks.onToggleGrid ? [{
      key: 'g',
      ctrlKey: true,
      callback: callbacks.onToggleGrid,
      description: 'Basculer la grille',
      category: 'Interface'
    }] : []),

    ...(callbacks.onToggleMinimap ? [{
      key: 'm',
      ctrlKey: true,
      callback: callbacks.onToggleMinimap,
      description: 'Basculer la minimap',
      category: 'Interface'
    }] : []),
  ];

  return useKeyboardShortcuts(shortcuts);
}

/**
 * Utilitaires pour formater les raccourcis
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.metaKey) parts.push('⌘');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');
  
  // Formater la touche principale
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Delete': 'Del',
    'Backspace': '⌫',
    'Enter': '↵',
    'Tab': '⇥',
    'Escape': 'Esc',
  };
  
  const formattedKey = keyMap[shortcut.key] || shortcut.key.toUpperCase();
  parts.push(formattedKey);
  
  return parts.join(' + ');
}

/**
 * Grouper les raccourcis par catégorie
 */
export function groupShortcutsByCategory(shortcuts: KeyboardShortcut[]): Record<string, KeyboardShortcut[]> {
  return shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'Autres';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);
}

/**
 * Hook pour désactiver temporairement les raccourcis
 */
export function useShortcutState() {
  const [disabled, setDisabled] = useState(false);

  const disable = useCallback(() => setDisabled(true), []);
  const enable = useCallback(() => setDisabled(false), []);
  const toggle = useCallback(() => setDisabled(prev => !prev), []);

  return { disabled, disable, enable, toggle };
}