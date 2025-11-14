-- Migration para suportar WhatsApp Business Cloud API
-- Adiciona colunas necessárias para armazenar credenciais da API oficial

-- Adicionar colunas para configuração da Cloud API na tabela consultores
ALTER TABLE consultores
ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT NULL COMMENT 'Token de acesso da WhatsApp Cloud API',
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id VARCHAR(50) NULL COMMENT 'ID do número de telefone da WhatsApp Cloud API',
ADD COLUMN IF NOT EXISTS whatsapp_business_account_id VARCHAR(50) NULL COMMENT 'ID da conta business do WhatsApp',
ADD COLUMN IF NOT EXISTS whatsapp_webhook_verify_token VARCHAR(255) NULL COMMENT 'Token de verificação do webhook';

-- Adicionar índices para melhor performance
ALTER TABLE consultores
ADD INDEX IF NOT EXISTS idx_whatsapp_phone_number_id (whatsapp_phone_number_id);

-- Comentários das colunas
ALTER TABLE consultores
MODIFY COLUMN status_conexao ENUM('offline', 'connecting', 'online') DEFAULT 'offline' COMMENT 'Status da conexão WhatsApp (usado tanto para Baileys quanto Cloud API)';

-- Log da migration
SELECT 'Migration 15: WhatsApp Cloud API columns added successfully!' as message;
