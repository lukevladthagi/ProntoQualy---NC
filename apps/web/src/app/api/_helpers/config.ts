import sql from "@/app/api/utils/sql";

// Shared CRUD for the dashboard configuration tables (config_*). Ported from the
// Hono worker's /api/config/* handlers. Identifiers (table/column names) cannot be
// parameterized via the neon tagged template, so each resource embeds its literal
// SQL while values flow through ${} substitution. Partial updates use COALESCE so
// only provided fields change; updated_at is always refreshed.

const nowIso = () => new Date().toISOString();
const boolInt = (v: unknown): number | null => (v === undefined ? null : v ? 1 : 0);
const asId = (id: string) => Number(id);

export interface ConfigResource {
  list: () => Promise<any[]>;
  create: (b: any) => Promise<any>;
  update: (id: string, b: any) => Promise<any>;
  remove: (id: string) => Promise<any>;
}

export const setores: ConfigResource = {
  list: () => sql`SELECT * FROM config_setores ORDER BY nome`,
  create: (b) => sql`INSERT INTO config_setores (nome) VALUES (${b.nome ?? null})`,
  update: (id, b) => sql`
    UPDATE config_setores SET
      nome = COALESCE(${b.nome ?? null}, nome),
      is_ativo = COALESCE(${boolInt(b.is_ativo)}, is_ativo),
      updated_at = ${nowIso()}
    WHERE id = ${asId(id)}`,
  remove: (id) => sql`DELETE FROM config_setores WHERE id = ${asId(id)}`,
};

export const tiposIncidente: ConfigResource = {
  list: () => sql`SELECT * FROM config_tipos_incidente ORDER BY nome`,
  create: (b) => sql`INSERT INTO config_tipos_incidente (nome) VALUES (${b.nome ?? null})`,
  update: (id, b) => sql`
    UPDATE config_tipos_incidente SET
      nome = COALESCE(${b.nome ?? null}, nome),
      is_ativo = COALESCE(${boolInt(b.is_ativo)}, is_ativo),
      updated_at = ${nowIso()}
    WHERE id = ${asId(id)}`,
  remove: (id) => sql`DELETE FROM config_tipos_incidente WHERE id = ${asId(id)}`,
};

export const gravidades: ConfigResource = {
  list: () => sql`SELECT * FROM config_gravidades ORDER BY nome`,
  create: (b) => sql`INSERT INTO config_gravidades (nome, codigo) VALUES (${b.nome ?? null}, ${b.codigo ?? null})`,
  update: (id, b) => sql`
    UPDATE config_gravidades SET
      nome = COALESCE(${b.nome ?? null}, nome),
      codigo = COALESCE(${b.codigo ?? null}, codigo),
      is_ativo = COALESCE(${boolInt(b.is_ativo)}, is_ativo),
      updated_at = ${nowIso()}
    WHERE id = ${asId(id)}`,
  remove: (id) => sql`DELETE FROM config_gravidades WHERE id = ${asId(id)}`,
};

export const responsaveis: ConfigResource = {
  list: () => sql`SELECT * FROM config_responsaveis ORDER BY nome`,
  create: (b) =>
    sql`INSERT INTO config_responsaveis (nome, email, setor) VALUES (${b.nome ?? null}, ${b.email ?? null}, ${b.setor ?? null})`,
  update: (id, b) => sql`
    UPDATE config_responsaveis SET
      nome = COALESCE(${b.nome ?? null}, nome),
      email = COALESCE(${b.email ?? null}, email),
      setor = COALESCE(${b.setor ?? null}, setor),
      is_ativo = COALESCE(${boolInt(b.is_ativo)}, is_ativo),
      updated_at = ${nowIso()}
    WHERE id = ${asId(id)}`,
  remove: (id) => sql`DELETE FROM config_responsaveis WHERE id = ${asId(id)}`,
};

export const metasInternacionais: ConfigResource = {
  list: () => sql`SELECT * FROM config_metas_internacionais ORDER BY nome`,
  create: (b) =>
    sql`INSERT INTO config_metas_internacionais (nome, descricao) VALUES (${b.nome ?? null}, ${b.descricao ?? null})`,
  update: (id, b) => sql`
    UPDATE config_metas_internacionais SET
      nome = COALESCE(${b.nome ?? null}, nome),
      descricao = COALESCE(${b.descricao ?? null}, descricao),
      is_ativo = COALESCE(${boolInt(b.is_ativo)}, is_ativo),
      updated_at = ${nowIso()}
    WHERE id = ${asId(id)}`,
  remove: (id) => sql`DELETE FROM config_metas_internacionais WHERE id = ${asId(id)}`,
};

export const medicos: ConfigResource = {
  list: () => sql`SELECT * FROM config_medicos ORDER BY nome`,
  create: (b) =>
    sql`INSERT INTO config_medicos (nome, crm, especialidade) VALUES (${b.nome ?? null}, ${b.crm ?? null}, ${b.especialidade ?? null})`,
  update: (id, b) => sql`
    UPDATE config_medicos SET
      nome = COALESCE(${b.nome ?? null}, nome),
      crm = COALESCE(${b.crm ?? null}, crm),
      especialidade = COALESCE(${b.especialidade ?? null}, especialidade),
      is_ativo = COALESCE(${boolInt(b.is_ativo)}, is_ativo),
      updated_at = ${nowIso()}
    WHERE id = ${asId(id)}`,
  remove: (id) => sql`DELETE FROM config_medicos WHERE id = ${asId(id)}`,
};

export const medicamentos: ConfigResource = {
  list: () => sql`SELECT * FROM config_medicamentos ORDER BY nome`,
  create: (b) => sql`INSERT INTO config_medicamentos (nome, classe) VALUES (${b.nome ?? null}, ${b.classe ?? null})`,
  update: (id, b) => sql`
    UPDATE config_medicamentos SET
      nome = COALESCE(${b.nome ?? null}, nome),
      classe = COALESCE(${b.classe ?? null}, classe),
      is_ativo = COALESCE(${boolInt(b.is_ativo)}, is_ativo),
      updated_at = ${nowIso()}
    WHERE id = ${asId(id)}`,
  remove: (id) => sql`DELETE FROM config_medicamentos WHERE id = ${asId(id)}`,
};

export const convenios: ConfigResource = {
  list: () => sql`SELECT * FROM config_convenios ORDER BY nome`,
  create: (b) => sql`INSERT INTO config_convenios (nome) VALUES (${b.nome ?? null})`,
  update: (id, b) => sql`
    UPDATE config_convenios SET
      nome = COALESCE(${b.nome ?? null}, nome),
      is_ativo = COALESCE(${boolInt(b.is_ativo)}, is_ativo),
      updated_at = ${nowIso()}
    WHERE id = ${asId(id)}`,
  remove: (id) => sql`DELETE FROM config_convenios WHERE id = ${asId(id)}`,
};
