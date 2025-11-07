#!/bin/bash

# Script de correção para Nginx + SSL
# Execute na VPS: bash fix-nginx-ssl.sh

set -e

echo "🔧 Corrigindo configuração Nginx + SSL"
echo "========================================"
echo ""

# 1. Verificar status do Nginx
echo "📊 Verificando status do Nginx..."
sudo systemctl status nginx --no-pager || true
echo ""

# 2. Parar Nginx
echo "⏹️  Parando Nginx..."
sudo systemctl stop nginx || true
echo ""

# 3. Remover configuração padrão que pode estar conflitando
echo "🗑️  Removendo configurações conflitantes..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/boraindicar.com.br
echo ""

# 4. Testar configuração do Nginx
echo "🧪 Testando configuração do Nginx..."
sudo nginx -t
echo ""

# 5. Iniciar Nginx
echo "▶️  Iniciando Nginx..."
sudo systemctl start nginx
sudo systemctl status nginx --no-pager
echo ""

# 6. Recriar link simbólico para configuração do domínio
echo "🔗 Ativando configuração do domínio..."
sudo ln -sf /etc/nginx/sites-available/boraindicar.com.br /etc/nginx/sites-enabled/
echo ""

# 7. Testar configuração novamente
echo "🧪 Testando configuração com domínio..."
sudo nginx -t
echo ""

# 8. Recarregar Nginx
echo "🔄 Recarregando Nginx..."
sudo systemctl reload nginx
echo ""

# 9. Instalar plugin Nginx do Certbot
echo "📦 Instalando plugin Nginx do Certbot..."
sudo apt install python3-certbot-nginx -y
echo ""

# 10. Verificar instalação
echo "✅ Verificando instalação do Certbot..."
certbot --version
certbot plugins
echo ""

echo "========================================"
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "========================================"
echo ""
echo "🎯 Agora execute o comando para gerar SSL:"
echo ""
echo "sudo certbot --nginx -d boraindicar.com.br -d www.boraindicar.com.br -d crm.boraindicar.com.br -d admin.boraindicar.com.br -d indicador.boraindicar.com.br -d api.boraindicar.com.br"
echo ""
echo "Se ainda der erro, tente este comando alternativo:"
echo ""
echo "sudo certbot certonly --standalone -d boraindicar.com.br -d www.boraindicar.com.br -d crm.boraindicar.com.br -d admin.boraindicar.com.br -d indicador.boraindicar.com.br -d api.boraindicar.com.br"
echo ""
echo "E depois configure manualmente no Nginx."
echo ""
