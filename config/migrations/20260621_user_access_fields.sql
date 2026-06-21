ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS setor text,
  ADD COLUMN IF NOT EXISTS perfil text NOT NULL DEFAULT 'usuario',
  ADD COLUMN IF NOT EXISTS setores_permitidos jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE "user"
SET perfil = 'usuario'
WHERE perfil IS NULL OR perfil = '';

UPDATE "user"
SET setores_permitidos = CASE
  WHEN setor IS NULL OR setor = '' THEN '[]'::jsonb
  ELSE jsonb_build_array(setor)
END
WHERE setores_permitidos IS NULL;
