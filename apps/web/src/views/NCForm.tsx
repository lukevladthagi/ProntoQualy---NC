"use client";

import { useEffect, useState } from "react";
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
  setores as defaultSetores,
  severityLabels,
  slaConfig,
  type Severity,
} from "@/data/mockData";

interface FormOption {
  nome: string;
  valor: string;
  is_ativo?: boolean | number;
}

interface ConfigSetor {
  nome: string;
  is_ativo?: boolean | number;
}

interface ConfigGravidade {
  nome: string;
  codigo?: string | null;
  is_ativo?: boolean | number;
}

interface CustomField {
  id: number;
  nome: string;
  chave: string;
  tipo: "texto" | "texto_longo" | "numero" | "data" | "selecao" | "sim_nao" | "checkbox";
  contexto: "ambos" | "nao_conformidade" | "evento_adverso";
  opcoes?: string | null;
  is_obrigatorio?: boolean | number;
  is_ativo?: boolean | number;
  ordem?: number;
}

const defaultLocaisAcesso: FormOption[] = [
  { nome: "Radial", valor: "radial" },
  { nome: "Femoral", valor: "femoral" },
  { nome: "Outros", valor: "outros" },
];

const defaultLocaisLesao: FormOption[] = [
  { nome: "Sacra", valor: "sacra" },
  { nome: "Glúteo", valor: "gluteo" },
  { nome: "Calcâneo", valor: "calcaneo" },
  { nome: "Pavilhão auricular", valor: "pavilhao_auricular" },
  { nome: "Trocânter", valor: "trocanter" },
];

const defaultFlebiteTipos: FormOption[] = [
  { nome: "Química", valor: "quimica" },
  { nome: "Mecânica", valor: "mecanica" },
  { nome: "Infecciosa", valor: "infecciosa" },
];

const defaultFlebiteFatores: FormOption[] = [
  { nome: "Uso de amiodarona", valor: "amiodarona" },
  { nome: "Uso de antibióticos", valor: "antibioticos" },
  { nome: "Droga vasoativa", valor: "droga_vasoativa" },
];

