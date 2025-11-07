#!/bin/bash

# Script de configuração automática Nginx + SSL para boraindicar.com.br
# Execute na VPS: bash setup-nginx-ssl.sh

set -e

echo "🚀 Iniciando configuração Nginx + SSL para boraindicar.com.br"
echo "=============================================================="
echo ""

# 1. Instalar Nginx
echo "📦 Instalando Nginx..."
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
echo "✅ Nginx instalado!"
echo ""

# 2. Configurar Firewall
echo "🔒 Configurando firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow 22
echo "✅ Firewall configurado!"
echo ""

# 3. Criar configuração do Nginx
echo "⚙️  Criando configuração do Nginx..."
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

# 4. Ativar configuração
echo "🔗 Ativando configuração..."
sudo ln -sf /etc/nginx/sites-available/boraindicar.com.br /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
echo "✅ Configuração ativada!"
echo ""

# 5. Testar configuração
echo "🧪 Testando configuração do Nginx..."
sudo nginx -t
echo ""

# 6. Recarregar Nginx
echo "🔄 Recarregando Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx recarregado!"
echo ""

# 7. Instalar Certbot
echo "📦 Instalando Certbot..."
sudo apt install certbot python3-certbot-nginx -y
echo "✅ Certbot instalado!"
echo ""

# 8. Verificar se Docker está rodando
echo "🐳 Verificando containers Docker..."
docker ps
echo ""

echo "=============================================================="
echo "✅ CONFIGURAÇÃO BÁSICA CONCLUÍDA!"
echo "=============================================================="
echo ""
echo "🎯 PRÓXIMO PASSO: Gerar certificados SSL"
echo ""
echo "Execute o seguinte comando:"
echo ""
echo "sudo certbot --nginx -d boraindicar.com.br -d www.boraindicar.com.br -d crm.boraindicar.com.br -d admin.boraindicar.com.br -d indicador.boraindicar.com.br -d api.boraindicar.com.br"
echo ""
echo "Durante a instalação:"
echo "1. Digite seu email"
echo "2. Aceite os termos (Y)"
echo "3. Compartilhar email com EFF (opcional - Y ou N)"
echo "4. Escolha opção 2 (redirecionar HTTP para HTTPS)"
echo ""
echo "=============================================================="
echo ""
echo "Após gerar SSL, teste acessando:"
echo "- https://boraindicar.com.br"
echo "- https://crm.boraindicar.com.br"
echo "- https://admin.boraindicar.com.br"
echo "- https://indicador.boraindicar.com.br"
echo "- https://api.boraindicar.com.br/api/health"
echo ""
