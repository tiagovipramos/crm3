#!/bin/bash

# Script para corrigir arquivo .env na VPS

echo "🔧 Verificando e corrigindo arquivo .env na VPS..."
echo ""

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env NÃO ENCONTRADO!"
    echo "📝 Criando arquivo .env..."
    
    cat > .env << 'EOF'
# Docker Compose - Variáveis de Ambiente para VPS

# Banco de Dados MySQL
DB_HOST=mysql
DB_NAME=protecar_crm
DB_USER=root
DB_PASSWORD=Crm@VPS2025!Secure#ProdDB
DB_PORT=3306

# Backend
PORT=3001
NODE_ENV=production
JWT_SECRET=vps-prod-jwt-secret-a9f8e7d6c5b4a3f2e1d0c9b8a7e6d5c4b3a2f1e0d9c8b7a6
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://185.217.125.72:3000
NEXT_PUBLIC_API_URL=http://185.217.125.72:3001/api
NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001
EOF
    
    echo "✅ Arquivo .env criado com sucesso!"
else
    echo "✅ Arquivo .env encontrado!"
fi

echo ""
echo "📋 Conteúdo do arquivo .env (DB_PASSWORD mascarado):"
echo ""
cat .env | sed 's/DB_PASSWORD=.*/DB_PASSWORD=***MASCARADO***/'

echo ""
echo "🔍 Verificando variável DB_PASSWORD..."
if grep -q "^DB_PASSWORD=" .env; then
    echo "✅ DB_PASSWORD está definido no .env"
    
    # Verificar se não está vazio
    PASSWORD=$(grep "^DB_PASSWORD=" .env | cut -d'=' -f2)
    if [ -z "$PASSWORD" ]; then
        echo "❌ DB_PASSWORD está VAZIO! Corrigindo..."
        sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=Crm@VPS2025!Secure#ProdDB/' .env
        echo "✅ DB_PASSWORD corrigido!"
    else
        echo "✅ DB_PASSWORD tem valor definido"
    fi
else
    echo "❌ DB_PASSWORD NÃO está definido! Adicionando..."
    echo "DB_PASSWORD=Crm@VPS2025!Secure#ProdDB" >> .env
    echo "✅ DB_PASSWORD adicionado!"
fi

echo ""
echo "🚀 Reiniciando containers..."
docker-compose down
docker-compose up -d

echo ""
echo "⏳ Aguardando 10 segundos para os containers iniciarem..."
sleep 10

echo ""
echo "📊 Verificando logs do backend..."
docker-compose logs --tail=30 backend

echo ""
echo "✅ Script finalizado!"
echo ""
echo "Se ainda houver erro, execute:"
echo "  docker-compose logs -f backend"
