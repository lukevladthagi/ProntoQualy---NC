import { NextResponse } from "next/server";
import { setores } from "@/app/api/_helpers/config";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  await setores.update(id, await req.json());
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await setores.remove(id);
  return NextResponse.json({ success: true });
}
