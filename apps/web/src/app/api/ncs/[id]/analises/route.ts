import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

// Original Hono path: /api/ncs/:ncId/analises (segment normalized to [id]).
type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id: ncId } = await params;
  const body = await req.json();
  const now = new Date().toISOString();

  const result = await sql`
    INSERT INTO analises (nc_id, tipo, responsavel, data_analise, conclusao, descricao_gestor, created_at, updated_at)
    VALUES (${ncId}, ${body.tipo ?? null}, ${body.responsavel ?? null}, ${now}, ${body.conclusao ?? null}, ${body.descricaoGestor ?? null}, ${now}, ${now})
    RETURNING id
  `;

  const analiseId = result[0]?.id;

  // Insert 5 porques if provided
  if (body.tipo === "5_porques" && body.porques) {
    for (let i = 0; i < body.porques.length; i++) {
      const porque = body.porques[i];
      await sql`
        INSERT INTO cinco_porques (analise_id, ordem, pergunta, resposta, created_at, updated_at)
        VALUES (${analiseId}, ${i + 1}, ${porque.pergunta ?? null}, ${porque.resposta ?? null}, ${now}, ${now})
      `;
    }
  }

  // Insert ishikawa categories if provided
  if (body.tipo === "ishikawa" && body.categorias) {
    for (const categoria of body.categorias) {
      await sql`
        INSERT INTO ishikawa_categorias (analise_id, categoria, causa, created_at, updated_at)
        VALUES (${analiseId}, ${categoria.categoria ?? null}, ${categoria.causa ?? null}, ${now}, ${now})
      `;
    }
  }

  return NextResponse.json({ id: analiseId }, { status: 201 });
}
