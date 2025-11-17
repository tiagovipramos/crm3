#!/bin/bash

echo "Aplicando configuração DEFINITIVA..."
sudo cp nginx-lp-definitivo.conf /etc/nginx/sites-available/lp.boraindicar.com.br
sudo nginx -t && sudo systemctl reload nginx
echo "✓ Pronto! Acesse https://lp.boraindicar.com.br"
