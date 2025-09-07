import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { 
  AlertTriangle, Shield, TrendingUp, Target, Network, 
  Clock, Zap, ArrowRight, BarChart3, Activity, 
  ChevronRight, Eye, Download, Share, RefreshCw, Info,
  Timer, Cpu, Brain, LineChart
} from "lucide-react";
import { 
  LineChart as RechartsLineChart, 
  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Line, 
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface RiskItem {
  id: string;
  risk: string;
  impact: 'Faible' | 'Moyen' | 'Élevé';
  probability: number;
  category: string;
  severity: number; // 1-9 calculé à partir de impact × probability
  mitigation?: string;
  owner?: string;
  status: 'Identifié' | 'En cours' | 'Mitigé' | 'Accepté';
}

interface RiskAnalysisProps {
  projectId: string;
  risks: {
    shortTerm: RiskItem[];
    mediumTerm: RiskItem[];
    longTerm: RiskItem[];
  };
  onBack?: () => void;
}

export default function RiskAnalysisPage({ projectId, risks, onBack }: RiskAnalysisProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'shortTerm' | 'mediumTerm' | 'longTerm'>('all');
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);
  const [matrixView, setMatrixView] = useState(true);

  // Combiner tous les risques avec timeframe
  const allRisks = [
    ...risks.shortTerm.map(r => ({ ...r, timeframe: 'Court terme' as const })),
    ...risks.mediumTerm.map(r => ({ ...r, timeframe: 'Moyen terme' as const })),
    ...risks.longTerm.map(r => ({ ...r, timeframe: 'Long terme' as const }))
  ];

  // Calculer les métriques de risque
  const riskMetrics = {
    total: allRisks.length,
    high: allRisks.filter(r => r.severity >= 7).length,
    medium: allRisks.filter(r => r.severity >= 4 && r.severity < 7).length,
    low: allRisks.filter(r => r.severity < 4).length,
    avgSeverity: allRisks.reduce((acc, r) => acc + r.severity, 0) / allRisks.length || 0
  };

  // Fonction pour obtenir la couleur selon la sévérité
  const getSeverityColor = (severity: number) => {
    if (severity >= 7) return 'bg-red-500';
    if (severity >= 4) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getSeverityTextColor = (severity: number) => {
    if (severity >= 7) return 'text-red-600 bg-red-50 border-red-200';
    if (severity >= 4) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  // Matrice de risques 3x3 - Version simplifiée
  const RiskMatrix = () => {
    const impactLevels = ['Élevé', 'Moyen', 'Faible'];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Matrice de Risques
          </CardTitle>
          <CardDescription>
            Visualisation impact vs probabilité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Grille simplifiée */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {/* Header */}
              <div className="text-center text-sm text-muted-foreground p-2"></div>
              <div className="text-center text-sm text-muted-foreground p-2">Faible</div>
              <div className="text-center text-sm text-muted-foreground p-2">Moyen</div>
              <div className="text-center text-sm text-muted-foreground p-2">Élevé</div>

              {/* Lignes de la matrice */}
              {impactLevels.map((impact, impactIndex) => (
                <React.Fragment key={impact}>
                  <div className="text-sm text-muted-foreground p-2 flex items-center justify-center">
                    {impact}
                  </div>
                  {[0, 1, 2].map((probIndex) => {
                    const cellRisks = allRisks.filter(risk => {
                      const riskImpact = risk.impact;
                      const riskProb = risk.probability;
                      
                      const impactMatch = riskImpact === impact;
                      const probMatch = probIndex === 0 ? riskProb <= 33 : 
                                       probIndex === 1 ? riskProb > 33 && riskProb <= 66 : 
                                       riskProb > 66;
                      
                      return impactMatch && probMatch;
                    });

                    const severity = (2 - impactIndex) * 3 + probIndex + 1;
                    const cellColor = severity >= 7 ? 'border-red-300 bg-red-50' :
                                     severity >= 4 ? 'border-orange-300 bg-orange-50' :
                                     'border-green-300 bg-green-50';

                    return (
                      <div 
                        key={`${impactIndex}-${probIndex}`}
                        className={`min-h-16 p-3 border rounded-lg ${cellColor} relative hover:bg-opacity-80 transition-colors`}
                      >
                        <div className="flex flex-wrap gap-1">
                          {cellRisks.slice(0, 4).map((risk, index) => (
                            <div 
                              key={risk.id}
                              className="w-2 h-2 rounded-full bg-current opacity-60"
                              title={risk.risk}
                            />
                          ))}
                          {cellRisks.length > 4 && (
                            <div className="text-xs text-muted-foreground ml-1">
                              +{cellRisks.length - 4}
                            </div>
                          )}
                        </div>
                        {cellRisks.length > 0 && (
                          <div className="absolute bottom-1 right-2 text-xs font-medium text-muted-foreground">
                            {cellRisks.length}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Diagramme de flux des risques - Version épurée
  const RiskFlowDiagram = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Flux d'Impact des Risques
          </CardTitle>
          <CardDescription>
            Enchaînement et amplification des risques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Niveau 1: Risques initiaux */}
            <div className="text-center">
              <h4 className="text-sm text-muted-foreground mb-3">Risques Initiaux</h4>
              <div className="flex justify-center gap-4">
                {allRisks.filter(r => r.severity >= 6).slice(0, 3).map((risk) => (
                  <div key={risk.id} className="border border-red-200 bg-red-50 rounded-lg p-3 max-w-40">
                    <div className="text-xs font-medium text-red-800 truncate">
                      {risk.risk.substring(0, 30)}...
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Sévérité: {risk.severity}/9
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flèches */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-2">
                <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
                <span className="text-xs text-muted-foreground">Peut causer</span>
              </div>
            </div>

            {/* Niveau 2: Risques secondaires */}
            <div className="text-center">
              <h4 className="text-sm text-muted-foreground mb-3">Impacts Secondaires</h4>
              <div className="flex justify-center gap-4">
                {allRisks.filter(r => r.severity >= 4 && r.severity < 6).slice(0, 4).map((risk) => (
                  <div key={risk.id} className="border border-orange-200 bg-orange-50 rounded-lg p-3 max-w-36">
                    <div className="text-xs font-medium text-orange-800 truncate">
                      {risk.risk.substring(0, 25)}...
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      Sévérité: {risk.severity}/9
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flèches */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-2">
                <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
                <span className="text-xs text-muted-foreground">Peut amplifier</span>
              </div>
            </div>

            {/* Niveau 3: Impact proyecto */}
            <div className="text-center">
              <h4 className="text-sm text-muted-foreground mb-3">Impact Global</h4>
              <div className="border border-red-200 bg-red-50 rounded-lg p-4 max-w-md mx-auto">
                <div className="text-sm font-medium text-red-800 mb-2">
                  Risque d'échec du projet
                </div>
                <div className="text-xs text-red-600 mb-2">
                  Probabilité cumulée: {Math.round(riskMetrics.avgSeverity * 10)}%
                </div>
                <Progress value={riskMetrics.avgSeverity * 10} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Données pour les graphiques
  const getTimelineData = () => {
    const periods = ['Court terme', 'Moyen terme', 'Long terme'];
    const data = periods.map((period, index) => {
      const periodRisks = index === 0 ? risks.shortTerm : 
                         index === 1 ? risks.mediumTerm : risks.longTerm;
      
      const highSeverity = periodRisks.filter(r => r.severity >= 7).length;
      const mediumSeverity = periodRisks.filter(r => r.severity >= 4 && r.severity < 7).length;
      const lowSeverity = periodRisks.filter(r => r.severity < 4).length;
      const avgSeverity = periodRisks.length > 0 
        ? periodRisks.reduce((acc, r) => acc + r.severity, 0) / periodRisks.length 
        : 0;
      const avgProbability = periodRisks.length > 0 
        ? periodRisks.reduce((acc, r) => acc + r.probability, 0) / periodRisks.length 
        : 0;

      return {
        period,
        total: periodRisks.length,
        high: highSeverity,
        medium: mediumSeverity,
        low: lowSeverity,
        avgSeverity: Math.round(avgSeverity * 10) / 10,
        avgProbability: Math.round(avgProbability),
        riskScore: Math.round(avgSeverity * avgProbability / 10)
      };
    });
    
    return data;
  };

  // Données pour le graphique en aires empilées
  const getStackedAreaData = () => {
    return [
      { month: 'Jan', courtTerme: 2, moyenTerme: 1, longTerme: 1 },
      { month: 'Fév', courtTerme: 3, moyenTerme: 2, longTerme: 1 },
      { month: 'Mar', courtTerme: 2, moyenTerme: 2, longTerme: 2 },
      { month: 'Avr', courtTerme: risks.shortTerm.length, moyenTerme: risks.mediumTerm.length, longTerme: risks.longTerm.length },
    ];
  };

  // Graphiques visuels avancés
  const VisualTimelineCharts = () => {
    const timelineData = getTimelineData();
    const stackedData = getStackedAreaData();
    
    const colors = {
      high: '#ef4444',
      medium: '#f97316', 
      low: '#22c55e',
      courtTerme: '#ef4444',
      moyenTerme: '#f97316',
      longTerme: '#3b82f6'
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique de distribution des risques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Distribution par Sévérité
            </CardTitle>
            <CardDescription>
              Répartition des risques par niveau de criticité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsBarChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="high" stackId="a" fill={colors.high} name="Sévérité élevée" />
                <Bar dataKey="medium" stackId="a" fill={colors.medium} name="Sévérité moyenne" />
                <Bar dataKey="low" stackId="a" fill={colors.low} name="Sévérité faible" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Évolution temporelle des risques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Évolution des Risques
            </CardTitle>
            <CardDescription>
              Progression des risques dans le temps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stackedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="courtTerme" 
                  stackId="1" 
                  stroke={colors.courtTerme} 
                  fill={colors.courtTerme}
                  fillOpacity={0.6}
                  name="Court terme"
                />
                <Area 
                  type="monotone" 
                  dataKey="moyenTerme" 
                  stackId="1" 
                  stroke={colors.moyenTerme} 
                  fill={colors.moyenTerme}
                  fillOpacity={0.6}
                  name="Moyen terme"
                />
                <Area 
                  type="monotone" 
                  dataKey="longTerme" 
                  stackId="1" 
                  stroke={colors.longTerme} 
                  fill={colors.longTerme}
                  fillOpacity={0.6}
                  name="Long terme"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Score de risque combiné */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5" />
              Score de Risque Global
            </CardTitle>
            <CardDescription>
              Sévérité moyenne et probabilité par période
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsLineChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgSeverity" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  name="Sévérité moyenne"
                />
                <Line 
                  type="monotone" 
                  dataKey="avgProbability" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  name="Probabilité moyenne (%)"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition globale en camembert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Répartition Globale
            </CardTitle>
            <CardDescription>
              Vue d'ensemble de la distribution des risques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Court terme', value: risks.shortTerm.length, color: colors.courtTerme },
                    { name: 'Moyen terme', value: risks.mediumTerm.length, color: colors.moyenTerme },
                    { name: 'Long terme', value: risks.longTerm.length, color: colors.longTerme }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelStyle={{ fontSize: '12px', fill: '#6b7280' }}
                >
                  {[
                    { name: 'Court terme', value: risks.shortTerm.length, color: colors.courtTerme },
                    { name: 'Moyen terme', value: risks.mediumTerm.length, color: colors.moyenTerme },
                    { name: 'Long terme', value: risks.longTerm.length, color: colors.longTerme }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header simplifié */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2">Analyse des Risques</h2>
          <p className="text-muted-foreground text-sm">
            Identification et évaluation des risques projet
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Métriques principales - Version sobre */}
      <div className="border rounded-lg p-4 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">Analyse des Risques</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {riskMetrics.total} risques identifiés
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {riskMetrics.high} criticité élevée
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Score moyen: {riskMetrics.avgSeverity.toFixed(1)}/9
              </span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Dernière évaluation: maintenant
          </Badge>
        </div>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="matrix" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matrix">Matrice</TabsTrigger>
          <TabsTrigger value="flow">Flux d'Impact</TabsTrigger>
          <TabsTrigger value="timeline">Évolution</TabsTrigger>
          <TabsTrigger value="details">Détails</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskMatrix />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Métriques par Période
                </CardTitle>
                <CardDescription>
                  Vue synthétique des indicateurs clés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Court terme', risks: risks.shortTerm, color: 'red' },
                    { label: 'Moyen terme', risks: risks.mediumTerm, color: 'orange' },
                    { label: 'Long terme', risks: risks.longTerm, color: 'blue' }
                  ].map(({ label, risks: periodRisks, color }) => {
                    const avgSeverity = periodRisks.length > 0 
                      ? periodRisks.reduce((acc, r) => acc + r.severity, 0) / periodRisks.length 
                      : 0;
                    const avgProbability = periodRisks.length > 0 
                      ? periodRisks.reduce((acc, r) => acc + r.probability, 0) / periodRisks.length 
                      : 0;

                    return (
                      <div key={label} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            color === 'red' ? 'bg-red-500' :
                            color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{periodRisks.length} risque{periodRisks.length !== 1 ? 's' : ''}</span>
                          <span>Sév: {avgSeverity.toFixed(1)}</span>
                          <span>Prob: {avgProbability.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="flow" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskFlowDiagram />
            <Card>
              <CardHeader>
                <CardTitle>Scénarios de Risque</CardTitle>
                <CardDescription>
                  Enchaînements et mesures préventives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Scénario critique:</strong> Les interconnexions insuffisantes peuvent 
                      entraîner des goulets d'étranglement et compromettre la coordination.
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Effet domino:</strong> Les retards de validation peuvent se propager 
                      et impacter l'ensemble du projet.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Mitigation:</strong> Établir des points de contrôle réguliers et 
                      renforcer la communication entre les éléments.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {/* Graphiques visuels avancés */}
          <VisualTimelineCharts />
          
          {/* Analyse détaillée par période */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {Object.entries({
              'Court terme': { risks: risks.shortTerm, icon: AlertTriangle },
              'Moyen terme': { risks: risks.mediumTerm, icon: Clock },
              'Long terme': { risks: risks.longTerm, icon: TrendingUp }
            }).map(([period, { risks: periodRisks, icon: Icon }]) => (
              <Card key={period}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {period}
                  </CardTitle>
                  <CardDescription>
                    {period === 'Court terme' ? '0-3 mois' : 
                     period === 'Moyen terme' ? '3-12 mois' : '12+ mois'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {periodRisks.slice(0, 3).map((risk) => (
                      <div key={risk.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className={getSeverityTextColor(risk.severity)}>
                            {risk.impact}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{risk.probability}%</span>
                        </div>
                        <p className="text-sm">{risk.risk.substring(0, 60)}...</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">Sévérité: {risk.severity}/9</span>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {periodRisks.length > 3 && (
                      <div className="text-center pt-2">
                        <Button variant="outline" size="sm" className="text-xs">
                          Voir {periodRisks.length - 3} risque{periodRisks.length - 3 > 1 ? 's' : ''} de plus
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Liste Détaillée des Risques</CardTitle>
              <CardDescription>
                Vue complète avec statuts et mitigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allRisks.map((risk) => (
                  <div key={risk.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(risk.severity)}`} />
                        <Badge variant="outline" className="text-xs">
                          {risk.timeframe}
                        </Badge>
                        <Badge variant="outline" className={getSeverityTextColor(risk.severity)}>
                          {risk.impact}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {risk.probability}% | {risk.severity}/9
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <h4 className="font-medium mb-2">{risk.risk}</h4>
                    
                    {risk.mitigation && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                        <p className="text-sm text-blue-800">
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <Badge variant={
                        risk.status === 'Mitigé' ? 'default' :
                        risk.status === 'En cours' ? 'secondary' :
                        'outline'
                      }>
                        {risk.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Voir détails
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}