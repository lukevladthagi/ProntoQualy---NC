import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

type Ctx = { params: Promise<{ id: string }> };

// Update NC status with workflow validation
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const now = new Date().toISOString();

  // Get current status
  const ncRows = await sql`SELECT status FROM nao_conformidades WHERE id = ${id}`;
  const nc = ncRows[0];
  if (!nc) {
    return NextResponse.json({ error: "NC não encontrada" }, { status: 404 });
  }

  const statusAnterior = nc.status as string;
  const statusNovo = body.status;

  // Validate workflow transitions
  const validTransitions: Record<string, string[]> = {
    registrada: ["em_analise"],
    em_analise: ["plano_definido", "registrada"],
    plano_definido: ["em_execucao", "em_analise"],
    em_execucao: ["aguardando_verificacao", "plano_definido"],
    aguardando_verificacao: ["encerrada", "reaberta"],
    reaberta: ["em_analise"],
    encerrada: ["reaberta"],
  };

  if (!validTransitions[statusAnterior]?.includes(statusNovo)) {
    return NextResponse.json(
      { error: `Transição de ${statusAnterior} para ${statusNovo} não permitida` },
      { status: 400 }
    );
  }

  // Update status (set data_encerramento only when transitioning to encerrada)
  await sql`
    UPDATE nao_conformidades SET
      status = ${statusNovo},
      updated_at = ${now},
      data_encerramento = CASE WHEN ${statusNovo} = 'encerrada' THEN ${now} ELSE data_encerramento END
    WHERE id = ${id}
  `;

  // Record history
  await sql`
    INSERT INTO historico_status (nc_id, status_anterior, status_novo, responsavel, observacao, created_at, updated_at)
    VALUES (${id}, ${statusAnterior}, ${statusNovo}, ${body.responsavel ?? null}, ${body.observacao ?? null}, ${now}, ${now})
  `;

  return NextResponse.json({ success: true });
}
