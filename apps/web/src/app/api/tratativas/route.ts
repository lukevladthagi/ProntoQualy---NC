import { NextResponse } from "next/server";
import sql from "@/app/api/utils/sql";

function itemMatchesSearch(search: string | null) {
  return search ? `%${search}%` : null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search");
  const setor = url.searchParams.get("setor");
  const tipo = url.searchParams.get("tipo");
  const status = url.searchParams.get("status");
  const searchLike = itemMatchesSearch(search);

  const evidencias = tipo && tipo !== "evidencia" ? [] : await sql`
    SELECT
      'evidencia' AS tipo_item,
      ev.id,
      ev.nc_id,
      ev.created_at AS data_item,
      ev.nome_arquivo AS titulo,
      ev.descricao AS resumo,
      ev.url,
      ev.tamanho,
      nc.codigo,
      nc.status AS nc_status,
      nc.setor,
      nc.gravidade,
      nc.descricao AS nc_descricao
    FROM evidencias ev
    JOIN nao_conformidades nc ON nc.id = ev.nc_id
    WHERE (${setor}::text IS NULL OR nc.setor = ${setor})
      AND (${status}::text IS NULL OR nc.status = ${status})
      AND (${search}::text IS NULL OR nc.codigo ILIKE ${searchLike} OR nc.descricao ILIKE ${searchLike})
    ORDER BY ev.created_at DESC
  `;

  const analises = tipo && tipo !== "analise" ? [] : await sql`
    SELECT
      'analise' AS tipo_item,
      an.id,
      an.nc_id,
      an.data_analise AS data_item,
      CASE
        WHEN an.tipo = '5_porques' THEN 'Análise 5 Porquês'
        WHEN an.tipo = 'ishikawa' THEN 'Análise Ishikawa'
        ELSE 'Análise de causa'
      END AS titulo,
      an.conclusao AS resumo,
      an.responsavel,
      nc.codigo,
      nc.status AS nc_status,
      nc.setor,
      nc.gravidade,
      nc.descricao AS nc_descricao
    FROM analises an
    JOIN nao_conformidades nc ON nc.id = an.nc_id
    WHERE (${setor}::text IS NULL OR nc.setor = ${setor})
      AND (${status}::text IS NULL OR nc.status = ${status})
      AND (${search}::text IS NULL OR nc.codigo ILIKE ${searchLike} OR nc.descricao ILIKE ${searchLike})
    ORDER BY an.data_analise DESC
  `;

  const acoes = tipo && tipo !== "acao" ? [] : await sql`
    SELECT
      'acao' AS tipo_item,
      pa.id,
      pa.nc_id,
      COALESCE(pa.updated_at, pa.created_at) AS data_item,
      pa.descricao AS titulo,
      pa.observacoes AS resumo,
      pa.responsavel,
      pa.prazo,
      pa.status AS status_item,
      pa.data_conclusao,
      nc.codigo,
      nc.status AS nc_status,
      nc.setor,
      nc.gravidade,
      nc.descricao AS nc_descricao
    FROM planos_acao pa
    JOIN nao_conformidades nc ON nc.id = pa.nc_id
    WHERE (${setor}::text IS NULL OR nc.setor = ${setor})
      AND (${status}::text IS NULL OR nc.status = ${status})
      AND (${search}::text IS NULL OR nc.codigo ILIKE ${searchLike} OR nc.descricao ILIKE ${searchLike})
    ORDER BY pa.prazo ASC NULLS LAST, pa.updated_at DESC
  `;

  const verificacoes = tipo && tipo !== "verificacao" ? [] : await sql`
    SELECT
      'verificacao' AS tipo_item,
      ve.id,
      ve.nc_id,
      ve.data_verificacao AS data_item,
      CASE WHEN ve.is_eficaz = 1 THEN 'Verificação eficaz' ELSE 'Verificação não eficaz' END AS titulo,
      COALESCE(ve.observacoes, ve.motivo_reabrir) AS resumo,
      ve.responsavel,
      ve.is_eficaz,
      nc.codigo,
      nc.status AS nc_status,
      nc.setor,
      nc.gravidade,
      nc.descricao AS nc_descricao
    FROM verificacoes ve
    JOIN nao_conformidades nc ON nc.id = ve.nc_id
    WHERE (${setor}::text IS NULL OR nc.setor = ${setor})
      AND (${status}::text IS NULL OR nc.status = ${status})
      AND (${search}::text IS NULL OR nc.codigo ILIKE ${searchLike} OR nc.descricao ILIKE ${searchLike})
    ORDER BY ve.data_verificacao DESC
  `;

  const pendencias = await sql`
    SELECT
      nc.id AS nc_id,
      nc.codigo,
      nc.status AS nc_status,
      nc.setor,
      nc.gravidade,
      nc.descricao AS nc_descricao,
      nc.data_prazo,
      COUNT(DISTINCT ev.id) AS total_evidencias,
      COUNT(DISTINCT an.id) AS total_analises,
      COUNT(DISTINCT pa.id) AS total_acoes,
      COUNT(DISTINCT ve.id) AS total_verificacoes,
      COUNT(DISTINCT CASE WHEN pa.status <> 'concluida' THEN pa.id END) AS acoes_abertas,
      MIN(CASE WHEN pa.status <> 'concluida' THEN pa.prazo END) AS proximo_prazo
    FROM nao_conformidades nc
    LEFT JOIN evidencias ev ON ev.nc_id = nc.id
    LEFT JOIN analises an ON an.nc_id = nc.id
    LEFT JOIN planos_acao pa ON pa.nc_id = nc.id
    LEFT JOIN verificacoes ve ON ve.nc_id = nc.id
    WHERE (${setor}::text IS NULL OR nc.setor = ${setor})
      AND (${status}::text IS NULL OR nc.status = ${status})
      AND (${search}::text IS NULL OR nc.codigo ILIKE ${searchLike} OR nc.descricao ILIKE ${searchLike})
      AND nc.status <> 'encerrada'
    GROUP BY nc.id
    ORDER BY nc.data_registro DESC
  `;

  return NextResponse.json({
    evidencias,
    analises,
    acoes,
    verificacoes,
    pendencias,
  });
}
