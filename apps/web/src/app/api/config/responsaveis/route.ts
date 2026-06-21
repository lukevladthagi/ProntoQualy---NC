import { NextResponse } from "next/server";
import { responsaveis } from "@/app/api/_helpers/config";

export async function GET() {
  return NextResponse.json(await responsaveis.list());
}

export async function POST(req: Request) {
  await responsaveis.create(await req.json());
  return NextResponse.json({ success: true });
}
