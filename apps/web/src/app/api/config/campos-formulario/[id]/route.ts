import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

type Ctx = { params: Promise<{ id: string }> };

const nowIso = () => new Date().toISOString();
const asId = (id: string) => Number(id);

function boolInt(value: unknown): number | null {
  if (value === undefined) return null;
  return value === true || value === 1 || value === "1" || value === "sim" || value === "true" ? 1 : 0;
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();

  await sql`
    UPDATE config_campos_formulario SET
      nome = COALESCE(${body.nome ?? null}, nome),
      chave = COALESCE(${body.chave ?? null}, chave),
      tipo = COALESCE(${body.tipo ?? null}, tipo),
      contexto = COALESCE(${body.contexto ?? null}, contexto),
      opcoes = COALESCE(${body.opcoes ?? null}, opcoes),
      is_obrigatorio = COALESCE(${boolInt(body.is_obrigatorio)}, is_obrigatorio),
      is_ativo = COALESCE(${boolInt(body.is_ativo)}, is_ativo),
      ordem = COALESCE(${body.ordem !== undefined ? Number(body.ordem) : null}, ordem),
      updated_at = ${nowIso()}
    WHERE id = ${asId(id)}
  `;

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await sql`DELETE FROM config_campos_formulario WHERE id = ${asId(id)}`;
  return NextResponse.json({ success: true });
}
