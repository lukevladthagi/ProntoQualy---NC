"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/router-shim";
import { ArrowLeft, Upload, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  eventoAdversoTipos,
  naoConformidadeTipos,
  setores,
  severityLabels,
  slaConfig,
  type Severity,
} from "@/data/mockData";

export default function NCFormPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    dataOcorrencia: "",
    setorNotificado: "",
    setorNotificador: "",
    responsavelRegistro: "",
    emailResponsavel: "",
    tipoNotificacao: "" as "nao_conformidade" | "evento_adverso" | "",
    subtipoEvento: "",
    localizacaoLesao: "",
    tipoHematoma: "",
    tipoPseudoaneurisma: "",
    flebiteQuimica: false,
    flebiteMecanica: false,
    flebiteInfecciosa: false,
    flebiteAmiodarona: "",
    flebiteAntibioticos: "",
    flebiteDrogaVasoativa: "",
    flebiteOutrasDrogas: "",
    gravidade: "" as Severity | "",
    descricao: "",
    pacienteNome: "",
    pacienteDataNascimento: "",
    pacienteNumeroAtendimento: "",
    medicoResponsavel: "",
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split("T")[0];

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.dataOcorrencia) {
      newErrors.dataOcorrencia = "Data da ocorrência é obrigatória";
    }
    if (!formData.setorNotificado) {
      newErrors.setorNotificado = "Setor notificado é obrigatório";
    }
    if (!formData.setorNotificador) {
      newErrors.setorNotificador = "Setor notificador é obrigatório";
    }
    if (!formData.tipoNotificacao) {
      newErrors.tipoNotificacao = "Tipo de notificação é obrigatório";
    }
    if (!formData.subtipoEvento) {
      newErrors.subtipoEvento = "Tipo de não conformidade é obrigatório";
    }
    if (!formData.gravidade) {
      newErrors.gravidade = "Gravidade é obrigatória";
    }
    if (!formData.descricao.trim()) {
      newErrors.descricao = "Descrição é obrigatória";
    } else if (formData.descricao.trim().length < 20) {
      newErrors.descricao = "Descrição deve ter pelo menos 20 caracteres";
    }

    // Validations for evento_adverso
    if (formData.tipoNotificacao === "evento_adverso") {
      if (!formData.pacienteNome.trim()) {
        newErrors.pacienteNome = "Nome do paciente é obrigatório para evento adverso";
      }
      if (!formData.pacienteDataNascimento && !formData.pacienteNumeroAtendimento) {
        newErrors.pacienteDataNascimento = "Informe a data de nascimento ou número de atendimento";
        newErrors.pacienteNumeroAtendimento = "Informe a data de nascimento ou número de atendimento";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Create NC
      const response = await fetch("/api/ncs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataOcorrencia: formData.dataOcorrencia,
          setor: formData.setorNotificado,
          unidade: formData.setorNotificador,
          responsavelRegistro: formData.responsavelRegistro,
          emailResponsavel: formData.emailResponsavel || null,
          medicoResponsavel: formData.medicoResponsavel || null,
          tipo: formData.subtipoEvento,
          tipoNotificacao: formData.tipoNotificacao,
          gravidade: formData.gravidade,
          descricao: formData.descricao,
          localizacaoLesao: formData.localizacaoLesao || null,
          tipoHematoma: formData.tipoHematoma || null,
          tipoPseudoaneurisma: formData.tipoPseudoaneurisma || null,
          flebiteQuimica: formData.flebiteQuimica,
          flebiteMecanica: formData.flebiteMecanica,
          flebiteInfecciosa: formData.flebiteInfecciosa,
          flebiteAmiodarona: formData.flebiteAmiodarona || null,
          flebiteAntibioticos: formData.flebiteAntibioticos || null,
          flebiteDrogaVasoativa: formData.flebiteDrogaVasoativa || null,
          flebiteOutrasDrogas: formData.flebiteOutrasDrogas || null,
          pacienteDataNascimento: formData.pacienteDataNascimento || null,
          pacienteNumeroAtendimento: formData.pacienteNumeroAtendimento || null,
          pacienteEnvolvido: formData.tipoNotificacao === "evento_adverso" 
            ? `${formData.pacienteNome}${formData.pacienteDataNascimento ? ` - DN: ${formData.pacienteDataNascimento}` : ''}${formData.pacienteNumeroAtendimento ? ` - Atend: ${formData.pacienteNumeroAtendimento}` : ''}`
            : null,
          segurancaPaciente: formData.tipoNotificacao === "evento_adverso",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao registrar NC");
      }

      const result = await response.json();
      const ncId = result.id;

      // Upload evidencias if any
      if (files.length > 0) {
        for (const file of files) {
          const uploadData = new FormData();
          uploadData.append("file", file);

          const uploadResponse = await fetch("/api/uploads/evidencias", {
            method: "POST",
            body: uploadData,
          });

          if (!uploadResponse.ok) {
            throw new Error("Erro ao enviar evidência");
          }

          const uploaded = await uploadResponse.json();

          await fetch(`/api/ncs/${ncId}/evidencias`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nomeArquivo: uploaded.nomeArquivo,
              tipoArquivo: uploaded.tipoArquivo,
              url: uploaded.url,
              tamanho: uploaded.tamanho,
            }),
          });
        }
      }

      setIsSubmitting(false);
      setShowSuccess(true);

      // Redirect to NC detail page after showing success
      setTimeout(() => {
        navigate(`/nc/${ncId}`);
      }, 2000);
    } catch (error) {
      console.error("Error submitting NC:", error);
      setErrors({ submit: "Erro ao registrar NC. Tente novamente." });
      setIsSubmitting(false);
    }
  };

  const selectedSeverity = formData.gravidade as Severity;
  const slaDays = selectedSeverity ? slaConfig[selectedSeverity] : null;

  if (showSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            NC Registrada com Sucesso!
          </h2>
          <p className="text-muted-foreground">
            A não conformidade foi registrada e está aguardando análise.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecionando para a lista de NCs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-foreground">
          Registrar Não Conformidade
        </h1>
        <p className="text-muted-foreground mt-1">
          Preencha os campos abaixo para registrar uma nova ocorrência
        </p>
      </div>

      {errors.submit && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{errors.submit}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm leading-6 text-blue-950">
              A identificação do notificante é recomendada para permitir devolutiva e esclarecimentos, mas permanece opcional para não dificultar o registro da ocorrência.
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Data da Ocorrência */}
              <div className="space-y-2">
                <Label htmlFor="dataOcorrencia">
                  Data da Ocorrência <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dataOcorrencia"
                  type="date"
                  max={today}
                  value={formData.dataOcorrencia}
                  onChange={(e) => handleChange("dataOcorrencia", e.target.value)}
                  className={errors.dataOcorrencia ? "border-destructive" : ""}
                />
                {errors.dataOcorrencia && (
                  <p className="text-xs text-destructive">{errors.dataOcorrencia}</p>
                )}
              </div>

              {/* Responsável */}
              <div className="space-y-2">
                <Label htmlFor="responsavelRegistro">
                  Responsável pelo Registro <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="responsavelRegistro"
                  placeholder="Nome completo"
                  value={formData.responsavelRegistro}
                  onChange={(e) => handleChange("responsavelRegistro", e.target.value)}
                />
              </div>
            </div>

            {/* Email (optional) */}
            <div className="space-y-2">
              <Label htmlFor="emailResponsavel">
                E-mail <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="emailResponsavel"
                type="email"
                placeholder="seu@email.com"
                value={formData.emailResponsavel}
                onChange={(e) => handleChange("emailResponsavel", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Deseja receber devolutiva sobre o desfecho? Se sim, insira seu e-mail
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Setor Notificado */}
              <div className="space-y-2">
                <Label>
                  Setor Notificado <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.setorNotificado}
                  onValueChange={(value) => handleChange("setorNotificado", value)}
                >
                  <SelectTrigger className={`w-full ${errors.setorNotificado ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Selecione o setor notificado" />
                  </SelectTrigger>
                  <SelectContent>
                    {setores.map((setor) => (
                      <SelectItem key={setor} value={setor}>
                        {setor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.setorNotificado && (
                  <p className="text-xs text-destructive">{errors.setorNotificado}</p>
                )}
              </div>

              {/* Setor Notificador */}
              <div className="space-y-2">
                <Label>
                  Setor Notificador <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.setorNotificador}
                  onValueChange={(value) => handleChange("setorNotificador", value)}
                >
                  <SelectTrigger className={`w-full ${errors.setorNotificador ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Selecione o setor notificador" />
                  </SelectTrigger>
                  <SelectContent>
                    {setores.map((setor) => (
                      <SelectItem key={setor} value={setor}>
                        {setor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.setorNotificador && (
                  <p className="text-xs text-destructive">{errors.setorNotificador}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classification Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Classificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Tipo de Notificação */}
              <div className="space-y-2">
                <Label>
                  Tipo de Notificação <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.tipoNotificacao}
                  onValueChange={(value) => handleChange("tipoNotificacao", value)}
                >
                  <SelectTrigger className={`w-full ${errors.tipoNotificacao ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao_conformidade">
                      Não Conformidade (Não envolve paciente)
                    </SelectItem>
                    <SelectItem value="evento_adverso">
                      Evento Adverso (Envolve paciente)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipoNotificacao && (
                  <p className="text-xs text-destructive">{errors.tipoNotificacao}</p>
                )}
              </div>

            </div>

            {/* Subtipo de Evento Adverso */}
            {formData.tipoNotificacao === "evento_adverso" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Tipo de Evento Adverso <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.subtipoEvento}
                    onValueChange={(value) => {
                      handleChange("subtipoEvento", value);
                      // Reset related fields when changing subtipo
                      handleChange("localizacaoLesao", "");
                      handleChange("tipoHematoma", "");
                      handleChange("tipoPseudoaneurisma", "");
                    }}
                  >
                    <SelectTrigger className={`w-full ${errors.subtipoEvento ? "border-destructive" : ""}`}>
                      <SelectValue placeholder="Selecione o evento adverso" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventoAdversoTipos.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subtipoEvento && (
                    <p className="text-xs text-destructive">{errors.subtipoEvento}</p>
                  )}
                </div>

                {/* Hematoma pós-puncionismo options */}
                {formData.subtipoEvento === "hematoma_pos_puncionismo" && (
                  <div className="space-y-2">
                    <Label>Localização</Label>
                    <Select
                      value={formData.tipoHematoma}
                      onValueChange={(value) => handleChange("tipoHematoma", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="radial">Radial</SelectItem>
                        <SelectItem value="femoral">Femoral</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Informe o médico responsável pelo procedimento no campo de dados do paciente, quando aplicável.
                    </p>
                  </div>
                )}

                {/* Pseudoaneurisma options */}
                {formData.subtipoEvento === "pseudoaneurisma" && (
                  <div className="space-y-2">
                    <Label>Localização</Label>
                    <Select
                      value={formData.tipoPseudoaneurisma}
                      onValueChange={(value) => handleChange("tipoPseudoaneurisma", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="radial">Radial</SelectItem>
                        <SelectItem value="femoral">Femoral</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Informe o médico responsável pelo procedimento no campo de dados do paciente, quando aplicável.
                    </p>
                  </div>
                )}

                {/* Flebite options */}
                {formData.subtipoEvento === "flebite" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.flebiteQuimica}
                            onChange={(e) => handleChange("flebiteQuimica", e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Química</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.flebiteMecanica}
                            onChange={(e) => handleChange("flebiteMecanica", e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Mecânica</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.flebiteInfecciosa}
                            onChange={(e) => handleChange("flebiteInfecciosa", e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">Infecciosa</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="flebiteAmiodarona">Uso de amiodarona</Label>
                      <Select
                        value={formData.flebiteAmiodarona}
                        onValueChange={(value) => handleChange("flebiteAmiodarona", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sim ou não" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="flebiteAntibioticos">Uso de antibióticos</Label>
                      <Select
                        value={formData.flebiteAntibioticos}
                        onValueChange={(value) => handleChange("flebiteAntibioticos", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sim ou não" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="flebiteDrogaVasoativa">Droga vasoativa</Label>
                      <Select
                        value={formData.flebiteDrogaVasoativa}
                        onValueChange={(value) => handleChange("flebiteDrogaVasoativa", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sim ou não" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="flebiteOutrasDrogas">Outras drogas e espaço aberto</Label>
                      <Input
                        id="flebiteOutrasDrogas"
                        placeholder="Especifique outras drogas"
                        value={formData.flebiteOutrasDrogas}
                        onChange={(e) => handleChange("flebiteOutrasDrogas", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Reação Transfusional note */}
                {formData.subtipoEvento === "reacao_transfusional" && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800 font-medium">
                      Ter uma observação: NOTIFICAR AO HEMOCE
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      E um link que direciona no final à notificação do Hemoce
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Subtipo de Não Conformidade */}
            {formData.tipoNotificacao === "nao_conformidade" && (
              <div className="space-y-2">
                <Label>
                  Tipo de Não Conformidade <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.subtipoEvento}
                  onValueChange={(value) => {
                    handleChange("subtipoEvento", value);
                    handleChange("localizacaoLesao", "");
                  }}
                >
                  <SelectTrigger className={`w-full ${errors.subtipoEvento ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {naoConformidadeTipos.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subtipoEvento && (
                  <p className="text-xs text-destructive">{errors.subtipoEvento}</p>
                )}

                {/* Lesão por pressão - localização */}
                {formData.subtipoEvento === "lesao_por_pressao" && (
                  <div className="space-y-2 mt-2">
                    <Label>Localização</Label>
                    <Select
                      value={formData.localizacaoLesao}
                      onValueChange={(value) => handleChange("localizacaoLesao", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a localização" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sacra">Sacra</SelectItem>
                        <SelectItem value="gluteo">Glúteo</SelectItem>
                        <SelectItem value="calcaneo">Calcâneo</SelectItem>
                        <SelectItem value="pavilhao_auricular">Pavilhão auricular</SelectItem>
                        <SelectItem value="trocanter">Trocânter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Gravidade */}
            <div className="space-y-2">
              <Label>
                Gravidade inicial <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.gravidade}
                onValueChange={(value) => handleChange("gravidade", value)}
              >
                <SelectTrigger className={`w-full ${errors.gravidade ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Selecione a gravidade" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(severityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            value === "baixa"
                              ? "bg-emerald-500"
                              : value === "media"
                              ? "bg-amber-500"
                              : value === "alta"
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }`}
                        />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gravidade && (
                <p className="text-xs text-destructive">{errors.gravidade}</p>
              )}
              {slaDays && (
                <p className="text-xs text-muted-foreground">
                  SLA de resolução: {slaDays} dias
                </p>
              )}
            </div>

            {/* Patient Info for evento_adverso */}
            {formData.tipoNotificacao === "evento_adverso" && (
              <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <Label className="font-medium text-amber-900">
                    Informações do Paciente
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pacienteNome">
                    Nome do Paciente <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pacienteNome"
                    placeholder="Nome completo do paciente"
                    value={formData.pacienteNome}
                    onChange={(e) => handleChange("pacienteNome", e.target.value)}
                    className={errors.pacienteNome ? "border-destructive bg-white" : "bg-white"}
                  />
                  {errors.pacienteNome && (
                    <p className="text-xs text-destructive">{errors.pacienteNome}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pacienteDataNascimento">
                      Data de Nascimento <span className="text-muted-foreground">(ou número de atendimento)</span>
                    </Label>
                    <Input
                      id="pacienteDataNascimento"
                      type="date"
                      max={today}
                      value={formData.pacienteDataNascimento}
                      onChange={(e) => handleChange("pacienteDataNascimento", e.target.value)}
                      className={errors.pacienteDataNascimento ? "border-destructive bg-white" : "bg-white"}
                    />
                    {errors.pacienteDataNascimento && (
                      <p className="text-xs text-destructive">{errors.pacienteDataNascimento}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pacienteNumeroAtendimento">
                      Número de Atendimento <span className="text-muted-foreground">(ou data de nascimento)</span>
                    </Label>
                    <Input
                      id="pacienteNumeroAtendimento"
                      placeholder="Ex: 2024/123456"
                      value={formData.pacienteNumeroAtendimento}
                      onChange={(e) => handleChange("pacienteNumeroAtendimento", e.target.value)}
                      className={errors.pacienteNumeroAtendimento ? "border-destructive bg-white" : "bg-white"}
                    />
                    {errors.pacienteNumeroAtendimento && (
                      <p className="text-xs text-destructive">{errors.pacienteNumeroAtendimento}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicoResponsavel">
                    Médico responsável <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    id="medicoResponsavel"
                    placeholder="Nome do médico responsável"
                    value={formData.medicoResponsavel}
                    onChange={(e) => handleChange("medicoResponsavel", e.target.value)}
                    className="bg-white"
                  />
                </div>

                <p className="text-xs text-amber-700">
                  Esta informação é confidencial e será tratada de acordo com a LGPD
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Descrição da Ocorrência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">
                Descrição Detalhada <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="descricao"
                placeholder="Descreva detalhadamente o que aconteceu, quando, onde e quem estava envolvido..."
                rows={5}
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                className={`resize-y min-h-[120px] ${errors.descricao ? "border-destructive" : ""}`}
              />
              <div className="flex items-center justify-between">
                {errors.descricao ? (
                  <p className="text-xs text-destructive">{errors.descricao}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 20 caracteres
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.descricao.length} caracteres
                </p>
              </div>
            </div>

            {/* Evidências */}
            <div className="space-y-2">
              <Label>
                Evidências <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="evidencias"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="evidencias"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">
                    Clique para anexar arquivos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Imagens, PDFs ou documentos (máx. 10MB cada)
                  </p>
                </label>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2 mt-3">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary uppercase">
                            {file.name.split(".").pop()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-background rounded"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Registrando...
              </>
            ) : (
              "Registrar NC"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
