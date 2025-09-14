import React, { useState, useEffect, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  FileText, 
  RefreshCw, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Search,
  Database,
  Book,
  Edit3,
  Send
} from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { secureNotionService, NotionPage, NotionDatabase } from '../services/secureNotionService';

export interface NotionBlockData {
  id: string;
  title: string;
  type: 'notion';
  status: 'connected' | 'disconnected' | 'loading' | 'error';
  notionPageId?: string;
  notionPageTitle?: string;
  notionPageUrl?: string;
  content?: string;
  lastSync?: string;
  metadata: {
    workspace?: string;
    pageType?: 'page' | 'database';
    icon?: string;
    [key: string]: any;
  };
}

interface NotionBlockProps extends NodeProps {
  data: NotionBlockData;
}

function NotionBlock({ data, selected }: NotionBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Icône selon le statut
  const getStatusIcon = () => {
    switch (data.status) {
      case 'connected':
        return CheckCircle;
      case 'loading':
        return Loader2;
      case 'error':
        return AlertCircle;
      default:
        return FileText;
    }
  };

  // Couleur selon le statut
  const getStatusColor = () => {
    switch (data.status) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'loading':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Charger les pages et databases Notion de manière sécurisée
  const loadNotionContent = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const isConnected = await secureNotionService.isConnected();
      if (!isConnected) {
        throw new Error('Non connecté à Notion');
      }

      const [pagesData, databasesData] = await Promise.all([
        secureNotionService.getPages(),
        secureNotionService.getDatabases()
      ]);

      setPages(pagesData);
      setDatabases(databasesData);
    } catch (error: any) {
      console.error('Erreur lors du chargement sécurisé du contenu Notion:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Sélectionner une page Notion de manière sécurisée
  const selectNotionPage = async (page: NotionPage) => {
    setIsLoading(true);
    setError(null);

    try {
      // Charger le contenu de la page de manière sécurisée
      const pageContent = await secureNotionService.getPageContent(page.id);
      
      // Mettre à jour les données du bloc (normalement via un callback)
      // Pour l'instant, on simule la mise à jour
      console.log('Page sélectionnée de manière sécurisée:', {
        pageId: page.id,
        title: page.title,
        content: pageContent.content,
        url: page.url
      });

      // Fermer le sélecteur
      setShowPageSelector(false);
      
      // Ici, vous devrez implémenter la mise à jour du bloc dans le canvas
      // Par exemple : onUpdateBlockData(data.id, { notionPageId: page.id, ... })

    } catch (error: any) {
      console.error('Erreur lors de la sélection sécurisée de la page:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Sélectionner une database Notion
  const selectNotionDatabase = async (database: NotionDatabase) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Database sélectionnée:', database);
      setShowPageSelector(false);
      
      // Ici, vous devrez implémenter la logique spécifique aux databases
      
    } catch (error: any) {
      console.error('Erreur lors de la sélection de la database:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Rafraîchir le contenu de manière sécurisée
  const refreshContent = async () => {
    if (!data.notionPageId) return;
    
    setIsLoading(true);
    try {
      const pageContent = await secureNotionService.getPageContent(data.notionPageId);
      console.log('Contenu rafraîchi de manière sécurisée:', pageContent);
      // Mettre à jour le bloc avec le nouveau contenu
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les pages selon la recherche
  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDatabases = databases.filter(db =>
    db.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatusIcon = getStatusIcon();
  const statusColor = getStatusColor();

  return (
    <>
      <Card 
        className={cn(
          'w-80 bg-white border-2 transition-all duration-200 cursor-pointer',
          'border-gray-300 bg-gray-50', // Couleurs Notion
          selected && 'ring-2 ring-blue-500 ring-offset-2',
          isHovered && 'shadow-lg scale-105'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white rounded-md shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs text-muted-foreground">
              Notion
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <StatusIcon className={cn("w-3 h-3", 
              data.status === 'loading' && 'animate-spin'
            )} />
            <Badge 
              variant="secondary" 
              className={cn('text-xs px-2 py-0.5', statusColor)}
            >
              {data.status}
            </Badge>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-3">
          <h3 className="font-medium text-sm mb-1 line-clamp-1">
            {data.notionPageTitle || data.title}
          </h3>
          
          {data.notionPageId ? (
            <>
              {/* Page connectée */}
              <div className="text-xs text-muted-foreground mb-2">
                {data.metadata.workspace && (
                  <span>📝 {data.metadata.workspace}</span>
                )}
              </div>
              
              {data.content && (
                <div className="text-xs text-gray-600 line-clamp-3 mb-2 p-2 bg-gray-50 rounded">
                  {data.content.slice(0, 150)}...
                </div>
              )}

              {data.lastSync && (
                <div className="text-xs text-muted-foreground">
                  Sync: {new Date(data.lastSync).toLocaleTimeString()}
                </div>
              )}
            </>
          ) : (
            /* Pas de page sélectionnée */
            <div className="text-center py-4">
              <Book className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground mb-3">
                Aucune page Notion sélectionnée
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setShowPageSelector(true);
                  loadNotionContent();
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Search className="w-3 h-3 mr-1" />
                )}
                Sélectionner
              </Button>
            </div>
          )}

          {/* Actions */}
          {data.notionPageId && (
            <div className="flex gap-1 mt-2 pt-2 border-t border-gray-100">
              <Button
                size="sm"
                variant="outline"
                onClick={refreshContent}
                disabled={isLoading}
                className="flex-1 text-xs"
              >
                <RefreshCw className={cn("w-3 h-3 mr-1", isLoading && "animate-spin")} />
                Sync
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPageSelector(true)}
                className="flex-1 text-xs"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Changer
              </Button>
              
              {data.notionPageUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(data.notionPageUrl, '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Handles pour les connexions */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-gray-600 border-2 border-white"
        />
      </Card>

      {/* Dialog de sélection de page */}
      <Dialog open={showPageSelector} onOpenChange={setShowPageSelector}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Sélectionner une page ou database Notion
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher une page ou database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-4">
                {/* Pages */}
                {filteredPages.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Book className="w-4 h-4" />
                      Pages ({filteredPages.length})
                    </h3>
                    <div className="space-y-1">
                      {filteredPages.map((page) => (
                        <div
                          key={page.id}
                          onClick={() => selectNotionPage(page)}
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {page.icon?.emoji && (
                              <span className="text-lg">{page.icon.emoji}</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {page.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Modifié: {new Date(page.last_edited_time).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Separator si on a les deux types */}
                {filteredPages.length > 0 && filteredDatabases.length > 0 && (
                  <Separator />
                )}

                {/* Databases */}
                {filteredDatabases.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Databases ({filteredDatabases.length})
                    </h3>
                    <div className="space-y-1">
                      {filteredDatabases.map((database) => (
                        <div
                          key={database.id}
                          onClick={() => selectNotionDatabase(database)}
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {database.icon?.emoji && (
                              <span className="text-lg">{database.icon.emoji}</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {database.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Database • {new Date(database.last_edited_time).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* État de chargement */}
                {isLoading && (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Chargement du contenu Notion...
                    </p>
                  </div>
                )}

                {/* Aucun résultat */}
                {!isLoading && filteredPages.length === 0 && filteredDatabases.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? 'Aucun résultat trouvé' : 'Aucune page ou database trouvée'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(NotionBlock);