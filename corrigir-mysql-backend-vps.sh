#!/bin/bash

# Script para corrigir erro de conexão MySQL no backend

echo "🔧 Corrigindo conexão MySQL do backend"

# 1. Verificar variáveis de ambiente
echo ""
echo "📋 Variáveis de ambiente atuais:"
docker exec crm-backend env | grep DB_

# 2. Verificar se MySQL está acessível do backend
echo ""
echo "🧪 Testando conexão MySQL do backend..."
docker exec crm-backend sh -c "apk add --no-cache mysql-client && mysql -h mysql -u root -proot123 -e 'SELECT NOW();'"

# 3. Ver logs completos do backend
echo ""
echo "📋 Logs completos do backend:"
docker-compose logs backend

# 4. Parar containers
echo ""
echo "🛑 Parando containers..."
docker-compose down

# 5. Atualizar .env com configurações corretas
echo ""
echo "📝 Atualizando .env..."
cat > .env << 'EOF'
# Database
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root123
DB_NAME=crm_vipseg

# JWT
JWT_SECRET=seu-secret-super-seguro-aqui-2024

# API URL - USANDO HTTPS
NEXT_PUBLIC_API_URL=https://api.boraindicar.com.br/api

# Server
PORT=3001
NODE_ENV=production
EOF

echo "✅ Arquivo .env atualizado"

# 6. Verificar docker-compose.yml
echo ""
echo "📝 Verificando configuração do MySQL no docker-compose.yml..."
grep -A 10 "mysql:" docker-compose.yml

# 7. Iniciar containers
echo ""
echo "🚀 Iniciando containers..."
docker-compose up -d

# 8. Aguardar MySQL iniciar
echo ""
echo "⏳ Aguardando MySQL iniciar (15 segundos)..."
sleep 15

# 9. Verificar status
echo ""
echo "🔍 Status dos containers:"
docker-compose ps

# 10. Ver logs do backend
echo ""
echo "📋 Logs do backend (últimas 30 linhas):"
docker-compose logs --tail=30 backend

# 11. Testar API
echo ""
echo "🧪 Testando API..."
sleep 5
curl -I http://localhost:3001/api/health

echo ""
echo "✅ Diagnóstico concluído!"
echo ""
echo "📋 Se o erro persistir:"
echo "   1. Verifique se o nome do banco está correto (crm_vipseg)"
echo "   2. Execute: docker exec crm-mysql mysql -u root -proot123 -e 'SHOW DATABASES;'"
echo "   3. Veja logs: docker-compose logs -f backend"
