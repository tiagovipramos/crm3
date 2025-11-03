-- Migration para adicionar colunas de Loot Box na tabela indicadores
SET @dbname = DATABASE();
SET @tablename = "indicadores";

-- Adicionar leads_para_proxima_caixa
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'leads_para_proxima_caixa';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN leads_para_proxima_caixa INT DEFAULT 0 AFTER indicacoes_convertidas', 
    'SELECT "Coluna leads_para_proxima_caixa já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar total_caixas_abertas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'total_caixas_abertas';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN total_caixas_abertas INT DEFAULT 0 AFTER leads_para_proxima_caixa', 
    'SELECT "Coluna total_caixas_abertas já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar total_ganho_caixas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'total_ganho_caixas';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN total_ganho_caixas DECIMAL(10, 2) DEFAULT 0.00 AFTER total_caixas_abertas', 
    'SELECT "Coluna total_ganho_caixas já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar vendas_para_proxima_caixa (para loot box de vendas)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'vendas_para_proxima_caixa';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN vendas_para_proxima_caixa INT DEFAULT 0 AFTER total_ganho_caixas', 
    'SELECT "Coluna vendas_para_proxima_caixa já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar total_caixas_vendas_abertas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'total_caixas_vendas_abertas';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN total_caixas_vendas_abertas INT DEFAULT 0 AFTER vendas_para_proxima_caixa', 
    'SELECT "Coluna total_caixas_vendas_abertas já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar total_ganho_caixas_vendas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'total_ganho_caixas_vendas';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN total_ganho_caixas_vendas DECIMAL(10, 2) DEFAULT 0.00 AFTER total_caixas_vendas_abertas', 
    'SELECT "Coluna total_ganho_caixas_vendas já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar pix_chave
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'pix_chave';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN pix_chave VARCHAR(255) AFTER total_ganho_caixas_vendas', 
    'SELECT "Coluna pix_chave já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar pix_tipo
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'pix_tipo';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE indicadores ADD COLUMN pix_tipo ENUM(\'cpf\', \'cnpj\', \'email\', \'telefone\', \'aleatoria\') AFTER pix_chave', 
    'SELECT "Coluna pix_tipo já existe"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar colunas na tabela saques_indicador se não existirem
SET @tablename = "saques_indicador";

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'pix_chave';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE saques_indicador ADD COLUMN pix_chave VARCHAR(255) AFTER valor', 
    'SELECT "Coluna pix_chave já existe em saques_indicador"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'pix_tipo';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE saques_indicador ADD COLUMN pix_tipo ENUM(\'cpf\', \'cnpj\', \'email\', \'telefone\', \'aleatoria\') AFTER pix_chave', 
    'SELECT "Coluna pix_tipo já existe em saques_indicador"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM information_schema.columns 
WHERE table_schema = @dbname AND table_name = @tablename AND column_name = 'comprovante_url';
SET @query = IF(@col_exists = 0, 
    'ALTER TABLE saques_indicador ADD COLUMN comprovante_url VARCHAR(500) AFTER status', 
    'SELECT "Coluna comprovante_url já existe em saques_indicador"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
