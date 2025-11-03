-- =============================================
-- MIGRATION 09: Sistema de Follow-up Automático
-- =============================================

-- Tabela de Sequências de Follow-up
CREATE TABLE IF NOT EXISTS followup_sequencias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  fase_inicio ENUM('novo', 'primeiro_contato', 'proposta_enviada', 'convertido', 'perdido') NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  automatico BOOLEAN DEFAULT TRUE,
  prioridade INT DEFAULT 0,
  criado_por VARCHAR(36),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fase (fase_inicio),
  INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Mensagens das Sequências
CREATE TABLE IF NOT EXISTS followup_mensagens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sequencia_id INT NOT NULL,
  ordem INT NOT NULL,
  dias_espera INT NOT NULL DEFAULT 0,
  conteudo TEXT NOT NULL,
  tipo_mensagem ENUM('texto', 'imagem', 'video', 'audio', 'documento') DEFAULT 'texto',
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sequencia_id) REFERENCES followup_sequencias(id) ON DELETE CASCADE,
  INDEX idx_sequencia (sequencia_id, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Leads em Follow-up
CREATE TABLE IF NOT EXISTS followup_leads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  sequencia_id INT NOT NULL,
  status ENUM('ativo', 'pausado', 'concluido', 'cancelado') DEFAULT 'ativo',
  mensagem_atual INT DEFAULT 1,
  data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_proxima_mensagem TIMESTAMP,
  data_conclusao TIMESTAMP NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (sequencia_id) REFERENCES followup_sequencias(id) ON DELETE CASCADE,
  UNIQUE KEY uk_lead_sequencia (lead_id, sequencia_id),
  INDEX idx_status (status),
  INDEX idx_proxima_mensagem (data_proxima_mensagem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Histórico de Envios
CREATE TABLE IF NOT EXISTS followup_envios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  followup_lead_id INT NOT NULL,
  mensagem_id INT NOT NULL,
  enviado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sucesso BOOLEAN DEFAULT TRUE,
  erro TEXT,
  FOREIGN KEY (followup_lead_id) REFERENCES followup_leads(id) ON DELETE CASCADE,
  FOREIGN KEY (mensagem_id) REFERENCES followup_mensagens(id) ON DELETE CASCADE,
  INDEX idx_followup_lead (followup_lead_id),
  INDEX idx_enviado_em (enviado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- VIEW: Estatísticas das Sequências
CREATE OR REPLACE VIEW v_followup_estatisticas AS
SELECT 
  s.id as sequencia_id,
  s.nome as sequencia_nome,
  COUNT(DISTINCT fl.id) as total_leads,
  SUM(CASE WHEN fl.status = 'ativo' THEN 1 ELSE 0 END) as leads_ativos,
  SUM(CASE WHEN fl.status = 'concluido' THEN 1 ELSE 0 END) as leads_concluidos,
  COUNT(DISTINCT fe.id) as total_mensagens_enviadas,
  SUM(CASE WHEN fe.sucesso = TRUE THEN 1 ELSE 0 END) as mensagens_sucesso,
  SUM(CASE WHEN fe.sucesso = FALSE THEN 1 ELSE 0 END) as mensagens_erro
FROM followup_sequencias s
LEFT JOIN followup_leads fl ON s.id = fl.sequencia_id
LEFT JOIN followup_envios fe ON fl.id = fe.followup_lead_id
GROUP BY s.id, s.nome;

-- VIEW: Próximos Envios Programados
CREATE OR REPLACE VIEW v_followup_proximos_envios AS
SELECT 
  fl.id as followup_lead_id,
  l.id as lead_id,
  l.nome as lead_nome,
  l.telefone as lead_telefone,
  s.id as sequencia_id,
  s.nome as sequencia_nome,
  fm.id as mensagem_id,
  fm.conteudo as mensagem_conteudo,
  fl.mensagem_atual,
  fl.data_proxima_mensagem,
  fl.status
FROM followup_leads fl
INNER JOIN leads l ON fl.lead_id = l.id
INNER JOIN followup_sequencias s ON fl.sequencia_id = s.id
INNER JOIN followup_mensagens fm ON s.id = fm.sequencia_id AND fm.ordem = fl.mensagem_atual
WHERE fl.status = 'ativo'
  AND fl.data_proxima_mensagem IS NOT NULL
  AND fl.data_proxima_mensagem <= DATE_ADD(NOW(), INTERVAL 7 DAY)
ORDER BY fl.data_proxima_mensagem ASC;
