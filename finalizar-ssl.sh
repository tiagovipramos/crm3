#!/bin/bash

# Script final para configurar SSL
# Execute na VPS: bash finalizar-ssl.sh

echo "🎯 Finalizando configuração SSL"
echo "================================"
echo ""

# 1. Criar configuração do domínio
echo "📝 Criando configuração do domínio..."
sudo tee /etc/nginx/sites-available/boraindicar.com.br > /dev/null <<'EOF'
# Site principal - boraindicar.com.br
server {
    listen 80;
    server_name boraindicar.com.br www.boraindicar.com.br;
    
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
        proxy_pass http://localhost:3000/crm;
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
        proxy_pass http://localhost:3000/admin;
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
        proxy_pass http://localhost:3000/indicador;
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

# API Backend - api.boraindicar.com.br
server {
    listen 80;
    server_name api.boraindicar.com.br;
    
    location / {
        proxy_pass http://localhost:3001;
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

echo "✅ Configuração criada!"
echo ""

# 2. Ativar configuração
echo "🔗 Ativando configuração..."
sudo ln -sf /etc/nginx/sites-available/boraindicar.com.br /etc/nginx/sites-enabled/
echo "✅ Link criado!"
echo ""

# 3. Testar configuração
echo "🧪 Testando configuração..."
sudo nginx -t
echo ""

# 4. Recarregar Nginx
echo "🔄 Recarregando Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx recarregado!"
echo ""

# 5. Verificar status
echo "📊 Status do Nginx..."
sudo systemctl status nginx --no-pager | head -15
echo ""

# 6. Instalar plugin do Certbot (se necessário)
echo "📦 Verificando/Instalando plugin Certbot..."
sudo apt install python3-certbot-nginx -y
echo ""

echo "================================"
echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
echo "================================"
echo ""
echo "🎯 Agora teste o acesso HTTP:"
echo "   curl -I http://boraindicar.com.br"
echo ""
echo "Se funcionar, gere os certificados SSL:"
echo ""
echo "sudo certbot --nginx -d boraindicar.com.br -d www.boraindicar.com.br -d crm.boraindicar.com.br -d admin.boraindicar.com.br -d indicador.boraindicar.com.br -d api.boraindicar.com.br"
echo ""
echo "Durante a instalação:"
echo "1. Digite seu email"
echo "2. Aceite os termos (Y)"
echo "3. Compartilhar email (Y ou N)"
echo "4. Escolha opção 2 (redirecionar para HTTPS)"
echo ""
