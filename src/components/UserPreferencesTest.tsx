import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function UserPreferencesTest() {
  const { 
    preferences, 
    loading, 
    saving, 
    error,
    savePreferences,
    exportUserData
  } = useUserPreferences();

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Chargement des préférences...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Test des Préférences Utilisateur</h3>
        
        {error && (
          <div className="flex items-center text-red-600 text-sm">
            <XCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Apparence</h4>
            <div className="space-y-1 text-sm">
              <div>Thème: <Badge variant="outline">{preferences.theme}</Badge></div>
              <div>Langue: <Badge variant="outline">{preferences.language}</Badge></div>
              <div>Taille de police: <Badge variant="outline">{preferences.fontSize}</Badge></div>
              <div>Sidebar: <Badge variant="outline">{preferences.sidebarCollapsed ? 'Réduite' : 'Étendue'}</Badge></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Notifications</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                Email: {preferences.emailNotifications ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-red-600" />
                }
              </div>
              <div className="flex items-center gap-2">
                Push: {preferences.pushNotifications ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-red-600" />
                }
              </div>
              <div className="flex items-center gap-2">
                Marketing: {preferences.marketingEmails ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-red-600" />
                }
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Profil</h4>
            <div className="space-y-1 text-sm">
              <div>Téléphone: <span className="font-mono text-xs">{preferences.phone || 'Non défini'}</span></div>
              <div>Entreprise: <span className="font-mono text-xs">{preferences.company || 'Non définie'}</span></div>
              <div>Localisation: <span className="font-mono text-xs">{preferences.location || 'Non définie'}</span></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Sécurité</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                2FA: {preferences.twoFactorEnabled ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-red-600" />
                }
              </div>
              <div>Session timeout: <Badge variant="outline">{preferences.sessionTimeout}min</Badge></div>
              <div>Auto-save: <Badge variant="outline">{preferences.autoSave ? 'Activé' : 'Désactivé'}</Badge></div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            size="sm"
            onClick={() => savePreferences({ theme: preferences.theme === 'light' ? 'dark' : 'light' })}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Basculer le thème
          </Button>
          
          <Button 
            size="sm"
            variant="outline"
            onClick={() => savePreferences({ fontSize: preferences.fontSize === 'medium' ? 'large' : 'medium' })}
            disabled={saving}
          >
            Changer la taille
          </Button>
          
          <Button 
            size="sm"
            variant="outline"
            onClick={exportUserData}
            disabled={saving}
          >
            Exporter données
          </Button>
        </div>
      </div>
    </Card>
  );
}