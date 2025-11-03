-- Migration: Adicionar colunas necessárias para WhatsApp na tabela mensagens
-- Data: 2025-11-03
-- Descrição: Adiciona colunas whatsapp_message_id, media_url, media_name, status e timestamp

-- 1. Adicionar whatsapp_message_id (ID único da mensagem do WhatsApp para evitar duplicação)
ALTER TABLE mensagens ADD COLUMN whatsapp_message_id VARCHAR(255) NULL AFTER remetente;
ALTER TABLE mensagens ADD INDEX idx_whatsapp_message_id (whatsapp_message_id);

-- 2. Renomear arquivo_url para media_url (compatibilidade com código TypeScript)
ALTER TABLE mensagens CHANGE COLUMN arquivo_url media_url TEXT NULL;

-- 3. Adicionar media_name (nome do arquivo de mídia)
ALTER TABLE mensagens ADD COLUMN media_name VARCHAR(255) NULL AFTER media_url;

-- 4. Substituir coluna 'lida' (boolean) por 'status' (enum mais completo)
ALTER TABLE mensagens ADD COLUMN status ENUM('enviada', 'entregue', 'lida') DEFAULT 'enviada' AFTER remetente;

-- Migrar dados existentes: se lida=true -> status='lida', senão -> status='enviada'
UPDATE mensagens SET status = IF(lida = 1, 'lida', 'enviada');

-- Remover coluna antiga 'lida'
ALTER TABLE mensagens DROP COLUMN lida;

-- 5. Renomear data_criacao para timestamp (padronização)
ALTER TABLE mensagens CHANGE COLUMN data_criacao timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 6. Remover coluna duracao_audio se existir (não está sendo usada no código atual)
ALTER TABLE mensagens DROP COLUMN IF EXISTS duracao_audio;
