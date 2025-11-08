-- Migration 12: Adicionar coluna mensagens_nao_lidas na tabela leads
-- Data: 08/11/2025
-- Descrição: Adiciona coluna para contagem de mensagens não lidas

-- Adicionar coluna mensagens_nao_lidas (se não existir)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS mensagens_nao_lidas INT DEFAULT 0 NOT NULL
AFTER ultima_mensagem;

-- Criar índice para melhorar performance em consultas
CREATE INDEX IF NOT EXISTS idx_leads_mensagens_nao_lidas 
ON leads(mensagens_nao_lidas);

-- Atualizar leads existentes para garantir que tenham valor 0
UPDATE leads 
SET mensagens_nao_lidas = 0 
WHERE mensagens_nao_lidas IS NULL;

-- Log da migration
SELECT '✅ Migration 12 aplicada com sucesso!' as status;
SELECT 'Coluna mensagens_nao_lidas adicionada na tabela leads' as mensagem;
