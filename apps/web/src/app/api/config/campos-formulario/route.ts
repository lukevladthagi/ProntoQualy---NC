import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

const nowIso = () => new Date().toISOString();

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function boolInt(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "sim" || value === "true" ? 1 : 0;
}

export async function GET() {
  const rows = await sql`
    SELECT * FROM config_campos_formulario
    ORDER BY ordem, nome
  `;

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const nome = String(body.nome ?? "").trim();
  const chave = String(body.chave ?? "").trim() || slug(nome);
  const tipo = String(body.tipo ?? "texto").trim();
  const contexto = String(body.contexto ?? "ambos").trim();

  if (!nome || !chave) {
    return NextResponse.json({ error: "Nome e chave são obrigatórios" }, { status: 400 });
  }

  await sql`
    INSERT INTO config_campos_formulario (
      nome, chave, tipo, contexto, opcoes, is_obrigatorio, is_ativo, ordem, created_at, updated_at
    ) VALUES (
      ${nome},
      ${chave},
      ${tipo},
      ${contexto},
      ${body.opcoes ?? null},
      ${boolInt(body.is_obrigatorio)},
      ${body.is_ativo === false ? 0 : 1},
      ${Number(body.ordem ?? 0)},
      ${nowIso()},
      ${nowIso()}
    )
    ON CONFLICT (chave) DO UPDATE SET
      nome = EXCLUDED.nome,
      tipo = EXCLUDED.tipo,
      contexto = EXCLUDED.contexto,
      opcoes = EXCLUDED.opcoes,
      is_obrigatorio = EXCLUDED.is_obrigatorio,
      is_ativo = EXCLUDED.is_ativo,
      ordem = EXCLUDED.ordem,
      updated_at = EXCLUDED.updated_at
  `;

  return NextResponse.json({ success: true });
}
