import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const now = new Date().toISOString();

  await sql`
    UPDATE planos_acao SET
      descricao = COALESCE(${body.descricao ?? null}, descricao),
      tipo = COALESCE(${body.tipo ?? null}, tipo),
      responsavel = COALESCE(${body.responsavel ?? null}, responsavel),
      prazo = COALESCE(${body.prazo ?? null}, prazo),
      status = COALESCE(${body.status ?? null}, status),
      data_conclusao = ${body.status === "concluida" ? now : null},
      observacoes = ${body.observacoes ?? null},
      updated_at = ${now}
    WHERE id = ${id}
  `;

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await sql`DELETE FROM planos_acao WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
