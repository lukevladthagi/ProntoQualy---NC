import { NextResponse } from "next/server";
import { responsaveis } from "@/app/api/_helpers/config";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  await responsaveis.update(id, await req.json());
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await responsaveis.remove(id);
  return NextResponse.json({ success: true });
}
