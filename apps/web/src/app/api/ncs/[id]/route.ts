import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

type Ctx = { params: Promise<{ id: string }> };

// Get single NC with related data
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;

  const ncRows = await sql`SELECT * FROM nao_conformidades WHERE id = ${id}`;
  const nc = ncRows[0];
  if (!nc) {
    return NextResponse.json({ error: "NC não encontrada" }, { status: 404 });
  }

  const evidencias = await sql`SELECT * FROM evidencias WHERE nc_id = ${id}`;
  const analises = await sql`SELECT * FROM analises WHERE nc_id = ${id} ORDER BY data_analise DESC`;
  const planosAcao = await sql`SELECT * FROM planos_acao WHERE nc_id = ${id} ORDER BY prazo`;
  const verificacoes = await sql`SELECT * FROM verificacoes WHERE nc_id = ${id} ORDER BY data_verificacao DESC`;
  const historico = await sql`SELECT * FROM historico_status WHERE nc_id = ${id} ORDER BY created_at DESC`;

  // Get 5 porques and ishikawa for each analysis
  const analisesCompletas = await Promise.all(
    analises.map(async (analise: any) => {
      const cincoPortques = await sql`SELECT * FROM cinco_porques WHERE analise_id = ${analise.id} ORDER BY ordem`;
      const ishikawa = await sql`SELECT * FROM ishikawa_categorias WHERE analise_id = ${analise.id}`;
      return {
        ...analise,
        cincoPortques,
        ishikawa,
      };
    })
  );

  return NextResponse.json({
    ...nc,
    evidencias,
    analises: analisesCompletas,
    planosAcao,
    verificacoes,
    historico,
  });
}

// Update NC
export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const now = new Date().toISOString();

  await sql`
    UPDATE nao_conformidades SET
      data_ocorrencia = COALESCE(${body.dataOcorrencia ?? null}, data_ocorrencia),
      setor = COALESCE(${body.setor ?? null}, setor),
      unidade = COALESCE(${body.unidade ?? null}, unidade),
      tipo = COALESCE(${body.tipo ?? null}, tipo),
      gravidade = COALESCE(${body.gravidade ?? null}, gravidade),
      descricao = COALESCE(${body.descricao ?? null}, descricao),
      paciente_envolvido = ${body.pacienteEnvolvido ?? null},
      is_seguranca_paciente = COALESCE(${body.segurancaPaciente !== undefined ? (body.segurancaPaciente ? 1 : 0) : null}, is_seguranca_paciente),
      responsavel_analise = COALESCE(${body.responsavelAnalise ?? null}, responsavel_analise),
      updated_at = ${now}
    WHERE id = ${id}
  `;

  return NextResponse.json({ success: true });
}

// Delete NC and all related records
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;

  await sql`DELETE FROM historico_status WHERE nc_id = ${id}`;
  await sql`DELETE FROM verificacoes WHERE nc_id = ${id}`;
  await sql`DELETE FROM planos_acao WHERE nc_id = ${id}`;

  const analises = await sql`SELECT id FROM analises WHERE nc_id = ${id}`;
  for (const analise of analises as any[]) {
    await sql`DELETE FROM cinco_porques WHERE analise_id = ${analise.id}`;
    await sql`DELETE FROM ishikawa_categorias WHERE analise_id = ${analise.id}`;
  }
  await sql`DELETE FROM analises WHERE nc_id = ${id}`;
  await sql`DELETE FROM evidencias WHERE nc_id = ${id}`;

  await sql`DELETE FROM nao_conformidades WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
