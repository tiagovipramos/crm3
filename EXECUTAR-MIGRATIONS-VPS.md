# 🔧 Executar Migrations no Banco de Dados - VPS

## ❌ Problema identificado:
```
Table 'protecar_crm.consultores' doesn't exist
```

Apenas a tabela `admins` existe. Faltam todas as outras tabelas do sistema.

---

## ✅ SOLUÇÃO - Execute na VPS:

```bash
# 1. Entrar no container MySQL e executar as migrations manualmente
docker-compose exec mysql mysql -u protecar_user -pprotecar_dev_2025 protecar_crm << 'EOF'

-- Criar tabela consultores
CREATE TABLE IF NOT EXISTS consultores (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  celular VARCHAR(20),
  avatar TEXT,
  sessao_whatsapp TEXT,
  status_conexao VARCHAR(50) DEFAULT 'offline',
  numero_whatsapp VARCHAR(50),
  tipo VARCHAR(20) DEFAULT 'consultor',
  ativo BOOLEAN DEFAULT TRUE,
  sistema_online BOOLEAN DEFAULT FALSE,
  ultimo_acesso TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criar tabela leads
CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  celular VARCHAR(20),
  email VARCHAR(255),
  cpf VARCHAR(14),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(9),
  data_nascimento DATE,
  profissao VARCHAR(100),
  empresa VARCHAR(100),
  cargo VARCHAR(100),
  renda_mensal DECIMAL(10,2),
  observacoes TEXT,
  tags TEXT,
  status VARCHAR(50) DEFAULT 'novo',
  origem VARCHAR(100),
  consultor_id VARCHAR(36),
  funil VARCHAR(50) DEFAULT 'lead',
  pontuacao INT DEFAULT 0,
  ultima_interacao TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE SET NULL
);

-- Criar tabela mensagens
CREATE TABLE IF NOT EXISTS mensagens (
  id VARCHAR(36) PRIMARY KEY,
  lead_id VARCHAR(36) NOT NULL,
  consultor_id VARCHAR(36),
  conteudo TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'texto',
  remetente VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'enviada',
  media_url TEXT,
  media_name VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE SET NULL
);

-- Criar tabela tarefas
CREATE TABLE IF NOT EXISTS tarefas (
  id VARCHAR(36) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  status VARCHAR(50) DEFAULT 'pendente',
  prioridade VARCHAR(50) DEFAULT 'media',
  data_vencimento TIMESTAMP NULL,
  consultor_id VARCHAR(36),
  lead_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE SET NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

-- Criar tabela followups
CREATE TABLE IF NOT EXISTS followups (
  id VARCHAR(36) PRIMARY KEY,
  lead_id VARCHAR(36) NOT NULL,
  consultor_id VARCHAR(36),
  tipo VARCHAR(50) NOT NULL,
  descricao TEXT,
