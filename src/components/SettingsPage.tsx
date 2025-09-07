import { useState, useEffect } from "react";
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
import InvitationDebugInfo from "./InvitationDebugInfo";
import SupabaseConfigGuide from "./SupabaseConfigGuide";
import InvitationTestComponent from "./InvitationTestComponent";

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, updateProfile, signOut, error, loading } = useAuthContext();

  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    updates: true
  });

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
  
  // État pour le profil utilisateur
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || '',
    phone: '',
    company: '',
    location: '',
    bio: ''
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Mettre à jour les données du profil quand l'utilisateur change
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        avatar_url: user.avatar_url || '',
        phone: '',
        company: '',
        location: '',
        bio: ''
      });
    }
  }, [user]);

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
    if (!updateProfile) {
      console.error('updateProfile function is not available');
      return;
    }

    setIsUpdating(true);
    setUpdateSuccess(false);
    
    try {
      await updateProfile({
        name: profileData.name || '',
        avatar_url: profileData.avatar_url || ''
      });
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const [profile, setProfile] = useState({
    phone: '',
    bio: '',
    company: '',
    location: ''
  });

  const sections = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'appearance', label: 'Apparence', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'invitations', label: 'Invitations', icon: Mail }
  ];

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4">Informations du profil</h3>
        
        {/* Photo de profil */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="text-lg bg-gradient-to-br from-blue-100 to-indigo-200 text-blue-700">
              {profileData.name && profileData.name.trim() ? getInitials(profileData.name) : (user?.email ? user.email[0].toUpperCase() : 'U')}
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
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
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
                value={profileData.email}
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
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Entreprise</Label>
            <Input 
              id="company" 
              value={profileData.company}
              onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="location">Localisation</Label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input 
                id="location" 
                className="pl-10"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea 
              id="bio"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSaveProfile}
            disabled={isUpdating}
          >
            {isUpdating ? (
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
                {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span className="font-medium">Mode sombre</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Basculer entre le thème clair et sombre
              </p>
            </div>
            <Switch 
              checked={darkMode} 
              onCheckedChange={setDarkMode}
            />
          </div>

          <Separator />

          {/* Langue */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="font-medium">Langue</span>
            </div>
            <Select defaultValue="fr">
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
            <Select defaultValue="medium">
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
            <Switch />
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
              checked={notifications.email} 
              onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
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
              checked={notifications.push} 
              onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
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
              checked={notifications.updates} 
              onCheckedChange={(checked) => setNotifications({ ...notifications, updates: checked })}
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
              checked={notifications.marketing} 
              onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderInvitationsSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4">Système d'invitations</h3>
        
        <div className="space-y-6">
          {/* Status du système */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Système d'invitations activé</span>
            </div>
            <p className="text-sm text-green-800">
              Les invitations utilisent maintenant le système Supabase Auth intégré avec envoi d'emails automatique.
            </p>
          </div>

          <Separator />

          {/* Configuration des emails */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="font-medium">Configuration des emails d'invitation</span>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Templates d'emails</p>
                    <p className="text-sm text-blue-800">
                      Les templates d'emails sont configurables dans le dashboard Supabase, section "Authentication" → "Email Templates".
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Personnalisation</p>
                    <p className="text-sm text-blue-800">
                      Vous pouvez personnaliser le contenu, le design et l'expéditeur des emails d'invitation directement depuis Supabase.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Variables disponibles</p>
                    <p className="text-sm text-blue-800">
                      Les emails incluent automatiquement les informations du projet, du rôle et de l'inviteur via les métadonnées utilisateur.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" className="mt-4">
              <Globe className="w-4 h-4 mr-2" />
              Ouvrir le dashboard Supabase
            </Button>
          </div>

          <Separator />

          {/* Diagnostic */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Diagnostic des invitations</span>
            </div>
            
            <InvitationDebugInfo />
          </div>

          <Separator />

          {/* Informations techniques */}
          <div className="space-y-3">
            <span className="font-medium">Informations techniques</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Envoi automatique</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Les emails sont envoyés automatiquement par Supabase lors de l'invitation
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Expiration automatique</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Les liens d'invitation expirent selon la configuration Supabase
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Sécurité renforcée</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Utilise les tokens sécurisés de Supabase Auth
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Gestion des utilisateurs</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Création automatique de compte si nécessaire
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Test en temps réel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Test en temps réel</span>
            </div>
            
            <InvitationTestComponent />
          </div>

          <Separator />

          {/* Guide de configuration */}
          <div className="space-y-4">
            <SupabaseConfigGuide />
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
                />
              </div>
            </div>
            <Button variant="outline" size="sm">
              Mettre à jour le mot de passe
            </Button>
          </div>

          <Separator />

          {/* Sessions */}
          <div className="space-y-3">
            <span className="font-medium">Sessions actives</span>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    <span className="font-medium">Session actuelle</span>
                    <Badge variant="outline" className="text-xs">En cours</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Chrome sur macOS • Paris, France • Il y a 2 minutes
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span className="font-medium">iPhone</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Safari Mobile • Paris, France • Il y a 2 heures
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Déconnecter
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Export des données */}
          <div className="space-y-3">
            <span className="font-medium">Données personnelles</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
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
                      <Input id="confirm-delete" placeholder="SUPPRIMER" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">Annuler</Button>
                      <Button variant="destructive">Supprimer définitivement</Button>
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
      case 'invitations':
        return renderInvitationsSection();
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