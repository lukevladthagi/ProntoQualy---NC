// @ts-nocheck
import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

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

// ===============================
// NC Endpoints
// ===============================

// List all NCs with filters
app.get("/api/ncs", async (c) => {
  const db = c.env.DB;
  const url = new URL(c.req.url);
  
  const status = url.searchParams.get("status");
  const setor = url.searchParams.get("setor");
  const gravidade = url.searchParams.get("gravidade");
  const tipo = url.searchParams.get("tipo");
  const responsavel = url.searchParams.get("responsavel");
  const dataInicio = url.searchParams.get("dataInicio");
  const dataFim = url.searchParams.get("dataFim");
  const search = url.searchParams.get("search");

  let query = "SELECT * FROM nao_conformidades WHERE 1=1";
  const params: string[] = [];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (setor) {
    query += " AND setor = ?";
    params.push(setor);
  }
  if (gravidade) {
    query += " AND gravidade = ?";
    params.push(gravidade);
  }
  if (tipo) {
    query += " AND tipo = ?";
    params.push(tipo);
  }
  if (responsavel) {
    query += " AND (responsavel_registro = ? OR responsavel_analise = ?)";
    params.push(responsavel, responsavel);
  }
  if (dataInicio) {
    query += " AND date(data_registro) >= ?";
    params.push(dataInicio);
  }
  if (dataFim) {
    query += " AND date(data_registro) <= ?";
    params.push(dataFim);
  }
  if (search) {
    query += " AND (codigo LIKE ? OR descricao LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY data_registro DESC";

  const result = await db.prepare(query).bind(...params).all();
  return c.json(result.results);
});

// Get single NC with related data
app.get("/api/ncs/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");

  const nc = await db.prepare("SELECT * FROM nao_conformidades WHERE id = ?").bind(id).first();
  if (!nc) {
    return c.json({ error: "NC não encontrada" }, 404);
  }

  const evidencias = await db.prepare("SELECT * FROM evidencias WHERE nc_id = ?").bind(id).all();
  const analises = await db.prepare("SELECT * FROM analises WHERE nc_id = ? ORDER BY data_analise DESC").bind(id).all();
  const planosAcao = await db.prepare("SELECT * FROM planos_acao WHERE nc_id = ? ORDER BY prazo").bind(id).all();
  const verificacoes = await db.prepare("SELECT * FROM verificacoes WHERE nc_id = ? ORDER BY data_verificacao DESC").bind(id).all();
  const historico = await db.prepare("SELECT * FROM historico_status WHERE nc_id = ? ORDER BY created_at DESC").bind(id).all();

  // Get 5 porques and ishikawa for each analysis
  const analisesCompletas = await Promise.all(
    analises.results.map(async (analise: any) => {
      const cincoPortques = await db.prepare("SELECT * FROM cinco_porques WHERE analise_id = ? ORDER BY ordem").bind(analise.id).all();
      const ishikawa = await db.prepare("SELECT * FROM ishikawa_categorias WHERE analise_id = ?").bind(analise.id).all();
      return {
        ...analise,
        cincoPortques: cincoPortques.results,
        ishikawa: ishikawa.results,
      };
    })
  );

  return c.json({
    ...nc,
    evidencias: evidencias.results,
    analises: analisesCompletas,
    planosAcao: planosAcao.results,
    verificacoes: verificacoes.results,
    historico: historico.results,
  });
});

