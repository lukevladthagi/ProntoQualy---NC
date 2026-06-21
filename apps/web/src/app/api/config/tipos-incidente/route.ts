import { NextResponse } from "next/server";
import { tiposIncidente } from "@/app/api/_helpers/config";

export async function GET() {
  return NextResponse.json(await tiposIncidente.list());
}

export async function POST(req: Request) {
  await tiposIncidente.create(await req.json());
  return NextResponse.json({ success: true });
}
