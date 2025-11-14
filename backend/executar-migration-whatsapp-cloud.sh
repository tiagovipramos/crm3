#!/bin/bash

# Script para executar migration do WhatsApp Cloud API no Linux/Mac
# Autor: Sistema CRM
# Data: 2025-11-14

echo "============================================"
echo "  Migration: WhatsApp Cloud API"
echo "============================================"
echo ""

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "Por favor, crie o arquivo .env com as configurações do banco de dados."
    echo ""
    exit 1
fi

# Ler variáveis do .env
echo "📄 Lendo configurações do arquivo .env..."
source .env

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}

echo "✅ Configurações carregadas:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

if [ -z "$DB_NAME" ]; then
    echo "❌ DB_NAME não encontrado no arquivo .env!"
    echo ""
    exit 1
fi

# Perguntar senha se não estiver no .env
if [ -z "$DB_PASSWORD" ]; then
    read -sp "Digite a senha do banco de dados: " DB_PASSWORD
    echo ""
    echo ""
fi

echo "🚀 Executando migration..."
echo ""

# Verificar se o arquivo de migration existe
if [ ! -f "migrations/15-whatsapp-cloud-api.sql" ]; then
    echo "❌ Arquivo de migration não encontrado: migrations/15-whatsapp-cloud-api.sql"
    echo ""
    exit 1
fi

# Verificar se mysql está disponível
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL CLI não encontrado!"
    echo ""
    echo "Opções:"
    echo "1. Instale o MySQL CLI: sudo apt-get install mysql-client (Ubuntu/Debian)"
    echo "                        brew install mysql-client (Mac)"
    echo "2. Execute a migration manualmente via phpMyAdmin ou outro cliente"
    echo ""
    exit 1
fi

# Executar migration usando mysql CLI
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < migrations/15-whatsapp-cloud-api.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================"
    echo "  ✅ Migration executada com sucesso!"
    echo "============================================"
    echo ""
    echo "As seguintes colunas foram adicionadas à tabela 'consultores':"
    echo "  • whatsapp_access_token"
    echo "  • whatsapp_phone_number_id"
    echo "  • whatsapp_business_account_id"
    echo "  • whatsapp_webhook_verify_token"
    echo ""
    echo "📚 Próximos passos:"
    echo "  1. Configure sua conta no Facebook Developers"
    echo "  2. Obtenha o Access Token e Phone Number ID"
    echo "  3. Configure no frontend do CRM"
    echo ""
    echo "Consulte o arquivo MIGRACAO-WHATSAPP-API-OFICIAL.md para instruções detalhadas."
    echo ""
else
    echo ""
    echo "❌ Erro ao executar migration!"
    echo ""
    exit 1
fi
