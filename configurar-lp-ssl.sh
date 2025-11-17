#!/bin/bash

# Script rápido para configurar Landing Page com SSL
# Subdomínio: lp.boraindicar.com.br

set -e

echo "======================================"
echo "CONFIGURAÇÃO SSL - LANDING PAGE"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}[1/5]${NC} Usando configuração temporária sem SSL..."
sudo cp nginx-lp-subdomain-temp.conf /etc/nginx/sites-available/lp.boraindicar.com.br

# Criar link simbólico
if [ ! -L /etc/nginx/sites-enabled/lp.boraindicar.com.br ]; then
    sudo ln -s /etc/nginx/sites-available/lp.boraindicar.com.br /etc/nginx/sites-enabled/
fi

echo -e "${GREEN}[2/5]${NC} Testando configuração do Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo -e "${GREEN}[3/5]${NC} Obtendo certificado SSL..."
sudo certbot --nginx -d lp.boraindicar.com.br --non-interactive --agree-tos --email contato@boraindicar.com.br || {
    echo -e "${YELLOW}Certbot automático falhou. Tentando manualmente...${NC}"
    sudo certbot certonly --nginx -d lp.boraindicar.com.br
}

echo -e "${GREEN}[4/5]${NC} Aplicando configuração com SSL..."
sudo cp nginx-lp-subdomain.conf /etc/nginx/sites-available/lp.boraindicar.com.br

echo -e "${GREEN}[5/5]${NC} Recarregando Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "======================================"
echo -e "${GREEN}✓ SSL CONFIGURADO COM SUCESSO!${NC}"
echo "======================================"
echo ""
echo "Acesse: https://lp.boraindicar.com.br"
echo ""