// Create NC
app.post("/api/ncs", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  const codigo = generateNCCode();
  const dataPrazo = calculateDueDate(body.gravidade);
  const now = new Date().toISOString();

  const result = await db.prepare(`
    INSERT INTO nao_conformidades (
      codigo, data_ocorrencia, data_registro, setor, unidade,
      responsavel_registro, tipo, gravidade, descricao,
      paciente_envolvido, is_seguranca_paciente, status, data_prazo,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    codigo,
    body.dataOcorrencia,
    now,
    body.setor,
    body.unidade,
    body.responsavelRegistro,
    body.tipo,
    body.gravidade,
    body.descricao,
    body.pacienteEnvolvido || null,
    body.segurancaPaciente ? 1 : 0,
    "registrada",
    dataPrazo,
    now,
    now
  ).run();

  const ncId = result.meta.last_row_id;

  // Create initial history entry
  await db.prepare(`
    INSERT INTO historico_status (nc_id, status_anterior, status_novo, responsavel, observacao, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    ncId,
    null,
    "registrada",
    body.responsavelRegistro,
    "NC registrada no sistema",
    now,
    now
  ).run();

  return c.json({ id: ncId, codigo }, 201);
});

// Update NC
app.put("/api/ncs/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = new Date().toISOString();

  await db.prepare(`
    UPDATE nao_conformidades SET
      data_ocorrencia = COALESCE(?, data_ocorrencia),
      setor = COALESCE(?, setor),
      unidade = COALESCE(?, unidade),
      tipo = COALESCE(?, tipo),
      gravidade = COALESCE(?, gravidade),
      descricao = COALESCE(?, descricao),
      paciente_envolvido = ?,
      is_seguranca_paciente = COALESCE(?, is_seguranca_paciente),
      responsavel_analise = COALESCE(?, responsavel_analise),
      updated_at = ?
    WHERE id = ?
  `).bind(
    body.dataOcorrencia || null,
    body.setor || null,
    body.unidade || null,
    body.tipo || null,
    body.gravidade || null,
    body.descricao || null,
    body.pacienteEnvolvido,
    body.segurancaPaciente !== undefined ? (body.segurancaPaciente ? 1 : 0) : null,
    body.responsavelAnalise || null,
    now,
    id
  ).run();

  return c.json({ success: true });
});

// Update NSP analysis
app.patch("/api/ncs/:id/nsp-analysis", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = new Date().toISOString();

  await db.prepare(`
    UPDATE nao_conformidades SET
      grau_dano = ?,
      meta_seguranca = ?,
      evento_identificado_evolucao = ?,
      necessita_analise_causa = ?,
      necessita_plano_acao = ?,
      updated_at = ?
    WHERE id = ?
  `).bind(
    body.grauDano || null,
    body.metaSeguranca || null,
    body.eventoIdentificadoEvolucao !== undefined ? (body.eventoIdentificadoEvolucao ? 1 : 0) : null,
    body.necessitaAnaliseCausa !== undefined ? (body.necessitaAnaliseCausa ? 1 : 0) : null,
    body.necessitaPlanoAcao !== undefined ? (body.necessitaPlanoAcao ? 1 : 0) : null,
    now,
    id
  ).run();

  return c.json({ success: true });
});

