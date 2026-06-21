import { NextResponse } from "next/server";
import { gravidades } from "@/app/api/_helpers/config";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  await gravidades.update(id, await req.json());
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  await gravidades.remove(id);
  return NextResponse.json({ success: true });
}
