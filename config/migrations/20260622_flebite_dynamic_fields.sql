ALTER TABLE nao_conformidades
  ADD COLUMN IF NOT EXISTS flebite_tipos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS flebite_fatores jsonb NOT NULL DEFAULT '{}'::jsonb;