// Update NC status with workflow
app.patch("/api/ncs/:id/status", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = new Date().toISOString();

  // Get current status
  const nc = await db.prepare("SELECT status FROM nao_conformidades WHERE id = ?").bind(id).first();
  if (!nc) {
    return c.json({ error: "NC não encontrada" }, 404);
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
    return c.json({ 
      error: `Transição de ${statusAnterior} para ${statusNovo} não permitida` 
    }, 400);
  }

  // Update status
  const updateFields: string[] = ["status = ?", "updated_at = ?"];
  const updateValues: any[] = [statusNovo, now];

  if (statusNovo === "encerrada") {
    updateFields.push("data_encerramento = ?");
    updateValues.push(now);
  }

  await db.prepare(`
    UPDATE nao_conformidades SET ${updateFields.join(", ")} WHERE id = ?
  `).bind(...updateValues, id).run();

  // Record history
  await db.prepare(`
    INSERT INTO historico_status (nc_id, status_anterior, status_novo, responsavel, observacao, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    statusAnterior,
    statusNovo,
    body.responsavel,
    body.observacao || null,
    now,
    now
  ).run();

  return c.json({ success: true });
});

// Delete NC
app.delete("/api/ncs/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");

  // Delete related records first
  await db.prepare("DELETE FROM historico_status WHERE nc_id = ?").bind(id).run();
  await db.prepare("DELETE FROM verificacoes WHERE nc_id = ?").bind(id).run();
  await db.prepare("DELETE FROM planos_acao WHERE nc_id = ?").bind(id).run();
  
  // Delete analysis related records
  const analises = await db.prepare("SELECT id FROM analises WHERE nc_id = ?").bind(id).all();
  for (const analise of analises.results as any[]) {
    await db.prepare("DELETE FROM cinco_porques WHERE analise_id = ?").bind(analise.id).run();
    await db.prepare("DELETE FROM ishikawa_categorias WHERE analise_id = ?").bind(analise.id).run();
  }
  await db.prepare("DELETE FROM analises WHERE nc_id = ?").bind(id).run();
  await db.prepare("DELETE FROM evidencias WHERE nc_id = ?").bind(id).run();

  // Delete NC
  await db.prepare("DELETE FROM nao_conformidades WHERE id = ?").bind(id).run();

  return c.json({ success: true });
});

// ===============================
// Evidências Endpoints
// ===============================

app.post("/api/ncs/:ncId/evidencias", async (c) => {
  const db = c.env.DB;
  const ncId = c.req.param("ncId");
  const body = await c.req.json();
  const now = new Date().toISOString();

  const result = await db.prepare(`
    INSERT INTO evidencias (nc_id, nome_arquivo, tipo_arquivo, url, tamanho, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    ncId,
    body.nomeArquivo,
    body.tipoArquivo,
    body.url,
    body.tamanho || null,
    now,
    now
  ).run();

  return c.json({ id: result.meta.last_row_id }, 201);
});

