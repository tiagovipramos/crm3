#!/bin/bash

# Script de diagnóstico VPS
# Execute: bash diagnosticar-vps.sh

echo "🔍 DIAGNÓSTICO VPS"
echo "=================="
echo ""

echo "1️⃣ Verificando Docker Compose..."
echo "--------------------------------"
which docker-compose
docker-compose --version 2>&1 | head -5
echo ""

echo "2️⃣ Verificando Docker..."
echo "------------------------"
docker --version
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "3️⃣ Verificando Nginx..."
echo "-----------------------"
sudo systemctl status nginx --no-pager | head -10
sudo nginx -t
echo ""

echo "4️⃣ Verificando Apache..."
echo "------------------------"
sudo systemctl status apache2 --no-pager | head -5
sudo netstat -tulpn | grep :80
echo ""

echo "5️⃣ Verificando Git/Código..."
echo "----------------------------"
git log --oneline -5
ls -la | grep -E "middleware|rebuild|corrigir"
echo ""

echo "6️⃣ Verificando SSL..."
echo "---------------------"
sudo certbot certificates 2>&1 | head -20
echo ""

echo "7️⃣ Testando URLs localmente..."
echo "-------------------------------"
echo "Testando localhost:3000..."
curl -I http://localhost:3000 2>&1 | head -5
echo ""
echo "Testando admin.boraindicar.com.br..."
curl -I https://admin.boraindicar.com.br 2>&1 | head -10
echo ""

echo "8️⃣ Verificando logs do frontend..."
echo "-----------------------------------"
docker logs crm-frontend-1 --tail=20 2>&1
echo ""

echo "=================="
echo "✅ DIAGNÓSTICO COMPLETO"
echo "=================="
echo ""
echo "Copie TODA a saída acima e envie para análise."
