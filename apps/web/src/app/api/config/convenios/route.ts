import { NextResponse } from "next/server";
import { convenios } from "@/app/api/_helpers/config";

export async function GET() {
  return NextResponse.json(await convenios.list());
}

export async function POST(req: Request) {
  await convenios.create(await req.json());
  return NextResponse.json({ success: true });
}
