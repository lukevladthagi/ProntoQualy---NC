// Mock data for QualityHub NC Management System

export type NCStatus = 
  | "registrada"
  | "em_analise"
  | "plano_definido"
  | "em_execucao"
  | "aguardando_verificacao"
  | "encerrada"
  | "reaberta";

export type NCType = 
  | "processo"
  | "seguranca_paciente"
  | "equipamento"
  | "sistema"
  | "documentacao"
  | "administrativo"
  | "outros";

export type Severity = "baixa" | "media" | "alta" | "critica";

export type ActionStatus = "pendente" | "em_execucao" | "concluida" | "atrasada";

export interface NC {
  id: string;
  dataOcorrencia: string;
  dataRegistro: string;
  setor: string;
  unidade: string;
  tipo: NCType;
  gravidade: Severity;
  descricao: string;
  status: NCStatus;
  responsavelRegistro: string;
  pacienteEnvolvido?: string;
  segurancaPaciente: boolean;
}

export interface Action {
  id: string;
  ncId: string;
  descricao: string;
  tipo: "corretiva" | "preventiva";
  responsavel: string;
  prazo: string;
  status: ActionStatus;
}

export const statusLabels: Record<NCStatus, string> = {
  registrada: "Registrada",
  em_analise: "Em Análise",
  plano_definido: "Plano Definido",
  em_execucao: "Em Execução",
  aguardando_verificacao: "Aguardando Verificação",
  encerrada: "Encerrada",
  reaberta: "Reaberta",
};

export const typeLabels: Record<NCType, string> = {
  processo: "Processo",
  seguranca_paciente: "Segurança do Paciente",
  equipamento: "Equipamento",
  sistema: "Sistema",
  documentacao: "Documentação",
  administrativo: "Administrativo",
  outros: "Outros",
};

export const severityLabels: Record<Severity, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export const setores = [
  "HEMODINÂMICA",
  "UTI 1",
  "UTI 2",
  "UTI 3",
  "UTI 4",
  "ASSISTÊNCIA MÉDICA",
  "EMERGÊNCIA",
  "FARMÁCIA",
  "LABORATÓRIO",
  "CLÍNICA 1",
  "CLÍNICA 2",
  "NUTRIÇÃO",
  "MANUTENÇÃO",
  "CENTRO CIRÚRGICO",
  "CME",
  "RECEPÇÃO",
  "ADMINISTRATIVO",
];

export const unidades = [
  "Hospital Central",
  "Unidade Norte",
  "Unidade Sul",
  "Clínica Especializada",
];

export const eventoAdversoTipos = [
  { value: "hematoma_pos_puncionismo", label: "Hematoma pós-puncionismo" },
  { value: "pseudoaneurisma", label: "Pseudoaneurisma" },
  { value: "flebite", label: "Flebite" },
  { value: "hematoma_retroperitonial", label: "Hematoma retroperitonial" },
  { value: "falha_cateter_venoso", label: "Falha envolvendo cateter venoso" },
  { value: "reacao_transfusional", label: "Reação transfusional" },
  { value: "broncoaspiracao", label: "Broncoaspiração" },
  { value: "falha_identificacao_beira_leito", label: "Falha na identificação à beira leito" },
  { value: "falha_pulseira_identificacao", label: "Falha no uso da pulseira de identificação" },
  { value: "falha_comunicacao", label: "Falha na comunicação" },
  { value: "lesao_por_pressao", label: "Lesão por pressão" },
  { value: "queda", label: "Queda" },
  { value: "erro_medicacao", label: "Erro de medicação" },
  { value: "erro_dispensacao", label: "Erro de dispensação" },
  { value: "erro_prescricao", label: "Erro de prescrição" },
  { value: "tecnovigilancia", label: "Tecnovigilância" },
  { value: "equimose", label: "Equimose" },
  { value: "risco_infeccao", label: "Risco de infecção" },
  { value: "dermatite_fraldas", label: "Dermatite por fraldas" },
  { value: "reacao_alergica", label: "Reação alérgica" },
  { value: "lesao_dispositivo", label: "Lesão por dispositivo" },
  { value: "skin_tears", label: "Skin Tears" },
  { value: "outros_evento_adverso", label: "Outros" },
];

export const naoConformidadeTipos = [
  { value: "falha_processo", label: "Falha de processo" },
  { value: "falha_comunicacao", label: "Falha na comunicação" },
  { value: "falha_documentacao", label: "Falha na documentação" },
  { value: "outros_nao_conformidade", label: "Outros" },
];

export const tipoNotificacaoLabels: Record<string, string> = {
  nao_conformidade: "Não conformidade",
  evento_adverso: "Evento adverso",
};

export const tipoLabelsByValue: Record<string, string> = {
  ...Object.fromEntries(eventoAdversoTipos.map((tipo) => [tipo.value, tipo.label])),
  ...Object.fromEntries(naoConformidadeTipos.map((tipo) => [tipo.value, tipo.label])),
};

