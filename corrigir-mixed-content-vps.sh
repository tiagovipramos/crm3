#!/bin/bash

# Script para corrigir Mixed Content (HTTP/HTTPS) no VPS
# Configura a API para usar HTTPS através do domínio

echo "🔧 Corrigindo Mixed Content - Configurando API com HTTPS"

# 1. Parar containers
echo "🛑 Parando containers..."
docker-compose down

# 2. Atualizar .env com URL HTTPS
echo "📝 Atualizando variável de ambiente..."
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

# 3. Configurar Nginx para proxy reverso da API
echo "🌐 Configurando Nginx para API..."
cat > /etc/nginx/sites-available/api.boraindicar.com.br << 'NGINX_EOF'
server {
    listen 80;
    server_name api.boraindicar.com.br;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.boraindicar.com.br;

    # Certificados SSL (Certbot irá adicionar)
    # ssl_certificate /etc/letsencrypt/live/api.boraindicar.com.br/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api.boraindicar.com.br/privkey.pem;

    # Proxy para o backend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

# 4. Ativar configuração do Nginx
echo "🔗 Ativando configuração do Nginx..."
ln -sf /etc/nginx/sites-available/api.boraindicar.com.br /etc/nginx/sites-enabled/

# 5. Testar configuração do Nginx
echo "🧪 Testando configuração do Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração do Nginx OK"
    
    # 6. Recarregar Nginx
    echo "🔄 Recarregando Nginx..."
    systemctl reload nginx
    
    # 7. Obter certificado SSL com Certbot
    echo "🔐 Obtendo certificado SSL..."
    certbot --nginx -d api.boraindicar.com.br --non-interactive --agree-tos --email admin@boraindicar.com.br
    
    # 8. Rebuild e restart dos containers
    echo "🐳 Reconstruindo containers..."
    docker-compose build
    
    echo "🚀 Iniciando containers..."
    docker-compose up -d
    
    echo ""
    echo "✅ Configuração concluída!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Adicione o registro DNS: api.boraindicar.com.br -> $( curl -s ifconfig.me )"
    echo "2. Aguarde a propagação do DNS (pode levar alguns minutos)"
    echo "3. Teste o acesso: https://api.boraindicar.com.br/api/health"
    echo ""
    echo "🌐 URLs configuradas:"
    echo "   Frontend: https://boraindicar.com.br"
    echo "   API: https://api.boraindicar.com.br/api"
    echo ""
else
    echo "❌ Erro na configuração do Nginx"
    echo "Execute: nginx -t para ver os erros"
fi
