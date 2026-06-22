"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, Clock, Send, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statusLabels, severityLabels, type NCStatus, type Severity } from "@/data/mockData";
import { useNavigate } from "@/lib/router-shim";

interface NCNotification {
  id: number;
  codigo: string;
  descricao: string;
  setor: string;
  gravidade: Severity;
  status: NCStatus;
  data_registro: string;
  data_prazo?: string | null;
  responsavel_registro?: string | null;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  const today = new Date();
  const due = new Date(value);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function NotificacoesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NCNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await fetch("/api/ncs", { cache: "no-store" });
        if (response.ok) setItems(await response.json());
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const stats = useMemo(() => {
    const abertas = items.filter((item) => item.status !== "encerrada");
    const criticas = abertas.filter((item) => item.gravidade === "critica");
    const vencidas = abertas.filter((item) => {
      const days = daysUntil(item.data_prazo);
      return days !== null && days < 0;
    });

    return { abertas: abertas.length, criticas: criticas.length, vencidas: vencidas.length };
  }, [items]);

  const recentItems = items.slice(0, 10);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="mt-1 text-muted-foreground">
            Acompanhe alertas de NC e prepare os avisos por Telegram.
          </p>
        </div>
        <Button onClick={() => navigate("/notificar")}>
          <Bell className="mr-2 h-4 w-4" />
          Registrar notificação pública
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">NC abertas</p>
              <p className="text-2xl font-bold">{stats.abertas}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Críticas abertas</p>
              <p className="text-2xl font-bold">{stats.criticas}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Prazos vencidos</p>
              <p className="text-2xl font-bold">{stats.vencidas}</p>
            </div>
            <ShieldCheck className="h-8 w-8 text-amber-600" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eventos recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Carregando...</div>
            ) : recentItems.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nenhuma notificação encontrada.
              </div>
            ) : (
              <div className="space-y-3">
                {recentItems.map((item) => {
                  const dueDays = daysUntil(item.data_prazo);
                  const overdue = dueDays !== null && dueDays < 0 && item.status !== "encerrada";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(`/nc/${item.id}`)}
                      className="flex w-full items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{item.codigo}</span>
                          <Badge>{statusLabels[item.status]}</Badge>
                          <Badge variant={item.gravidade === "critica" ? "destructive" : "outline"}>
                            {severityLabels[item.gravidade]}
                          </Badge>
                          {overdue && <Badge variant="destructive">Prazo vencido</Badge>}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {item.descricao}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {item.setor} • registrado por {item.responsavel_registro || "-"} •{" "}
                          {formatDateTime(item.data_registro)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-5 w-5 text-primary" />
              Integração Telegram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              É possível abrir NC pelo Telegram e enviar alertas para quem registrou a ocorrência.
            </p>

            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <span>Usuário envia /nova_nc ou responde perguntas guiadas pelo bot.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <span>Sistema cria a NC, salva o chat_id e retorna o código ao usuário.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <span>Ao mudar status, definir plano ou encerrar, o bot notifica o solicitante.</span>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
              Para ativar em produção precisamos do token do bot do Telegram e de um endereço HTTPS
              público apontando para este sistema.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
