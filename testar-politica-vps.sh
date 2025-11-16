#!/bin/bash

echo "============================================"
echo "Testando Página de Política de Privacidade"
echo "============================================"
echo ""

# Teste 1: Acesso direto ao frontend (porta 3000)
echo "1. Testando acesso direto ao frontend (porta 3000):"
echo "curl http://localhost:3000/politica-privacidade"
curl -s http://localhost:3000/politica-privacidade | head -50
echo ""
echo ""

# Teste 2: Verificar se a rota existe no Next.js
echo "2. Verificando estrutura de arquivos:"
ls -la app/politica-privacidade/
echo ""

# Teste 3: Verificar logs do frontend
echo "3. Logs recentes do frontend:"
docker-compose logs frontend | tail -20
echo ""

# Teste 4: Verificar se há erros de build
echo "4. Verificando se há erros de build no container:"
docker-compose exec -T frontend ls -la /app/app/politica-privacidade/ 2>&1
echo ""

# Teste 5: Testar outras rotas do Next.js
echo "5. Testando outras rotas do Next.js:"
echo "- Rota /admin:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin
echo ""
echo "- Rota /crm:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/crm
echo ""
echo "- Rota /indicador:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/indicador
echo ""
echo "- Rota /politica-privacidade:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/politica-privacidade
echo ""
echo ""

# Teste 6: Verificar configuração do nginx/proxy
echo "6. Verificando se há reverse proxy configurado:"
if command -v nginx &> /dev/null; then
    echo "Nginx instalado. Verificando configuração..."
    nginx -t 2>&1
    echo ""
    echo "Configuração do site:"
    cat /etc/nginx/sites-enabled/* 2>/dev/null | grep -A 10 "location"
else
    echo "Nginx não encontrado ou não configurado"
fi
echo ""

echo "============================================"
echo "Diagnóstico concluído!"
echo "============================================"
