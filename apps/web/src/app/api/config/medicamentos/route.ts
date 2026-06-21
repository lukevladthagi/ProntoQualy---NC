import { NextResponse } from "next/server";
import { medicamentos } from "@/app/api/_helpers/config";

export async function GET() {
  return NextResponse.json(await medicamentos.list());
}

export async function POST(req: Request) {
  await medicamentos.create(await req.json());
  return NextResponse.json({ success: true });
}
