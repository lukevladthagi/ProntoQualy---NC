import { NextResponse } from "next/server";
import { gravidades } from "@/app/api/_helpers/config";

export async function GET() {
  return NextResponse.json(await gravidades.list());
}

export async function POST(req: Request) {
  await gravidades.create(await req.json());
  return NextResponse.json({ success: true });
}
