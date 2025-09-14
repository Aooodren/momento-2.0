import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Sparkles, Loader2 } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // en ms, 0 = permanent
  icon?: React.ReactNode;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Composant Provider
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 4000, // 4s par défaut
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-suppression si durée définie
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAll,
      }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Composant Container qui affiche les notifications
const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-3 pointer-events-none">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

// Icônes par défaut selon le type
const getDefaultIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-4 h-4" />;
    case 'error':
      return <AlertCircle className="w-4 h-4" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4" />;
    case 'info':
      return <Info className="w-4 h-4" />;
    case 'loading':
      return <Loader2 className="w-4 h-4 animate-spin" />;
    default:
      return <Info className="w-4 h-4" />;
  }
};

// Couleurs par type
const getTypeStyles = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-white',
        border: 'border-green-200',
        iconColor: 'text-green-600',
        titleColor: 'text-green-700',
      };
    case 'error':
      return {
        bg: 'bg-white',
        border: 'border-red-200',
        iconColor: 'text-red-600',
        titleColor: 'text-red-700',
      };
    case 'warning':
      return {
        bg: 'bg-white',
        border: 'border-yellow-200',
        iconColor: 'text-yellow-600',
        titleColor: 'text-yellow-700',
      };
    case 'info':
      return {
        bg: 'bg-white',
        border: 'border-blue-200',
        iconColor: 'text-blue-600',
        titleColor: 'text-blue-700',
      };
    case 'loading':
      return {
        bg: 'bg-white',
        border: 'border-blue-200',
        iconColor: 'text-blue-600',
        titleColor: 'text-blue-700',
      };
    default:
      return {
        bg: 'bg-white',
        border: 'border-gray-200',
        iconColor: 'text-gray-600',
        titleColor: 'text-gray-700',
      };
  }
};

// Composant individuel de notification
const NotificationItem: React.FC<{
  notification: Notification;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  const styles = getTypeStyles(notification.type);
  const icon = notification.icon || getDefaultIcon(notification.type);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Délai pour l'animation de sortie
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`
        ${styles.bg} ${styles.border} shadow-lg rounded-lg border p-4 min-w-80 max-w-md
        pointer-events-auto relative
        transform transition-all duration-200 ease-out
        ${isVisible 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-2 opacity-0 scale-95'
        }
      `}
    >
      {/* Bouton fermer */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        <X className="w-3 h-3 text-gray-400" />
      </button>

      {/* Contenu */}
      <div className="flex items-start gap-3 pr-6">
        <div className={`flex-shrink-0 ${styles.iconColor}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className={`font-medium text-sm ${styles.titleColor}`}>
            {notification.title}
          </div>
          {notification.message && (
            <div className="text-xs text-gray-600 mt-1">
              {notification.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hooks utilitaires pour faciliter l'usage
export const useNotify = () => {
  const { addNotification } = useNotifications();

  return {
    success: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'success', title, message, duration }),
    
    error: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'error', title, message, duration }),
    
    info: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'info', title, message, duration }),
    
    warning: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'warning', title, message, duration }),
    
    loading: (title: string, message?: string) =>
      addNotification({ type: 'loading', title, message, duration: 0 }),

    layout: (columns: number, totalNodes: number, spacing: number) =>
      addNotification({
        type: 'success',
        title: 'Layout appliqué !',
        message: `Organisation en grille ${columns} colonnes • ${totalNodes} blocs • Espacement ${spacing}px`,
        duration: 3000,
        icon: <Sparkles className="w-4 h-4" />
      }),
  };
};