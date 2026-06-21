import { NextResponse } from "next/server";
import { medicos } from "@/app/api/_helpers/config";

export async function GET() {
  return NextResponse.json(await medicos.list());
}

export async function POST(req: Request) {
  await medicos.create(await req.json());
  return NextResponse.json({ success: true });
}
