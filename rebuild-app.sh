#!/bin/bash

# Script para rebuild da aplicação com middleware
# Execute na VPS: bash rebuild-app.sh

echo "🔄 Iniciando rebuild da aplicação"
echo "=================================="
echo ""

# 1. Parar containers
echo "⏹️  Parando containers..."
docker-compose down
echo "✅ Containers parados"
echo ""

# 2. Rebuild frontend (com middleware)
echo "🔨 Rebuilding frontend..."
docker-compose build --no-cache frontend
echo "✅ Frontend rebuild concluído"
echo ""

# 3. Subir containers
echo "▶️  Iniciando containers..."
docker-compose up -d
echo "✅ Containers iniciados"
echo ""

# 4. Aguardar alguns segundos
echo "⏳ Aguardando inicialização..."
sleep 10
echo ""

# 5. Verificar status
echo "📊 Status dos containers:"
docker-compose ps
echo ""

# 6. Mostrar logs do frontend
echo "📋 Logs do frontend (últimas 20 linhas):"
docker-compose logs --tail=20 frontend
echo ""

echo "=================================="
echo "✅ REBUILD CONCLUÍDO!"
echo "=================================="
echo ""
echo "🎯 Agora teste as URLs:"
echo "   - https://admin.boraindicar.com.br/"
echo "   - https://crm.boraindicar.com.br/"
echo "   - https://indicador.boraindicar.com.br/"
echo ""
echo "Se quiser ver logs em tempo real:"
echo "   docker-compose logs -f frontend"
echo ""
