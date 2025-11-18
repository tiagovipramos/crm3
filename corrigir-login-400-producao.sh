#!/bin/bash

echo "=========================================="
echo "  CORREÇÃO AUTOMÁTICA - ERRO 400 LOGIN"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Verificar se está executando no servidor correto
echo "1. Verificando ambiente..."
if [ ! -f "/root/crm/docker-compose.yml" ]; then
    print_error "Este script deve ser executado no servidor VPS em /root/crm/"
    exit 1
fi
print_status "Ambiente verificado"
echo ""

# 2. Fazer backup da configuração atual do NGINX
echo "2. Fazendo backup da configuração do NGINX..."
sudo cp /etc/nginx/sites-enabled/boraindicar.com.br /etc/nginx/sites-enabled/boraindicar.com.br.backup.$(date +%Y%m%d_%H%M%S)
print_status "Backup criado"
echo ""

# 3. Criar configuração corrigida do NGINX
echo "3. Criando configuração corrigida do NGINX..."
cat > /tmp/nginx-corrigido.conf << 'EOF'
server {
    listen 80;
    server_name boraindicar.com.br www.boraindicar.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name boraindicar.com.br www.boraindicar.com.br;

    ssl_certificate /etc/letsencrypt/live/boraindicar.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/boraindicar.com.br/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 20M;

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # IMPORTANTE: Garantir que o body seja passado
        proxy_request_buffering off;
        proxy_buffering off;
        
        # Timeouts aumentados
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Headers adicionais para garantir o body
        proxy_set_header Content-Type $content_type;
        proxy_set_header Content-Length $content_length;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads/ {
        proxy_pass http://localhost:3001/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
print_status "Configuração criada"
echo ""

# 4. Testar nova configuração
echo "4. Testando nova configuração do NGINX..."
sudo cp /tmp/nginx-corrigido.conf /etc/nginx/sites-enabled/boraindicar.com.br
if sudo nginx -t; then
    print_status "Configuração válida"
else
    print_error "Erro na configuração do NGINX. Restaurando backup..."
    sudo cp /etc/nginx/sites-enabled/boraindicar.com.br.backup.* /etc/nginx/sites-enabled/boraindicar.com.br
    exit 1
fi
echo ""

# 5. Aplicar configuração
echo "5. Aplicando nova configuração..."
sudo systemctl reload nginx
print_status "NGINX recarregado"
echo ""

# 6. Reiniciar backend para garantir
echo "6. Reiniciando backend..."
cd /root/crm
docker-compose restart backend
sleep 5
print_status "Backend reiniciado"
echo ""

# 7. Verificar se serviços estão rodando
echo "7. Verificando serviços..."
if docker-compose ps | grep -q "Up"; then
    print_status "Containers estão rodando"
else
    print_error "Erro: Containers não estão rodando"
    docker-compose ps
    exit 1
fi
echo ""

# 8. Testar login direto no backend
echo "8. Testando login direto no backend (sem NGINX)..."
BACKEND_TEST=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@protecar.com","senha":"Admin@2024"}' \
  -w "\n%{http_code}")

BACKEND_CODE=$(echo "$BACKEND_TEST" | tail -1)
BACKEND_BODY=$(echo "$BACKEND_TEST" | head -n -1)

if [ "$BACKEND_CODE" = "200" ]; then
    print_status "Backend respondendo corretamente (200 OK)"
elif [ "$BACKEND_CODE" = "401" ]; then
    print_warning "Backend respondeu 401 - Credenciais podem estar incorretas"
    echo "Response: $BACKEND_BODY"
else
    print_error "Backend respondeu com código: $BACKEND_CODE"
    echo "Response: $BACKEND_BODY"
fi
echo ""

# 9. Testar login através do NGINX
echo "9. Testando login através do NGINX..."
NGINX_TEST=$(curl -s -k -X POST https://boraindicar.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@protecar.com","senha":"Admin@2024"}' \
  -w "\n%{http_code}")

NGINX_CODE=$(echo "$NGINX_TEST" | tail -1)
NGINX_BODY=$(echo "$NGINX_TEST" | head -n -1)

if [ "$NGINX_CODE" = "200" ]; then
    print_status "NGINX respondendo corretamente (200 OK)"
    echo ""
    echo -e "${GREEN}=========================================="
    echo "  ✓ CORREÇÃO APLICADA COM SUCESSO!"
    echo "==========================================${NC}"
elif [ "$NGINX_CODE" = "401" ]; then
    print_warning "NGINX respondeu 401 - Credenciais podem estar incorretas, mas a comunicação está OK"
    echo "Response: $NGINX_BODY"
else
    print_error "NGINX respondeu com código: $NGINX_CODE"
    echo "Response: $NGINX_BODY"
    echo ""
    print_warning "O erro persiste. Executando diagnóstico adicional..."
    echo ""
    echo "Últimas linhas do log do backend:"
    docker logs crm-backend --tail 20
fi
echo ""

# 10. Mostrar resumo
echo "=========================================="
echo "  RESUMO DA CORREÇÃO"
echo "=========================================="
echo ""
echo "✓ Backup criado em: /etc/nginx/sites-enabled/boraindicar.com.br.backup.*"
echo "✓ Configuração NGINX atualizada com:"
echo "  - proxy_request_buffering off"
echo "  - proxy_buffering off"
echo "  - Headers Content-Type e Content-Length preservados"
echo "  - client_max_body_size 20M"
echo "✓ Backend reiniciado"
echo ""
echo "Teste manual:"
echo "curl -X POST https://boraindicar.com.br/api/auth/login \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"admin@protecar.com\",\"senha\":\"Admin@2024\"}'"
echo ""
echo "Monitorar logs:"
echo "docker logs -f crm-backend"
echo ""
echo "=========================================="
