import { useState, useEffect } from "react";
import { ArrowRight, Zap, Ban, Link, ThumbsUp } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface ConnectionType {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  shortcut: string;
  modifier?: string;
}

const connectionTypes: ConnectionType[] = [
  {
    id: 'inspire',
    label: 'Inspire',
    icon: ArrowRight,
    color: 'bg-blue-500',
    description: 'Cette idée inspire celle-ci',
    shortcut: '1',
    modifier: 'Glisser normalement'
  },
  {
    id: 'cause',
    label: 'Cause',
    icon: Zap,
    color: 'bg-orange-500',
    description: 'Ceci cause cela',
    shortcut: '2',
    modifier: 'Ctrl + Glisser'
  },
  {
    id: 'support',
    label: 'Soutient',
    icon: ThumbsUp,
    color: 'bg-green-500',
    description: 'Ceci soutient cela',
    shortcut: '3',
    modifier: 'Shift + Glisser'
  },
  {
    id: 'depend',
    label: 'Dépend',
    icon: Link,
    color: 'bg-purple-500',
    description: 'Ceci dépend de cela',
    shortcut: '4',
    modifier: 'Alt + Glisser'
  },
  {
    id: 'contradict',
    label: 'Contredit',
    icon: Ban,
    color: 'bg-red-500',
    description: 'Ces éléments se contredisent',
    shortcut: '5'
  }
];

interface ConnectionTypeSelectorProps {
  position: { x: number; y: number };
  onSelect: (type: string) => void;
  onCancel: () => void;
  currentType?: string;
  isEditing?: boolean;
  modifierUsed?: string | null;
}

export default function ConnectionTypeSelector({ 
  position, 
  onSelect, 
  onCancel, 
  currentType = 'inspire',
  isEditing = false,
  modifierUsed = null
}: ConnectionTypeSelectorProps) {
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Auto-sélection basée sur le modificateur utilisé
  useEffect(() => {
    if (modifierUsed && !isEditing) {
      let autoType = 'inspire';
      switch (modifierUsed) {
        case 'ctrl': autoType = 'cause'; break;
        case 'shift': autoType = 'support'; break;
        case 'alt': autoType = 'depend'; break;
      }
      
      // Auto-sélectionner après un court délai
      setTimeout(() => {
        onSelect(autoType);
      }, 150);
      return;
    }
  }, [modifierUsed, isEditing, onSelect]);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      
      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      // Chiffres 1-5 pour sélection directe
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) {
        const selectedType = connectionTypes[num - 1];
        if (selectedType) {
          onSelect(selectedType.id);
        }
        return;
      }

      // Flèches pour navigation
      if (e.key === 'ArrowDown') {
        setSelectedIndex(prev => (prev + 1) % connectionTypes.length);
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex(prev => (prev - 1 + connectionTypes.length) % connectionTypes.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        onSelect(connectionTypes[selectedIndex].id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelect, onCancel]);

  // Trouver l'index du type actuel
  useEffect(() => {
    const currentIndex = connectionTypes.findIndex(t => t.id === currentType);
    if (currentIndex !== -1) {
      setSelectedIndex(currentIndex);
    }
  }, [currentType]);

  const handleSelect = (typeId: string) => {
    onSelect(typeId);
  };

  return (
    <div
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <Card className="p-4 shadow-xl border-2 bg-white/95 backdrop-blur-sm min-w-[320px] max-w-[400px]">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            {isEditing ? 'Modifier le type de connexion' : 'Choisir le type de connexion'}
          </h4>
          <p className="text-xs text-gray-500">
            {hoveredType 
              ? connectionTypes.find(t => t.id === hoveredType)?.description
              : 'Utilisez les chiffres 1-5, flèches ↑↓, ou cliquez pour sélectionner'
            }
          </p>
        </div>

        <div className="space-y-2">
          {connectionTypes.map((type, index) => {
            const Icon = type.icon;
            const isSelected = index === selectedIndex;
            const isHovered = hoveredType === type.id;
            const isCurrent = type.id === currentType;

            return (
              <Button
                key={type.id}
                variant={isSelected ? "default" : "ghost"}
                className={`w-full justify-between h-12 transition-all duration-200 ${
                  isSelected 
                    ? 'bg-blue-50 border border-blue-200 text-blue-900 scale-105' 
                    : isHovered 
                      ? 'bg-gray-50' 
                      : ''
                }`}
                onClick={() => handleSelect(type.id)}
                onMouseEnter={() => {
                  setHoveredType(type.id);
                  setSelectedIndex(index);
                }}
                onMouseLeave={() => setHoveredType(null)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${type.color}`}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{type.label}</div>
                    {type.modifier && (
                      <div className="text-xs text-gray-500">{type.modifier}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                  <kbd className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-mono">
                    {type.shortcut}
                  </kbd>
                </div>
              </Button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>↑↓ Naviguer • Enter Valider</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCancel}
              className="h-8 text-xs"
            >
              Échap
            </Button>
          </div>
        </div>
      </Card>

      {/* Overlay pour fermer en cliquant à côté */}
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onCancel}
      />
    </div>
  );
}

// Fonction utilitaire pour obtenir les styles d'une connexion
export const getConnectionTypeStyle = (type: string) => {
  switch (type) {
    case 'cause':
      return { 
        stroke: '#f97316', 
        strokeWidth: 2,
        strokeDasharray: 'none'
      };
    case 'inspire':
      return { 
        stroke: '#3b82f6', 
        strokeWidth: 2,
        strokeDasharray: 'none'
      };
    case 'contradict':
      return { 
        stroke: '#ef4444', 
        strokeWidth: 2,
        strokeDasharray: '8 4'
      };
    case 'depend':
      return { 
        stroke: '#8b5cf6', 
        strokeWidth: 2,
        strokeDasharray: '4 4'
      };
    case 'support':
      return { 
        stroke: '#10b981', 
        strokeWidth: 2,
        strokeDasharray: 'none'
      };
    default:
      return { 
        stroke: '#6b7280', 
        strokeWidth: 1,
        strokeDasharray: 'none'
      };
  }
};

// Fonction utilitaire pour obtenir l'icône d'un type de connexion
export const getConnectionTypeIcon = (type: string) => {
  const connectionType = connectionTypes.find(t => t.id === type);
  return connectionType ? connectionType.icon : ArrowRight;
};

// Fonction utilitaire pour obtenir la couleur d'un type de connexion
export const getConnectionTypeColor = (type: string) => {
  switch (type) {
    case 'cause': return '#f97316';
    case 'inspire': return '#3b82f6';
    case 'contradict': return '#ef4444';
    case 'depend': return '#8b5cf6';
    case 'support': return '#10b981';
    default: return '#6b7280';
  }
};

// Fonction utilitaire pour détecter les modificateurs
export const getModifierFromEvent = (event: MouseEvent): string | null => {
  if (event.ctrlKey) return 'ctrl';
  if (event.shiftKey) return 'shift';
  if (event.altKey) return 'alt';
  return null;
};

export { connectionTypes };