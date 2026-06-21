"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FileSearch,
  ListChecks,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/lib/router-shim";
import { setores, statusLabels, severityLabels, type NCStatus, type Severity } from "@/data/mockData";

type TipoItem = "evidencia" | "analise" | "acao" | "verificacao";

interface TratativaItem {
  tipo_item: TipoItem;
  id: number;
  nc_id: number;
  data_item?: string;
  titulo?: string;
  resumo?: string;
  url?: string;
  tamanho?: number;
  responsavel?: string;
  prazo?: string;
  status_item?: string;
  data_conclusao?: string;
  is_eficaz?: number;
  codigo: string;
  nc_status: NCStatus;
  setor: string;
  gravidade: Severity;
  nc_descricao: string;
}

interface PendenciaItem {
  nc_id: number;
  codigo: string;
  nc_status: NCStatus;
  setor: string;
  gravidade: Severity;
  nc_descricao: string;
  data_prazo?: string;
  total_evidencias: number;
  total_analises: number;
  total_acoes: number;
  total_verificacoes: number;
  acoes_abertas: number;
  proximo_prazo?: string;
}

interface TratativasResponse {
  evidencias: TratativaItem[];
  analises: TratativaItem[];
  acoes: TratativaItem[];
  verificacoes: TratativaItem[];
  pendencias: PendenciaItem[];
}

const emptyData: TratativasResponse = {
  evidencias: [],
  analises: [],
  acoes: [],
  verificacoes: [],
  pendencias: [],
};

const tipoLabels: Record<TipoItem, string> = {
  evidencia: "Evidência",
  analise: "Análise",
  acao: "Ação",
  verificacao: "Verificação",
};

const actionStatusLabels: Record<string, string> = {
  pendente: "Pendente",
  em_execucao: "Em execução",
  concluida: "Concluída",
  atrasada: "Atrasada",
};

