import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Shield, 
  Monitor, 
  Moon, 
  Sun, 
  Globe,
  Loader2,
  Save,
  CheckCircle, 
  Trash2, 
  Download, 
  Upload,
  Camera,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";
import { useAuthContext } from "../hooks/useAuth";
import { useUserPreferences } from "../hooks/useUserPreferences";
import UserPreferencesTest from "./UserPreferencesTest";

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPageNew({ onBack }: SettingsPageProps) {
  const { user, updateProfile, signOut } = useAuthContext();
  const { 
    preferences, 
    sessions, 
    loading, 
    saving, 
    error,
    savePreferences,
    changePassword,
    exportUserData,
    deleteAccount,
    terminateSession
  } = useUserPreferences();

  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Affichage de chargement si l'utilisateur n'est pas encore chargé
  if (loading || !user) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  // Afficher les messages de succès
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getInitials = (name: string) => {
    if (!name || !name.trim()) return 'U';
    
    return name
      .trim()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const handleSaveProfile = async () => {
    try {
      await savePreferences({
        phone: preferences.phone,
        company: preferences.company,
        location: preferences.location,
        bio: preferences.bio
      });
      
      showSuccess('Profil mis à jour avec succès!');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      return;
    }
    
    if (newPassword !== confirmPassword) {
      return;
    }
    
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSuccess('Mot de passe modifié avec succès!');
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
    }
  };

  const handleExportData = async () => {
    try {
      await exportUserData();
      showSuccess('Données exportées avec succès!');
    } catch (error) {
      console.error('Erreur export données:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(deleteConfirmText);
      showSuccess('Compte supprimé.');
    } catch (error) {
      console.error('Erreur suppression compte:', error);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'appearance', label: 'Apparence', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'test', label: 'Test', icon: CheckCircle }
  ];

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4">Informations du profil</h3>
        
        {/* Message de succès */}
        {successMessage && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        {/* Photo de profil */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="text-lg bg-gradient-to-br from-blue-100 to-indigo-200 text-blue-700">
              {user?.name ? getInitials(user.name) : (user?.email ? user.email[0].toUpperCase() : 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Camera className="w-4 h-4 mr-2" />
                Changer la photo
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              JPG, PNG ou GIF. Max 2MB.
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input 
              id="name" 
              value={user?.name || ''}
              disabled
              title="Le nom est géré via le profil d'authentification"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input 
                id="email" 
                type="email"
                className="pl-10"
                value={user?.email || ''}
                disabled
                title="L'email ne peut pas être modifié"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input 
                id="phone" 
                type="tel"
                className="pl-10"
                value={preferences.phone}
                onChange={(e) => savePreferences({ phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Entreprise</Label>
            <Input 
              id="company" 
              value={preferences.company}
              onChange={(e) => savePreferences({ company: e.target.value })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="location">Localisation</Label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input 
                id="location" 
                className="pl-10"
                value={preferences.location}
                onChange={(e) => savePreferences({ location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea 
              id="bio"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={preferences.bio}
              onChange={(e) => savePreferences({ bio: e.target.value })}
              placeholder="Parlez-nous de vous..."
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder les modifications
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4">Préférences d'affichage</h3>
        
        <div className="space-y-6">
          {/* Thème */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {preferences.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span className="font-medium">Mode sombre</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Basculer entre le thème clair et sombre
              </p>
            </div>
            <Switch 
              checked={preferences.theme === 'dark'} 
              onCheckedChange={(checked) => savePreferences({ theme: checked ? 'dark' : 'light' })}
            />
          </div>

          <Separator />

          {/* Langue */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="font-medium">Langue</span>
            </div>
            <Select 
              value={preferences.language} 
              onValueChange={(value) => savePreferences({ language: value as any })}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Sélectionner une langue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Taille de police */}
          <div className="space-y-3">
            <span className="font-medium">Taille de police</span>
            <Select 
              value={preferences.fontSize}
              onValueChange={(value) => savePreferences({ fontSize: value as any })}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Petite</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Sidebar */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-medium">Sidebar réduite par défaut</span>
              <p className="text-sm text-muted-foreground">
                Démarrer avec la sidebar en mode réduit
              </p>
            </div>
            <Switch 
              checked={preferences.sidebarCollapsed}
              onCheckedChange={(checked) => savePreferences({ sidebarCollapsed: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4">Préférences de notification</h3>
        
        <div className="space-y-6">
          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="font-medium">Notifications par email</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications importantes par email
              </p>
            </div>
            <Switch 
              checked={preferences.emailNotifications} 
              onCheckedChange={(checked) => savePreferences({ emailNotifications: checked })}
            />
          </div>

          <Separator />

          {/* Push */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="font-medium">Notifications push</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications en temps réel
              </p>
            </div>
            <Switch 
              checked={preferences.pushNotifications} 
              onCheckedChange={(checked) => savePreferences({ pushNotifications: checked })}
            />
          </div>

          <Separator />

          {/* Mises à jour */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-medium">Mises à jour produit</span>
              <p className="text-sm text-muted-foreground">
                Être informé des nouvelles fonctionnalités
              </p>
            </div>
            <Switch 
              checked={preferences.productUpdates} 
              onCheckedChange={(checked) => savePreferences({ productUpdates: checked })}
            />
          </div>

          <Separator />

          {/* Marketing */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-medium">Emails marketing</span>
              <p className="text-sm text-muted-foreground">
                Recevoir des conseils et des actualités
              </p>
            </div>
            <Switch 
              checked={preferences.marketingEmails} 
              onCheckedChange={(checked) => savePreferences({ marketingEmails: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4">Sécurité et confidentialité</h3>
        
        <div className="space-y-6">
          {/* Mot de passe */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Changer le mot de passe</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <div className="relative">
                  <Input 
                    id="current-password" 
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input 
                  id="new-password" 
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input 
                  id="confirm-password" 
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleChangePassword}>
              Mettre à jour le mot de passe
            </Button>
          </div>

          <Separator />

          {/* Sessions */}
          <div className="space-y-3">
            <span className="font-medium">Sessions actives</span>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      <span className="font-medium">{session.device}</span>
                      {session.current && <Badge variant="outline" className="text-xs">En cours</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {session.location} • {session.lastActive}
                    </p>
                  </div>
                  {!session.current && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => terminateSession(session.id)}
                    >
                      Déconnecter
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Export des données */}
          <div className="space-y-3">
            <span className="font-medium">Données personnelles</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                Exporter mes données
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer le compte
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Supprimer le compte</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-delete">
                        Tapez "SUPPRIMER" pour confirmer
                      </Label>
                      <Input 
                        id="confirm-delete" 
                        placeholder="SUPPRIMER" 
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">Annuler</Button>
                      <Button 
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'SUPPRIMER'}
                      >
                        Supprimer définitivement
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTestSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4">Test des préférences utilisateur</h3>
        <p className="text-muted-foreground mb-6">
          Cette section permet de tester le système de préférences en temps réel.
        </p>
        <UserPreferencesTest />
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'appearance':
        return renderAppearanceSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'security':
        return renderSecuritySection();
      case 'test':
        return renderTestSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
            <div className="border-l border-gray-300 h-6"></div>
            <h1>Réglages</h1>
          </div>
          <p className="text-muted-foreground">
            Gérez vos préférences et paramètres de compte
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar des sections */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              {renderCurrentSection()}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}