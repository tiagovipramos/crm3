#!/bin/bash

# Script para aplicar configuração final da Landing Page

echo "======================================"
echo "APLICANDO CONFIGURAÇÃO FINAL"
echo "======================================"
echo ""

# Copiar configuração final
sudo cp nginx-lp-final.conf /etc/nginx/sites-available/lp.boraindicar.com.br

# Testar configuração
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Configuração OK! Recarregando Nginx..."
    sudo systemctl reload nginx
    echo ""
    echo "======================================"
    echo "✓ PRONTO!"
    echo "======================================"
    echo ""
    echo "Acesse: https://lp.boraindicar.com.br"
    echo ""
else
    echo "✗ Erro na configuração!"
    exit 1
fi
