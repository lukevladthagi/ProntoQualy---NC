"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-shim";
import { Search, Plus, Filter, X, Calendar, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  statusLabels,
  typeLabels,
  severityLabels,
  setores,
  type NCStatus,
  type NCType,
  type Severity,
} from "@/data/mockData";

const ALL_FILTER_VALUE = "__all__";

interface NC {
  id: number;
  codigo: string;
  data_ocorrencia: string;
  data_registro: string;
  setor: string;
  unidade: string;
  tipo: NCType;
  gravidade: Severity;
  descricao: string;
  status: NCStatus;
  responsavel_registro: string;
  responsavel_analise?: string;
  paciente_envolvido?: string;
  is_seguranca_paciente: number;
  data_prazo?: string;
}

export default function NCListPage() {
  const navigate = useNavigate();
  const [ncs, setNcs] = useState<NC[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    setor: "",
    gravidade: "",
    tipo: "",
    responsavel: "",
    dataInicio: "",
    dataFim: "",
  });

  // Fetch NCs from API
  const fetchNCs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);
      if (filters.setor) params.append("setor", filters.setor);
      if (filters.gravidade) params.append("gravidade", filters.gravidade);
      if (filters.tipo) params.append("tipo", filters.tipo);
      if (filters.responsavel) params.append("responsavel", filters.responsavel);
      if (filters.dataInicio) params.append("dataInicio", filters.dataInicio);
      if (filters.dataFim) params.append("dataFim", filters.dataFim);

      const response = await fetch(`/api/ncs?${params.toString()}`);
      const data = await response.json();
      setNcs(data);
    } catch (error) {
      console.error("Error fetching NCs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNCs();
  }, [filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === ALL_FILTER_VALUE ? "" : value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      setor: "",
      gravidade: "",
      tipo: "",
      responsavel: "",
      dataInicio: "",
      dataFim: "",
    });
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v !== "").length;

  const getStatusColor = (status: NCStatus) => {
    const colors: Record<NCStatus, string> = {
      registrada: "bg-blue-100 text-blue-700 border-blue-200",
      em_analise: "bg-purple-100 text-purple-700 border-purple-200",
      plano_definido: "bg-indigo-100 text-indigo-700 border-indigo-200",
      em_execucao: "bg-amber-100 text-amber-700 border-amber-200",
      aguardando_verificacao: "bg-orange-100 text-orange-700 border-orange-200",
      encerrada: "bg-emerald-100 text-emerald-700 border-emerald-200",
      reaberta: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getSeverityColor = (severity: Severity) => {
    const colors: Record<Severity, string> = {
      baixa: "bg-emerald-500",
      media: "bg-amber-500",
      alta: "bg-orange-500",
      critica: "bg-red-500",
    };
    return colors[severity];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDaysUntilDue = (dataPrazo: string | undefined) => {
    if (!dataPrazo) return null;
    const today = new Date();
    const dueDate = new Date(dataPrazo);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Não Conformidades</h1>
          <p className="text-muted-foreground mt-1">
            {ncs.length} {ncs.length === 1 ? "registro encontrado" : "registros encontrados"}
          </p>
        </div>
        <Button onClick={() => navigate("/nc/nova")}>
          <Plus className="w-4 h-4 mr-2" />
          Nova NC
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou descrição..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filters.status || ALL_FILTER_VALUE} onValueChange={(v) => handleFilterChange("status", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>Todos</SelectItem>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Setor */}
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <Select value={filters.setor || ALL_FILTER_VALUE} onValueChange={(v) => handleFilterChange("setor", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>Todos</SelectItem>
                      {setores.map((setor) => (
                        <SelectItem key={setor} value={setor}>
                          {setor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gravidade */}
                <div className="space-y-2">
                  <Label>Gravidade</Label>
                  <Select value={filters.gravidade || ALL_FILTER_VALUE} onValueChange={(v) => handleFilterChange("gravidade", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>Todas</SelectItem>
                      {Object.entries(severityLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${getSeverityColor(value as Severity)}`} />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo */}
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={filters.tipo || ALL_FILTER_VALUE} onValueChange={(v) => handleFilterChange("tipo", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>Todos</SelectItem>
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Responsável */}
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Input
                    placeholder="Nome do responsável"
                    value={filters.responsavel}
                    onChange={(e) => handleFilterChange("responsavel", e.target.value)}
                  />
                </div>

                {/* Data Início */}
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={filters.dataInicio}
                    onChange={(e) => handleFilterChange("dataInicio", e.target.value)}
                  />
                </div>

                {/* Data Fim */}
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={filters.dataFim}
                    onChange={(e) => handleFilterChange("dataFim", e.target.value)}
                  />
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mt-4 pt-4 border-t flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* NC List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : ncs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma NC encontrada
            </h3>
            <p className="text-muted-foreground">
              {activeFiltersCount > 0
                ? "Tente ajustar os filtros para encontrar o que procura"
                : "Comece registrando uma nova não conformidade"}
            </p>
            {activeFiltersCount === 0 && (
              <Button onClick={() => navigate("/nc/nova")} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Registrar NC
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ncs.map((nc) => {
            const daysUntilDue = getDaysUntilDue(nc.data_prazo);
            const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && nc.status !== "encerrada";
            const isNearDue = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 2 && nc.status !== "encerrada";

            return (
              <Card
                key={nc.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/nc/${nc.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-1 h-12 rounded-full ${getSeverityColor(nc.gravidade)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">{nc.codigo}</span>
                            <Badge variant="outline" className={getStatusColor(nc.status)}>
                              {statusLabels[nc.status]}
                            </Badge>
                            {nc.is_seguranca_paciente === 1 && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Segurança do Paciente
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {nc.descricao}
                          </p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Setor:</span>
                          <p className="font-medium text-foreground">{nc.setor}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gravidade:</span>
                          <p className="font-medium text-foreground">
                            {severityLabels[nc.gravidade]}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tipo:</span>
                          <p className="font-medium text-foreground">
                            {typeLabels[nc.tipo]}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Data:</span>
                          <p className="font-medium text-foreground">
                            {formatDate(nc.data_ocorrencia)}
                          </p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="text-xs text-muted-foreground">
                          Registrado por {nc.responsavel_registro}
                          {nc.responsavel_analise && ` • Analista: ${nc.responsavel_analise}`}
                        </div>
                        {daysUntilDue !== null && nc.status !== "encerrada" && (
                          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                            isOverdue 
                              ? "bg-red-100 text-red-700" 
                              : isNearDue 
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {isOverdue 
                              ? `${Math.abs(daysUntilDue)} dias em atraso` 
                              : `${daysUntilDue} dias restantes`
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
