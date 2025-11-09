-- Migration: Mensagens e Áudios Pré-Definidos
-- Criar tabela para mensagens e áudios pré-definidos que podem ser usados no chat

CREATE TABLE IF NOT EXISTS mensagens_predefinidas (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tipo ENUM('mensagem', 'audio') NOT NULL DEFAULT 'mensagem',
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT,
    arquivo_url TEXT,
    duracao_audio INT,
    ordem INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo),
    INDEX idx_ativo (ativo),
    INDEX idx_ordem (ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir algumas mensagens de exemplo
INSERT INTO mensagens_predefinidas (tipo, titulo, conteudo, ordem, ativo) VALUES
('mensagem', 'Boas-vindas', 'Olá! Seja bem-vindo(a)! Como posso ajudar você hoje? 😊', 1, TRUE),
('mensagem', 'Horário de Atendimento', 'Nosso horário de atendimento é de Segunda a Sexta, das 9h às 18h. 🕐', 2, TRUE),
('mensagem', 'Informações sobre Produto', 'Temos ótimas opções de produtos para você! Qual o seu interesse? 🚗', 3, TRUE),
('mensagem', 'Agendamento', 'Gostaria de agendar uma visita? Temos disponibilidade para esta semana! 📅', 4, TRUE),
('mensagem', 'Agradecimento', 'Muito obrigado pelo contato! Estamos à disposição para ajudá-lo(a)! 🙏', 5, TRUE);
