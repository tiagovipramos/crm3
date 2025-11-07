#!/bin/bash

# Script para corrigir Mixed Content (HTTPS -> HTTP)
# Execute na VPS: bash corrigir-mixed-content.sh

echo "🔧 Corrigindo Mixed Content"
echo "============================"
echo ""

# 1. Atualizar .env na VPS
echo "📝 Atualizando .env..."
cat > .env <<'EOF'
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
FRONTEND_URL=https://boraindicar.com.br
NEXT_PUBLIC_API_URL=https://boraindicar.com.br/api
NEXT_PUBLIC_WS_URL=https://boraindicar.com.br

# IMPORTANTE PARA VPS:
# 1. Este arquivo contém configurações para produção na VPS
# 2. URLs agora usam HTTPS com domínio
EOF

echo "✅ .env atualizado"
echo ""

# 2. Atualizar configuração Nginx para incluir proxy da API
echo "📝 Atualizando Nginx para fazer proxy da API..."
sudo tee /etc/nginx/sites-available/boraindicar.com.br > /dev/null <<'EOF'
# Site principal - boraindicar.com.br
server {
    listen 80;
    server_name boraindicar.com.br;
    
    # Proxy para API
    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Proxy para WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Proxy para frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# CRM - crm.boraindicar.com.br
server {
    listen 80;
    server_name crm.boraindicar.com.br;
    
    # Proxy para API
    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Proxy para WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin - admin.boraindicar.com.br
server {
    listen 80;
    server_name admin.boraindicar.com.br;
    
    # Proxy para API
    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Proxy para WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Indicador - indicador.boraindicar.com.br
server {
    listen 80;
    server_name indicador.boraindicar.com.br;
    
    # Proxy para API
    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Proxy para WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo "✅ Configuração Nginx atualizada"
echo ""

# 3. Testar configuração
echo "🧪 Testando Nginx..."
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração!"
    exit 1
fi
echo ""

# 4. Recarregar Nginx
echo "🔄 Recarregando Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx recarregado"
echo ""

# 5. Parar containers
echo "⏹️  Parando containers..."
docker-compose down
echo ""

# 6. Rebuild backend e frontend
echo "🔨 Rebuild backend (CORS atualizado)..."
docker-compose build --no-cache backend
echo ""

echo "🔨 Rebuild frontend (URLs HTTPS)..."
docker-compose build --no-cache frontend
echo ""

# 7. Subir containers
echo "▶️  Iniciando containers..."
docker-compose up -d
echo ""

# 8. Aguardar
echo "⏳ Aguardando (15 segundos)..."
sleep 15
echo ""

# 9. Refazer SSL
echo "🔐 Refazendo SSL com as novas configurações..."
sudo certbot delete --cert-name boraindicar.com.br --non-interactive
echo ""
sudo certbot --nginx \
  -d boraindicar.com.br \
  -d crm.boraindicar.com.br \
  -d admin.boraindicar.com.br \
  -d indicador.boraindicar.com.br \
  --non-interactive \
  --agree-tos \
  --email tiagoramos@msn.com \
  --redirect

echo ""
echo "===================================="
echo "✅ MIXED CONTENT CORRIGIDO!"
echo "===================================="
echo ""
echo "Agora a API é acessada via:"
echo "   https://admin.boraindicar.com.br/api"
echo "   https://crm.boraindicar.com.br/api"
echo "   https://indicador.boraindicar.com.br/api"
echo ""
echo "Teste o login agora!"
echo ""
