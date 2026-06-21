import { NextResponse } from "next/server";
import { tiposIncidente } from "@/app/api/_helpers/config";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  await tiposIncidente.update(id, await req.json());
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await tiposIncidente.remove(id);
  return NextResponse.json({ success: true });
}
