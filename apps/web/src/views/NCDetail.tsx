"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@/lib/router-shim";
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  Circle,
  ChevronRight,
  Plus,
  Paperclip,
  Edit,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  statusLabels,
  typeLabels,
  severityLabels,
  type NCStatus,
  type NCType,
  type Severity,
} from "@/data/mockData";
import ActionDialog from "@/components/ActionDialog";
import AnalysisDialog from "@/components/AnalysisDialog";
import VerificationDialog from "@/components/VerificationDialog";

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
  created_at: string;
  updated_at: string;
  grau_dano?: string;
  meta_seguranca?: string;
  evento_identificado_evolucao?: number;
  necessita_analise_causa?: number;
  necessita_plano_acao?: number;
  busca_ativa?: number;
  numero_atendimento_mv?: string;
  convenio?: string;
  data_internacao?: string;
  paciente_idade?: number;
  paciente_data_nascimento?: string;
  medico_responsavel?: string;
  localizacao_hematoma?: string;
  tipo_fonte?: string;
  email_responsavel?: string;
  campos_personalizados?: Record<string, string | boolean | number | null>;
}

interface Evidencia {
  id: number;
  nc_id: number;
  nome_arquivo: string;
  tipo_arquivo: string;
  url: string;
  tamanho?: number;
  descricao?: string;
  created_at: string;
}

interface Analise {
  id: number;
  nc_id: number;
  tipo: "5_porques" | "ishikawa";
  descricao: string;
  descricao_gestor?: string;
  responsavel: string;
  data_analise: string;
  created_at: string;
  cincoPortques?: Array<{ id: number; ordem: number; pergunta: string; resposta: string }>;
  ishikawa?: Array<{ id: number; categoria: string; causa: string }>;
}

interface PlanoAcao {
  id: number;
  nc_id: number;
  descricao: string;
  tipo: "corretiva" | "preventiva";
  responsavel: string;
  prazo: string;
  status: "pendente" | "em_execucao" | "concluida" | "atrasada";
  data_conclusao?: string;
  created_at: string;
}

interface Verificacao {
  id: number;
  nc_id: number;
  descricao: string;
  is_eficaz: number;
  responsavel: string;
  data_verificacao: string;
  observacoes?: string;
  created_at: string;
}

interface HistoricoStatus {
  id: number;
  nc_id: number;
  status_anterior?: string;
  status_novo: string;
  usuario: string;
  observacao?: string;
  created_at: string;
}

interface NCDetailResponse extends NC {
  evidencias: Evidencia[];
  analises: Analise[];
  planosAcao: PlanoAcao[];
  verificacoes: Verificacao[];
  historico: HistoricoStatus[];
}

const workflowSteps: NCStatus[] = [
  "registrada",
  "em_analise",
  "plano_definido",
  "em_execucao",
  "aguardando_verificacao",
  "encerrada",
];

const grauDanoLabels: Record<string, string> = {
  incidente_sem_lesao: "Incidente sem lesão",
  leve: "Leve",
  moderado: "Moderado",
  grave: "Grave",
  obito: "Óbito",
};

const metaSegurancaLabels: Record<string, string> = {
  "1_identificacao": "1. Identificação",
  "2_comunicacao": "2. Comunicação",
  "3_medicacao": "3. Medicação",
  "4_procedimento_seguro": "4. Procedimento seguro",
  "5_risco_infeccao": "5. Risco de infecção",
  "6_queda_lpp": "6. Queda e LPP",
  nao_aplica: "Não se aplica",
};

const boolToSelect = (value?: number | boolean | null) =>
  value === 1 || value === true ? "sim" : value === 0 || value === false ? "nao" : "";

