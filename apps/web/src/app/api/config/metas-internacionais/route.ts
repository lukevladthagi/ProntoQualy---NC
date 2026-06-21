import { NextResponse } from "next/server";
import { metasInternacionais } from "@/app/api/_helpers/config";

export async function GET() {
  return NextResponse.json(await metasInternacionais.list());
}

export async function POST(req: Request) {
  await metasInternacionais.create(await req.json());
  return NextResponse.json({ success: true });
}
