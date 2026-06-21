import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

// Original Hono path: /api/ncs/:ncId/planos-acao (segment normalized to [id]).
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id: ncId } = await params;
  const rows = await sql`SELECT * FROM planos_acao WHERE nc_id = ${ncId} ORDER BY prazo`;
  return NextResponse.json(rows);
}

export async function POST(req: Request, { params }: Ctx) {
  const { id: ncId } = await params;
  const body = await req.json();
  const now = new Date().toISOString();

  const result = await sql`
    INSERT INTO planos_acao (nc_id, descricao, tipo, responsavel, prazo, status, observacoes, created_at, updated_at)
    VALUES (${ncId}, ${body.descricao ?? null}, ${body.tipo ?? null}, ${body.responsavel ?? null}, ${body.prazo ?? null}, ${"pendente"}, ${body.observacoes ?? null}, ${now}, ${now})
    RETURNING id
  `;

  return NextResponse.json({ id: result[0]?.id }, { status: 201 });
}