function formatDate(dateString?: string) {
  if (!dateString) return "Sem data";
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatSize(size?: number) {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getSeverityClass(severity: Severity) {
  const classes: Record<Severity, string> = {
    baixa: "bg-emerald-100 text-emerald-700 border-emerald-200",
    media: "bg-amber-100 text-amber-700 border-amber-200",
    alta: "bg-orange-100 text-orange-700 border-orange-200",
    critica: "bg-red-100 text-red-700 border-red-200",
  };
  return classes[severity] ?? "bg-slate-100 text-slate-700 border-slate-200";
}

function getStatusClass(status: NCStatus) {
  const classes: Record<NCStatus, string> = {
    registrada: "bg-sky-100 text-sky-700 border-sky-200",
    em_analise: "bg-violet-100 text-violet-700 border-violet-200",
    plano_definido: "bg-indigo-100 text-indigo-700 border-indigo-200",
    em_execucao: "bg-amber-100 text-amber-700 border-amber-200",
    aguardando_verificacao: "bg-orange-100 text-orange-700 border-orange-200",
    encerrada: "bg-emerald-100 text-emerald-700 border-emerald-200",
    reaberta: "bg-red-100 text-red-700 border-red-200",
  };
  return classes[status] ?? "bg-slate-100 text-slate-700 border-slate-200";
}

function getPendencia(item: PendenciaItem) {
  if (Number(item.total_analises) === 0) return "Aguardando análise de causa";
  if (Number(item.total_acoes) === 0) return "Aguardando plano de ação";
  if (Number(item.acoes_abertas) > 0) return "Ações em aberto";
  if (Number(item.total_verificacoes) === 0) return "Aguardando verificação de eficácia";
  return "Tratativa em acompanhamento";
}

function isOverdue(dateString?: string) {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

function ItemCard({ item }: { item: TratativaItem }) {
  const overdue = item.tipo_item === "acao" && item.status_item !== "concluida" && isOverdue(item.prazo);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{tipoLabels[item.tipo_item]}</Badge>
              <Link href={`/nc/${item.nc_id}`} className="font-semibold text-foreground hover:text-primary">
                {item.codigo}
              </Link>
              <Badge variant="outline" className={getStatusClass(item.nc_status)}>
                {statusLabels[item.nc_status]}
              </Badge>
              <Badge variant="outline" className={getSeverityClass(item.gravidade)}>
                {severityLabels[item.gravidade]}
              </Badge>
              {overdue && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Atrasada
                </Badge>
              )}
            </div>

            <h3 className="text-base font-semibold text-foreground">
              {item.titulo || "Item sem título"}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {item.resumo || item.nc_descricao || "Sem resumo informado"}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Setor: {item.setor}</span>
              <span>Data: {formatDate(item.data_item)}</span>
              {item.responsavel && <span>Responsável: {item.responsavel}</span>}
              {item.prazo && <span>Prazo: {formatDate(item.prazo)}</span>}
              {item.status_item && <span>Status: {actionStatusLabels[item.status_item] ?? item.status_item}</span>}
              {item.tamanho ? <span>Arquivo: {formatSize(item.tamanho)}</span> : null}
              {item.tipo_item === "verificacao" && (
                <span>{item.is_eficaz === 1 ? "Eficaz" : "Não eficaz"}</span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {item.url && (
              <Button variant="outline" size="sm" asChild>
                <a href={item.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver
                </a>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href={`/nc/${item.nc_id}`}>Abrir NC</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <FileSearch className="mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="text-base font-semibold text-foreground">Nada encontrado</h3>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export default function TratativasPage() {
  const [data, setData] = useState<TratativasResponse>(emptyData);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    setor: "",
    status: "",
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.setor) params.set("setor", filters.setor);
    if (filters.status) params.set("status", filters.status);
    return params.toString();
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchTratativas() {
      setLoading(true);
      try {
        const response = await fetch(`/api/tratativas?${queryString}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Erro ao carregar tratativas");
        setData(await response.json());
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setData(emptyData);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchTratativas();
    return () => controller.abort();
  }, [queryString]);

  const allItems = [...data.evidencias, ...data.analises, ...data.acoes, ...data.verificacoes].sort(
    (a, b) => new Date(b.data_item ?? 0).getTime() - new Date(a.data_item ?? 0).getTime(),
  );
  const overdueActions = data.acoes.filter(
    (item) => item.status_item !== "concluida" && isOverdue(item.prazo),
  ).length;
  const pendingVerification = data.pendencias.filter(
    (item) =>
      Number(item.total_acoes) > 0 &&
      Number(item.acoes_abertas) === 0 &&
      Number(item.total_verificacoes) === 0,
  ).length;

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tratativas da Qualidade</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Central para acompanhar evidências, análises de causa, planos de ação e verificações de eficácia sem perder a rastreabilidade com a NC original.
          </p>
        </div>
        <Button asChild>
          <Link href="/nc/nova">Registrar nova NC</Link>
        </Button>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Itens tratados</p>
              <p className="text-2xl font-bold">{allItems.length}</p>
            </div>
            <ListChecks className="h-8 w-8 text-cyan-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">NC em aberto</p>
              <p className="text-2xl font-bold">{data.pendencias.length}</p>
            </div>
            <ClipboardCheck className="h-8 w-8 text-indigo-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Ações atrasadas</p>
              <p className="text-2xl font-bold">{overdueActions}</p>
            </div>
            <Clock className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Aguardam eficácia</p>
              <p className="text-2xl font-bold">{pendingVerification}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 border-cyan-100 bg-cyan-50/60">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
            <p className="text-sm text-cyan-950">
              Boa prática: registrar a ocorrência, reunir evidências/fatos, analisar causa raiz, definir ações corretivas ou preventivas e depois verificar a eficácia. A tela abaixo organiza essas etapas como filas de trabalho, mantendo cada item ligado à sua NC.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por código ou descrição da NC..."
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            className="pl-9"
          />
        </div>
        <select
          value={filters.setor}
          onChange={(event) => setFilters((prev) => ({ ...prev, setor: event.target.value }))}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos os setores</option>
          {setores.map((setor) => (
            <option key={setor} value={setor}>
              {setor}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos os status</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      ) : (
        <Tabs defaultValue="pendencias">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="pendencias">Pendências ({data.pendencias.length})</TabsTrigger>
            <TabsTrigger value="todos">Todos ({allItems.length})</TabsTrigger>
            <TabsTrigger value="evidencias">Evidências ({data.evidencias.length})</TabsTrigger>
            <TabsTrigger value="analises">Análises ({data.analises.length})</TabsTrigger>
            <TabsTrigger value="acoes">Ações ({data.acoes.length})</TabsTrigger>
            <TabsTrigger value="verificacoes">Verificações ({data.verificacoes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pendencias" className="mt-4 space-y-3">
            {data.pendencias.length === 0 ? (
              <EmptyState label="Nenhuma pendência aberta para os filtros atuais." />
            ) : (
              data.pendencias.map((item) => (
                <Card key={item.nc_id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                          <Link href={`/nc/${item.nc_id}`} className="hover:text-primary">
                            {item.codigo}
                          </Link>
                          <Badge variant="outline" className={getStatusClass(item.nc_status)}>
                            {statusLabels[item.nc_status]}
                          </Badge>
                          <Badge variant="outline" className={getSeverityClass(item.gravidade)}>
                            {severityLabels[item.gravidade]}
                          </Badge>
                        </CardTitle>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {item.nc_descricao}
                        </p>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/nc/${item.nc_id}`}>Tratar NC</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-3 text-sm md:grid-cols-5">
                      <div>
                        <p className="text-muted-foreground">Próximo passo</p>
                        <p className="font-medium">{getPendencia(item)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Setor</p>
                        <p className="font-medium">{item.setor}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Evidências</p>
                        <p className="font-medium">{item.total_evidencias}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Análises/Ações</p>
                        <p className="font-medium">{item.total_analises} / {item.total_acoes}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prazo</p>
                        <p className={isOverdue(item.proximo_prazo ?? item.data_prazo) ? "font-medium text-red-600" : "font-medium"}>
                          {formatDate(item.proximo_prazo ?? item.data_prazo)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="todos" className="mt-4 space-y-3">
            {allItems.length === 0 ? <EmptyState label="Nenhum item encontrado." /> : allItems.map((item) => <ItemCard key={`${item.tipo_item}-${item.id}`} item={item} />)}
          </TabsContent>
          <TabsContent value="evidencias" className="mt-4 space-y-3">
            {data.evidencias.length === 0 ? <EmptyState label="Nenhuma evidência encontrada." /> : data.evidencias.map((item) => <ItemCard key={item.id} item={item} />)}
          </TabsContent>
          <TabsContent value="analises" className="mt-4 space-y-3">
            {data.analises.length === 0 ? <EmptyState label="Nenhuma análise encontrada." /> : data.analises.map((item) => <ItemCard key={item.id} item={item} />)}
          </TabsContent>
          <TabsContent value="acoes" className="mt-4 space-y-3">
            {data.acoes.length === 0 ? <EmptyState label="Nenhuma ação encontrada." /> : data.acoes.map((item) => <ItemCard key={item.id} item={item} />)}
          </TabsContent>
          <TabsContent value="verificacoes" className="mt-4 space-y-3">
            {data.verificacoes.length === 0 ? <EmptyState label="Nenhuma verificação encontrada." /> : data.verificacoes.map((item) => <ItemCard key={item.id} item={item} />)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
