-- =============================================
-- Migration: Criar Tabela de Etapas de Funil
-- Descrição: Tabela para gerenciar etapas personalizadas dos funis de vendas
-- Data: 2025-01-06
-- =============================================

-- Criar tabela de etapas de funil
CREATE TABLE IF NOT EXISTS etapas_funil (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    consultor_id VARCHAR(36) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cor VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
    ordem INT NOT NULL,
    sistema BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_consultor (consultor_id),
    INDEX idx_ativo (ativo),
    INDEX idx_ordem (ordem),
    FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir etapas padrão do sistema para cada consultor existente
INSERT INTO etapas_funil (id, consultor_id, nome, cor, ordem, sistema, ativo)
SELECT 
    CONCAT(UUID(), '-novo') as id,
    id as consultor_id,
    'Novo' as nome,
    '#3B82F6' as cor,
    1 as ordem,
    TRUE as sistema,
    TRUE as ativo
FROM consultores
WHERE NOT EXISTS (
    SELECT 1 FROM etapas_funil WHERE consultor_id = consultores.id AND nome = 'Novo'
);

INSERT INTO etapas_funil (id, consultor_id, nome, cor, ordem, sistema, ativo)
SELECT 
    CONCAT(UUID(), '-primeiro_contato') as id,
    id as consultor_id,
    'Primeiro Contato' as nome,
    '#10B981' as cor,
    2 as ordem,
    TRUE as sistema,
    TRUE as ativo
FROM consultores
WHERE NOT EXISTS (
    SELECT 1 FROM etapas_funil WHERE consultor_id = consultores.id AND nome = 'Primeiro Contato'
);

INSERT INTO etapas_funil (id, consultor_id, nome, cor, ordem, sistema, ativo)
SELECT 
    CONCAT(UUID(), '-aguardando_retorno') as id,
    id as consultor_id,
    'Aguardando Retorno' as nome,
    '#F59E0B' as cor,
    3 as ordem,
    FALSE as sistema,
    TRUE as ativo
FROM consultores
WHERE NOT EXISTS (
    SELECT 1 FROM etapas_funil WHERE consultor_id = consultores.id AND nome = 'Aguardando Retorno'
);

INSERT INTO etapas_funil (id, consultor_id, nome, cor, ordem, sistema, ativo)
SELECT 
    CONCAT(UUID(), '-vistoria_agendada') as id,
    id as consultor_id,
    'Vistoria Agendada' as nome,
    '#8B5CF6' as cor,
    4 as ordem,
    FALSE as sistema,
    TRUE as ativo
FROM consultores
WHERE NOT EXISTS (
    SELECT 1 FROM etapas_funil WHERE consultor_id = consultores.id AND nome = 'Vistoria Agendada'
);

INSERT INTO etapas_funil (id, consultor_id, nome, cor, ordem, sistema, ativo)
SELECT 
    CONCAT(UUID(), '-proposta_enviada') as id,
    id as consultor_id,
    'Proposta Enviada' as nome,
    '#EC4899' as cor,
    5 as ordem,
    FALSE as sistema,
    TRUE as ativo
FROM consultores
WHERE NOT EXISTS (
    SELECT 1 FROM etapas_funil WHERE consultor_id = consultores.id AND nome = 'Proposta Enviada'
);

INSERT INTO etapas_funil (id, consultor_id, nome, cor, ordem, sistema, ativo)
SELECT 
    CONCAT(UUID(), '-convertido') as id,
    id as consultor_id,
    'Convertido' as nome,
    '#059669' as cor,
    6 as ordem,
    TRUE as sistema,
    TRUE as ativo
FROM consultores
WHERE NOT EXISTS (
    SELECT 1 FROM etapas_funil WHERE consultor_id = consultores.id AND nome = 'Convertido'
);

INSERT INTO etapas_funil (id, consultor_id, nome, cor, ordem, sistema, ativo)
SELECT 
    CONCAT(UUID(), '-perdido') as id,
    id as consultor_id,
    'Perdido' as nome,
    '#EF4444' as cor,
    7 as ordem,
    TRUE as sistema,
    TRUE as ativo
FROM consultores
WHERE NOT EXISTS (
    SELECT 1 FROM etapas_funil WHERE consultor_id = consultores.id AND nome = 'Perdido'
);

INSERT INTO etapas_funil (id, consultor_id, nome, cor, ordem, sistema, ativo)
SELECT 
    CONCAT(UUID(), '-engano') as id,
    id as consultor_id,
    'Engano' as nome,
    '#6B7280' as cor,
    8 as ordem,
    TRUE as sistema,
    TRUE as ativo
FROM consultores
WHERE NOT EXISTS (
    SELECT 1 FROM etapas_funil WHERE consultor_id = consultores.id AND nome = 'Engano'
);

-- Confirmar migração
SELECT 'Tabela etapas_funil criada com sucesso!' as status;
