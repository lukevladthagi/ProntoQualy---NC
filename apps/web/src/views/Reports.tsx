"use client";

import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { setores, tipoLabelsByValue } from "@/data/mockData";

type NCReportRow = {
  id: number | string;
  codigo: string;
  setor: string;
  tipo: string;
  gravidade: string;
  grau_dano?: string | null;
  descricao: string;
  data_registro: string;
  is_seguranca_paciente?: number;
};

const grauDanoLabels: Record<string, string> = {
  incidente_sem_lesao: "Incidente sem lesão",
  leve: "Leve",
  moderado: "Moderado",
  grave: "Grave",
  obito: "Óbito",
};

const months = [
  { value: "2026-06", label: "Junho 2026" },
  { value: "2026-05", label: "Maio 2026" },
  { value: "2026-04", label: "Abril 2026" },
  { value: "2026-03", label: "Março 2026" },
  { value: "2026-02", label: "Fevereiro 2026" },
  { value: "2026-01", label: "Janeiro 2026" },
  { value: "2025-12", label: "Dezembro 2025" },
];

const defaultTexts = {
  analise:
    "Após avaliação das notificações registradas no período, observa-se a necessidade de acompanhamento dos eventos por setor, tipo de notificação e grau de dano classificado pela qualidade.",
  recomendacoes:
    "O NSP recomenda revisar o processo com a equipe, realizar treinamento quando necessário e acompanhar os planos de ação para reduzir recorrências.",
  causas:
    "Fatores relacionados ao processo assistencial, comunicação, documentação, profissional, paciente, equipamentos, materiais ou ambiente.",
  notificacoes:
    "As notificações do setor devem ser acompanhadas com devolutiva à gestão responsável, mantendo o incentivo à notificação confidencial e não punitiva.",
};

function countBy<T extends string>(rows: NCReportRow[], getter: (row: NCReportRow) => T) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = getter(row) || "Não informado";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function toTableRows(counts: Record<string, number>, labels?: Record<string, string>) {
  return Object.entries(counts)
    .map(([key, total]) => ({ label: labels?.[key] || key, total }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [rows, setRows] = useState<NCReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [texts, setTexts] = useState(defaultTexts);

  const selectedMonthLabel = months.find((month) => month.value === selectedMonth)?.label || selectedMonth;

  const summary = useMemo(() => {
    const porTipo = toTableRows(countBy(rows, (row) => row.tipo), tipoLabelsByValue);
    const porGrauDano = toTableRows(
      countBy(rows, (row) => row.grau_dano || (row.is_seguranca_paciente ? "aguardando_qualidade" : "nao_conformidade")),
      {
        ...grauDanoLabels,
        aguardando_qualidade: "Aguardando classificação da qualidade",
        nao_conformidade: "Não conformidade",
      }
    );
    return { porTipo, porGrauDano };
  }, [rows]);

  const handleGenerateReport = async () => {
    if (!selectedMonth || !selectedSector) return;

    const [year, month] = selectedMonth.split("-").map(Number);
    const dataInicio = `${selectedMonth}-01`;
    const dataFim = new Date(year, month, 0).toISOString().slice(0, 10);
    const params = new URLSearchParams({
      setor: selectedSector,
      dataInicio,
      dataFim,
    });

    setLoading(true);
    try {
      const response = await fetch(`/api/ncs?${params.toString()}`);
      if (!response.ok) throw new Error("Erro ao carregar dados do relatório");
      setRows(await response.json());
      setShowReport(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Relatórios Mensais</h1>
        <p className="text-muted-foreground mt-1">
          Gere relatórios mensais por setor com números reais e textos editáveis.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Gerar Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Setor</label>
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map((setor) => (
                    <SelectItem key={setor} value={setor}>
                      {setor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleGenerateReport} disabled={!selectedMonth || !selectedSector || loading} className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                {loading ? "Gerando..." : "Gerar Relatório"}
              </Button>
              {showReport && (
                <Button variant="outline" onClick={() => window.print()}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showReport && (
        <Card className="print:shadow-none">
          <CardContent className="p-8 space-y-8">
            <div className="text-center border-b pb-6">
              <h2 className="text-2xl font-bold mb-2">PLANO DE AÇÃO - EVENTOS ASSISTENCIAIS MONITORADOS</h2>
              <p className="text-sm text-red-600 font-medium">
                Preenchimento de gestão, ações já realizadas ou em andamento
              </p>
            </div>

            <div>
              <p className="text-sm mb-1">
                <strong>Setor:</strong> {selectedSector}
              </p>
              <p className="text-sm mb-4">
                <strong>Período analisado:</strong> {selectedMonthLabel}
              </p>

              <h3 className="font-bold mb-3">1. Panorama geral de notificações</h3>
              <p className="text-sm mb-3">Total de notificações recebidas no período: {rows.length}</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <table className="border-collapse border border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left">Tipo de notificação</th>
                      <th className="border border-gray-300 px-3 py-2">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.porTipo.length === 0 ? (
                      <tr>
                        <td className="border border-gray-300 px-3 py-2" colSpan={2}>Sem notificações no período</td>
                      </tr>
                    ) : (
                      summary.porTipo.map((item) => (
                        <tr key={item.label}>
                          <td className="border border-gray-300 px-3 py-2">{item.label}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">{item.total}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <table className="border-collapse border border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left">Grau do dano</th>
                      <th className="border border-gray-300 px-3 py-2">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.porGrauDano.length === 0 ? (
                      <tr>
                        <td className="border border-gray-300 px-3 py-2" colSpan={2}>Sem notificações no período</td>
                      </tr>
                    ) : (
                      summary.porGrauDano.map((item) => (
                        <tr key={item.label}>
                          <td className="border border-gray-300 px-3 py-2">{item.label}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">{item.total}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {[
              ["analise", "2. Análise do Núcleo de Segurança do Paciente"],
              ["recomendacoes", "3. Medidas recomendadas"],
              ["causas", "4. Possíveis causas"],
              ["notificacoes", "5. Das notificações realizadas pelo setor"],
            ].map(([key, title]) => (
              <div key={key} className="space-y-2">
                <h3 className="font-bold">{title}</h3>
                <Textarea
                  value={texts[key as keyof typeof texts]}
                  onChange={(event) => setTexts((current) => ({ ...current, [key]: event.target.value }))}
                  rows={4}
                  className="text-sm print:border-0 print:p-0"
                />
              </div>
            ))}

            <div>
              <h3 className="font-bold mb-3">6. Modelo de Plano de Ação</h3>
              <table className="border-collapse border border-gray-300 text-xs w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-2 py-2 text-left">Problema Identificado</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Ação proposta</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Responsável</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Prazo</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Monitoramento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-2 h-16"></td>
                    <td className="border border-gray-300 px-2 py-2"></td>
                    <td className="border border-gray-300 px-2 py-2"></td>
                    <td className="border border-gray-300 px-2 py-2"></td>
                    <td className="border border-gray-300 px-2 py-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="font-bold mb-3">7. Incentivo à notificação</h3>
              <p className="text-sm">
                Reforçamos que a notificação de incidentes e eventos adversos é confidencial e não punitiva,
                sendo fundamental para o aprimoramento da segurança e qualidade da assistência prestada aos pacientes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
