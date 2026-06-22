import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

export async function GET() {
  const users = await sql`
    SELECT
      id,
      name,
      email,
      setor,
      perfil,
      setores_permitidos AS "setoresPermitidos",
      "createdAt"
    FROM "user"
    ORDER BY name NULLS LAST, email
  `;

  return NextResponse.json(users);
}
