import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const competencia = url.searchParams.get("competencia") || new Date().toISOString().slice(0, 7);

  const rows = await sql`
    SELECT *
    FROM indicadores_assistenciais
    WHERE competencia = ${competencia}
    ORDER BY fonte, indicador
  `;

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const now = new Date().toISOString();

  for (const row of rows) {
    await sql`
      INSERT INTO indicadores_assistenciais (
        competencia, fonte, indicador, numerador, denominador, resultado, observacoes, created_at, updated_at
      ) VALUES (
        ${row.competencia}, ${row.fonte}, ${row.indicador}, ${row.numerador ?? null},
        ${row.denominador ?? null}, ${row.resultado ?? null}, ${row.observacoes ?? null}, ${now}, ${now}
      )
      ON CONFLICT (competencia, fonte, indicador)
      DO UPDATE SET
        numerador = EXCLUDED.numerador,
        denominador = EXCLUDED.denominador,
        resultado = EXCLUDED.resultado,
        observacoes = EXCLUDED.observacoes,
        updated_at = EXCLUDED.updated_at
    `;
  }

  return NextResponse.json({ success: true });
}
