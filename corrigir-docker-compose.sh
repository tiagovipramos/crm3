#!/bin/bash

# Script para corrigir problema do docker-compose com paramiko
# Execute na VPS: bash corrigir-docker-compose.sh

echo "🔧 Corrigindo docker-compose"
echo "============================"
echo ""

# 1. Desinstalar paramiko antigo
echo "🗑️  Removendo paramiko antigo..."
sudo pip3 uninstall -y paramiko
echo "✅ Paramiko removido"
echo ""

# 2. Instalar versão compatível
echo "📦 Instalando paramiko compatível..."
sudo pip3 install 'paramiko<3.0'
echo "✅ Paramiko instalado"
echo ""

# 3. Testar docker-compose
echo "🧪 Testando docker-compose..."
docker-compose version
echo ""

if [ $? -eq 0 ]; then
    echo "============================"
    echo "✅ CORREÇÃO BEM-SUCEDIDA!"
    echo "============================"
    echo ""
    echo "Agora você pode usar:"
    echo "   bash rebuild-app.sh"
else
    echo "❌ Ainda há problemas. Vamos tentar solução alternativa..."
    echo ""
    echo "Desinstalando docker-compose do pip..."
    sudo pip3 uninstall -y docker-compose
    echo ""
    echo "Instalando docker-compose standalone..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo ""
    echo "Testando nova versão..."
    docker-compose version
    echo ""
    echo "✅ Docker Compose atualizado!"
fi

echo ""
echo "Agora execute:"
echo "   bash rebuild-app.sh"
echo ""
