-- Adicionar colunas faltantes na tabela indicadores
ALTER TABLE indicadores 
ADD COLUMN IF NOT EXISTS saldo_disponivel DECIMAL(10, 2) DEFAULT 0.00 AFTER total_comissoes,
ADD COLUMN IF NOT EXISTS saldo_bloqueado DECIMAL(10, 2) DEFAULT 0.00 AFTER saldo_disponivel,
ADD COLUMN IF NOT EXISTS saldo_perdido DECIMAL(10, 2) DEFAULT 0.00 AFTER saldo_bloqueado,
ADD COLUMN IF NOT EXISTS indicacoes_respondidas INT DEFAULT 0 AFTER total_indicacoes,
ADD COLUMN IF NOT EXISTS indicacoes_convertidas INT DEFAULT 0 AFTER indicacoes_respondidas,
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) AFTER email;

-- Criar índice para o CPF
CREATE INDEX IF NOT EXISTS idx_cpf ON indicadores(cpf);

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

-- Adicionar coluna created_by na tabela consultores se não existir
ALTER TABLE consultores 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) AFTER role;

-- Criar índice para created_by
CREATE INDEX IF NOT EXISTS idx_created_by ON consultores(created_by);

-- Ajustar ENUM de role para incluir os valores corretos
ALTER TABLE consultores 
MODIFY COLUMN role ENUM('consultor', 'vendedor', 'admin', 'diretor', 'gerente', 'supervisor') DEFAULT 'vendedor';

-- Ajustar ENUM de status dos leads para incluir todos os valores usados no código
ALTER TABLE leads 
MODIFY COLUMN status ENUM('indicacao', 'novo', 'primeiro_contato', 'contato', 'qualificado', 'proposta', 'proposta_enviada', 'negociacao', 'aguardando', 'vistoria', 'ganho', 'convertido', 'nao_solicitado', 'perdido') DEFAULT 'novo';

-- Adicionar coluna indicador_id na tabela leads se não existir
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS indicador_id VARCHAR(36) AFTER consultor_id;

-- Criar índice para indicador_id
CREATE INDEX IF NOT EXISTS idx_indicador ON leads(indicador_id);

-- Adicionar foreign key para indicador_id
ALTER TABLE leads 
ADD CONSTRAINT fk_leads_indicador 
FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE SET NULL;
