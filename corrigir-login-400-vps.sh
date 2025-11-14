#!/bin/bash

# Script para corrigir erro 400 no login em produção
# Aplica correção no lib/api.ts e faz rebuild do frontend

echo "🔧 ============================================"
echo "🔧  Corrigindo Erro 400 no Login"
echo "🔧 ============================================"
echo ""

# Ir para o diretório do projeto
cd ~/crm || exit 1

echo "📥 1. Fazendo pull do código atualizado..."
git pull origin main
echo "✅ Código atualizado"
echo ""

echo "🔍 2. Verificando se correção está presente no código..."
if grep -q "isLoginRoute" lib/api.ts; then
    echo "✅ Correção encontrada no lib/api.ts"
else
    echo "❌ ERRO: Correção não encontrada no lib/api.ts"
    echo "   Certifique-se de que o código foi commitado e enviado ao repositório"
    exit 1
fi
echo ""

echo "🏗️  3. Parando frontend para rebuild..."
docker-compose stop frontend
echo "✅ Frontend parado"
echo ""

echo "🔨 4. Fazendo rebuild do frontend com a correção..."
docker-compose build --no-cache frontend
echo "✅ Build concluído"
echo ""

echo "🚀 5. Iniciando frontend novamente..."
docker-compose up -d frontend
echo "✅ Frontend iniciado"
echo ""

echo "⏳ 6. Aguardando frontend ficar pronto (30 segundos)..."
sleep 30
echo ""

echo "📊 7. Verificando logs do frontend..."
docker-compose logs --tail=50 frontend
echo ""

echo "🔍 8. Verificando logs do backend para erros 400..."
echo "Últimos logs do backend:"
docker-compose logs --tail=20 backend | grep -E "(400|login|erro)" || echo "Nenhum erro 400 recente encontrado"
echo ""

echo "✅ ============================================"
echo "✅  Correção Aplicada!"
echo "✅ ============================================"
echo ""
echo "📝 Próximos passos:"
echo "   1. Limpe o cache do navegador (Ctrl+Shift+Delete)"
echo "   2. Acesse: https://boraindicar.com.br"
echo "   3. Tente fazer login novamente"
echo "   4. Verifique no DevTools > Network que:"
echo "      - Requisição /api/auth/login não tem header Authorization"
echo "      - Status code deve ser 200 (não mais 400)"
echo ""
echo "🔧 Para monitorar logs em tempo real:"
echo "   docker-compose logs -f frontend backend"
echo ""
