#!/bin/bash

# Script para executar migration de etapas de funil
# Criado em: 2025-01-06

echo "================================================"
echo "🔄 Executando Migration de Etapas de Funil"
echo "================================================"
echo ""

# Carregar variáveis do .env
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '#' | xargs)
    echo "✅ Variáveis carregadas do .env"
else
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

# Verificar se o MySQL está acessível
echo ""
echo "🔍 Verificando conexão com MySQL..."
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ MySQL acessível"
else
    echo "❌ Não foi possível conectar ao MySQL"
    echo "   Host: $DB_HOST"
    echo "   User: $DB_USER"
    exit 1
fi

# Executar migration
echo ""
echo "📝 Executando migration 12-criar-tabela-etapas-funil.sql..."
echo ""

mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < migrations/12-criar-tabela-etapas-funil.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "✅ Migration executada com sucesso!"
    echo "================================================"
    echo ""
    echo "📊 Tabela 'etapas_funil' criada"
    echo "📥 Etapas padrão inseridas para todos os consultores"
    echo ""
    
    # Mostrar estatísticas
    echo "📈 Estatísticas:"
    mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "
        SELECT 
            COUNT(*) as total_etapas,
            COUNT(DISTINCT consultor_id) as total_consultores
        FROM etapas_funil;
    "
else
    echo ""
    echo "================================================"
    echo "❌ Erro ao executar migration"
    echo "================================================"
    exit 1
fi
