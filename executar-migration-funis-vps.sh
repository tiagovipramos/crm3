#!/bin/bash

# Script para executar migration de funis admin na VPS
# Executa a migration DENTRO do container Docker

echo "🔄 Executando migration: Funis Admin Global (VPS)"
echo "=================================================="
echo ""

# Verificar se está na raiz do projeto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto!"
    echo "   cd /root/crm && ./executar-migration-funis-vps.sh"
    exit 1
fi

# Carregar variáveis de ambiente
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Variáveis de ambiente carregadas"
else
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

# Verificar se container MySQL está rodando
if ! docker ps | grep -q crm-mysql; then
    echo "❌ Container crm-mysql não está rodando!"
    echo "   Execute: docker-compose up -d"
    exit 1
fi

echo ""
echo "📝 Aplicando migration 13-funis-admin-global.sql..."
echo ""

# Executar migration usando docker exec (ignora erros de coluna duplicada)
docker exec -i crm-mysql mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} << 'EOF' 2>&1 | grep -v "Using a password"
-- Migration: Permitir que admin gerencie funis globais
-- Ignora erro se coluna já existe

-- Adicionar coluna global (ignora erro se já existe)
SET @sql = 'ALTER TABLE etapas_funil ADD COLUMN global BOOLEAN DEFAULT FALSE COMMENT ''Etapa global gerenciada pelo admin''';
SET @sqlCheck = (SELECT IF(COUNT(*) = 0, @sql, 'SELECT ''Coluna global já existe''') 
                 FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = DATABASE() 
                 AND TABLE_NAME = 'etapas_funil' 
                 AND COLUMN_NAME = 'global');
PREPARE stmt FROM @sqlCheck;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Criar índice (ignora erro se já existe)
CREATE INDEX IF NOT EXISTS idx_etapas_global ON etapas_funil(global);

-- Permitir que consultor_id seja NULL
ALTER TABLE etapas_funil MODIFY COLUMN consultor_id INT NULL COMMENT 'NULL = etapa global do sistema';

-- Criar etapas globais padrão (INSERT IGNORE evita duplicatas)
INSERT IGNORE INTO etapas_funil (id, consultor_id, nome, cor, ordem, sistema, ativo, global)
VALUES
  ('novo_lead_global', NULL, 'Novo Lead', '#3B82F6', 1, TRUE, TRUE, TRUE),
  ('contato_inicial_global', NULL, 'Contato Inicial', '#10B981', 2, TRUE, TRUE, TRUE),
  ('qualificacao_global', NULL, 'Qualificação', '#F59E0B', 3, TRUE, TRUE, TRUE),
  ('proposta_global', NULL, 'Proposta', '#8B5CF6', 4, TRUE, TRUE, TRUE),
  ('negociacao_global', NULL, 'Negociação', '#EC4899', 5, TRUE, TRUE, TRUE),
  ('fechamento_global', NULL, 'Fechamento', '#059669', 6, TRUE, TRUE, TRUE);
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration aplicada com sucesso!"
    echo ""
    
    # Verificar quantas etapas globais foram criadas
    ETAPAS_COUNT=$(docker exec crm-mysql mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} -sN -e "SELECT COUNT(*) FROM etapas_funil WHERE global = TRUE;" 2>/dev/null)
    
    echo "📊 Resumo das alterações:"
    echo "  ✅ Coluna 'global' verificada/criada"
    echo "  ✅ Consultor_id configurado para aceitar NULL"
    echo "  ✅ ${ETAPAS_COUNT} etapas globais no banco"
    echo ""
    
    # Mostrar etapas criadas
    echo "📋 Etapas globais disponíveis:"
    docker exec crm-mysql mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} -e "SELECT ordem, nome, cor FROM etapas_funil WHERE global = TRUE ORDER BY ordem;" 2>/dev/null | grep -v "Using a password"
    
    echo ""
    echo "🔄 Reinicie o backend para aplicar as mudanças:"
    echo "   docker-compose restart backend"
    echo ""
else
    echo ""
    echo "❌ Erro ao aplicar migration!"
    exit 1
fi
