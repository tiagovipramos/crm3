-- Criar tabela de indicacoes (faltante)

CREATE TABLE IF NOT EXISTS indicacoes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    indicador_id VARCHAR(36) NOT NULL,
    nome_indicado VARCHAR(255) NOT NULL,
    telefone_indicado VARCHAR(20) NOT NULL,
    whatsapp_validado BOOLEAN DEFAULT FALSE,
    lead_id VARCHAR(36),
    status ENUM('pendente', 'enviado_crm', 'respondeu', 'converteu', 'engano') DEFAULT 'pendente',
    comissao_resposta DECIMAL(10, 2) DEFAULT 2.00,
    comissao_venda DECIMAL(10, 2) DEFAULT 0.00,
    data_indicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_resposta TIMESTAMP NULL,
    data_conversao TIMESTAMP NULL,
    data_validacao_whatsapp TIMESTAMP NULL,
    INDEX idx_indicador (indicador_id),
    INDEX idx_lead (lead_id),
    INDEX idx_status (status),
    INDEX idx_telefone (telefone_indicado),
    FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela de transacoes_indicador

CREATE TABLE IF NOT EXISTS transacoes_indicador (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    indicador_id VARCHAR(36) NOT NULL,
    indicacao_id VARCHAR(36),
    tipo ENUM('credito', 'debito', 'bloqueio', 'desbloqueio', 'saque') NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    saldo_anterior DECIMAL(10, 2) NOT NULL,
    saldo_novo DECIMAL(10, 2) NOT NULL,
    descricao TEXT,
    data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_indicador (indicador_id),
    INDEX idx_indicacao (indicacao_id),
    INDEX idx_tipo (tipo),
    INDEX idx_data (data_transacao),
    FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE,
    FOREIGN KEY (indicacao_id) REFERENCES indicacoes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