// Sample NCs for dashboard
export const mockNCs: NC[] = [
  {
    id: "NC-2024-001",
    dataOcorrencia: "2024-01-15",
    dataRegistro: "2024-01-15",
    setor: "UTI Adulto",
    unidade: "Hospital Central",
    tipo: "seguranca_paciente",
    gravidade: "critica",
    descricao: "Paciente recebeu medicação com dosagem incorreta. Identificado erro na transcrição da prescrição médica.",
    status: "em_execucao",
    responsavelRegistro: "Maria Silva",
    segurancaPaciente: true,
  },
  {
    id: "NC-2024-002",
    dataOcorrencia: "2024-01-16",
    dataRegistro: "2024-01-16",
    setor: "Centro Cirúrgico",
    unidade: "Hospital Central",
    tipo: "equipamento",
    gravidade: "alta",
    descricao: "Monitor multiparamétrico apresentou falha durante procedimento cirúrgico.",
    status: "plano_definido",
    responsavelRegistro: "Carlos Souza",
    segurancaPaciente: true,
  },
  {
    id: "NC-2024-003",
    dataOcorrencia: "2024-01-17",
    dataRegistro: "2024-01-17",
    setor: "Farmácia",
    unidade: "Hospital Central",
    tipo: "processo",
    gravidade: "media",
    descricao: "Medicamentos controlados armazenados fora da temperatura adequada por 4 horas.",
    status: "em_analise",
    responsavelRegistro: "Ana Costa",
    segurancaPaciente: false,
  },
  {
    id: "NC-2024-004",
    dataOcorrencia: "2024-01-18",
    dataRegistro: "2024-01-18",
    setor: "Laboratório",
    unidade: "Unidade Norte",
    tipo: "documentacao",
    gravidade: "baixa",
    descricao: "Laudos de exames emitidos sem assinatura digital do responsável técnico.",
    status: "registrada",
    responsavelRegistro: "Pedro Lima",
    segurancaPaciente: false,
  },
  {
    id: "NC-2024-005",
    dataOcorrencia: "2024-01-10",
    dataRegistro: "2024-01-10",
    setor: "Emergência",
    unidade: "Hospital Central",
    tipo: "seguranca_paciente",
    gravidade: "alta",
    descricao: "Atraso no atendimento de paciente com classificação de risco vermelho.",
    status: "encerrada",
    responsavelRegistro: "Juliana Mendes",
    segurancaPaciente: true,
  },
  {
    id: "NC-2024-006",
    dataOcorrencia: "2024-01-12",
    dataRegistro: "2024-01-12",
    setor: "CME",
    unidade: "Hospital Central",
    tipo: "processo",
    gravidade: "critica",
    descricao: "Lote de material esterilizado sem indicador químico adequado.",
    status: "aguardando_verificacao",
    responsavelRegistro: "Roberto Santos",
    segurancaPaciente: true,
  },
  {
    id: "NC-2024-007",
    dataOcorrencia: "2024-01-19",
    dataRegistro: "2024-01-19",
    setor: "Radiologia",
    unidade: "Unidade Sul",
    tipo: "sistema",
    gravidade: "media",
    descricao: "Sistema PACS fora do ar por 2 horas, impossibilitando acesso a imagens.",
    status: "em_analise",
    responsavelRegistro: "Fernanda Oliveira",
    segurancaPaciente: false,
  },
  {
    id: "NC-2024-008",
    dataOcorrencia: "2024-01-08",
    dataRegistro: "2024-01-08",
    setor: "Enfermaria A",
    unidade: "Hospital Central",
    tipo: "administrativo",
    gravidade: "baixa",
    descricao: "Escala de enfermagem não atualizada no sistema.",
    status: "encerrada",
    responsavelRegistro: "Lucia Ferreira",
    segurancaPaciente: false,
  },
];

// Dashboard statistics
export const dashboardStats = {
  totalAberto: 6,
  totalEncerrado: 2,
  criticasAbertas: 2,
  tempoMedioResolucao: 5.2,
  ncPorSetor: [
    { setor: "UTI Adulto", total: 3 },
    { setor: "Centro Cirúrgico", total: 2 },
    { setor: "Emergência", total: 4 },
    { setor: "Farmácia", total: 2 },
    { setor: "Laboratório", total: 1 },
    { setor: "CME", total: 2 },
  ],
  ncPorGravidade: [
    { gravidade: "Baixa", total: 8, cor: "hsl(142, 71%, 45%)" },
    { gravidade: "Média", total: 12, cor: "hsl(45, 93%, 47%)" },
    { gravidade: "Alta", total: 6, cor: "hsl(25, 95%, 53%)" },
    { gravidade: "Crítica", total: 3, cor: "hsl(0, 72%, 51%)" },
  ],
  ncPorTipo: [
    { tipo: "Processo", total: 10 },
    { tipo: "Segurança Paciente", total: 8 },
    { tipo: "Equipamento", total: 4 },
    { tipo: "Sistema", total: 3 },
    { tipo: "Documentação", total: 3 },
    { tipo: "Administrativo", total: 2 },
  ],
  tendenciaMensal: [
    { mes: "Ago", total: 12, encerradas: 10 },
    { mes: "Set", total: 15, encerradas: 13 },
    { mes: "Out", total: 10, encerradas: 9 },
    { mes: "Nov", total: 18, encerradas: 14 },
    { mes: "Dez", total: 14, encerradas: 11 },
    { mes: "Jan", total: 8, encerradas: 2 },
  ],
  slaStatus: [
    { gravidade: "Crítica", slaDias: 3, dentroSla: 1, foraSla: 1 },
    { gravidade: "Alta", slaDias: 7, dentroSla: 4, foraSla: 2 },
    { gravidade: "Média", slaDias: 15, dentroSla: 10, foraSla: 2 },
    { gravidade: "Baixa", slaDias: 30, dentroSla: 7, foraSla: 1 },
  ],
  reincidencia: [
    { setor: "UTI Adulto", reincidentes: 2, total: 5, percentual: 40 },
    { setor: "Emergência", reincidentes: 3, total: 8, percentual: 37.5 },
    { setor: "Centro Cirúrgico", reincidentes: 1, total: 4, percentual: 25 },
  ],
};

// SLA configuration by severity
export const slaConfig: Record<Severity, number> = {
  critica: 3,
  alta: 7,
  media: 15,
  baixa: 30,
};
