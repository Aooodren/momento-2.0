import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { 
  Share, Edit3, X, ArrowLeft, 
  Calendar, User, Tag, FileText,
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Lightbulb, Target, Layers, Network, Activity,
  ExternalLink, Download, Star, Eye, Crown, Shield, Edit, EyeIcon, Loader2,
  MousePointer, Zap
} from "lucide-react";

import { useCanvasAPI, Block, Relation } from "../hooks/useCanvasAPI";
import { useProjectMembers } from "../hooks/useProjectMembers";
import { useAuthContext } from "../hooks/useAuth";
import { useProjectPermissions } from "../hooks/useProjectPermissions";
import exampleImage from 'figma:asset/f732417d3948b1aee3d2de707001635b53fda24f.png';

interface ProjectDetails {
  id: string;
  title: string;
  type: string;
  from: 'myproject' | 'liked';
}

interface ProjectDetailPageProps {
  project: ProjectDetails;
  onEdit: () => void;
  onEditProperties: () => void;
  onShare: () => void;
  onBack: () => void;
}

interface ProjectInsight {
  id: string;
  type: 'structure' | 'flow' | 'optimization' | 'risk';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  impact: string;
}

interface ProjectMetrics {
  totalBlocks: number;
  totalConnections: number;
  complexity: 'Low' | 'Medium' | 'High';
  status: 'Planning' | 'In Progress' | 'Review' | 'Completed';
  progress: number;
}

