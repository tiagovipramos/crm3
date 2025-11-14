-- ============================================
-- Migration 15: WhatsApp Business Cloud API
-- Data: 14/11/2025
-- Descrição: Adiciona colunas para suportar API oficial do WhatsApp
-- ============================================

-- Adicionar coluna para Access Token da Cloud API
ALTER TABLE consultores 
ADD COLUMN whatsapp_access_token TEXT NULL COMMENT 'Token de acesso da WhatsApp Cloud API'
AFTER status_conexao;

-- Adicionar coluna para Phone Number ID
ALTER TABLE consultores 
ADD COLUMN whatsapp_phone_number_id VARCHAR(50) NULL COMMENT 'ID do número de telefone da WhatsApp Cloud API'
AFTER whatsapp_access_token;

-- Adicionar coluna para Business Account ID
ALTER TABLE consultores 
ADD COLUMN whatsapp_business_account_id VARCHAR(50) NULL COMMENT 'ID da conta business do WhatsApp'
AFTER whatsapp_phone_number_id;

-- Adicionar coluna para Webhook Verify Token
ALTER TABLE consultores 
ADD COLUMN whatsapp_webhook_verify_token VARCHAR(255) NULL COMMENT 'Token de verificação do webhook'
AFTER whatsapp_business_account_id;

-- Criar índice para melhorar performance nas buscas por Phone Number ID
CREATE INDEX idx_whatsapp_phone_number_id 
ON consultores(whatsapp_phone_number_id);

-- Log da migration
SELECT '✅ Migration 15 aplicada com sucesso!' as status;
SELECT 'Colunas WhatsApp Cloud API adicionadas na tabela consultores' as mensagem;
