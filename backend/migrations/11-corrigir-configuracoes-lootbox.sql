-- =====================================================
-- CORREÇÃO: CONFIGURAÇÕES DE LOOTBOX
-- Adicionar campos para lootbox de indicações (respostas)
-- e clarificar que campos existentes são para lootbox de vendas
-- =====================================================

-- Adicionar colunas para lootbox de indicações
ALTER TABLE configuracoes_lootbox 
ADD COLUMN indicacoes_necessarias INT DEFAULT 10 AFTER id,
ADD COLUMN premio_minimo_indicacoes DECIMAL(10,2) DEFAULT 5.00 AFTER indicacoes_necessarias,
ADD COLUMN premio_maximo_indicacoes DECIMAL(10,2) DEFAULT 20.00 AFTER premio_minimo_indicacoes,
ADD COLUMN probabilidade_baixo_indicacoes INT DEFAULT 60 AFTER premio_maximo_indicacoes,
ADD COLUMN probabilidade_medio_indicacoes INT DEFAULT 30 AFTER probabilidade_baixo_indicacoes,
ADD COLUMN probabilidade_alto_indicacoes INT DEFAULT 10 AFTER probabilidade_medio_indicacoes;

-- Renomear colunas existentes para deixar claro que são de vendas
ALTER TABLE configuracoes_lootbox
CHANGE COLUMN premio_minimo premio_minimo_vendas DECIMAL(10,2) DEFAULT 10.00,
CHANGE COLUMN premio_maximo premio_maximo_vendas DECIMAL(10,2) DEFAULT 50.00,
CHANGE COLUMN probabilidade_baixo probabilidade_baixo_vendas INT DEFAULT 60,
CHANGE COLUMN probabilidade_medio probabilidade_medio_vendas INT DEFAULT 30,
CHANGE COLUMN probabilidade_alto probabilidade_alto_vendas INT DEFAULT 10;

-- Atualizar valores existentes para a primeira configuração
UPDATE configuracoes_lootbox SET
  indicacoes_necessarias = 10,
  premio_minimo_indicacoes = 5.00,
  premio_maximo_indicacoes = 20.00,
  probabilidade_baixo_indicacoes = 60,
  probabilidade_medio_indicacoes = 30,
  probabilidade_alto_indicacoes = 10
WHERE id = 1;
