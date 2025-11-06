-- Migration: Permitir que admin gerencie funis globais
-- Data: 2025-11-06

-- 1. Adicionar coluna para identificar etapas globais (gerenciadas pelo admin)
ALTER TABLE etapas_funil 
ADD COLUMN global BOOLEAN DEFAULT FALSE COMMENT 'Etapa global gerenciada pelo admin';

-- 2. Adicionar índice para consultas de admin
CREATE INDEX idx_etapas_global ON etapas_funil(global);

-- 3. Permitir que consultor_id seja NULL para etapas globais
ALTER TABLE etapas_funil 
MODIFY COLUMN consultor_id INT NULL COMMENT 'NULL = etapa global do sistema';

-- 4. Criar etapas globais padrão do sistema (se não existirem)
-- Estas etapas serão gerenciadas pelo admin e servem como template

INSERT IGNORE INTO etapas_funil (id, consultor_id, nome, cor, ordem, sistema, ativo, global)
VALUES
  ('novo_lead_global', NULL, 'Novo Lead', '#3B82F6', 1, TRUE, TRUE, TRUE),
  ('contato_inicial_global', NULL, 'Contato Inicial', '#10B981', 2, TRUE, TRUE, TRUE),
  ('qualificacao_global', NULL, 'Qualificação', '#F59E0B', 3, TRUE, TRUE, TRUE),
  ('proposta_global', NULL, 'Proposta', '#8B5CF6', 4, TRUE, TRUE, TRUE),
  ('negociacao_global', NULL, 'Negociação', '#EC4899', 5, TRUE, TRUE, TRUE),
  ('fechamento_global', NULL, 'Fechamento', '#059669', 6, TRUE, TRUE, TRUE);

-- 5. Adicionar comentário na tabela
ALTER TABLE etapas_funil COMMENT = 'Etapas do funil: consultor_id NULL = global (admin), não NULL = personalizada';
