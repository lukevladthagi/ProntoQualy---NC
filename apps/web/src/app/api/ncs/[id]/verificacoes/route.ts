import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

// Original Hono path: /api/ncs/:ncId/verificacoes (segment normalized to [id]).
type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id: ncId } = await params;
  const body = await req.json();
  const now = new Date().toISOString();

  const result = await sql`
    INSERT INTO verificacoes (nc_id, data_verificacao, responsavel, is_eficaz, observacoes, motivo_reabrir, created_at, updated_at)
    VALUES (${ncId}, ${now}, ${body.responsavel ?? null}, ${body.eficaz ? 1 : 0}, ${body.observacoes ?? null}, ${body.motivoReabrir ?? null}, ${now}, ${now})
    RETURNING id
  `;

  // If not effective, set NC as reopened; otherwise close it.
  if (!body.eficaz) {
    await sql`
      UPDATE nao_conformidades SET status = 'reaberta', is_reincidente = 1, updated_at = ${now} WHERE id = ${ncId}
    `;
    await sql`
      INSERT INTO historico_status (nc_id, status_anterior, status_novo, responsavel, observacao, created_at, updated_at)
      VALUES (${ncId}, 'aguardando_verificacao', 'reaberta', ${body.responsavel ?? null}, ${body.motivoReabrir || "Verificação de eficácia não aprovada"}, ${now}, ${now})
    `;
  } else {
    await sql`
      UPDATE nao_conformidades SET status = 'encerrada', data_encerramento = ${now}, updated_at = ${now} WHERE id = ${ncId}
    `;
    await sql`
      INSERT INTO historico_status (nc_id, status_anterior, status_novo, responsavel, observacao, created_at, updated_at)
      VALUES (${ncId}, 'aguardando_verificacao', 'encerrada', ${body.responsavel ?? null}, ${"Verificação de eficácia aprovada"}, ${now}, ${now})
    `;
  }

  return NextResponse.json({ id: result[0]?.id }, { status: 201 });
}
