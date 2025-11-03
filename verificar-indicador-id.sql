-- ============================================
-- SCRIPT DE VERIFICAÇÃO: indicador_id nos leads
-- ============================================
-- Este script verifica se os leads criados por indicações
-- têm o campo indicador_id preenchido corretamente

-- 1. Verificar último lead criado por indicação
SELECT 
    id,
    nome,
    telefone,
    indicador_id,
    consultor_id,
    status,
    origem,
    data_criacao
FROM leads 
WHERE origem = 'Indicação' 
ORDER BY data_criacao DESC 
LIMIT 1;

-- 2. Verificar todos os leads de indicação sem indicador_id
SELECT 
    COUNT(*) as total_leads_sem_indicador,
    status,
    origem
FROM leads 
WHERE origem = 'Indicação' 
  AND indicador_id IS NULL
GROUP BY status, origem;

-- 3. Verificar indicadores cadastrados
SELECT 
    id,
    nome,
    email,
    saldo_disponivel,
    saldo_bloqueado,
    total_indicacoes
FROM indicadores 
ORDER BY data_criacao DESC 
LIMIT 5;

-- 4. Verificar indicações criadas
SELECT 
    i.id as indicacao_id,
    i.nome_indicado,
    i.telefone_indicado,
    i.indicador_id,
    i.lead_id,
    i.status as status_indicacao,
    l.nome as lead_nome,
    l.indicador_id as lead_indicador_id,
    l.status as lead_status
FROM indicacoes i
LEFT JOIN leads l ON i.lead_id = l.id
ORDER BY i.data_indicacao DESC
LIMIT 5;
