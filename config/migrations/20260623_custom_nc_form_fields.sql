ALTER TABLE nao_conformidades
  ADD COLUMN IF NOT EXISTS campos_personalizados jsonb DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS config_campos_formulario (
  id SERIAL PRIMARY KEY,
  nome text NOT NULL,
  chave text NOT NULL UNIQUE,
  tipo text NOT NULL DEFAULT 'texto',
  contexto text NOT NULL DEFAULT 'ambos',
  opcoes text,
  is_obrigatorio integer NOT NULL DEFAULT 0,
  is_ativo integer NOT NULL DEFAULT 1,
  ordem integer NOT NULL DEFAULT 0,
  created_at text DEFAULT CURRENT_TIMESTAMP,
  updated_at text DEFAULT CURRENT_TIMESTAMP
);
