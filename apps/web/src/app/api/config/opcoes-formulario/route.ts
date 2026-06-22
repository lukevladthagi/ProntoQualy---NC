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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const categoria = url.searchParams.get("categoria");

  const rows = categoria
    ? await sql`
        SELECT * FROM config_opcoes_formulario
        WHERE categoria = ${categoria}
        ORDER BY nome
      `
    : await sql`
        SELECT * FROM config_opcoes_formulario
        ORDER BY categoria, nome
      `;

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const categoria = String(body.categoria ?? "").trim();
  const nome = String(body.nome ?? "").trim();
  const valor = String(body.valor ?? "").trim() || slug(nome);

  if (!categoria || !nome || !valor) {
    return NextResponse.json({ error: "Categoria, nome e valor são obrigatórios" }, { status: 400 });
  }

  await sql`
    INSERT INTO config_opcoes_formulario (categoria, nome, valor, is_ativo, created_at, updated_at)
    VALUES (${categoria}, ${nome}, ${valor}, ${body.is_ativo === false ? 0 : 1}, ${nowIso()}, ${nowIso()})
    ON CONFLICT (categoria, valor) DO UPDATE SET
      nome = EXCLUDED.nome,
      is_ativo = EXCLUDED.is_ativo,
      updated_at = EXCLUDED.updated_at
  `;

  return NextResponse.json({ success: true });
}
