import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

// Original Hono path: /api/ncs/:ncId/evidencias. The dynamic segment is named
// [id] here to match the sibling /api/ncs/[id] route (Next.js requires a single
// param name at the same path depth); it carries the NC id.
type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id: ncId } = await params;
  const body = await req.json();
  const now = new Date().toISOString();

  // body.url is the already-uploaded public asset URL (uploads go through
  // useUpload.ts on the client); this route only persists the reference.
  const result = await sql`
    INSERT INTO evidencias (nc_id, nome_arquivo, tipo_arquivo, url, tamanho, descricao, created_at, updated_at)
    VALUES (${ncId}, ${body.nomeArquivo ?? null}, ${body.tipoArquivo ?? null}, ${body.url ?? null}, ${body.tamanho ?? null}, ${body.descricao ?? null}, ${now}, ${now})
    RETURNING id
  `;

  return NextResponse.json({ id: result[0]?.id }, { status: 201 });
}
