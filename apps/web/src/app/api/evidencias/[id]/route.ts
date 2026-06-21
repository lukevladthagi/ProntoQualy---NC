import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

type Ctx = { params: Promise<{ id: string }> };

// Remove the DB reference only; object storage cleanup is handled by the platform.
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await sql`DELETE FROM evidencias WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
