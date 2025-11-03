-- Adiciona coluna ultima_mensagem na tabela leads
-- Esta coluna armazena um preview da última mensagem trocada com o lead

ALTER TABLE leads ADD COLUMN ultima_mensagem VARCHAR(500) DEFAULT NULL;
