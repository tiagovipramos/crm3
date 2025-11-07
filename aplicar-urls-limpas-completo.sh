#!/bin/bash

# Script completo para aplicar URLs limpas
# Execute na VPS: bash aplicar-urls-limpas-completo.sh

echo "🚀 APLICANDO URLs LIMPAS - COMPLETO"
echo "===================================="
echo ""

# 1. Parar containers
echo "⏹️  Parando containers..."
docker-compose down
echo ""

# 2. Rebuild do frontend com middleware
echo "🔨 Rebuild do frontend (incluindo middleware)..."
docker-compose build --no-cache frontend
echo ""

# 3. Criar configuração correta do Nginx
echo "📝 Configurando Nginx com proxy reverso..."
sudo tee /etc/nginx/sites-available/boraindicar.com.br > /dev/null <<'EOF'
# Site principal - boraindicar.com.br
server {
    listen 80;
    server_name boraindicar.com.br;
    
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

echo "✅ Configuração Nginx criada"
echo ""

# 4. Testar configuração
echo "🧪 Testando configuração Nginx..."
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi
echo ""

# 5. Recarregar Nginx
echo "🔄 Recarregando Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx recarregado"
echo ""

# 6. Subir containers
echo "▶️  Iniciando containers..."
docker-compose up -d
echo ""

# 7. Aguardar
echo "⏳ Aguardando containers iniciarem (15 segundos)..."
sleep 15
echo ""

# 8. Verificar status
echo "📊 Status dos containers:"
docker ps
echo ""

# 9. Testar localmente
echo "🧪 Testando URLs localmente..."
echo "localhost:3000:"
curl -I http://localhost:3000 2>&1 | head -3
echo ""
echo "admin.boraindicar.com.br (sem SSL):"
curl -I http://admin.boraindicar.com.br 2>&1 | head -5
echo ""

# 10. Refazer SSL
echo "🔐 Removendo certificados SSL antigos..."
sudo certbot delete --cert-name boraindicar.com.br --non-interactive
echo ""

echo "🔐 Gerando novos certificados SSL..."
echo "IMPORTANTE: Durante a instalação:"
echo "  - Email: seu@email.com"
echo "  - Termos: Y"
echo "  - EFF: Y ou N"
echo ""
read -p "Pressione ENTER para continuar com o SSL..."

sudo certbot --nginx \
  -d boraindicar.com.br \
  -d crm.boraindicar.com.br \
  -d admin.boraindicar.com.br \
  -d indicador.boraindicar.com.br \
  --redirect

echo ""
echo "===================================="
echo "✅ CONFIGURAÇÃO COMPLETA!"
echo "===================================="
echo ""
echo "🎯 Teste suas URLs:"
echo "   https://admin.boraindicar.com.br/"
echo "   https://crm.boraindicar.com.br/"
echo "   https://indicador.boraindicar.com.br/"
echo ""
echo "O middleware Next.js agora detecta o subdomínio"
echo "e serve o conteúdo correto sem /admin na URL!"
echo ""