interface ProjectTask {
  id: string;
  title: string;
  category: 'Discovery' | 'Design' | 'Development' | 'Analysis';
  status: 'Completed' | 'In Progress' | 'Pending';
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

export default function ProjectDetailPage({ project, onEdit, onEditProperties, onShare, onBack }: ProjectDetailPageProps) {
  const isLiked = project.from === 'liked';
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [insights, setInsights] = useState<ProjectInsight[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllBlocks, setShowAllBlocks] = useState(false);
  
  const { getBlocks, getRelations } = useCanvasAPI();
  const { members, loading: membersLoading, getMembers } = useProjectMembers(project.id);
  const { user } = useAuthContext();
  
  // Get project owner ID and user role from members
  const projectOwner = members.find(m => m.role === 'owner');
  const currentUserMember = user ? members.find(m => m.id === user.id) : null;
  
  // Si c'est un projet de l'utilisateur et qu'on n'a pas encore les membres, 
  // on considère l'utilisateur comme propriétaire par défaut
  const effectiveOwnerId = projectOwner?.id || (project.from === 'myproject' ? user?.id : undefined);
  const effectiveRole = currentUserMember?.role || (project.from === 'myproject' ? 'owner' : undefined);
  
  const { permissions, canEdit, canManageMembers } = useProjectPermissions(
    effectiveOwnerId, 
    effectiveRole as any
  );

  useEffect(() => {
    loadProjectData();
  }, [project.id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [blocksData, relationsData] = await Promise.all([
        getBlocks(project.id),
        getRelations(project.id),
        getMembers().catch(() => []) // Don't fail if members can't be loaded
      ]);

      setBlocks(blocksData);
      setRelations(relationsData);
      
      // Generate smart insights from canvas data
      const projectMetrics = analyzeProjectStructure(blocksData, relationsData);
      const projectInsights = generateSmartInsights(blocksData, relationsData);
      const projectTasks = generateProjectTasks(blocksData, relationsData);
      
      setMetrics(projectMetrics);
      setInsights(projectInsights);
      setTasks(projectTasks);
    } catch (err) {
      console.error('Error loading project data:', err);
      // Fallback to mock data
      setMetrics(getMockMetrics());
      setInsights(getMockInsights());
      setTasks(getMockTasks());
    } finally {
      setLoading(false);
    }
  };

  const analyzeProjectStructure = (blocks: Block[], relations: Relation[]): ProjectMetrics => {
    const totalBlocks = blocks.length;
    const totalConnections = relations.length;
    
    // Calculate complexity based on structure
    const complexity = totalBlocks > 15 || totalConnections > 20 ? 'High' : 
                      totalBlocks > 8 || totalConnections > 10 ? 'Medium' : 'Low';

    // Determine status based on block types and configurations
    const hasLogicBlocks = blocks.some(block => block.type === 'logic');
    const hasValidation = blocks.some(block => block.metadata?.logicType === 'validator');
    
    let status: 'Planning' | 'In Progress' | 'Review' | 'Completed' = 'Planning';
    let progress = 25;

    if (hasLogicBlocks && totalConnections > 5) {
      status = 'In Progress';
      progress = 65;
    }
    if (hasValidation && totalConnections > totalBlocks * 0.8) {
      status = 'Review';
      progress = 85;
    }

    return {
      totalBlocks,
      totalConnections,
      complexity,
      status,
      progress
    };
  };

  const generateSmartInsights = (blocks: Block[], relations: Relation[]): ProjectInsight[] => {
    const insights: ProjectInsight[] = [];
    const totalBlocks = blocks.length;
    const totalConnections = relations.length;
    const connectionRatio = totalConnections / Math.max(totalBlocks, 1);

    // Structure insights
    if (connectionRatio < 0.3) {
      insights.push({
        id: 'structure-1',
        type: 'structure',
        title: 'Low connectivity detected',
        description: 'Several blocks appear isolated. Consider adding more connections to improve information flow.',
        priority: 'high',
        actionable: true,
        impact: 'Better project coherence and reduced silos'
      });
    }

    // Flow insights
    const logicBlocks = blocks.filter(block => block.type === 'logic');
    if (logicBlocks.length === 0) {
      insights.push({
        id: 'flow-1',
        type: 'flow',
        title: 'Missing workflow definition',
        description: 'No logic blocks found. Adding workflow blocks can improve process clarity.',
        priority: 'medium',
        actionable: true,
        impact: 'Clearer process definition and team coordination'
      });
    }

    // Optimization insights
    if (totalBlocks > 20) {
      insights.push({
        id: 'optimization-1',
        type: 'optimization',
        title: 'High complexity project',
        description: 'Consider grouping related blocks or creating sub-projects for better management.',
        priority: 'medium',
        actionable: true,
        impact: 'Improved maintainability and team focus'
      });
    }

    // Risk insights
    const hasValidation = blocks.some(block => block.metadata?.logicType === 'validator');
    if (!hasValidation && totalBlocks > 10) {
      insights.push({
        id: 'risk-1',
        type: 'risk',
        title: 'Missing validation checkpoints',
        description: 'Large projects benefit from validation blocks at critical decision points.',
        priority: 'high',
        actionable: true,
        impact: 'Reduced project risk and better quality control'
      });
    }

    return insights;
  };

  const generateProjectTasks = (blocks: Block[], relations: Relation[]): ProjectTask[] => {
    const tasks: ProjectTask[] = [];
    const totalBlocks = blocks.length;
    const hasWorkflow = blocks.some(block => block.metadata?.logicType === 'workflow');

    // Generate realistic tasks based on project structure
    tasks.push({
      id: 'task-1',
      title: 'Define project scope and objectives',
      category: 'Discovery',
      status: 'Completed',
      dueDate: 'Dec 3, 2024',
      priority: 'high'
    });

    tasks.push({
      id: 'task-2',
      title: 'Map stakeholder requirements',
      category: 'Discovery',
      status: 'Completed',
      dueDate: 'Dec 4, 2024',
      priority: 'high'
    });

    if (!hasWorkflow) {
      tasks.push({
        id: 'task-3',
        title: 'Implement workflow validation',
        category: 'Design',
        status: 'In Progress',
        dueDate: 'Dec 28, 2024',
        priority: 'medium'
      });
    }

    if (totalBlocks > 15) {
      tasks.push({
        id: 'task-4',
        title: 'Optimize project structure',
        category: 'Analysis',
        status: 'Pending',
        dueDate: 'Jan 5, 2025',
        priority: 'medium'
      });
    }

    return tasks;
  };

  const getMockMetrics = (): ProjectMetrics => ({
    totalBlocks: 12,
    totalConnections: 8,
    complexity: 'Medium',
    status: 'In Progress',
    progress: 65
  });

  const getMockInsights = (): ProjectInsight[] => ([
    {
      id: 'mock-1',
      type: 'structure',
      title: 'Well-balanced architecture',
      description: 'Project shows good structural organization with appropriate complexity.',
      priority: 'low',
      actionable: false,
      impact: 'Maintained project clarity and team productivity'
    },
    {
      id: 'mock-2',
      type: 'optimization',
      title: 'Automation opportunities',
      description: 'Several manual processes could benefit from workflow automation.',
      priority: 'medium',
      actionable: true,
      impact: 'Reduced manual overhead and improved efficiency'
    }
  ]);

  const getMockTasks = (): ProjectTask[] => ([
    {
      id: 'mock-task-1',
      title: 'Schedule initial client meeting',
      category: 'Discovery',
      status: 'Completed',
      dueDate: 'Dec 3, 2024',
      priority: 'high'
    },
    {
      id: 'mock-task-2',
      title: 'Gather business goals and user needs',
      category: 'Discovery',
      status: 'Completed',
      dueDate: 'Dec 4, 2024',
      priority: 'high'
    },
    {
      id: 'mock-task-3',
      title: 'Review current website performance',
      category: 'Discovery',
      status: 'In Progress',
      dueDate: 'Dec 5, 2024',
      priority: 'medium'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Review': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'structure': return <Layers className="w-4 h-4" />;
      case 'flow': return <Activity className="w-4 h-4" />;
      case 'optimization': return <TrendingUp className="w-4 h-4" />;
      case 'risk': return <AlertTriangle className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'editor': return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-3 h-3" />;
      case 'admin': return <Shield className="w-3 h-3" />;
      case 'editor': return <Edit className="w-3 h-3" />;
      case 'viewer': return <EyeIcon className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'owner': return 'Propriétaire';
      case 'admin': return 'Admin';
      case 'editor': return 'Éditeur';
      case 'viewer': return 'Lecteur';
      default: return role;
    }
  };

  // Fonction pour combiner l'utilisateur actuel avec les membres du projet
  const getAllMembers = () => {
    if (!user) return members;
    
    // Créer un membre représentant l'utilisateur actuel (propriétaire/créateur)
    const currentUserAsMember = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'owner' as const,
      status: 'active' as const,
      joinedAt: user.created_at,
      avatarUrl: user.avatar_url,
      lastActiveAt: new Date().toISOString(),
      isCurrentUser: true
    };

    // Vérifier si l'utilisateur actuel est déjà dans la liste des membres
    const userAlreadyInMembers = members.some(member => member.email === user.email);
    
    if (userAlreadyInMembers) {
      // Marquer l'utilisateur actuel dans la liste existante
      return members.map(member => 
        member.email === user.email 
          ? { ...member, isCurrentUser: true }
          : member
      );
    } else {
      // Ajouter l'utilisateur actuel en première position
      return [currentUserAsMember, ...members];
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading project insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Client Projects</span>
              <span>/</span>
              <span className="text-foreground font-medium">{project.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onShare}
              disabled={!permissions.canShare}
              className={`${!permissions.canShare ? 'opacity-50' : ''}`}
            >
              <Share className="w-4 h-4 mr-2" />
              Partager
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onEditProperties}
              disabled={!canEdit}
              className={`${!canEdit ? 'opacity-50' : ''}`}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
          {/* Project Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold mb-6">{project.title}</h1>
            
            {/* Project Properties */}
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-20">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Status</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(metrics?.status || 'Planning')} border px-3 py-1`}
                >
                  {metrics?.status || 'Planning'}
                </Badge>
              </div>

              {/* Members */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-20">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Membres</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {membersLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ) : (() => {
                    const allMembers = getAllMembers();
                    return allMembers.length > 0 ? (
                      <>
                        {allMembers.slice(0, 3).map((member, index) => (
                          <div key={member.id} className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={member.avatarUrl} alt={member.name} />
                              <AvatarFallback className="text-xs">
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium">{member.name}</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs px-1.5 py-0.5 flex items-center gap-1 ${getRoleColor(member.role)}`}
                              >
                                {getRoleIcon(member.role)}
                                {getRoleText(member.role)}
                              </Badge>
                            </div>
                            {index < Math.min(allMembers.length - 1, 2) && (
                              <span className="text-muted-foreground text-sm">•</span>
                            )}
                          </div>
                        ))}
                        {allMembers.length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            +{allMembers.length - 3} autres
                          </Badge>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-gray-100 text-gray-500">
                            <User className="w-3 h-3" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">Aucun membre assigné</span>
                        {canManageMembers && (
                          <Button variant="ghost" size="sm" onClick={onShare} className="text-xs h-6 px-2 text-blue-600 hover:text-blue-700">
                            Inviter des membres
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-20">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Date</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>June 3, 2025</span>
                  <span className="text-muted-foreground">→</span>
                  <span>June 28, 2025</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-20">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tags</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Design
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Client Work
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground text-[14px] text-[13px] font-normal font-bold">Description</span>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p className="mb-4">
                This task focuses on preparing a high-impact visual presentation that showcases the new website design 
                concept for Client X. The goal is to clearly communicate the updated UI direction, design system, and user flow 
                improvements to the client in a concise and engaging format.
              </p>
              <p>
                The presentation will include wireframes, visual mockups, user journey maps, and interactive prototypes 
                to demonstrate the enhanced user experience and business value proposition.
              </p>
            </div>
          </div>

          {/* Canvas Access */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <MousePointer className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Espace de travail</span>
            </div>
            <div className="p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors cursor-pointer group" onClick={onEdit}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Accéder au canvas</h3>
                    <p className="text-sm text-muted-foreground">
                      Modifiez les blocs, créez des connexions et gérez la structure du projet
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{metrics?.totalBlocks || 0} blocs</span>
                      <span>•</span>
                      <span>{metrics?.totalConnections || 0} connexions</span>
                      <span>•</span>
                      <span>Complexité {metrics?.complexity || 'Medium'}</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors"
                  disabled={!canEdit}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ouvrir
                </Button>
              </div>
            </div>
          </div>



          {/* AI Insights */}
          {insights.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">AI Insights</span>
                <Badge variant="outline" className="text-xs">
                  {insights.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {insights.map((insight) => (
                  <div 
                    key={insight.id} 
                    className="flex items-start gap-3 p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className={`p-1.5 rounded-md ${
                      insight.type === 'risk' ? 'bg-red-100 text-red-600' :
                      insight.type === 'optimization' ? 'bg-blue-100 text-blue-600' :
                      insight.type === 'flow' ? 'bg-green-100 text-green-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium">{insight.title}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(insight.priority)}`}
                        >
                          {insight.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      {insight.actionable && (
                        <p className="text-xs text-blue-600 font-medium">💡 {insight.impact}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Attachment</span>
                <Badge variant="outline" className="text-xs">2</Badge>
              </div>
              <Button variant="ghost" size="sm" className="text-sm text-blue-600 hover:text-blue-700">
                <Download className="w-4 h-4 mr-1" />
                Download All
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-red-600">PDF</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">ClientX_UI_Redesign.pdf</p>
                  <p className="text-xs text-muted-foreground">4.8 Mb</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-purple-600">FIG</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Homepage_Mockup.fig</p>
                  <p className="text-xs text-muted-foreground">12.4 Mb</p>
                </div>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Task List</span>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b">
                <div className="grid grid-cols-5 gap-4 text-xs font-medium text-muted-foreground">
                  <span>No</span>
                  <span>Task</span>
                  <span>Category</span>
                  <span>Status</span>
                  <span>Due Date</span>
                </div>
              </div>
              <div className="divide-y">
                {tasks.map((task, index) => (
                  <div key={task.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <span className="text-sm text-muted-foreground">{index + 1}</span>
                      <span className="text-sm font-medium">{task.title}</span>
                      <Badge variant="outline" className="text-xs w-fit">
                        {task.category}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs w-fit ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{task.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Layers */}
          {blocks.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Calques du projet</span>
                  <Badge variant="outline" className="text-xs">
                    {blocks.length} élément{blocks.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 border-b">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Nom du block</span>
                    <span>Type</span>
                  </div>
                </div>
                <div>
                  <div className="divide-y">
                    {(showAllBlocks ? blocks : blocks.slice(0, 3)).map((block, index) => (
                      <div 
                        key={block.id} 
                        className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {block.title || `Block ${index + 1}`}
                              {block.content && (
                                <span className="ml-2 text-xs text-muted-foreground font-normal">
                                  {block.content.length > 40 ? `${block.content.substring(0, 40)}...` : block.content}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              block.type === 'input' ? 'bg-green-50 text-green-700 border-green-200' :
                              block.type === 'output' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              block.type === 'logic' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {block.type === 'input' ? 'Entrée' :
                             block.type === 'output' ? 'Sortie' :
                             block.type === 'logic' ? 'Logique' :
                             block.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Bouton Voir plus/moins */}
                  {blocks.length > 3 && (
                    <div className="border-t bg-muted/20 px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllBlocks(!showAllBlocks)}
                        className="w-full justify-center text-xs text-muted-foreground hover:text-foreground"
                      >
                        {showAllBlocks ? (
                          <>
                            Voir moins
                            <span className="ml-2">↑</span>
                          </>
                        ) : (
                          <>
                            Voir {blocks.length - 3} autres éléments
                            <span className="ml-2">↓</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>


    </div>
  );
}