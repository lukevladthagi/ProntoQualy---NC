"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Fonte = "CONVÊNIO" | "SUS";

type IndicatorRow = {
  competencia: string;
  fonte: Fonte;
  indicador: string;
  numerador: string;
  denominador: string;
  resultado: string;
  observacoes: string;
};

const indicatorDefinitions: Record<Fonte, string[]> = {
  CONVÊNIO: [
    "Mortalidade: N° de óbitos / Saídas",
    "Taxa de reinternação: N° de reinternações / Saídas",
    "Incidência de eventos adversos: N° de eventos adversos classificados a partir de leve / N° de internações",
    "Taxa de incidência de queda com dano: N° de quedas classificadas com dano / N° de internações",
    "Taxa de incidência de LP: N° de LPs classificadas com dano / N° de internações",
    "Taxa de hematomas locais: N° de hematomas notificados / N° de cateterismos realizados",
    "Taxa de hematoma retroperitoneal: N° de hematomas retroperitoneais notificados / N° de cateterismos realizados",
    "Taxa de pseudoaneurisma/fístula: N° de pseudoaneurisma/fístula / N° de cateterismos realizados",
  ],
  SUS: [
    "Mortalidade: N° de óbitos / Saídas",
    "Incidência de eventos adversos: N° de eventos adversos classificados a partir de leve / N° de internações",
    "Taxa de incidência de queda com dano: N° de quedas classificadas com dano / N° de internações",
    "Taxa de hematomas locais: N° de hematomas notificados / N° de cateterismos realizados",
    "Taxa de hematoma retroperitoneal: N° de hematomas retroperitoneais notificados / N° de cateterismos realizados",
    "Taxa de pseudoaneurisma/fístula: N° de pseudoaneurisma/fístula / N° de cateterismos realizados",
  ],
};

const currentMonth = new Date().toISOString().slice(0, 7);

function buildRows(competencia: string): IndicatorRow[] {
  return Object.entries(indicatorDefinitions).flatMap(([fonte, indicadores]) =>
    indicadores.map((indicador) => ({
      competencia,
      fonte: fonte as Fonte,
      indicador,
      numerador: "",
      denominador: "",
      resultado: "",
      observacoes: "",
    }))
  );
}

function normalizeNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export default function Indicators() {
  const [competencia, setCompetencia] = useState(currentMonth);
  const [rows, setRows] = useState<IndicatorRow[]>(() => buildRows(currentMonth));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const rowsByFonte = useMemo(
    () => ({
      CONVÊNIO: rows.filter((row) => row.fonte === "CONVÊNIO"),
      SUS: rows.filter((row) => row.fonte === "SUS"),
    }),
    [rows]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessage("");

    fetch(`/api/indicadores-assistenciais?competencia=${competencia}`)
      .then((response) => {
        if (!response.ok) throw new Error("Erro ao carregar indicadores");
        return response.json();
      })
      .then((savedRows) => {
        if (cancelled) return;
        const baseRows = buildRows(competencia);
        const merged = baseRows.map((row) => {
          const saved = savedRows.find(
            (item: any) => item.fonte === row.fonte && item.indicador === row.indicador
          );
          if (!saved) return row;
          return {
            ...row,
            numerador: saved.numerador?.toString() || "",
            denominador: saved.denominador?.toString() || "",
            resultado: saved.resultado?.toString() || "",
            observacoes: saved.observacoes || "",
          };
        });
        setRows(merged);
      })
      .catch(() => {
        if (!cancelled) setRows(buildRows(competencia));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [competencia]);

  const updateRow = (fonte: Fonte, indicador: string, field: keyof IndicatorRow, value: string) => {
    setRows((current) =>
      current.map((row) => {
        if (row.fonte !== fonte || row.indicador !== indicador) return row;
        const updated = { ...row, [field]: value };
        const numerador = normalizeNumber(updated.numerador);
        const denominador = normalizeNumber(updated.denominador);
        const resultado =
          numerador !== null && denominador && denominador > 0
            ? ((numerador / denominador) * 100).toFixed(2)
            : updated.resultado;
        return { ...updated, resultado };
      })
    );
  };

  const saveRows = async () => {
    setSaving(true);
    setMessage("");
    const payload = rows.map((row) => ({
      ...row,
      numerador: normalizeNumber(row.numerador),
      denominador: normalizeNumber(row.denominador),
      resultado: normalizeNumber(row.resultado),
    }));

    try {
      const response = await fetch("/api/indicadores-assistenciais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });
      if (!response.ok) throw new Error("Erro ao salvar");
      setMessage("Indicadores salvos.");
    } catch {
      setMessage("Não foi possível salvar os indicadores.");
    } finally {
      setSaving(false);
    }
  };

  const renderTable = (fonte: Fonte) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">{fonte}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border px-3 py-2 text-left">Indicador</th>
              <th className="border px-3 py-2 w-32">Numerador</th>
              <th className="border px-3 py-2 w-32">Denominador</th>
              <th className="border px-3 py-2 w-28">Resultado %</th>
              <th className="border px-3 py-2 text-left">Observações</th>
            </tr>
          </thead>
          <tbody>
            {rowsByFonte[fonte].map((row) => (
              <tr key={`${fonte}-${row.indicador}`}>
                <td className="border px-3 py-2 align-top">{row.indicador}</td>
                <td className="border px-2 py-2 align-top">
                  <Input
                    inputMode="decimal"
                    value={row.numerador}
                    onChange={(event) => updateRow(fonte, row.indicador, "numerador", event.target.value)}
                  />
                </td>
                <td className="border px-2 py-2 align-top">
                  <Input
                    inputMode="decimal"
                    value={row.denominador}
                    onChange={(event) => updateRow(fonte, row.indicador, "denominador", event.target.value)}
                  />
                </td>
                <td className="border px-2 py-2 align-top">
                  <Input
                    inputMode="decimal"
                    value={row.resultado}
                    onChange={(event) => updateRow(fonte, row.indicador, "resultado", event.target.value)}
                  />
                </td>
                <td className="border px-2 py-2 align-top">
                  <Textarea
                    rows={2}
                    value={row.observacoes}
                    onChange={(event) => updateRow(fonte, row.indicador, "observacoes", event.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Indicadores</h1>
          <p className="text-muted-foreground">
            Alimente os dados assistenciais e de produção para reunir notificações e resultados em um só local.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Competência</label>
            <Input type="month" value={competencia} onChange={(event) => setCompetencia(event.target.value)} />
          </div>
          <Button onClick={saveRows} disabled={saving || loading}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {message && <p className="mb-4 text-sm text-muted-foreground">{message}</p>}

      <div className="space-y-8">
        {renderTable("CONVÊNIO")}
        {renderTable("SUS")}
      </div>
    </div>
  );
}
