import { useState } from "react";
import { LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { supabase } from '../utils/supabase/client';

interface AuthComponentProps {
  onAuthSuccess: (accessToken: string, user: any) => void;
}

export default function AuthComponent({ onAuthSuccess }: AuthComponentProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          throw error;
        }

        if (data.session?.access_token && data.user) {
          onAuthSuccess(data.session.access_token, data.user);
        }
      } else {
        // Sign up directly with Supabase (simplified)
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name
            }
          }
        });

        if (error) {
          throw error;
        }

        if (data.session?.access_token && data.user) {
          // User is automatically signed in after signup
          onAuthSuccess(data.session.access_token, data.user);
        } else if (data.user && !data.session) {
          // User created but needs email confirmation
          setError('Compte créé ! Vérifiez votre email pour vous connecter.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Handle specific auth errors
      if (err.message?.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect. Vérifiez vos informations.');
      } else if (err.message?.includes('User already registered')) {
        setError('Cette adresse email est déjà utilisée. Essayez de vous connecter.');
        setIsLogin(true);
      } else if (err.message?.includes('Password should be at least')) {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
      } else if (err.message?.includes('Unable to validate email address')) {
        setError('Adresse email invalide.');
      } else {
        setError(err.message || 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFormData({ email: '', password: '', name: '' });
  };

  // Demo credentials helper
  const useDemoCredentials = () => {
    setFormData({
      email: 'demo@innovation-canvas.com',
      password: 'demo123',
      name: 'Demo User'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Connectez-vous pour accéder à vos projets d\'innovation'
              : 'Créez votre compte pour commencer à innover'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Nom complet *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Votre nom"
                  required={!isLogin}
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="votre.email@exemple.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Mot de passe *
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">
                  Au moins 6 caractères
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full gap-2" 
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isLogin ? 'Se connecter' : 'Créer le compte'}
                </>
              )}
            </Button>
          </form>

          {/* Demo credentials button */}
          <div className="mt-4">
            <Button 
              onClick={useDemoCredentials}
              variant="outline"
              className="w-full gap-2"
              disabled={loading}
              type="button"
            >
              Utiliser les identifiants de démo
            </Button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              disabled={loading}
            >
              {isLogin 
                ? "Pas encore de compte ? Créer un compte"
                : "Déjà un compte ? Se connecter"
              }
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note :</strong> Cette application est destinée aux prototypes et tests. 
              N'utilisez pas d'informations sensibles.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}