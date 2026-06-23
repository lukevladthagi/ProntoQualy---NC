INSERT INTO config_opcoes_formulario (categoria, nome, valor, is_ativo)
VALUES
  ('tipo_notificacao', 'Não Conformidade (Não envolve paciente)', 'nao_conformidade', 1),
  ('tipo_notificacao', 'Evento Adverso (Envolve paciente)', 'evento_adverso', 1)
ON CONFLICT (categoria, valor) DO UPDATE SET
  nome = EXCLUDED.nome,
  is_ativo = EXCLUDED.is_ativo;
