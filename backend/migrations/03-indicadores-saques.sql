-- Adicionar colunas faltantes na tabela indicadores (verificação manual de existência)
SET @dbname = DATABASE();
SET @tablename = "indicadores";

-- Adicionar saldo_disponivel
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'saldo_disponivel';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN saldo_disponivel DECIMAL(10, 2) DEFAULT 0.00 AFTER total_comissoes', 
    'SELECT "Coluna saldo_disponivel já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar saldo_bloqueado
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'saldo_bloqueado';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN saldo_bloqueado DECIMAL(10, 2) DEFAULT 0.00 AFTER saldo_disponivel', 
    'SELECT "Coluna saldo_bloqueado já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar saldo_perdido
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'saldo_perdido';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN saldo_perdido DECIMAL(10, 2) DEFAULT 0.00 AFTER saldo_bloqueado', 
    'SELECT "Coluna saldo_perdido já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar indicacoes_respondidas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'indicacoes_respondidas';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN indicacoes_respondidas INT DEFAULT 0 AFTER total_indicacoes', 
    'SELECT "Coluna indicacoes_respondidas já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar indicacoes_convertidas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'indicacoes_convertidas';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN indicacoes_convertidas INT DEFAULT 0 AFTER indicacoes_respondidas', 
    'SELECT "Coluna indicacoes_convertidas já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar cpf
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'cpf';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN cpf VARCHAR(14) AFTER email', 
    'SELECT "Coluna cpf já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Criar índice para o CPF
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists FROM information_schema.statistics 
WHERE table_schema = @dbname AND table_name = @tablename AND index_name = 'idx_cpf';
SET @query = IF(@index_exists = 0, 
    'CREATE INDEX idx_cpf ON indicadores(cpf)', 
    'SELECT "Índice idx_cpf já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Criar tabela de saques_indicador
CREATE TABLE IF NOT EXISTS saques_indicador (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    indicador_id VARCHAR(36) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP NULL,
    data_pagamento TIMESTAMP NULL,
    status ENUM('solicitado', 'aprovado', 'pago', 'rejeitado') DEFAULT 'solicitado',
    observacoes TEXT,
    aprovado_por VARCHAR(36),
    metodo_pagamento VARCHAR(50),
    INDEX idx_indicador (indicador_id),
    INDEX idx_status (status),
    FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE,
    FOREIGN KEY (aprovado_por) REFERENCES consultores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar coluna created_by na tabela consultores
SET @tablename = "consultores";
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'created_by';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE consultores ADD COLUMN created_by VARCHAR(36) AFTER role', 
    'SELECT "Coluna created_by já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Criar índice para created_by
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists FROM information_schema.statistics 
WHERE table_schema = @dbname AND table_name = @tablename AND index_name = 'idx_created_by';
SET @query = IF(@index_exists = 0, 
    'CREATE INDEX idx_created_by ON consultores(created_by)', 
    'SELECT "Índice idx_created_by já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajustar ENUM de role para incluir os valores corretos
ALTER TABLE consultores 
MODIFY COLUMN role ENUM('consultor', 'vendedor', 'admin', 'diretor', 'gerente', 'supervisor') DEFAULT 'vendedor';

-- Ajustar ENUM de status dos leads para incluir todos os valores usados no código
ALTER TABLE leads 
MODIFY COLUMN status ENUM('indicacao', 'novo', 'primeiro_contato', 'contato', 'qualificado', 'proposta', 'proposta_enviada', 'negociacao', 'aguardando', 'vistoria', 'ganho', 'convertido', 'nao_solicitado', 'perdido') DEFAULT 'novo';

-- Adicionar coluna indicador_id na tabela leads
SET @tablename = "leads";
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'indicador_id';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE leads ADD COLUMN indicador_id VARCHAR(36) AFTER consultor_id', 
    'SELECT "Coluna indicador_id já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Criar índice para indicador_id
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists FROM information_schema.statistics 
WHERE table_schema = @dbname AND table_name = @tablename AND index_name = 'idx_indicador';
SET @query = IF(@index_exists = 0, 
    'CREATE INDEX idx_indicador ON leads(indicador_id)', 
    'SELECT "Índice idx_indicador já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar foreign key para indicador_id
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists FROM information_schema.table_constraints 
WHERE table_schema = @dbname AND table_name = @tablename AND constraint_name = 'fk_leads_indicador';
SET @query = IF(@fk_exists = 0, 
    'ALTER TABLE leads ADD CONSTRAINT fk_leads_indicador FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE SET NULL', 
    'SELECT "Foreign key fk_leads_indicador já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
