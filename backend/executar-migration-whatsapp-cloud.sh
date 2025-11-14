#!/bin/bash

# Script para executar migration 15 - WhatsApp Business Cloud API
# Data: 14/11/2025

echo "🚀 ============================================"
echo "🚀  Executando Migration 15"
echo "🚀  WhatsApp Business Cloud API"
echo "🚀 ============================================"
echo ""

# Verificar se o container MySQL está rodando
if ! docker ps | grep -q crm-mysql; then
    echo "❌ Erro: Container MySQL não está rodando!"
    echo "Execute: docker-compose up -d"
    exit 1
fi

echo "📊 Conectando ao banco de dados..."
echo ""

# Executar a migration
docker exec -i crm-mysql mysql -uroot -p'Crm@VPS2025!Secure#ProdDB' protecar_crm < migrations/15-whatsapp-cloud-api.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ============================================"
    echo "✅  Migration 15 executada com sucesso!"
    echo "✅ ============================================"
    echo ""
    echo "📝 Colunas WhatsApp Cloud API adicionadas:"
    echo "   - whatsapp_access_token"
    echo "   - whatsapp_phone_number_id"
    echo "   - whatsapp_business_account_id"
    echo "   - whatsapp_webhook_verify_token"
    echo ""
    echo "🔄 Agora reinicie o backend: docker-compose restart backend"
    echo ""
else
    echo ""
    echo "❌ ============================================"
    echo "❌  Erro ao executar migration!"
    echo "❌ ============================================"
    echo ""
    exit 1
fi
