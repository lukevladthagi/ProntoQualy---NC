import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

type Ctx = { params: Promise<{ id: string }> };

function asSectorList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const setoresPermitidos = asSectorList(body.setoresPermitidos);
  const setor = String(body.setor ?? setoresPermitidos[0] ?? "").trim() || null;
  const perfil = ["usuario", "gestor", "admin"].includes(String(body.perfil))
    ? String(body.perfil)
    : "usuario";

  await sql`
    UPDATE "user"
    SET
      name = COALESCE(${body.name ?? null}, name),
      setor = ${setor},
      perfil = ${perfil},
      setores_permitidos = ${JSON.stringify(setoresPermitidos)}::jsonb,
      "updatedAt" = NOW()
    WHERE id = ${id}
  `;

  return NextResponse.json({ success: true });
}
