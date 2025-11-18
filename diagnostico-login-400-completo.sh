#!/bin/bash

echo "=========================================="
echo "  DIAGNÓSTICO COMPLETO - ERRO 400 LOGIN"
echo "=========================================="
echo ""

# 1. Verificar se o backend está respondendo
echo "1. Testando conexão com o backend..."
curl -I http://localhost:3001/api/health
echo ""

# 2. Testar login diretamente no backend (sem passar pelo nginx)
echo "2. Testando login direto no backend..."
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@protecar.com","senha":"Admin@2024"}' \
  -v
echo ""

# 3. Testar login através do nginx
echo "3. Testando login através do nginx..."
curl -X POST https://boraindicar.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@protecar.com","senha":"Admin@2024"}' \
  -v
echo ""

# 4. Verificar logs do backend em tempo real
echo "4. Últimas linhas do log do backend:"
docker logs crm-backend --tail 50
echo ""

# 5. Verificar logs do nginx
echo "5. Últimas linhas do erro do nginx:"
tail -50 /var/log/nginx/error.log
echo ""

# 6. Verificar configuração do nginx
echo "6. Verificando configuração do nginx para a rota /api/auth/login..."
grep -A 10 "location /api" /etc/nginx/sites-enabled/boraindicar.com.br
echo ""

# 7. Verificar variáveis de ambiente do container
echo "7. Variáveis de ambiente do backend:"
docker exec crm-backend env | grep -E "(JWT_SECRET|DB_|NODE_ENV|FRONTEND_URL)"
echo ""

# 8. Verificar se o banco de dados está acessível
echo "8. Testando conexão com o banco de dados..."
docker exec crm-mysql mysql -u root -p"Crm@VPS2025!Secure#ProdDB" -e "SELECT COUNT(*) as total_consultores FROM protecar_crm.consultores;"
echo ""

echo "=========================================="
echo "  DIAGNÓSTICO CONCLUÍDO"
echo "=========================================="
