#!/bin/bash

echo "============================================"
echo "Diagnóstico Detalhado do Nginx"
echo "============================================"
echo ""

echo "1. Arquivos de configuração do nginx:"
ls -la /etc/nginx/sites-enabled/
echo ""

echo "2. Conteúdo completo de cada arquivo:"
for file in /etc/nginx/sites-enabled/*; do
    echo "=========================================="
    echo "Arquivo: $file"
    echo "=========================================="
    cat "$file"
    echo ""
    echo ""
done

echo "3. Testando ordem de prioridade das rotas:"
echo ""
echo "Teste 1: curl http://localhost:3000/politica-privacidade"
curl -s http://localhost:3000/politica-privacidade | head -10
echo ""
echo ""

echo "Teste 2: curl http://localhost:3001/politica-privacidade"
curl -s http://localhost:3001/politica-privacidade
echo ""
echo ""

echo "Teste 3: curl https://www.boraindicar.com.br/politica-privacidade"
curl -k -s https://www.boraindicar.com.br/politica-privacidade
echo ""
echo ""

echo "4. Verificando qual porta o nginx está redirecionando:"
echo ""
curl -k -v https://www.boraindicar.com.br/politica-privacidade 2>&1 | grep -i "location\|server\|x-powered"
echo ""

echo "============================================"
echo "Fim do diagnóstico"
echo "============================================"
