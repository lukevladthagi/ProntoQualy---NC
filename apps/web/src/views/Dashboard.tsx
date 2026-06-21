"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  statusLabels,
  severityLabels,
} from "@/data/mockData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  ComposedChart,
} from "recharts";
import { Link } from "@/lib/router-shim";

interface DashboardIndicadores {
  total: number;
  encerradasMes: number;
  tempoMedioResolucao: number;
  statusCounts: Array<{ status: string; count: number }>;
  porSetor: Array<{ setor: string; count: number }>;
  porGravidade: Array<{ gravidade: string; count: number }>;
  porTipo: Array<{ tipo: string; count: number }>;
  tendenciaMensal: Array<{ mes: string; count: number }>;
  reincidencia: { taxa: number; total: number };
  sla: { atrasadas: number; noPrazo: number; encerradas: number };
  recentes: Array<{
    id: number;
    codigo: string;
    descricao: string;
    setor: string;
    gravidade: string;
    status: string;
    data_registro: string;
  }>;
}

interface NC {
  id: number;
  codigo: string;
  descricao: string;
  setor: string;
  gravidade: string;
  status: string;
  data_registro: string;
  data_ocorrencia?: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  variant = "default",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  variant?: "default" | "warning" | "success" | "danger";
}) {
  const variants = {
    default: "bg-cyan-500/10 text-cyan-600",
    warning: "bg-orange-500/10 text-orange-500",
    success: "bg-emerald-500/10 text-emerald-600",
    danger: "bg-red-500/10 text-red-500",
  };

  return (
    <Card className="relative min-h-[164px] overflow-hidden bg-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 pt-1">
                {trendUp ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    trendUp ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {trend}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${variants[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const classes: Record<string, string> = {
    baixa: "severity-low border",
    media: "severity-medium border",
    alta: "severity-high border",
    critica: "severity-critical border",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        classes[severity] || ""
      }`}
    >
      {severityLabels[severity as keyof typeof severityLabels]}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    registrada: "secondary",
    em_analise: "default",
    plano_definido: "default",
    em_execucao: "default",
    aguardando_verificacao: "outline",
    encerrada: "secondary",
    reaberta: "destructive",
  };
  return (
    <Badge variant={variants[status] || "secondary"}>
      {statusLabels[status as keyof typeof statusLabels]}
    </Badge>
  );
}

function RecentNCRow({ nc }: { nc: NC }) {
  return (
    <Link
      to={`/nc/${nc.id}`}
      className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-primary">
            {nc.codigo}
          </span>
          <SeverityBadge severity={nc.gravidade} />
        </div>
        <p className="mt-1 text-sm text-foreground truncate">{nc.descricao}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {nc.setor} • {new Date(nc.data_registro).toLocaleDateString("pt-BR")}
        </p>
      </div>
      <StatusBadge status={nc.status} />
    </Link>
  );
}

const COLORS = ["#1f5b93", "#2f80c3", "#7b8794", "#22c55e", "#eab308", "#ef4444"];
const CHART_BLUE = "#1f5b93";
const CHART_GRID = "#d8dee6";
const CHART_AXIS = "#657182";
const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #d8dee6",
  borderRadius: "8px",
  color: "#001f53",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.10)",
};

const SEVERITY_COLORS: Record<string, string> = {
  critica: "#ef4444",
  alta: "#f59e0b",
  media: "#eab308",
  baixa: "#22c55e",
};

const SEVERITY_LABELS: Record<string, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export default function Dashboard() {
  const [indicadores, setIndicadores] = useState<DashboardIndicadores | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/indicadores")
      .then((res) => res.json())
      .then((data) => {
        setIndicadores(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar indicadores:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando indicadores...</p>
        </div>
      </div>
    );
  }

  if (!indicadores) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-center text-muted-foreground">
          Erro ao carregar indicadores
        </div>
      </div>
    );
  }

  // Calculate critical open NCs
  const criticasAbertas = indicadores.recentes.filter(
    (nc) => nc.gravidade === "critica" && nc.status !== "encerrada"
  ).length;

  // Transform data for charts
  const chartPorSetor = indicadores.porSetor.map((item) => ({
    setor: item.setor,
    total: item.count,
  }));

  const chartPorGravidade = indicadores.porGravidade.map((item) => ({
    gravidade: SEVERITY_LABELS[item.gravidade] || item.gravidade,
    total: item.count,
    cor: SEVERITY_COLORS[item.gravidade] || COLORS[0],
  }));

  // Transform monthly trend
  const chartTendenciaMensal = indicadores.tendenciaMensal.map((item) => {
    const [, month] = item.mes.split("-");
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return {
      mes: monthNames[parseInt(month) - 1],
      total: item.count,
      encerradas: 0, // We'll need to enhance the API to get this split
    };
  });

  const openNCs = indicadores.recentes.filter((nc) => nc.status !== "encerrada");
  const criticalOpen = openNCs.filter((nc) => nc.gravidade === "critica");

  // Data for detailed analytics tab
  const convenioSusData = [
    { tipo: "CONVÊNIO", valor: 42, fill: "#f97316" },
    { tipo: "SUS", valor: 38, fill: "#14b8a6" },
    { tipo: "NÃO SE APLICA", valor: 4, fill: "#6b7280" },
    { tipo: "PARTICULAR", valor: 1, fill: "#3b82f6" },
  ];

  const taxaNotificacaoData = [
    { mes: "DEZ", setores: 31, buscaAtiva: 23, total: 54, taxa: 57.41 },
    { mes: "JAN", setores: 43, buscaAtiva: 11, total: 54, taxa: 79.63 },
    { mes: "FEV", setores: 59, buscaAtiva: 28, total: 87, taxa: 67.82 },
  ];

  const geralBuscaData = [
    { name: "GERAL", value: 68.6, fill: "#60a5fa" },
    { name: "BUSCA ATIVA", value: 31.4, fill: "#1e40af" },
  ];

  const setorMaisNotificadoData = [
    { setor: "HEMODINÂMICA", valor: 52, fill: "#a3e635" },
    { setor: "UTI 2", valor: 6, fill: "#14b8a6" },
    { setor: "UTI 1", valor: 5, fill: "#f97316" },
    { setor: "UTI 3", valor: 5, fill: "#ef4444" },
    { setor: "ASSISTÊNCIA MÉDICA", valor: 5, fill: "#94a3b8" },
    { setor: "EMERGÊNCIA", valor: 4, fill: "#10b981" },
    { setor: "UTI 4", valor: 3, fill: "#3b82f6" },
    { setor: "FARMÁCIA", valor: 2, fill: "#ec4899" },
    { setor: "LABORATÓRIO", valor: 1, fill: "#a78bfa" },
    { setor: "CLÍNICA 2", valor: 1, fill: "#f472b6" },
    { setor: "NUTRIÇÃO", valor: 1, fill: "#a3e635" },
    { setor: "MANUTENÇÃO", valor: 1, fill: "#06b6d4" },
    { setor: "ASSISTÊNCIA", valor: 1, fill: "#8b5cf6" },
  ];

  const setorQueMaisNotificouData = [
    { setor: "UTI 2", valor: 29, fill: "#14b8a6" },
    { setor: "UTI 3", valor: 16, fill: "#f97316" },
    { setor: "UTI 1", valor: 13, fill: "#fbbf24" },
    { setor: "QUALIDADE", valor: 6, fill: "#94a3b8" },
    { setor: "UTI 4", valor: 5, fill: "#3b82f6" },
    { setor: "POSTO", valor: 5, fill: "#a78bfa" },
    { setor: "HEMODINÂMICA", valor: 4, fill: "#a3e635" },
    { setor: "EMERGÊNCIA", valor: 2, fill: "#10b981" },
    { setor: "CLÍNICA 2", valor: 2, fill: "#ec4899" },
    { setor: "CENTRO CIRÚRGICO", valor: 1, fill: "#facc15" },
    { setor: "FARMÁCIA", valor: 1, fill: "#ec4899" },
    { setor: "ASSISTÊNCIA", valor: 1, fill: "#8b5cf6" },
    { setor: "ASSISTÊNCIA MÉDICA", valor: 1, fill: "#475569" },
    { setor: "AUTORIZAÇÃO", valor: 1, fill: "#3b82f6" },
  ];

  const uti1IncidentsData = [
    { tipo: "FALHA NA IDENT...", valor: 1, fill: "#10b981" },
    { tipo: "FALHA DE PROC...", valor: 1, fill: "#fbbf24" },
    { tipo: "FLEBITE", valor: 1, fill: "#475569" },
    { tipo: "NÃO CONFORMI...", valor: 1, fill: "#3b82f6" },
    { tipo: "BRONCOASPIRA...", valor: 1, fill: "#60a5fa" },
  ];

  const uti2IncidentsData = [
    { tipo: "FLEBITE", valor: 2, fill: "#475569" },
    { tipo: "FALHA DE PROC...", valor: 1, fill: "#fbbf24" },
    { tipo: "CELULITE", valor: 1, fill: "#94a3b8" },
    { tipo: "HEMATOMA PÓS...", valor: 1, fill: "#f97316" },
    { tipo: "NÃO CONFORMI...", valor: 1, fill: "#3b82f6" },
  ];

  const tipoIncidenteGeralData = [
    { tipo: "HEMATOMA PÓS-CA...", valor: 45, fill: "#f97316" },
    { tipo: "NÃO CONFORMIDADE", valor: 10, fill: "#3b82f6" },
    { tipo: "FLEBITE", valor: 9, fill: "#475569" },
    { tipo: "PSEUDOANEURISMA", valor: 6, fill: "#92400e" },
    { tipo: "FALHA DE PROCESSO", valor: 5, fill: "#fbbf24" },
    { tipo: "FALHA NA IDENTIFIC...", valor: 2, fill: "#10b981" },
    { tipo: "FALHA ENVOLVEND...", valor: 2, fill: "#06b6d4" },
    { tipo: "TECNOVIGILÂNCIA", valor: 2, fill: "#3b82f6" },
    { tipo: "BRONCOASPIRAÇÃO", valor: 2, fill: "#60a5fa" },
    { tipo: "QUEDA", valor: 1, fill: "#8b5cf6" },
    { tipo: "EQUIMOSE", valor: 1, fill: "#9f1239" },
    { tipo: "CELULITE", valor: 1, fill: "#64748b" },
    { tipo: "LESÃO POR DISPOS...", valor: 1, fill: "#ec4899" },
  ];

  const grauDanoData = [
    { name: "DANO LEVE", value: 69.0, fill: "#a3e635" },
    { name: "NÃO CONFORMIDADE", value: 12.6, fill: "#3b82f6" },
    { name: "DANO MODERADO", value: 8.0, fill: "#fbbf24" },
    { name: "INCIDENTE SEM DANO", value: 4.6, fill: "#64748b" },
    { name: "CIRCUNSTÂNCIA DE RISCO", value: 3.4, fill: "#f97316" },
    { name: "DESCARACTERIZADO", value: 2.3, fill: "#ec4899" },
  ];

  // Data for Tipo de incidente por meta internacional
  const metaInternacionalData = [
    { name: "PROCEDIMENTO SEGURO", value: 67.8, fill: "#8b5cf6" },
    { name: "RISCO DE INFECÇÃO", value: 14.9, fill: "#a3e635" },
    { name: "COMUNICAÇÃO EFETIVA", value: 12.6, fill: "#f97316" },
    { name: "IDENTIFICAÇÃO SEGURA", value: 2.3, fill: "#14b8a6" },
    { name: "QUEDA/LPP", value: 2.3, fill: "#fbbf24" },
  ];

  // Data for Discriminação dos hematomas
  const hematomasRadialFemoralData = [
    { name: "RADIAL", value: 57.7, fill: "#14b8a6" },
    { name: "FEMORAL", value: 42.3, fill: "#f97316" },
  ];

  const hematomasPorMedicoData = [
    { name: "Dr. Silva", value: 35, fill: "#ef4444" },
    { name: "Dr. Santos", value: 28, fill: "#14b8a6" },
    { name: "Dr. Costa", value: 20, fill: "#f97316" },
    { name: "Dr. Lima", value: 10, fill: "#3b82f6" },
    { name: "Dr. Alves", value: 7, fill: "#ec4899" },
  ];

  // Data for Discriminação das flebites
  const flebitesDiscriminacaoData = [
    { tipo: "Mecânica", valor: 5, fill: "#14b8a6" },
    { tipo: "Química", valor: 3, fill: "#3b82f6" },
    { tipo: "Bacteriana", valor: 1, fill: "#1e3a8a" },
  ];

  // Data for Flebite Química - Droga associada
  const flebiteQuimicaDrogaData = [
    { droga: "NOREPINEFRINA", valor: 1, fill: "#3b82f6" },
    { droga: "MIDAZOLAM", valor: 1, fill: "#3b82f6" },
    { droga: "FENITOÍNA", valor: 1, fill: "#3b82f6" },
  ];

  return (
    <div className="p-5 lg:p-6 xl:p-7">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Dashboard da Qualidade
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão geral das não conformidades e indicadores
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Análises Detalhadas</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats grid */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="NC Abertas"
              value={indicadores.total}
              subtitle="Aguardando resolução"
              icon={AlertCircle}
              variant="default"
            />
            <StatCard
              title="NC Encerradas"
              value={indicadores.encerradasMes}
              subtitle="Este mês"
              icon={CheckCircle2}
              variant="success"
            />
            <StatCard
              title="Críticas Abertas"
              value={criticasAbertas}
              subtitle="Atenção imediata"
              icon={AlertTriangle}
              variant="danger"
            />
            <StatCard
              title="Tempo Médio"
              value={`${indicadores.tempoMedioResolucao} dias`}
              subtitle="Para resolução"
              icon={Clock}
              variant="warning"
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-5 xl:grid-cols-2">
            {/* NC por Setor */}
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  NC por Setor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartPorSetor}
                      layout="vertical"
                      margin={{ left: 0, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={CHART_GRID} />
                      <XAxis type="number" fontSize={12} stroke={CHART_AXIS} tickLine={false} axisLine={{ stroke: CHART_GRID }} />
                      <YAxis
                        type="category"
                        dataKey="setor"
                        fontSize={12}
                        width={100}
                        stroke={CHART_AXIS}
                        tickLine={false}
                        axisLine={{ stroke: CHART_GRID }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(31, 91, 147, 0.08)" }}
                        contentStyle={CHART_TOOLTIP_STYLE}
                      />
                      <Bar
                        dataKey="total"
                        name="Total"
                        fill={CHART_BLUE}
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* NC por Gravidade */}
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  NC por Gravidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartPorGravidade}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="total"
                        nameKey="gravidade"
                      >
                        {chartPorGravidade.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                      />
                      <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
                        iconType="circle"
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend chart and recent NCs */}
          <div className="grid gap-5 xl:grid-cols-3">
            {/* Tendência Mensal */}
            <Card className="bg-white xl:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Tendência Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartTendenciaMensal}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
                      <XAxis dataKey="mes" fontSize={12} tickLine={false} stroke={CHART_AXIS} axisLine={{ stroke: CHART_GRID }} />
                      <YAxis fontSize={12} tickLine={false} stroke={CHART_AXIS} axisLine={{ stroke: CHART_GRID }} />
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                      />
                      <Legend iconType="circle" iconSize={8} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Registradas"
                        stroke={CHART_BLUE}
                        strokeWidth={3}
                        dot={{ fill: CHART_BLUE, stroke: "#ffffff", strokeWidth: 2 }}
                        activeDot={{ r: 5, fill: CHART_BLUE, stroke: "#ffffff", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* NC Críticas Abertas */}
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    NC Críticas
                  </CardTitle>
                  <Badge variant="destructive">{criticalOpen.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {criticalOpen.length > 0 ? (
                  criticalOpen.map((nc) => (
                    <Link
                      key={nc.id}
                      to={`/nc/${nc.id}`}
                      className="block p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium text-red-600">
                          {nc.codigo}
                        </span>
                        <StatusBadge status={nc.status} />
                      </div>
                      <p className="mt-1 text-sm text-foreground line-clamp-2">
                        {nc.descricao}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {nc.setor}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <p className="text-sm">Nenhuma NC crítica aberta</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* SLA Status and Reincidência */}
          <div className="grid gap-5 xl:grid-cols-2">
            {/* SLA Status */}
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Status de SLA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">No Prazo</span>
                      <span className="text-emerald-600 font-medium">
                        {indicadores.sla.noPrazo}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ 
                          width: `${
                            indicadores.total > 0 
                              ? (indicadores.sla.noPrazo / indicadores.total) * 100 
                              : 0
                          }%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Atrasadas</span>
                      <span className="text-red-600 font-medium">
                        {indicadores.sla.atrasadas}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ 
                          width: `${
                            indicadores.total > 0 
                              ? (indicadores.sla.atrasadas / indicadores.total) * 100 
                              : 0
                          }%` 
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Encerradas</span>
                      <span className="text-muted-foreground">
                        {indicadores.sla.encerradas}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reincidência */}
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  Taxa de Reincidência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-amber-600">
                        {indicadores.reincidencia.taxa}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {indicadores.reincidencia.total} NCs reincidentes
                      </p>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${indicadores.reincidencia.taxa}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent NCs */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Não Conformidades Recentes
                </CardTitle>
                <Link
                  to="/nc"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Ver todas
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {indicadores.recentes.slice(0, 5).map((nc) => (
                  <RecentNCRow key={nc.id} nc={nc} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-8">
          {/* First Row: Convênio x SUS, Taxa de notificação, Geral x Busca ativa */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notificações: Convênio x SUS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Notificações: Convênio x SUS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={convenioSusData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="tipo" fontSize={11} angle={-15} textAnchor="end" height={60} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                        {convenioSusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Taxa de notificação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Taxa de notificação:</CardTitle>
                <p className="text-sm text-muted-foreground">Busca ativa/geral (ou setores)*100</p>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={taxaNotificacaoData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="mes" fontSize={12} />
                      <YAxis yAxisId="left" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" fontSize={12} domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="setores" name="Setores" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="buscaAtiva" name="Busca ativa" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="total" name="Total" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="taxa" name="Taxa de Notificação" stroke="#fbbf24" strokeWidth={3} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Notificações: Geral x Busca ativa */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Notificações:</CardTitle>
                <p className="text-sm font-medium">Geral x Busca ativa</p>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={geralBuscaData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={0}
                          dataKey="value"
                        >
                          {geralBuscaData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#60a5fa" }}></div>
                      <span className="text-sm font-medium">GERAL: 68.6%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#1e40af" }}></div>
                      <span className="text-sm font-medium">BUSCA ATIVA: 31.4%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row: Setor mais notificado vs Setor que mais notificou */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Setor mais notificado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Notificações por setor:</CardTitle>
                <p className="text-sm font-medium">Setor mais notificado</p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={setorMaisNotificadoData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" fontSize={12} />
                      <YAxis type="category" dataKey="setor" fontSize={11} width={120} />
                      <Tooltip />
                      <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                        {setorMaisNotificadoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Setor que mais notificou */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Notificações por setor:</CardTitle>
                <p className="text-sm font-medium">Setor que mais notificou</p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={setorQueMaisNotificouData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" fontSize={12} />
                      <YAxis type="category" dataKey="setor" fontSize={11} width={120} />
                      <Tooltip />
                      <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                        {setorQueMaisNotificouData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Third Row: Tipo de incidente por setor (UTI 1 e UTI 2) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Notificações por setor: Tipo de incidente por setor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* UTI 1 */}
                <div>
                  <div className="mb-4 text-center">
                    <span className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold">
                      UTI 1
                    </span>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={uti1IncidentsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="tipo" fontSize={10} angle={-15} textAnchor="end" height={60} />
                        <YAxis fontSize={12} domain={[0, 1.2]} />
                        <Tooltip />
                        <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                          {uti1IncidentsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* UTI 2 */}
                <div>
                  <div className="mb-4 text-center">
                    <span className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold">
                      UTI 2
                    </span>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={uti2IncidentsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="tipo" fontSize={10} angle={-15} textAnchor="end" height={60} />
                        <YAxis fontSize={12} domain={[0, 2.5]} />
                        <Tooltip />
                        <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                          {uti2IncidentsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fourth Row: Tipo de Incidente geral and Grau de dano */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tipo de Incidente geral */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Tipo de Incidente geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tipoIncidenteGeralData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" fontSize={12} />
                      <YAxis type="category" dataKey="tipo" fontSize={11} width={140} />
                      <Tooltip />
                      <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                        {tipoIncidenteGeralData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Tipo de incidente por grau de dano */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Tipo de incidente por grau de dano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={grauDanoData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {grauDanoData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 pl-4">
                    {grauDanoData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                        <span className="text-sm font-medium">{item.name}: {item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fifth Row: Tipo de incidente por meta internacional */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Tipo de incidente por meta internacional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metaInternacionalData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {metaInternacionalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 pl-4">
                  {metaInternacionalData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                      <span className="text-sm font-medium">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sixth Row: Discriminação dos hematomas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Discriminação dos hematomas:</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Radial x Femoral */}
                <div>
                  <p className="text-sm font-medium text-center mb-4">Radial x femoral</p>
                  <div className="h-72 flex items-center">
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={hematomasRadialFemoralData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={0}
                            dataKey="value"
                          >
                            {hematomasRadialFemoralData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 pl-4">
                      {hematomasRadialFemoralData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                          <span className="text-sm font-medium">{item.name}: {item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Por médico */}
                <div>
                  <p className="text-sm font-medium text-center mb-4">Por médico</p>
                  <div className="h-72 flex items-center">
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={hematomasPorMedicoData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {hematomasPorMedicoData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1 pl-4">
                      {hematomasPorMedicoData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                          <span className="text-xs font-medium">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seventh Row: Discriminação das flebites */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Discriminação das flebites: Bacteriana, Química, Mecânica */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Discriminação das flebites:</CardTitle>
                <p className="text-sm font-medium">Bacteriana, Química, Mecânica</p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={flebitesDiscriminacaoData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="tipo" fontSize={12} />
                      <YAxis fontSize={12} domain={[0, 6]} />
                      <Tooltip />
                      <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                        {flebitesDiscriminacaoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Flebite Química: Droga associada */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Flebite Química:</CardTitle>
                <p className="text-sm font-medium">Droga associada</p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={flebiteQuimicaDrogaData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="droga" fontSize={11} angle={-15} textAnchor="end" height={80} />
                      <YAxis fontSize={12} domain={[0, 1.5]} />
                      <Tooltip />
                      <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                        {flebiteQuimicaDrogaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
