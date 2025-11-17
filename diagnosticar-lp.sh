#!/bin/bash

echo "======================================"
echo "DIAGNÓSTICO - LANDING PAGE"
echo "======================================"
echo ""

echo "1. Testando porta 3000 diretamente:"
curl -s http://localhost:3000/lp | head -20
echo ""
echo ""

echo "2. Configuração ativa do Nginx:"
cat /etc/nginx/sites-enabled/lp.boraindicar.com.br | grep -A 5 "location /"
echo ""
echo ""

echo "3. Testando subdomínio localmente:"
curl -H "Host: lp.boraindicar.com.br" http://localhost | head -20
echo ""
echo ""

echo "4. Verificando DNS:"
nslookup lp.boraindicar.com.br
echo ""

echo "5. Logs recentes do Nginx:"
sudo tail -20 /var/log/nginx/lp.boraindicar.com.br.access.log
echo ""
