import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

type Ctx = { params: Promise<{ id: string }> };

// Update NSP analysis
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const now = new Date().toISOString();

  await sql`
    UPDATE nao_conformidades SET
      grau_dano = ${body.grauDano ?? null},
      meta_seguranca = ${body.metaSeguranca ?? null},
      evento_identificado_evolucao = ${body.eventoIdentificadoEvolucao !== undefined ? (body.eventoIdentificadoEvolucao ? 1 : 0) : null},
      necessita_analise_causa = ${body.necessitaAnaliseCausa !== undefined ? (body.necessitaAnaliseCausa ? 1 : 0) : null},
      necessita_plano_acao = ${body.necessitaPlanoAcao !== undefined ? (body.necessitaPlanoAcao ? 1 : 0) : null},
      updated_at = ${now}
    WHERE id = ${id}
  `;

  return NextResponse.json({ success: true });
}
