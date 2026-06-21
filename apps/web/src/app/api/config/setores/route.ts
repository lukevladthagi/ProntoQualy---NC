import { NextResponse } from "next/server";
import { setores } from "@/app/api/_helpers/config";

export async function GET() {
  return NextResponse.json(await setores.list());
}

export async function POST(req: Request) {
  await setores.create(await req.json());
  return NextResponse.json({ success: true });
}
