#!/bin/bash

# Script para corrigir erro 502 e CORS na API

echo "🔧 Corrigindo erro 502 e CORS na API"

# 1. Verificar se o backend está rodando
echo "🔍 Verificando status dos containers..."
docker-compose ps

# 2. Ver logs do backend
echo ""
echo "📋 Logs do backend (últimas 50 linhas):"
docker-compose logs --tail=50 backend

# 3. Verificar se o backend está respondendo internamente
echo ""
echo "🧪 Testando backend internamente..."
docker exec crm-backend curl -s http://localhost:3001/api/health || echo "❌ Backend não está respondendo"

# 4. Reiniciar backend
echo ""
echo "🔄 Reiniciando backend..."
docker-compose restart backend

# 5. Aguardar backend iniciar
echo "⏳ Aguardando backend iniciar (10 segundos)..."
sleep 10

# 6. Testar novamente
echo ""
echo "🧪 Testando backend após reinício..."
docker exec crm-backend curl -s http://localhost:3001/api/health

# 7. Verificar configuração do Nginx
echo ""
echo "📝 Verificando configuração do Nginx para API..."
cat /etc/nginx/sites-enabled/api.boraindicar.com.br

# 8. Testar Nginx
echo ""
echo "🧪 Testando configuração do Nginx..."
nginx -t

# 9. Recarregar Nginx
echo ""
echo "🔄 Recarregando Nginx..."
systemctl reload nginx

# 10. Testar API externamente
echo ""
echo "🌐 Testando API externamente..."
curl -I https://api.boraindicar.com.br/api/health

echo ""
echo "✅ Diagnóstico concluído!"
echo ""
echo "📋 Se o erro persistir, execute:"
echo "   docker-compose logs -f backend"
echo "   para ver os logs em tempo real"
