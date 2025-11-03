#!/bin/bash

# Script para Redeploy do CRM na VPS
# Este script atualiza as variáveis de ambiente e reconstrói os containers

echo "🚀 ============================================"
echo "🚀  Iniciando Redeploy do CRM na VPS"
echo "🚀 ============================================"
echo ""

# 1. Copiar arquivo de configuração
echo "📋 Copiando configurações de produção..."
cp .env.vps .env
echo "✅ Arquivo .env atualizado"
echo ""

# 2. Parar containers atuais
echo "🛑 Parando containers..."
docker-compose down
echo "✅ Containers parados"
echo ""

# 3. Rebuild dos containers com novas variáveis
echo "🔨 Reconstruindo containers..."
docker-compose build --no-cache
echo "✅ Containers reconstruídos"
echo ""

# 4. Iniciar containers
echo "▶️  Iniciando containers..."
docker-compose up -d
echo "✅ Containers iniciados"
echo ""

# 5. Verificar status
echo "🔍 Verificando status dos containers..."
docker-compose ps
echo ""

# 6. Mostrar logs
echo "📋 Últimas linhas dos logs:"
echo "-------------------------------------------"
docker-compose logs --tail=20
echo "-------------------------------------------"
echo ""

echo "✅ ============================================"
echo "✅  Redeploy Concluído!"
echo "✅ ============================================"
echo ""
echo "🌐 Frontend: http://185.217.125.72:3000"
echo "🔧 Backend:  http://185.217.125.72:3001/api"
echo ""
echo "Para ver logs em tempo real, use:"
echo "  docker-compose logs -f"
echo ""
