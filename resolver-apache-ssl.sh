#!/bin/bash

# Script para resolver conflito Apache + gerar SSL
# Execute na VPS: bash resolver-apache-ssl.sh

echo "🔧 Resolvendo conflito Apache + SSL"
echo "===================================="
echo ""

# 1. Parar Apache
echo "⏹️  Parando Apache..."
sudo systemctl stop apache2
sudo systemctl disable apache2
echo "✅ Apache parado e desabilitado!"
echo ""

# 2. Verificar se porta 80 está livre
echo "📊 Verificando porta 80..."
sudo netstat -tlnp | grep :80 || echo "✅ Porta 80 livre!"
echo ""

# 3. Reiniciar Nginx
echo "🔄 Reiniciando Nginx..."
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager | head -10
echo ""

# 4. Testar domínio com Nginx
echo "🧪 Testando domínio..."
curl -I http://boraindicar.com.br
echo ""

echo "===================================="
echo "✅ APACHE REMOVIDO!"
echo "===================================="
echo ""
echo "🎯 Agora gere SSL apenas para os domínios com DNS configurado:"
echo ""
echo "sudo certbot --nginx -d boraindicar.com.br -d crm.boraindicar.com.br -d admin.boraindicar.com.br -d indicador.boraindicar.com.br"
echo ""
echo "⚠️  IMPORTANTE: Removi www e api porque não têm DNS configurado ainda."
echo ""
echo "📝 Para adicionar www e api depois:"
echo "1. Acesse Registro.br"
echo "2. Adicione registros DNS:"
echo "   - Tipo A, Nome: www, Valor: 185.217.125.72"
echo "   - Tipo A, Nome: api, Valor: 185.217.125.72"
echo "3. Aguarde propagação (30min-2h)"
echo "4. Execute:"
echo "   sudo certbot --nginx -d www.boraindicar.com.br -d api.boraindicar.com.br"
echo ""
