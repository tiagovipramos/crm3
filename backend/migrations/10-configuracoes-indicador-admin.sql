-- =====================================================
-- CONFIGURAÇÕES DO SISTEMA DE INDICAÇÕES - PAINEL ADMIN
-- =====================================================

-- =====================================================
-- TABELA 1: CONFIGURAÇÕES DE COMISSÃO
-- =====================================================
CREATE TABLE IF NOT EXISTS configuracoes_comissao (
  id INT PRIMARY KEY AUTO_INCREMENT,
  comissao_resposta DECIMAL(10,2) NOT NULL DEFAULT 2.00,
  comissao_venda DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir valores padrão
INSERT INTO configuracoes_comissao (comissao_resposta, comissao_venda) 
VALUES (2.00, 15.00);

-- =====================================================
-- TABELA 2: CONFIGURAÇÕES DE LOOTBOX
-- =====================================================
CREATE TABLE IF NOT EXISTS configuracoes_lootbox (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendas_necessarias INT NOT NULL DEFAULT 10,
  premio_minimo DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  premio_maximo DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  probabilidade_baixo INT NOT NULL DEFAULT 60,
  probabilidade_medio INT NOT NULL DEFAULT 30,
  probabilidade_alto INT NOT NULL DEFAULT 10,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir valores padrão
INSERT INTO configuracoes_lootbox 
  (vendas_necessarias, premio_minimo, premio_maximo, probabilidade_baixo, probabilidade_medio, probabilidade_alto) 
VALUES (10, 5.00, 50.00, 60, 30, 10);

-- =====================================================
-- TABELA 3: MENSAGENS AUTOMÁTICAS
-- =====================================================
CREATE TABLE IF NOT EXISTS mensagens_automaticas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo ENUM('boas_vindas', 'proposta', 'conversao', 'lootbox') NOT NULL,
  mensagem TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  ordem INT DEFAULT 0,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tipo (tipo),
  INDEX idx_ativo (ativo)
);

-- Inserir mensagens padrão
INSERT INTO mensagens_automaticas (tipo, mensagem, ativo, ordem) VALUES
('boas_vindas', '🎉 Bem-vindo ao programa de indicações! Você ganha R$ 2 quando seu indicado responde e R$ 15 quando ele converte!', TRUE, 1),
('boas_vindas', '👋 Olá! Muito obrigado por se cadastrar! A cada venda você ganha comissões e pode resgatar via PIX!', TRUE, 2),
('proposta', '💰 Parabéns! Seu indicado recebeu uma proposta! R$ 2,00 foram liberados na sua conta!', TRUE, 1),
('conversao', '🎊 INCRÍVEL! Seu indicado converteu! R$ 15,00 adicionados à sua conta! Continue indicando!', TRUE, 1),
('lootbox', '🎁 PARABÉNS! Você ganhou uma CAIXA MISTERIOSA! Prêmio de R$ {valor} creditado!', TRUE, 1);
