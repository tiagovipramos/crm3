#!/bin/bash

# Script para atualizar a página de política de privacidade no VPS
# Resolve branches divergentes de forma segura

echo "============================================"
echo "Atualizando Política de Privacidade no VPS"
echo "============================================"
echo ""

# Parar containers
echo "1. Parando containers Docker..."
docker-compose down
echo ""

# Verificar status do Git
echo "2. Verificando status do Git..."
git status
echo ""

# Fazer backup das mudanças locais se houver
echo "3. Fazendo backup de mudanças locais (stash)..."
git stash
echo ""

# Configurar estratégia de merge
echo "4. Configurando estratégia de pull..."
git config pull.rebase false
echo ""

# Fazer pull do GitHub
echo "5. Baixando atualizações do GitHub..."
git pull origin master
echo ""

# Verificar se o arquivo foi baixado
echo "6. Verificando se a página foi criada..."
if [ -f "app/politica-privacidade/page.tsx" ]; then
    echo "✅ Página de política de privacidade encontrada!"
    echo ""
else
    echo "❌ ERRO: Página não encontrada!"
    exit 1
fi

# Rebuildar containers
echo "7. Reconstruindo e iniciando containers..."
docker-compose up -d --build
echo ""

# Aguardar containers iniciarem
echo "8. Aguardando containers iniciarem..."
sleep 10
echo ""

# Verificar status dos containers
echo "9. Verificando status dos containers..."
docker-compose ps
echo ""

# Verificar logs
echo "10. Verificando logs (últimas 30 linhas)..."
docker-compose logs --tail=30
echo ""

echo "============================================"
echo "✅ Atualização concluída!"
echo "============================================"
echo ""
echo "A página estará disponível em:"
echo "https://www.boraindicar.com.br/politica-privacidade"
echo ""
echo "Para verificar se está funcionando:"
echo "curl -I https://www.boraindicar.com.br/politica-privacidade"
echo ""
