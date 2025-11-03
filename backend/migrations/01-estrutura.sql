-- Estrutura do Banco de Dados MySQL - VIP CRM

-- Tabela de Consultores
CREATE TABLE IF NOT EXISTS consultores (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    avatar TEXT,
    sessao_whatsapp VARCHAR(255),
    status_conexao ENUM('online', 'offline', 'connecting') DEFAULT 'offline',
    numero_whatsapp VARCHAR(20),
    role ENUM('consultor', 'admin', 'diretor') DEFAULT 'consultor',
    ativo BOOLEAN DEFAULT TRUE,
    sistema_online BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Leads
CREATE TABLE IF NOT EXISTS leads (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    empresa VARCHAR(255),
    cargo VARCHAR(255),
    origem VARCHAR(100),
    status ENUM('novo', 'contato', 'qualificado', 'proposta', 'negociacao', 'ganho', 'perdido') DEFAULT 'novo',
    valor_estimado DECIMAL(10, 2),
    tags JSON,
    observacoes TEXT,
    consultor_id VARCHAR(36),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_consultor (consultor_id),
    INDEX idx_status (status),
    FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS mensagens (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    lead_id VARCHAR(36) NOT NULL,
    consultor_id VARCHAR(36),
    conteudo TEXT NOT NULL,
    tipo ENUM('texto', 'audio', 'imagem', 'arquivo', 'video') DEFAULT 'texto',
    remetente ENUM('consultor', 'lead') NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    arquivo_url TEXT,
    duracao_audio INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lead (lead_id),
    INDEX idx_consultor (consultor_id),
    INDEX idx_lida (lida),
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Tarefas
CREATE TABLE IF NOT EXISTS tarefas (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    lead_id VARCHAR(36),
    consultor_id VARCHAR(36) NOT NULL,
    data_vencimento TIMESTAMP,
    prioridade ENUM('baixa', 'media', 'alta') DEFAULT 'media',
    status ENUM('pendente', 'em_andamento', 'concluida', 'cancelada') DEFAULT 'pendente',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP NULL,
    INDEX idx_consultor (consultor_id),
    INDEX idx_lead (lead_id),
    INDEX idx_status (status),
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Propostas
CREATE TABLE IF NOT EXISTS propostas (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    lead_id VARCHAR(36) NOT NULL,
    consultor_id VARCHAR(36) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    valor DECIMAL(10, 2) NOT NULL,
    validade DATE,
    status ENUM('rascunho', 'enviada', 'aceita', 'recusada') DEFAULT 'rascunho',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_envio TIMESTAMP NULL,
    data_resposta TIMESTAMP NULL,
    INDEX idx_lead (lead_id),
    INDEX idx_consultor (consultor_id),
    INDEX idx_status (status),
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Indicadores
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

-- Tabela de Vendas de Indicadores
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

-- Tabela de Lootboxes
CREATE TABLE IF NOT EXISTS lootboxes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    consultor_id VARCHAR(36) NOT NULL,
    nivel INT DEFAULT 1,
    xp_atual INT DEFAULT 0,
    xp_proximo_nivel INT DEFAULT 100,
    total_vendas INT DEFAULT 0,
    valor_total_vendas DECIMAL(10, 2) DEFAULT 0.00,
    ultima_recompensa TIMESTAMP NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_consultor (consultor_id),
    FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Recompensas
CREATE TABLE IF NOT EXISTS recompensas (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    consultor_id VARCHAR(36) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor VARCHAR(255),
    data_obtencao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_consultor (consultor_id),
    FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
