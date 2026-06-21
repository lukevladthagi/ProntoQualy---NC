import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const now = new Date().toISOString();

  await sql`UPDATE analises SET conclusao = ${body.conclusao ?? null}, updated_at = ${now} WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
