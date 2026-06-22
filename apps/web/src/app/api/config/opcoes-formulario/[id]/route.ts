import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

type Ctx = { params: Promise<{ id: string }> };

const nowIso = () => new Date().toISOString();
const asId = (id: string) => Number(id);

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const nome = body.nome === undefined ? null : String(body.nome).trim();
  const valor = body.valor === undefined ? null : String(body.valor).trim() || (nome ? slug(nome) : null);

  await sql`
    UPDATE config_opcoes_formulario SET
      nome = COALESCE(${nome}, nome),
      valor = COALESCE(${valor}, valor),
      categoria = COALESCE(${body.categoria ?? null}, categoria),
      is_ativo = COALESCE(${body.is_ativo === undefined ? null : body.is_ativo ? 1 : 0}, is_ativo),
      updated_at = ${nowIso()}
    WHERE id = ${asId(id)}
  `;

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await sql`DELETE FROM config_opcoes_formulario WHERE id = ${asId(id)}`;
  return NextResponse.json({ success: true });
}
