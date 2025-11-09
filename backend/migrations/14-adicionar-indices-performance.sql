-- ============================================
-- Migration: Adicionar Índices de Performance
-- Data: 09/11/2025
-- Descrição: Adiciona índices para melhorar performance de queries
-- ============================================

USE protecar_crm;

-- ============================================
-- TABELA: leads
-- ============================================

-- Índice para busca por telefone (muito usado no sistema)
CREATE INDEX idx_leads_telefone ON leads(telefone);

-- Índice composto para listar leads de um consultor ordenados por data
CREATE INDEX idx_leads_consultor_data ON leads(consultor_id, data_criacao DESC);

-- Índice para filtrar por status
CREATE INDEX idx_leads_status ON leads(status);

-- Índice para buscar leads de um indicador
CREATE INDEX idx_leads_indicador ON leads(indicador_id);


-- ============================================
-- TABELA: mensagens
-- ============================================

-- Índice para buscar mensagens de um lead ordenadas por data
CREATE INDEX idx_mensagens_lead_timestamp ON mensagens(lead_id, timestamp DESC);

-- Índice para buscar mensagens de um consultor
CREATE INDEX idx_mensagens_consultor ON mensagens(consultor_id);

-- Índice para verificar duplicatas por WhatsApp Message ID
CREATE INDEX idx_mensagens_whatsapp_id ON mensagens(whatsapp_message_id);


-- ============================================
-- TABELA: indicacoes
-- ============================================

-- Índice para buscar indicações de um indicador
CREATE INDEX idx_indicacoes_indicador ON indicacoes(indicador_id);

-- Índice para buscar indicação relacionada a um lead
CREATE INDEX idx_indicacoes_lead ON indicacoes(lead_id);


-- ============================================
-- TABELA: tarefas
-- ============================================

-- Índice para buscar tarefas de um consultor ordenadas por vencimento
CREATE INDEX idx_tarefas_consultor_data ON tarefas(consultor_id, data_vencimento);

-- Índice para buscar tarefas de um lead
CREATE INDEX idx_tarefas_lead ON tarefas(lead_id);


-- ============================================
-- VERIFICAR ÍNDICES CRIADOS
-- ============================================

SELECT 
    'leads' as tabela,
    index_name as indice,
    column_name as coluna,
    seq_in_index as posicao
FROM information_schema.statistics
WHERE table_schema = 'protecar_crm'
    AND table_name = 'leads'
    AND index_name LIKE 'idx_%'
ORDER BY index_name, seq_in_index;

SELECT 
    'mensagens' as tabela,
    index_name as indice,
    column_name as coluna,
    seq_in_index as posicao
FROM information_schema.statistics
WHERE table_schema = 'protecar_crm'
    AND table_name = 'mensagens'
    AND index_name LIKE 'idx_%'
ORDER BY index_name, seq_in_index;

-- ============================================
-- FIM DA MIGRATION
-- ============================================