export default function NCDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<NCDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<PlanoAcao | undefined>(undefined);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [evidenceError, setEvidenceError] = useState("");
  const [evidenceSubmitting, setEvidenceSubmitting] = useState(false);
  const [nspSubmitting, setNspSubmitting] = useState(false);
  const [nspForm, setNspForm] = useState({
    fonteNotificacao: "",
    grauDano: "",
    metaSeguranca: "",
    eventoIdentificadoEvolucao: "",
    necessitaAnaliseCausa: "",
    necessitaPlanoAcao: "",
    numeroAtendimentoMv: "",
    pacienteDataNascimento: "",
    pacienteIdade: "",
    convenio: "",
    tipoFonte: "",
    dataInternacao: "",
    medicoResponsavel: "",
    localizacaoHematoma: "",
  });

  useEffect(() => {
    fetchNCDetail();
  }, [id]);

  const fetchNCDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ncs/${id}`);
      const result = await response.json();
      setData(result);
      setNspForm({
        fonteNotificacao: result.busca_ativa === 1 ? "busca_ativa" : "notificacao_geral",
        grauDano: result.grau_dano ?? "",
        metaSeguranca: result.meta_seguranca ?? "",
        eventoIdentificadoEvolucao: boolToSelect(result.evento_identificado_evolucao),
        necessitaAnaliseCausa: boolToSelect(result.necessita_analise_causa),
        necessitaPlanoAcao: boolToSelect(result.necessita_plano_acao),
        numeroAtendimentoMv: result.numero_atendimento_mv ?? "",
        pacienteDataNascimento: result.paciente_data_nascimento ?? "",
        pacienteIdade: result.paciente_idade ? String(result.paciente_idade) : "",
        convenio: result.convenio ?? "",
        tipoFonte: result.tipo_fonte ?? "",
        dataInternacao: result.data_internacao ?? "",
        medicoResponsavel: result.medico_responsavel ?? "",
        localizacaoHematoma: result.localizacao_hematoma ?? "",
      });
    } catch (error) {
      console.error("Error fetching NC:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: NCStatus) => {
    try {
      const response = await fetch(`/api/ncs/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          responsavel: "João Costa", // TODO: Get from auth context
          observacao: `Status alterado para ${statusLabels[newStatus]}`,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error("Error updating status:", error);
        alert(error.error || "Erro ao atualizar status");
        return;
      }
      
      fetchNCDetail();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Erro ao atualizar status");
    }
  };

  const handleOpenActionDialog = (action?: PlanoAcao) => {
    setSelectedAction(action);
    setActionDialogOpen(true);
  };

  const handleCompleteAction = async (actionId: number) => {
    try {
      const response = await fetch(`/api/planos-acao/${actionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "concluida",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao concluir ação");
      }

      fetchNCDetail();
    } catch (error) {
      console.error("Error completing action:", error);
      alert("Erro ao concluir ação");
    }
  };

  const resetEvidenceForm = () => {
    setEvidenceFile(null);
    setEvidenceDescription("");
    setEvidenceError("");
  };

  const handleNspChange = (field: string, value: string) => {
    setNspForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveNspAnalysis = async () => {
    setNspSubmitting(true);
    try {
      const response = await fetch(`/api/ncs/${id}/nsp-analysis`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buscaAtiva: nspForm.fonteNotificacao === "busca_ativa",
          grauDano: nspForm.grauDano || null,
          metaSeguranca: nspForm.metaSeguranca || null,
          eventoIdentificadoEvolucao:
            nspForm.eventoIdentificadoEvolucao === "sim"
              ? true
              : nspForm.eventoIdentificadoEvolucao === "nao"
              ? false
              : undefined,
          necessitaAnaliseCausa:
            nspForm.necessitaAnaliseCausa === "sim"
              ? true
              : nspForm.necessitaAnaliseCausa === "nao"
              ? false
              : undefined,
          necessitaPlanoAcao:
            nspForm.necessitaPlanoAcao === "sim"
              ? true
              : nspForm.necessitaPlanoAcao === "nao"
              ? false
              : undefined,
          numeroAtendimentoMv: nspForm.numeroAtendimentoMv || null,
          pacienteDataNascimento: nspForm.pacienteDataNascimento || null,
          pacienteIdade: nspForm.pacienteIdade ? Number(nspForm.pacienteIdade) : null,
          convenio: nspForm.convenio || null,
          tipoFonte: nspForm.tipoFonte || null,
          dataInternacao: nspForm.dataInternacao || null,
          medicoResponsavel: nspForm.medicoResponsavel || null,
          localizacaoHematoma: nspForm.localizacaoHematoma || null,
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar análise NSP");
      await fetchNCDetail();
    } catch (error) {
      console.error("Error saving NSP analysis:", error);
      alert("Erro ao salvar análise NSP");
    } finally {
      setNspSubmitting(false);
    }
  };

  const handleAddEvidence = async (event: React.FormEvent) => {
    event.preventDefault();
    setEvidenceError("");

    if (!evidenceFile) {
      setEvidenceError("Selecione um arquivo para anexar.");
      return;
    }

    if (evidenceFile.size > 10 * 1024 * 1024) {
      setEvidenceError("O arquivo deve ter no máximo 10MB.");
      return;
    }

    setEvidenceSubmitting(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", evidenceFile);

      const uploadResponse = await fetch("/api/uploads/evidencias", {
        method: "POST",
        body: uploadData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Erro ao enviar arquivo");
      }

      const uploaded = await uploadResponse.json();
      const response = await fetch(`/api/ncs/${id}/evidencias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeArquivo: uploaded.nomeArquivo,
          tipoArquivo: uploaded.tipoArquivo,
          url: uploaded.url,
          tamanho: uploaded.tamanho,
          descricao: evidenceDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao anexar evidência");
      }

      resetEvidenceForm();
      setEvidenceDialogOpen(false);
      fetchNCDetail();
    } catch (error) {
      console.error("Error adding evidence:", error);
      setEvidenceError("Não foi possível anexar a evidência. Tente novamente.");
    } finally {
      setEvidenceSubmitting(false);
    }
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

  const getActionStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: "bg-gray-100 text-gray-700 border-gray-200",
      em_execucao: "bg-blue-100 text-blue-700 border-blue-200",
      concluida: "bg-emerald-100 text-emerald-700 border-emerald-200",
      atrasada: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCurrentStepIndex = (status: NCStatus) => {
    if (status === "reaberta") return workflowSteps.indexOf("em_analise");
    return workflowSteps.indexOf(status);
  };

  const canTransitionTo = (currentStatus: NCStatus, targetStatus: NCStatus) => {
    const transitions: Record<NCStatus, NCStatus[]> = {
      registrada: ["em_analise"],
      em_analise: ["plano_definido"],
      plano_definido: ["em_execucao"],
      em_execucao: ["aguardando_verificacao"],
      aguardando_verificacao: ["encerrada", "reaberta"],
      encerrada: [],
      reaberta: ["em_analise"],
    };
    return transitions[currentStatus]?.includes(targetStatus) || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">NC não encontrada</h2>
          <Button onClick={() => navigate("/nc")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const { evidencias, analises, planosAcao, verificacoes, historico, ...nc } = data;
  const currentStepIndex = getCurrentStepIndex(nc.status);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/nc")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para lista
        </Button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className={`w-2 h-16 rounded-full ${getSeverityColor(nc.gravidade)}`} />
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{nc.codigo}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={getStatusColor(nc.status)}>
                  {statusLabels[nc.status]}
                </Badge>
                <Badge variant="outline">{severityLabels[nc.gravidade]}</Badge>
                <Badge variant="outline">{typeLabels[nc.tipo]}</Badge>
                {nc.is_seguranca_paciente === 1 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Segurança do Paciente
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Progresso do Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
              style={{
                width: `${(currentStepIndex / (workflowSteps.length - 1)) * 100}%`,
              }}
            />

            {/* Steps */}
            <div className="relative grid grid-cols-6 gap-2">
              {workflowSteps.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isReaberta = nc.status === "reaberta" && step === "em_analise";

                return (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2 transition-all ${
                        isCompleted || isCurrent
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-border text-muted-foreground"
                      } ${isReaberta ? "ring-2 ring-red-500" : ""}`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs text-center ${
                        isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {statusLabels[step]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Actions */}
          {nc.status !== "encerrada" && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-3">Ações disponíveis:</p>
              <div className="flex gap-2 flex-wrap">
                {workflowSteps.map((step) => {
                  if (canTransitionTo(nc.status, step)) {
                    return (
                      <Button
                        key={step}
                        size="sm"
                        onClick={() => handleStatusChange(step)}
                        variant={step === "encerrada" ? "default" : "outline"}
                      >
                        <ChevronRight className="w-4 h-4 mr-1" />
                        Mover para {statusLabels[step]}
                      </Button>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - NC Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informações da Não Conformidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-foreground mt-1">{nc.descricao}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    Setor
                  </label>
                  <p className="text-foreground mt-1">{nc.setor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unidade</label>
                  <p className="text-foreground mt-1">{nc.unidade}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Data da Ocorrência
                  </label>
                  <p className="text-foreground mt-1">{formatDate(nc.data_ocorrencia)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Data de Registro
                  </label>
                  <p className="text-foreground mt-1">{formatDate(nc.data_registro)}</p>
                </div>
                {nc.paciente_envolvido && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Paciente Envolvido
                    </label>
                    <p className="text-foreground mt-1">{nc.paciente_envolvido}</p>
                  </div>
                )}
                {nc.campos_personalizados && Object.keys(nc.campos_personalizados).length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Campos Complementares
                    </label>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {Object.entries(nc.campos_personalizados).map(([key, value]) => (
                        <div key={key} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                          <p className="text-xs font-medium uppercase text-muted-foreground">{key}</p>
                          <p className="mt-1 text-sm text-foreground">
                            {typeof value === "boolean" ? (value ? "Sim" : "Não") : String(value ?? "")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Details */}
          <Tabs defaultValue="evidencias" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="evidencias">
                Evidências ({evidencias.length})
              </TabsTrigger>
              <TabsTrigger value="nsp">
                Análise NSP
              </TabsTrigger>
              <TabsTrigger value="analise">
                Análises ({analises.length})
              </TabsTrigger>
              <TabsTrigger value="acoes">
                Ações ({planosAcao.length})
              </TabsTrigger>
              <TabsTrigger value="verificacao">
                Verificações ({verificacoes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="evidencias" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Evidências</CardTitle>
                    <Button size="sm" onClick={() => setEvidenceDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {evidencias.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      Nenhuma evidência anexada
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {evidencias.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-start justify-between gap-3 p-3 border rounded-lg"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Paperclip className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">
                                {ev.nome_arquivo || "Evidência sem nome"}
                              </p>
                              {ev.descricao && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {ev.descricao}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDateTime(ev.created_at)}
                                {ev.tamanho ? ` • ${(ev.tamanho / 1024).toFixed(1)} KB` : ""}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(ev.url, "_blank", "noopener,noreferrer")}
                            disabled={!ev.url}
                          >
                            Ver
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>



            <TabsContent value="nsp" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <CardTitle className="text-base">Análise do NSP</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Classificação assistencial, matriz de priorização e dados complementares do paciente.
                      </p>
                    </div>
                    <Button onClick={handleSaveNspAnalysis} disabled={nspSubmitting}>
                      <Check className="mr-2 h-4 w-4" />
                      {nspSubmitting ? "Salvando..." : "Salvar NSP"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Origem da notificação</label>
                      <Select value={nspForm.fonteNotificacao} onValueChange={(value) => handleNspChange("fonteNotificacao", value)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notificacao_geral">Notificação geral</SelectItem>
                          <SelectItem value="busca_ativa">Busca ativa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Grau do dano</label>
                      <Select value={nspForm.grauDano} onValueChange={(value) => handleNspChange("grauDano", value)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(grauDanoLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Meta de segurança</label>
                      <Select value={nspForm.metaSeguranca} onValueChange={(value) => handleNspChange("metaSeguranca", value)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(metaSegurancaLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Evento identificado na evolução?</label>
                      <Select value={nspForm.eventoIdentificadoEvolucao} onValueChange={(value) => handleNspChange("eventoIdentificadoEvolucao", value)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Destaque importante para as coordenações.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Necessita análise das causas?</label>
                      <Select value={nspForm.necessitaAnaliseCausa} onValueChange={(value) => handleNspChange("necessitaAnaliseCausa", value)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Necessita plano de ação?</label>
                      <Select value={nspForm.necessitaPlanoAcao} onValueChange={(value) => handleNspChange("necessitaPlanoAcao", value)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    <p className="font-semibold">Matriz de priorização e prazo de resposta</p>
                    <div className="mt-2 grid gap-1 sm:grid-cols-2">
                      <p>Leve: 15 dias</p>
                      <p>Moderado: 7 dias</p>
                      <p>Grave ou óbito: 3 dias</p>
                      <p>NC ou incidente sem lesão: 20 dias</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Número de atendimento MV</label>
                      <Input value={nspForm.numeroAtendimentoMv} onChange={(event) => handleNspChange("numeroAtendimentoMv", event.target.value)} placeholder="Ex: 123456" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data de nascimento</label>
                      <Input type="date" value={nspForm.pacienteDataNascimento} onChange={(event) => handleNspChange("pacienteDataNascimento", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Idade</label>
                      <Input type="number" min="0" value={nspForm.pacienteIdade} onChange={(event) => handleNspChange("pacienteIdade", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Convênio</label>
                      <Input value={nspForm.convenio} onChange={(event) => handleNspChange("convenio", event.target.value)} placeholder="Convênio do paciente" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Classificação da fonte</label>
                      <Select value={nspForm.tipoFonte} onValueChange={(value) => handleNspChange("tipoFonte", value)}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="convenio">Convênio</SelectItem>
                          <SelectItem value="sus">SUS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data de internação</label>
                      <Input type="date" value={nspForm.dataInternacao} onChange={(event) => handleNspChange("dataInternacao", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Médico responsável</label>
                      <Input value={nspForm.medicoResponsavel} onChange={(event) => handleNspChange("medicoResponsavel", event.target.value)} placeholder="Nome do médico" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reclassificação / local do evento</label>
                      <Input value={nspForm.localizacaoHematoma} onChange={(event) => handleNspChange("localizacaoHematoma", event.target.value)} placeholder="Ex: femoral, radial, química, mecânica" />
                      <p className="text-xs text-muted-foreground">Use para hematoma, pseudoaneurisma, flebite e demais eventos que precisem de reclassificação.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analise" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Análise de Causa Raiz</CardTitle>
                    <Button size="sm" onClick={() => setAnalysisDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Análise
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {analises.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      Nenhuma análise realizada
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {analises.map((analise) => (
                        <div key={analise.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <Badge variant="outline" className="mb-2">
                                {analise.tipo === "5_porques" ? "5 Porquês" : "Ishikawa (6M)"}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(analise.data_analise)} • {analise.responsavel}
                              </p>
                            </div>
                          </div>

                          {analise.tipo === "5_porques" && analise.cincoPortques && (
                            <div className="space-y-2 mb-3">
                              {analise.cincoPortques.map((porque) => (
                                <div key={porque.id} className="bg-muted/50 p-3 rounded">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    {porque.pergunta}
                                  </p>
                                  <p className="text-sm">{porque.resposta}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {analise.tipo === "ishikawa" && analise.ishikawa && (
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {analise.ishikawa.map((cat) => (
                                <div key={cat.id} className="bg-muted/50 p-3 rounded">
                                  <p className="text-xs font-medium text-primary mb-1">
                                    {cat.categoria}
                                  </p>
                                  <p className="text-sm">{cat.causa}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {analise.descricao && (
                            <div className="border-t pt-3 mt-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Conclusão:</p>
                              <p className="text-sm">{analise.descricao}</p>
                            </div>
                          )}

                          {analise.descricao_gestor && (
                            <div className="border-t pt-3 mt-3 bg-teal-50 p-3 rounded">
                              <p className="text-xs font-medium text-teal-900 mb-1">✓ Aprovação do Gestor:</p>
                              <p className="text-sm text-teal-800">{analise.descricao_gestor}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="acoes" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Plano de Ação (CAPA)</CardTitle>
                    <Button size="sm" onClick={() => handleOpenActionDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Ação
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {planosAcao.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      Nenhuma ação definida
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {planosAcao.map((acao) => (
                        <div key={acao.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className={getActionStatusColor(acao.status)}>
                                {acao.status === "pendente" && "Pendente"}
                                {acao.status === "em_execucao" && "Em Execução"}
                                {acao.status === "concluida" && "Concluída"}
                                {acao.status === "atrasada" && "Atrasada"}
                              </Badge>
                              <Badge variant="outline">
                                {acao.tipo === "corretiva" ? "Corretiva" : "Preventiva"}
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              {acao.status !== "concluida" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCompleteAction(acao.id)}
                                  title="Marcar como concluída"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenActionDialog(acao)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-foreground mb-2">{acao.descricao}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {acao.responsavel}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Prazo: {formatDate(acao.prazo)}
                            </span>
                            {acao.data_conclusao && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Concluída: {formatDate(acao.data_conclusao)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verificacao" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Verificação de Eficácia</CardTitle>
                    <Button size="sm" onClick={() => setVerificationDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Verificação
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {verificacoes.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      Nenhuma verificação realizada
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {verificacoes.map((verif) => (
                        <div key={verif.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <Badge
                                variant={verif.is_eficaz ? "default" : "destructive"}
                                className="mb-2"
                              >
                                {verif.is_eficaz ? "Eficaz" : "Não Eficaz"}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(verif.data_verificacao)} • {verif.responsavel}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-foreground mb-2">{verif.descricao}</p>
                          {verif.observacoes && (
                            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                              Observações: {verif.observacoes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Timeline/History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4" />
                Histórico de Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Sem histórico
                </p>
              ) : (
                <div className="space-y-3">
                  {historico.map((hist, index) => (
                    <div key={hist.id} className="relative">
                      {index !== historico.length - 1 && (
                        <div className="absolute left-2 top-6 bottom-0 w-px bg-border" />
                      )}
                      <div className="flex gap-3">
                        <div className="w-4 h-4 rounded-full bg-primary flex-shrink-0 mt-0.5 relative z-10" />
                        <div className="flex-1 min-w-0 pb-4">
                          <p className="text-sm font-medium text-foreground">
                            {statusLabels[hist.status_novo as NCStatus]}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {hist.usuario} • {formatDateTime(hist.created_at)}
                          </p>
                          {hist.observacao && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {hist.observacao}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações Chave</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <label className="text-muted-foreground">Responsável Registro</label>
                <p className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                  {nc.responsavel_registro}
                </p>
              </div>
              {nc.responsavel_analise && (
                <div>
                  <label className="text-muted-foreground">Responsável Análise</label>
                  <p className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                    {nc.responsavel_analise}
                  </p>
                </div>
              )}
              {nc.data_prazo && (
                <div>
                  <label className="text-muted-foreground">Prazo de Resolução</label>
                  <p className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(nc.data_prazo)}
                  </p>
                </div>
              )}
              <Separator />
              <div>
                <label className="text-muted-foreground">Criado em</label>
                <p className="text-foreground mt-0.5">{formatDateTime(nc.created_at)}</p>
              </div>
              <div>
                <label className="text-muted-foreground">Última atualização</label>
                <p className="text-foreground mt-0.5">{formatDateTime(nc.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Dialog */}
      <ActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        ncId={Number(id)}
        action={selectedAction}
        onSuccess={fetchNCDetail}
      />

      {/* Analysis Dialog */}
      <AnalysisDialog
        open={analysisDialogOpen}
        onClose={() => setAnalysisDialogOpen(false)}
        ncId={Number(id)}
        onSuccess={fetchNCDetail}
      />

      {/* Verification Dialog */}
      <VerificationDialog
        open={verificationDialogOpen}
        onClose={() => setVerificationDialogOpen(false)}
        ncId={Number(id)}
        onSuccess={fetchNCDetail}
      />

      <Dialog
        open={evidenceDialogOpen}
        onOpenChange={(open) => {
          setEvidenceDialogOpen(open);
          if (!open) resetEvidenceForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar evidência</DialogTitle>
            <DialogDescription>
              Anexe uma imagem, PDF ou documento relacionado a esta não conformidade.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddEvidence} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="evidence-file">
                Arquivo <span className="text-destructive">*</span>
              </label>
              <Input
                id="evidence-file"
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={(event) => {
                  setEvidenceFile(event.target.files?.[0] ?? null);
                  setEvidenceError("");
                }}
              />
              {evidenceFile && (
                <p className="text-xs text-muted-foreground">
                  {evidenceFile.name} • {(evidenceFile.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="evidence-description">
                Descrição <span className="text-muted-foreground">(opcional)</span>
              </label>
              <Textarea
                id="evidence-description"
                rows={3}
                placeholder="Ex: Foto do equipamento, print do sistema, documento de apoio..."
                value={evidenceDescription}
                onChange={(event) => setEvidenceDescription(event.target.value)}
              />
            </div>

            {evidenceError && (
              <p className="text-sm text-destructive">{evidenceError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEvidenceDialogOpen(false)}
                disabled={evidenceSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={evidenceSubmitting}>
                {evidenceSubmitting ? "Anexando..." : "Anexar evidência"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
