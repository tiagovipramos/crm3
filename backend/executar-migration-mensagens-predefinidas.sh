#!/bin/bash

# Script para executar migration 13 - Mensagens e Áudios Pré-Definidos
# Data: 08/11/2025

echo "🚀 ============================================"
echo "🚀  Executando Migration 13"
echo "🚀  Mensagens e Áudios Pré-Definidos"
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
docker exec -i crm-mysql mysql -uroot -p'Crm@VPS2025!Secure#ProdDB' protecar_crm < backend/migrations/13-mensagens-audios-predefinidos.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ============================================"
    echo "✅  Migration 13 executada com sucesso!"
    echo "✅ ============================================"
    echo ""
    echo "📝 Tabela mensagens_predefinidas criada"
    echo "📝 Tabela audios_predefinidos criada"
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
