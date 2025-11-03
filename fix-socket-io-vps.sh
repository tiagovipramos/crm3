#!/bin/bash

# Script para aplicar correção do Socket.IO na VPS
# Adiciona variável NEXT_PUBLIC_WS_URL necessária para conexão WebSocket

echo "🔧 ============================================"
echo "🔧  Corrigindo Socket.IO WhatsApp na VPS"
echo "🔧 ============================================"
echo ""

# 1. Fazer pull das últimas mudanças
echo "📥 1. Baixando últimas mudanças do Git..."
git pull origin master
if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer pull do Git"
    exit 1
fi
echo "✅ Git pull concluído"
echo ""

# 2. Atualizar arquivo .env com a variável NEXT_PUBLIC_WS_URL
echo "📝 2. Atualizando arquivo .env..."
if [ -f .env ]; then
    # Verificar se a variável já existe
    if grep -q "NEXT_PUBLIC_WS_URL" .env; then
        echo "ℹ️  NEXT_PUBLIC_WS_URL já existe no .env"
    else
        echo "➕ Adicionando NEXT_PUBLIC_WS_URL ao .env"
        echo "NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001" >> .env
        echo "✅ Variável adicionada com sucesso"
    fi
else
    echo "⚠️  Arquivo .env não encontrado, usando .env.vps"
    cp .env.vps .env
    echo "✅ Arquivo .env criado a partir de .env.vps"
fi
echo ""

# 3. Verificar se a variável está no .env
echo "🔍 3. Verificando configuração..."
if grep -q "NEXT_PUBLIC_WS_URL" .env; then
    echo "✅ NEXT_PUBLIC_WS_URL encontrada:"
    grep "NEXT_PUBLIC_WS_URL" .env
else
    echo "❌ NEXT_PUBLIC_WS_URL não encontrada no .env"
    echo "⚠️  Adicionando manualmente..."
    echo "NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001" >> .env
fi
echo ""

# 4. Parar containers
echo "🛑 4. Parando containers..."
docker-compose down
echo "✅ Containers parados"
echo ""

# 5. Rebuild e restart dos containers
echo "🔄 5. Reconstruindo e iniciando containers..."
docker-compose up -d --build
if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar containers"
    exit 1
fi
echo "✅ Containers iniciados"
echo ""

# 6. Aguardar containers iniciarem
echo "⏳ 6. Aguardando containers iniciarem (30s)..."
sleep 30
echo ""

# 7. Verificar status dos containers
echo "📊 7. Status dos containers:"
docker-compose ps
echo ""

# 8. Verificar logs do frontend
echo "📋 8. Últimas linhas do log do frontend:"
docker-compose logs --tail=20 frontend
echo ""

echo "✅ ============================================"
echo "✅  Correção aplicada com sucesso!"
echo "✅ ============================================"
echo ""
echo "🔍 Para verificar:"
echo "   1. Acesse: http://185.217.125.72:3000"
echo "   2. Faça login como consultor"
echo "   3. Abra o modal do WhatsApp"
echo "   4. Clique em 'Conectar WhatsApp'"
echo "   5. O QR Code deve aparecer sem erros"
echo ""
echo "📋 Comandos úteis:"
echo "   - Ver logs: docker-compose logs -f"
echo "   - Ver logs do frontend: docker-compose logs -f frontend"
echo "   - Ver logs do backend: docker-compose logs -f backend"
echo "   - Reiniciar: docker-compose restart"
echo ""