app.delete("/api/evidencias/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  await db.prepare("DELETE FROM evidencias WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// ===============================
// Análise Endpoints
// ===============================

app.post("/api/ncs/:ncId/analises", async (c) => {
  const db = c.env.DB;
  const ncId = c.req.param("ncId");
  const body = await c.req.json();
  const now = new Date().toISOString();

  const result = await db.prepare(`
    INSERT INTO analises (nc_id, tipo, responsavel, data_analise, conclusao, descricao_gestor, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    ncId,
    body.tipo,
    body.responsavel,
    now,
    body.conclusao || null,
    body.descricaoGestor || null,
    now,
    now
  ).run();

  const analiseId = result.meta.last_row_id;

  // Insert 5 porques if provided
  if (body.tipo === "5_porques" && body.porques) {
    for (let i = 0; i < body.porques.length; i++) {
      const porque = body.porques[i];
      await db.prepare(`
        INSERT INTO cinco_porques (analise_id, ordem, pergunta, resposta, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        analiseId,
        i + 1,
        porque.pergunta,
        porque.resposta || null,
        now,
        now
      ).run();
    }
  }

  // Insert ishikawa categories if provided
  if (body.tipo === "ishikawa" && body.categorias) {
    for (const categoria of body.categorias) {
      await db.prepare(`
        INSERT INTO ishikawa_categorias (analise_id, categoria, causa, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        analiseId,
        categoria.categoria,
        categoria.causa,
        now,
        now
      ).run();
    }
  }

  return c.json({ id: analiseId }, 201);
});

app.put("/api/analises/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = new Date().toISOString();

  await db.prepare(`
    UPDATE analises SET conclusao = ?, updated_at = ? WHERE id = ?
  `).bind(body.conclusao, now, id).run();

  return c.json({ success: true });
});

// ===============================
// Planos de Ação (CAPA) Endpoints
// ===============================

app.get("/api/ncs/:ncId/planos-acao", async (c) => {
  const db = c.env.DB;
  const ncId = c.req.param("ncId");
  const result = await db.prepare("SELECT * FROM planos_acao WHERE nc_id = ? ORDER BY prazo").bind(ncId).all();
  return c.json(result.results);
});

app.post("/api/ncs/:ncId/planos-acao", async (c) => {
  const db = c.env.DB;
  const ncId = c.req.param("ncId");
  const body = await c.req.json();
  const now = new Date().toISOString();

  const result = await db.prepare(`
    INSERT INTO planos_acao (nc_id, descricao, tipo, responsavel, prazo, status, observacoes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    ncId,
    body.descricao,
    body.tipo,
    body.responsavel,
    body.prazo,
    "pendente",
    body.observacoes || null,
    now,
    now
  ).run();

  return c.json({ id: result.meta.last_row_id }, 201);
});

app.put("/api/planos-acao/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  const now = new Date().toISOString();

  await db.prepare(`
    UPDATE planos_acao SET
      descricao = COALESCE(?, descricao),
      tipo = COALESCE(?, tipo),
      responsavel = COALESCE(?, responsavel),
      prazo = COALESCE(?, prazo),
      status = COALESCE(?, status),
      data_conclusao = ?,
      observacoes = ?,
      updated_at = ?
    WHERE id = ?
  `).bind(
    body.descricao || null,
    body.tipo || null,
    body.responsavel || null,
    body.prazo || null,
    body.status || null,
    body.status === "concluida" ? now : null,
    body.observacoes,
    now,
    id
  ).run();

  return c.json({ success: true });
});

app.delete("/api/planos-acao/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  await db.prepare("DELETE FROM planos_acao WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// ===============================
// Verificação de Eficácia Endpoints
// ===============================

app.post("/api/ncs/:ncId/verificacoes", async (c) => {
  const db = c.env.DB;
  const ncId = c.req.param("ncId");
  const body = await c.req.json();
  const now = new Date().toISOString();

  const result = await db.prepare(`
    INSERT INTO verificacoes (nc_id, data_verificacao, responsavel, is_eficaz, observacoes, motivo_reabrir, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    ncId,
    now,
    body.responsavel,
    body.eficaz ? 1 : 0,
    body.observacoes || null,
    body.motivoReabrir || null,
    now,
    now
  ).run();

  // If not effective, set NC as reopened
  if (!body.eficaz) {
    await db.prepare(`
      UPDATE nao_conformidades SET status = 'reaberta', is_reincidente = 1, updated_at = ? WHERE id = ?
    `).bind(now, ncId).run();

    await db.prepare(`
      INSERT INTO historico_status (nc_id, status_anterior, status_novo, responsavel, observacao, created_at, updated_at)
      VALUES (?, 'aguardando_verificacao', 'reaberta', ?, ?, ?, ?)
    `).bind(
      ncId,
      body.responsavel,
      body.motivoReabrir || "Verificação de eficácia não aprovada",
      now,
      now
    ).run();
  } else {
    await db.prepare(`
      UPDATE nao_conformidades SET status = 'encerrada', data_encerramento = ?, updated_at = ? WHERE id = ?
    `).bind(now, now, ncId).run();

    await db.prepare(`
      INSERT INTO historico_status (nc_id, status_anterior, status_novo, responsavel, observacao, created_at, updated_at)
      VALUES (?, 'aguardando_verificacao', 'encerrada', ?, ?, ?, ?)
    `).bind(
      ncId,
      body.responsavel,
      "Verificação de eficácia aprovada",
      now,
      now
    ).run();
  }

  return c.json({ id: result.meta.last_row_id }, 201);
});

// ===============================
// Dashboard/Indicadores Endpoints
// ===============================

app.get("/api/dashboard/indicadores", async (c) => {
  const db = c.env.DB;

  // Total counts by status
  const statusCounts = await db.prepare(`
    SELECT status, COUNT(*) as count FROM nao_conformidades GROUP BY status
  `).all();

  // Total open (not encerrada)
  const abertas = await db.prepare(`
    SELECT COUNT(*) as count FROM nao_conformidades WHERE status != 'encerrada'
  `).first();

  // Total closed this month
  const mesAtual = new Date().toISOString().slice(0, 7);
  const encerradasMes = await db.prepare(`
    SELECT COUNT(*) as count FROM nao_conformidades 
    WHERE status = 'encerrada' AND data_encerramento LIKE ?
  `).bind(`${mesAtual}%`).first();

  // Average resolution time (days)
  const tempoMedio = await db.prepare(`
    SELECT AVG(julianday(data_encerramento) - julianday(data_registro)) as media
    FROM nao_conformidades 
    WHERE status = 'encerrada' AND data_encerramento IS NOT NULL
  `).first();

  // By sector
  const porSetor = await db.prepare(`
    SELECT setor, COUNT(*) as count FROM nao_conformidades GROUP BY setor ORDER BY count DESC
  `).all();

  // By severity
  const porGravidade = await db.prepare(`
    SELECT gravidade, COUNT(*) as count FROM nao_conformidades GROUP BY gravidade
  `).all();

  // By type
  const porTipo = await db.prepare(`
    SELECT tipo, COUNT(*) as count FROM nao_conformidades GROUP BY tipo ORDER BY count DESC
  `).all();

  // Monthly trend (last 6 months)
  const tendenciaMensal = await db.prepare(`
    SELECT strftime('%Y-%m', data_registro) as mes, COUNT(*) as count
    FROM nao_conformidades
    WHERE data_registro >= date('now', '-6 months')
    GROUP BY mes
    ORDER BY mes
  `).all();

  // Recurrence rate
  const reincidencia = await db.prepare(`
    SELECT 
      SUM(CASE WHEN is_reincidente = 1 THEN 1 ELSE 0 END) as reincidentes,
      COUNT(*) as total
    FROM nao_conformidades
  `).first();

  // SLA compliance
  const slaStatus = await db.prepare(`
    SELECT 
      SUM(CASE WHEN status != 'encerrada' AND date(data_prazo) < date('now') THEN 1 ELSE 0 END) as atrasadas,
      SUM(CASE WHEN status != 'encerrada' AND date(data_prazo) >= date('now') THEN 1 ELSE 0 END) as no_prazo,
      SUM(CASE WHEN status = 'encerrada' THEN 1 ELSE 0 END) as encerradas
    FROM nao_conformidades
  `).first();

  // Recent NCs
  const recentes = await db.prepare(`
    SELECT id, codigo, descricao, setor, gravidade, status, data_registro
    FROM nao_conformidades
    ORDER BY data_registro DESC
    LIMIT 10
  `).all();

  return c.json({
    total: (abertas as any)?.count || 0,
    encerradasMes: (encerradasMes as any)?.count || 0,
    tempoMedioResolucao: Math.round((tempoMedio as any)?.media || 0),
    statusCounts: statusCounts.results,
    porSetor: porSetor.results,
    porGravidade: porGravidade.results,
    porTipo: porTipo.results,
    tendenciaMensal: tendenciaMensal.results,
    reincidencia: {
      taxa: (reincidencia as any)?.total > 0 
        ? Math.round(((reincidencia as any)?.reincidentes / (reincidencia as any)?.total) * 100) 
        : 0,
      total: (reincidencia as any)?.reincidentes || 0,
    },
    sla: {
      atrasadas: (slaStatus as any)?.atrasadas || 0,
      noPrazo: (slaStatus as any)?.no_prazo || 0,
      encerradas: (slaStatus as any)?.encerradas || 0,
    },
    recentes: recentes.results,
  });
});

// ===============================
// Configuration Endpoints
// ===============================

// Setores
app.get("/api/config/setores", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM config_setores ORDER BY nome").all();
  return c.json(result.results);
});

app.post("/api/config/setores", async (c) => {
  const db = c.env.DB;
  const { nome } = await c.req.json();
  await db.prepare("INSERT INTO config_setores (nome) VALUES (?)").bind(nome).run();
  return c.json({ success: true });
});

app.put("/api/config/setores/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (body.nome !== undefined) {
    updates.push("nome = ?");
    params.push(body.nome);
  }
  if (body.is_ativo !== undefined) {
    updates.push("is_ativo = ?");
    params.push(body.is_ativo ? 1 : 0);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  
  await db.prepare(`UPDATE config_setores SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  return c.json({ success: true });
});

app.delete("/api/config/setores/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  await db.prepare("DELETE FROM config_setores WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Tipos de Incidente
app.get("/api/config/tipos-incidente", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM config_tipos_incidente ORDER BY nome").all();
  return c.json(result.results);
});

app.post("/api/config/tipos-incidente", async (c) => {
  const db = c.env.DB;
  const { nome } = await c.req.json();
  await db.prepare("INSERT INTO config_tipos_incidente (nome) VALUES (?)").bind(nome).run();
  return c.json({ success: true });
});

app.put("/api/config/tipos-incidente/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (body.nome !== undefined) {
    updates.push("nome = ?");
    params.push(body.nome);
  }
  if (body.is_ativo !== undefined) {
    updates.push("is_ativo = ?");
    params.push(body.is_ativo ? 1 : 0);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  
  await db.prepare(`UPDATE config_tipos_incidente SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  return c.json({ success: true });
});

app.delete("/api/config/tipos-incidente/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  await db.prepare("DELETE FROM config_tipos_incidente WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Gravidades
app.get("/api/config/gravidades", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM config_gravidades ORDER BY nome").all();
  return c.json(result.results);
});

app.post("/api/config/gravidades", async (c) => {
  const db = c.env.DB;
  const { nome, codigo } = await c.req.json();
  await db.prepare("INSERT INTO config_gravidades (nome, codigo) VALUES (?, ?)").bind(nome, codigo).run();
  return c.json({ success: true });
});

app.put("/api/config/gravidades/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (body.nome !== undefined) {
    updates.push("nome = ?");
    params.push(body.nome);
  }
  if (body.codigo !== undefined) {
    updates.push("codigo = ?");
    params.push(body.codigo);
  }
  if (body.is_ativo !== undefined) {
    updates.push("is_ativo = ?");
    params.push(body.is_ativo ? 1 : 0);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  
  await db.prepare(`UPDATE config_gravidades SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  return c.json({ success: true });
});

app.delete("/api/config/gravidades/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  await db.prepare("DELETE FROM config_gravidades WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Responsáveis
app.get("/api/config/responsaveis", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM config_responsaveis ORDER BY nome").all();
  return c.json(result.results);
});

app.post("/api/config/responsaveis", async (c) => {
  const db = c.env.DB;
  const { nome, email, setor } = await c.req.json();
  await db.prepare("INSERT INTO config_responsaveis (nome, email, setor) VALUES (?, ?, ?)").bind(nome, email, setor || null).run();
  return c.json({ success: true });
});

app.put("/api/config/responsaveis/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (body.nome !== undefined) {
    updates.push("nome = ?");
    params.push(body.nome);
  }
  if (body.email !== undefined) {
    updates.push("email = ?");
    params.push(body.email);
  }
  if (body.setor !== undefined) {
    updates.push("setor = ?");
    params.push(body.setor);
  }
  if (body.is_ativo !== undefined) {
    updates.push("is_ativo = ?");
    params.push(body.is_ativo ? 1 : 0);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  
  await db.prepare(`UPDATE config_responsaveis SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  return c.json({ success: true });
});

app.delete("/api/config/responsaveis/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  await db.prepare("DELETE FROM config_responsaveis WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Metas Internacionais
app.get("/api/config/metas-internacionais", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM config_metas_internacionais ORDER BY nome").all();
  return c.json(result.results);
});

app.post("/api/config/metas-internacionais", async (c) => {
  const db = c.env.DB;
  const { nome, descricao } = await c.req.json();
  await db.prepare("INSERT INTO config_metas_internacionais (nome, descricao) VALUES (?, ?)").bind(nome, descricao || null).run();
  return c.json({ success: true });
});

app.put("/api/config/metas-internacionais/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (body.nome !== undefined) {
    updates.push("nome = ?");
    params.push(body.nome);
  }
  if (body.descricao !== undefined) {
    updates.push("descricao = ?");
    params.push(body.descricao);
  }
  if (body.is_ativo !== undefined) {
    updates.push("is_ativo = ?");
    params.push(body.is_ativo ? 1 : 0);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  
  await db.prepare(`UPDATE config_metas_internacionais SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  return c.json({ success: true });
});

app.delete("/api/config/metas-internacionais/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  await db.prepare("DELETE FROM config_metas_internacionais WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Médicos
app.get("/api/config/medicos", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM config_medicos ORDER BY nome").all();
  return c.json(result.results);
});

app.post("/api/config/medicos", async (c) => {
  const db = c.env.DB;
  const { nome, crm, especialidade } = await c.req.json();
  await db.prepare("INSERT INTO config_medicos (nome, crm, especialidade) VALUES (?, ?, ?)").bind(nome, crm, especialidade || null).run();
  return c.json({ success: true });
});

app.put("/api/config/medicos/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (body.nome !== undefined) {
    updates.push("nome = ?");
    params.push(body.nome);
  }
  if (body.crm !== undefined) {
    updates.push("crm = ?");
    params.push(body.crm);
  }
  if (body.especialidade !== undefined) {
    updates.push("especialidade = ?");
    params.push(body.especialidade);
  }
  if (body.is_ativo !== undefined) {
    updates.push("is_ativo = ?");
    params.push(body.is_ativo ? 1 : 0);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  
  await db.prepare(`UPDATE config_medicos SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  return c.json({ success: true });
});

app.delete("/api/config/medicos/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  await db.prepare("DELETE FROM config_medicos WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Medicamentos
app.get("/api/config/medicamentos", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM config_medicamentos ORDER BY nome").all();
  return c.json(result.results);
});

app.post("/api/config/medicamentos", async (c) => {
  const db = c.env.DB;
  const { nome, classe } = await c.req.json();
  await db.prepare("INSERT INTO config_medicamentos (nome, classe) VALUES (?, ?)").bind(nome, classe || null).run();
  return c.json({ success: true });
});

app.put("/api/config/medicamentos/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (body.nome !== undefined) {
    updates.push("nome = ?");
    params.push(body.nome);
  }
  if (body.classe !== undefined) {
    updates.push("classe = ?");
    params.push(body.classe);
  }
  if (body.is_ativo !== undefined) {
    updates.push("is_ativo = ?");
    params.push(body.is_ativo ? 1 : 0);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  
  await db.prepare(`UPDATE config_medicamentos SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  return c.json({ success: true });
});

app.delete("/api/config/medicamentos/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  await db.prepare("DELETE FROM config_medicamentos WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Convênios
app.get("/api/config/convenios", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM config_convenios ORDER BY nome").all();
  return c.json(result.results);
});

app.post("/api/config/convenios", async (c) => {
  const db = c.env.DB;
  const { nome } = await c.req.json();
  await db.prepare("INSERT INTO config_convenios (nome) VALUES (?)").bind(nome).run();
  return c.json({ success: true });
});

app.put("/api/config/convenios/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = await c.req.json();
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (body.nome !== undefined) {
    updates.push("nome = ?");
    params.push(body.nome);
  }
  if (body.is_ativo !== undefined) {
    updates.push("is_ativo = ?");
    params.push(body.is_ativo ? 1 : 0);
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);
  
  await db.prepare(`UPDATE config_convenios SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  return c.json({ success: true });
});

app.delete("/api/config/convenios/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  await db.prepare("DELETE FROM config_convenios WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

export default app;
