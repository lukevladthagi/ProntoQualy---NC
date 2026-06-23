import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

// Helper to generate NC code
function generateNCCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `NC-${year}-${random}`;
}

// Helper to calculate due date based on severity
function calculateDueDate(gravidade: string): string {
  const today = new Date();
  const slaConfig: Record<string, number> = {
    critica: 3,
    alta: 7,
    media: 15,
    baixa: 30,
  };
  const days = slaConfig[gravidade] || 15;
  today.setDate(today.getDate() + days);
  return today.toISOString().split("T")[0];
}

// List all NCs with filters. Each optional filter is applied with a
// "(param IS NULL OR column = param)" guard so the whole query stays a single
// neon tagged template (no dynamic string concatenation). SQLite date(col) is
// replaced with LEFT(data_registro, 10) since data_registro is an ISO string.
export async function GET(req: Request) {
  const url = new URL(req.url);

  const status = url.searchParams.get("status");
  const setor = url.searchParams.get("setor");
  const gravidade = url.searchParams.get("gravidade");
  const tipo = url.searchParams.get("tipo");
  const responsavel = url.searchParams.get("responsavel");
  const dataInicio = url.searchParams.get("dataInicio");
  const dataFim = url.searchParams.get("dataFim");
  const search = url.searchParams.get("search");
  const searchLike = search ? `%${search}%` : null;

  const rows = await sql`
    SELECT * FROM nao_conformidades
    WHERE (${status}::text IS NULL OR status = ${status})
      AND (${setor}::text IS NULL OR setor = ${setor})
      AND (${gravidade}::text IS NULL OR gravidade = ${gravidade})
      AND (${tipo}::text IS NULL OR tipo = ${tipo})
      AND (${responsavel}::text IS NULL OR responsavel_registro = ${responsavel} OR responsavel_analise = ${responsavel})
      AND (${dataInicio}::text IS NULL OR LEFT(data_registro, 10) >= ${dataInicio})
      AND (${dataFim}::text IS NULL OR LEFT(data_registro, 10) <= ${dataFim})
      AND (${search}::text IS NULL OR codigo LIKE ${searchLike} OR descricao LIKE ${searchLike})
    ORDER BY data_registro DESC
  `;

  return NextResponse.json(rows);
}

// Create NC
export async function POST(req: Request) {
  const body = await req.json();

  const codigo = generateNCCode();
  const dataPrazo = calculateDueDate(body.gravidade);
  const now = new Date().toISOString();
  const responsavelRegistro = body.responsavelRegistro?.trim() || null;

  const result = await sql`
    INSERT INTO nao_conformidades (
      codigo, data_ocorrencia, data_registro, setor, unidade,
      responsavel_registro, tipo, gravidade, descricao,
      paciente_envolvido, is_seguranca_paciente, status, data_prazo,
      email_responsavel, medico_responsavel, localizacao_hematoma,
      paciente_data_nascimento, numero_atendimento_mv,
      flebite_tipos, flebite_fatores, campos_personalizados,
      created_at, updated_at
    ) VALUES (
      ${codigo}, ${body.dataOcorrencia ?? null}, ${now}, ${body.setor ?? null}, ${body.unidade ?? null},
      ${responsavelRegistro}, ${body.tipo ?? null}, ${body.gravidade ?? null}, ${body.descricao ?? null},
      ${body.pacienteEnvolvido ?? null}, ${body.segurancaPaciente ? 1 : 0}, ${"registrada"}, ${dataPrazo},
      ${body.emailResponsavel ?? null}, ${body.medicoResponsavel ?? null}, ${body.tipoHematoma ?? body.tipoPseudoaneurisma ?? body.localizacaoLesao ?? null},
      ${body.pacienteDataNascimento ?? null}, ${body.pacienteNumeroAtendimento ?? null},
      ${JSON.stringify(body.flebiteTipos ?? [])}::jsonb, ${JSON.stringify(body.flebiteFatores ?? {})}::jsonb,
      ${JSON.stringify(body.camposPersonalizados ?? {})}::jsonb,
      ${now}, ${now}
    )
    RETURNING id
  `;

  const ncId = result[0]?.id;

  // Create initial history entry
  await sql`
    INSERT INTO historico_status (nc_id, status_anterior, status_novo, responsavel, observacao, created_at, updated_at)
    VALUES (${ncId}, ${null}, ${"registrada"}, ${responsavelRegistro}, ${"NC registrada no sistema"}, ${now}, ${now})
  `;

  return NextResponse.json({ id: ncId, codigo }, { status: 201 });
}