function isActiveOption(option: FormOption) {
  return option.is_ativo === undefined || option.is_ativo === true || option.is_ativo === 1;
}

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
    flebiteTiposSelecionados: [] as string[],
    flebiteFatoresValores: {} as Record<string, string>,
    gravidade: "" as Severity | "",
    descricao: "",
    pacienteNome: "",
    pacienteDataNascimento: "",
    pacienteNumeroAtendimento: "",
    medicoResponsavel: "",
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | boolean>>({});
  const [sectorOptions, setSectorOptions] = useState<string[]>(defaultSetores);
  const [severityOptions, setSeverityOptions] = useState(
    Object.entries(severityLabels).map(([valor, nome]) => ({ valor, nome })),
  );
  const [dynamicOptions, setDynamicOptions] = useState({
    eventoAdverso: eventoAdversoTipos.map((item) => ({ nome: item.label, valor: item.value })),
    naoConformidade: naoConformidadeTipos.map((item) => ({ nome: item.label, valor: item.value })),
    locaisAcesso: defaultLocaisAcesso,
    locaisLesao: defaultLocaisLesao,
    flebiteTipos: defaultFlebiteTipos,
    flebiteFatores: defaultFlebiteFatores,
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const categories = {
      eventoAdverso: "evento_adverso",
      naoConformidade: "nao_conformidade",
      locaisAcesso: "local_acesso",
      locaisLesao: "local_lesao",
      flebiteTipos: "flebite_tipo",
      flebiteFatores: "flebite_fator",
    };

    async function loadOptions() {
      const entries = await Promise.all(
        Object.entries(categories).map(async ([key, categoria]) => {
          const response = await fetch(`/api/config/opcoes-formulario?categoria=${categoria}`, { cache: "no-store" });
          if (!response.ok) return null;
          const data = (await response.json()).filter(isActiveOption);
          return data.length ? [key, data.map((item: any) => ({ nome: item.nome, valor: item.valor }))] : null;
        }),
      );

      setDynamicOptions((current) => ({
        ...current,
        ...Object.fromEntries(entries.filter(Boolean) as [string, FormOption[]][]),
      }));

      const customFieldsResponse = await fetch("/api/config/campos-formulario", { cache: "no-store" });
      if (customFieldsResponse.ok) {
        const fields = (await customFieldsResponse.json())
          .filter(isActiveOption)
          .sort((a: CustomField, b: CustomField) => Number(a.ordem || 0) - Number(b.ordem || 0));
        setCustomFields(fields);
      }

      const setoresResponse = await fetch("/api/config/setores", { cache: "no-store" });
      if (setoresResponse.ok) {
        const setoresConfig = (await setoresResponse.json())
          .filter(isActiveOption)
          .map((setor: ConfigSetor) => setor.nome)
          .filter(Boolean);
        if (setoresConfig.length) {
          setSectorOptions(setoresConfig);
        }
      }

      const gravidadesResponse = await fetch("/api/config/gravidades", { cache: "no-store" });
      if (gravidadesResponse.ok) {
        const gravidadesConfig = (await gravidadesResponse.json())
          .filter(isActiveOption)
          .map((gravidade: ConfigGravidade) => ({
            valor: String(gravidade.codigo || gravidade.nome || "").toLowerCase(),
            nome: gravidade.nome,
          }))
          .filter((gravidade: FormOption) => gravidade.valor && gravidade.nome);
        if (gravidadesConfig.length) {
          setSeverityOptions(gravidadesConfig);
        }
      }
    }

    void loadOptions();
  }, []);

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

  const isCustomFieldVisible = (field: CustomField) =>
    field.contexto === "ambos" || field.contexto === formData.tipoNotificacao;

  const parseCustomOptions = (options?: string | null) =>
    String(options || "")
      .split(/\r?\n|,/)
      .map((option) => option.trim())
      .filter(Boolean);

  const handleCustomFieldChange = (field: CustomField, value: string | boolean) => {
    setCustomFieldValues((prev) => ({ ...prev, [field.chave]: value }));
    const errorKey = `custom_${field.chave}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleFlebiteTipoChange = (valor: string, checked: boolean) => {
    const fieldByValue: Record<string, "flebiteQuimica" | "flebiteMecanica" | "flebiteInfecciosa"> = {
      quimica: "flebiteQuimica",
      mecanica: "flebiteMecanica",
      infecciosa: "flebiteInfecciosa",
    };
    const field = fieldByValue[valor];

    setFormData((prev) => ({
      ...prev,
      ...(field ? { [field]: checked } : {}),
      flebiteTiposSelecionados: checked
        ? Array.from(new Set([...prev.flebiteTiposSelecionados, valor]))
        : prev.flebiteTiposSelecionados.filter((item) => item !== valor),
    }));
  };

  const handleFlebiteFatorChange = (valor: string, resposta: string) => {
    const fieldByValue: Record<string, "flebiteAmiodarona" | "flebiteAntibioticos" | "flebiteDrogaVasoativa"> = {
      amiodarona: "flebiteAmiodarona",
      antibioticos: "flebiteAntibioticos",
      droga_vasoativa: "flebiteDrogaVasoativa",
    };
    const field = fieldByValue[valor];

    setFormData((prev) => ({
      ...prev,
      ...(field ? { [field]: resposta } : {}),
      flebiteFatoresValores: {
        ...prev.flebiteFatoresValores,
        [valor]: resposta,
      },
    }));
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

    customFields
      .filter(isCustomFieldVisible)
      .filter((field) => field.is_obrigatorio === true || field.is_obrigatorio === 1)
      .forEach((field) => {
        const value = customFieldValues[field.chave];
        const isEmpty = field.tipo === "checkbox" ? value !== true : String(value ?? "").trim() === "";
        if (isEmpty) {
          newErrors[`custom_${field.chave}`] = `${field.nome} é obrigatório`;
        }
      });

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
          flebiteTipos: formData.flebiteTiposSelecionados,
          flebiteFatores: formData.flebiteFatoresValores,
          pacienteDataNascimento: formData.pacienteDataNascimento || null,
          pacienteNumeroAtendimento: formData.pacienteNumeroAtendimento || null,
          pacienteEnvolvido: formData.tipoNotificacao === "evento_adverso" 
            ? `${formData.pacienteNome}${formData.pacienteDataNascimento ? ` - DN: ${formData.pacienteDataNascimento}` : ''}${formData.pacienteNumeroAtendimento ? ` - Atend: ${formData.pacienteNumeroAtendimento}` : ''}`
            : null,
          segurancaPaciente: formData.tipoNotificacao === "evento_adverso",
          camposPersonalizados: customFieldValues,
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

  const visibleCustomFields = customFields.filter(isCustomFieldVisible);

  const renderCustomField = (field: CustomField) => {
    const errorKey = `custom_${field.chave}`;
    const value = customFieldValues[field.chave];
    const commonLabel = (
      <Label htmlFor={`custom-${field.chave}`}>
        {field.nome}
        {(field.is_obrigatorio === true || field.is_obrigatorio === 1) && (
          <span className="text-destructive"> *</span>
        )}
      </Label>
    );

    if (field.tipo === "texto_longo") {
      return (
        <div key={field.id} className="space-y-2">
          {commonLabel}
          <Textarea
            id={`custom-${field.chave}`}
            value={String(value || "")}
            onChange={(e) => handleCustomFieldChange(field, e.target.value)}
            className={errors[errorKey] ? "border-destructive" : ""}
          />
          {errors[errorKey] && <p className="text-xs text-destructive">{errors[errorKey]}</p>}
        </div>
      );
    }

    if (field.tipo === "selecao" || field.tipo === "sim_nao") {
      const options = field.tipo === "sim_nao" ? ["Sim", "Não"] : parseCustomOptions(field.opcoes);
      return (
        <div key={field.id} className="space-y-2">
          {commonLabel}
          <Select value={String(value || "")} onValueChange={(newValue) => handleCustomFieldChange(field, newValue)}>
            <SelectTrigger className={`w-full ${errors[errorKey] ? "border-destructive" : ""}`}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors[errorKey] && <p className="text-xs text-destructive">{errors[errorKey]}</p>}
        </div>
      );
    }

    if (field.tipo === "checkbox") {
      return (
        <div key={field.id} className="space-y-2">
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <input
              id={`custom-${field.chave}`}
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleCustomFieldChange(field, e.target.checked)}
            />
            {field.nome}
          </label>
          {errors[errorKey] && <p className="text-xs text-destructive">{errors[errorKey]}</p>}
        </div>
      );
    }

    return (
      <div key={field.id} className="space-y-2">
        {commonLabel}
        <Input
          id={`custom-${field.chave}`}
          type={field.tipo === "numero" ? "number" : field.tipo === "data" ? "date" : "text"}
          value={String(value || "")}
          onChange={(e) => handleCustomFieldChange(field, e.target.value)}
          className={errors[errorKey] ? "border-destructive" : ""}
        />
        {errors[errorKey] && <p className="text-xs text-destructive">{errors[errorKey]}</p>}
      </div>
    );
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
                    {sectorOptions.map((setor) => (
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
                    {sectorOptions.map((setor) => (
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
                      {dynamicOptions.eventoAdverso.map((tipo) => (
                        <SelectItem key={tipo.valor} value={tipo.valor}>
                          {tipo.nome}
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
                        {dynamicOptions.locaisAcesso.map((local) => (
                          <SelectItem key={local.valor} value={local.valor}>
                            {local.nome}
                          </SelectItem>
                        ))}
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
                        {dynamicOptions.locaisAcesso.map((local) => (
                          <SelectItem key={local.valor} value={local.valor}>
                            {local.nome}
                          </SelectItem>
                        ))}
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
                        {dynamicOptions.flebiteTipos.map((tipo) => {
                          const fieldByValue: Record<string, "flebiteQuimica" | "flebiteMecanica" | "flebiteInfecciosa"> = {
                            quimica: "flebiteQuimica",
                            mecanica: "flebiteMecanica",
                            infecciosa: "flebiteInfecciosa",
                          };
                          const field = fieldByValue[tipo.valor];
                          const checked = field
                            ? Boolean(formData[field])
                            : formData.flebiteTiposSelecionados.includes(tipo.valor);
                          return (
                            <label key={tipo.valor} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => handleFlebiteTipoChange(tipo.valor, e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{tipo.nome}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    
                    {dynamicOptions.flebiteFatores.map((fator) => {
                      const fieldByValue: Record<string, "flebiteAmiodarona" | "flebiteAntibioticos" | "flebiteDrogaVasoativa"> = {
                        amiodarona: "flebiteAmiodarona",
                        antibioticos: "flebiteAntibioticos",
                        droga_vasoativa: "flebiteDrogaVasoativa",
                      };
                      const field = fieldByValue[fator.valor];
                      const value = field
                        ? formData[field]
                        : formData.flebiteFatoresValores[fator.valor] || "";
                      return (
                        <div key={fator.valor} className="space-y-2">
                          <Label>{fator.nome}</Label>
                          <Select value={value} onValueChange={(value) => handleFlebiteFatorChange(fator.valor, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sim ou não" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}

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
                    {dynamicOptions.naoConformidade.map((tipo) => (
                      <SelectItem key={tipo.valor} value={tipo.valor}>
                        {tipo.nome}
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
                        {dynamicOptions.locaisLesao.map((local) => (
                          <SelectItem key={local.valor} value={local.valor}>
                            {local.nome}
                          </SelectItem>
                        ))}
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
                  {severityOptions.map((option) => (
                    <SelectItem key={option.valor} value={option.valor}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            option.valor === "baixa"
                              ? "bg-emerald-500"
                              : option.valor === "media"
                              ? "bg-amber-500"
                              : option.valor === "alta"
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }`}
                        />
                        {option.nome}
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

        {visibleCustomFields.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Campos Complementares</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {visibleCustomFields.map(renderCustomField)}
            </CardContent>
          </Card>
        )}

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
