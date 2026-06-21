import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

// Dashboard indicators. SQLite-only constructs from the original worker were
// converted to Postgres equivalents:
//   julianday(a) - julianday(b)  -> EXTRACT(EPOCH FROM (a::timestamptz - b::timestamptz)) / 86400
//   strftime('%Y-%m', col)       -> LEFT(col, 7)            (col is an ISO string)
//   date('now', '-6 months')     -> now() - interval '6 months'
//   date(col) / date('now')      -> col::date / CURRENT_DATE
// Aggregate counts come back from neon as strings, so they are wrapped in Number().
export async function GET() {
  const statusCounts = await sql`
    SELECT status, COUNT(*) as count FROM nao_conformidades GROUP BY status
  `;

  const abertasRows = await sql`
    SELECT COUNT(*) as count FROM nao_conformidades WHERE status != 'encerrada'
  `;
  const abertas = abertasRows[0];

  const mesAtual = new Date().toISOString().slice(0, 7);
  const encerradasMesRows = await sql`
    SELECT COUNT(*) as count FROM nao_conformidades
    WHERE status = 'encerrada' AND data_encerramento LIKE ${mesAtual + "%"}
  `;
  const encerradasMes = encerradasMesRows[0];

  const tempoMedioRows = await sql`
    SELECT AVG(EXTRACT(EPOCH FROM (data_encerramento::timestamptz - data_registro::timestamptz)) / 86400) as media
    FROM nao_conformidades
    WHERE status = 'encerrada' AND data_encerramento IS NOT NULL
  `;
  const tempoMedio = tempoMedioRows[0];

  const porSetor = await sql`
    SELECT setor, COUNT(*) as count FROM nao_conformidades GROUP BY setor ORDER BY count DESC
  `;

  const porGravidade = await sql`
    SELECT gravidade, COUNT(*) as count FROM nao_conformidades GROUP BY gravidade
  `;

  const porTipo = await sql`
    SELECT tipo, COUNT(*) as count FROM nao_conformidades GROUP BY tipo ORDER BY count DESC
  `;

  const tendenciaMensal = await sql`
    SELECT LEFT(data_registro, 7) as mes, COUNT(*) as count
    FROM nao_conformidades
    WHERE data_registro::timestamptz >= (now() - interval '6 months')
    GROUP BY mes
    ORDER BY mes
  `;

  const reincidenciaRows = await sql`
    SELECT
      SUM(CASE WHEN is_reincidente = 1 THEN 1 ELSE 0 END) as reincidentes,
      COUNT(*) as total
    FROM nao_conformidades
  `;
  const reincidencia = reincidenciaRows[0];

  const slaStatusRows = await sql`
    SELECT
      SUM(CASE WHEN status != 'encerrada' AND data_prazo::date < CURRENT_DATE THEN 1 ELSE 0 END) as atrasadas,
      SUM(CASE WHEN status != 'encerrada' AND data_prazo::date >= CURRENT_DATE THEN 1 ELSE 0 END) as no_prazo,
      SUM(CASE WHEN status = 'encerrada' THEN 1 ELSE 0 END) as encerradas
    FROM nao_conformidades
  `;
  const slaStatus = slaStatusRows[0];

  const recentes = await sql`
    SELECT id, codigo, descricao, setor, gravidade, status, data_registro
    FROM nao_conformidades
    ORDER BY data_registro DESC
    LIMIT 10
  `;

  const totalReincidentes = Number(reincidencia?.reincidentes) || 0;
  const totalNcs = Number(reincidencia?.total) || 0;

  return NextResponse.json({
    total: Number(abertas?.count) || 0,
    encerradasMes: Number(encerradasMes?.count) || 0,
    tempoMedioResolucao: Math.round(Number(tempoMedio?.media) || 0),
    statusCounts,
    porSetor,
    porGravidade,
    porTipo,
    tendenciaMensal,
    reincidencia: {
      taxa: totalNcs > 0 ? Math.round((totalReincidentes / totalNcs) * 100) : 0,
      total: totalReincidentes,
    },
    sla: {
      atrasadas: Number(slaStatus?.atrasadas) || 0,
      noPrazo: Number(slaStatus?.no_prazo) || 0,
      encerradas: Number(slaStatus?.encerradas) || 0,
    },
    recentes,
  });
}
