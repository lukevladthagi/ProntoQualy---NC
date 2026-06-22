import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function safeFileName(name: string) {
  const extension = path.extname(name).toLowerCase();
  const baseName = path
    .basename(name, extension)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${Date.now()}-${baseName || "evidencia"}${extension}`;
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Arquivo maior que 10MB" }, { status: 413 });
  }

  const fileName = safeFileName(file.name);
  const relativePath = `/uploads/evidencias/${fileName}`;
  const uploadDir = path.join(process.cwd(), "apps", "web", "public", "uploads", "evidencias");
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), bytes);

  return NextResponse.json({
    url: relativePath,
    nomeArquivo: file.name,
    tipoArquivo: file.type || "application/octet-stream",
    tamanho: file.size,
  });
}
