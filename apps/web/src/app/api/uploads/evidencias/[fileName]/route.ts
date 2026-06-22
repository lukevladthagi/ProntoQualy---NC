import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ fileName: string }> };

function contentTypeFor(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const types: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".txt": "text/plain; charset=utf-8",
    ".csv": "text/csv; charset=utf-8",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  return types[extension] ?? "application/octet-stream";
}

export async function GET(_req: Request, { params }: Ctx) {
  const { fileName } = await params;
  const safeName = path.basename(fileName);
  const filePath = path.join(process.cwd(), "uploads", "evidencias", safeName);

  try {
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentTypeFor(safeName),
        "Content-Disposition": `inline; filename="${safeName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }
}
