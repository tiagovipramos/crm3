#!/bin/bash

# Script para executar a migration de funis admin global
# Adiciona suporte para admin gerenciar funis globais

echo "🔄 Executando migration: Funis Admin Global"
echo "==========================================="
echo ""

# Carregar variáveis de ambiente (do diretório raiz do projeto)
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
    echo "✅ Variáveis de ambiente carregadas"
elif [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Variáveis de ambiente carregadas"
else
    echo "❌ Arquivo .env não encontrado!"
    echo "   Procurado em: ../.env e .env"
    exit 1
fi

# Executar migration
echo ""
echo "📝 Aplicando migration 13-funis-admin-global.sql..."

mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < migrations/13-funis-admin-global.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration aplicada com sucesso!"
    echo ""
    echo "📊 Resumo das alterações:"
    echo "  - Adicionada coluna 'global' na tabela etapas_funil"
    echo "  - Consultor_id agora pode ser NULL para etapas globais"
    echo "  - Criadas 6 etapas globais padrão do sistema"
    echo "  - Admin agora pode gerenciar funis globais"
    echo ""
    echo "🔄 Reinicie o backend para aplicar as mudanças:"
    echo "   docker-compose restart backend"
else
    echo ""
    echo "❌ Erro ao aplicar migration!"
    exit 1
fi
