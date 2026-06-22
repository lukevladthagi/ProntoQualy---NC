import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

type Ctx = { params: Promise<{ id: string }> };

function prazoPorGrauDano(grauDano?: string | null) {
  const dias: Record<string, number> = {
    leve: 15,
    moderado: 7,
    grave: 3,
    obito: 3,
    incidente_sem_lesao: 20,
  };
  const prazoDias = grauDano ? dias[grauDano] : null;
  if (!prazoDias) return null;

  const prazo = new Date();
  prazo.setDate(prazo.getDate() + prazoDias);
  return prazo.toISOString().split("T")[0];
}

// Update NSP analysis
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json();
  const now = new Date().toISOString();
  const dataPrazo = prazoPorGrauDano(body.grauDano);

  await sql`
    UPDATE nao_conformidades SET
      busca_ativa = ${body.buscaAtiva !== undefined ? (body.buscaAtiva ? 1 : 0) : null},
      grau_dano = ${body.grauDano ?? null},
      meta_seguranca = ${body.metaSeguranca ?? null},
      evento_identificado_evolucao = ${body.eventoIdentificadoEvolucao !== undefined ? (body.eventoIdentificadoEvolucao ? 1 : 0) : null},
      necessita_analise_causa = ${body.necessitaAnaliseCausa !== undefined ? (body.necessitaAnaliseCausa ? 1 : 0) : null},
      necessita_plano_acao = ${body.necessitaPlanoAcao !== undefined ? (body.necessitaPlanoAcao ? 1 : 0) : null},
      numero_atendimento_mv = ${body.numeroAtendimentoMv ?? null},
      paciente_data_nascimento = ${body.pacienteDataNascimento ?? null},
      paciente_idade = ${body.pacienteIdade ?? null},
      convenio = ${body.convenio ?? null},
      tipo_fonte = ${body.tipoFonte ?? null},
      data_internacao = ${body.dataInternacao ?? null},
      medico_responsavel = ${body.medicoResponsavel ?? null},
      localizacao_hematoma = ${body.localizacaoHematoma ?? null},
      data_prazo = COALESCE(${dataPrazo}, data_prazo),
      updated_at = ${now}
    WHERE id = ${id}
  `;

  return NextResponse.json({ success: true });
}
