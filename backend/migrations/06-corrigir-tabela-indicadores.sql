-- Correção: Criar tabela indicadores que estava faltando
-- Esta tabela deveria ter sido criada na migration 03, mas não foi

CREATE TABLE IF NOT EXISTS indicadores (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    avatar TEXT,
    codigo_indicacao VARCHAR(20) UNIQUE,
    total_indicacoes INT DEFAULT 0,
    total_vendas DECIMAL(10, 2) DEFAULT 0.00,
    comissao_percentual DECIMAL(5, 2) DEFAULT 10.00,
    total_comissoes DECIMAL(10, 2) DEFAULT 0.00,
    ativo BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(36),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_codigo (codigo_indicacao),
    FOREIGN KEY (created_by) REFERENCES consultores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar também outras tabelas que possam estar faltando

CREATE TABLE IF NOT EXISTS saques_indicador (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    indicador_id VARCHAR(36) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    status ENUM('pendente', 'aprovado', 'rejeitado', 'pago') DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP NULL,
    data_pagamento TIMESTAMP NULL,
    observacoes TEXT,
    INDEX idx_indicador (indicador_id),
    INDEX idx_status (status),
    FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transacoes_indicador (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    indicador_id VARCHAR(36) NOT NULL,
    tipo ENUM('indicacao', 'venda', 'saque', 'bonus') NOT NULL,
    descricao TEXT,
    valor DECIMAL(10, 2) NOT NULL,
    data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    referencia_id VARCHAR(36),
    INDEX idx_indicador (indicador_id),
    INDEX idx_tipo (tipo),
    FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vendas_indicadores (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    indicador_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    valor_venda DECIMAL(10, 2) NOT NULL,
    comissao DECIMAL(10, 2) NOT NULL,
    status ENUM('pendente', 'pago', 'cancelado') DEFAULT 'pendente',
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_pagamento TIMESTAMP NULL,
    INDEX idx_indicador (indicador_id),
    INDEX idx_lead (lead_id),
    INDEX idx_status (status),
    FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
