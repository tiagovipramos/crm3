#!/bin/bash

# Script para rebuildar a aplicação e adicionar a página de política de privacidade

echo "============================================"
echo "Rebuild Política de Privacidade - VPS"
echo "============================================"
echo ""

cd ~/crm

# 1. Resolver problemas de Git
echo "1. Resolvendo branches divergentes..."
git config pull.rebase false
git stash
echo ""

# 2. Baixar atualizações
echo "2. Baixando atualizações do GitHub..."
git pull origin master
echo ""

# 3. Verificar se o arquivo existe
echo "3. Verificando arquivo..."
if [ -f "app/politica-privacidade/page.tsx" ]; then
    echo "✅ Arquivo encontrado!"
    cat app/politica-privacidade/page.tsx | head -20
else
    echo "❌ Arquivo não encontrado!"
    exit 1
fi
echo ""

# 4. Parar containers
echo "4. Parando containers..."
docker-compose down
echo ""

# 5. Remover build antigo do Next.js
echo "5. Limpando cache do Next.js..."
rm -rf .next
echo ""

# 6. Rebuildar imagem Docker do zero (sem cache)
echo "6. Reconstruindo imagem Docker (isso pode demorar alguns minutos)..."
docker-compose build --no-cache
echo ""

# 7. Iniciar containers
echo "7. Iniciando containers..."
docker-compose up -d
echo ""

# 8. Aguardar inicialização
echo "8. Aguardando aplicação inicializar (30 segundos)..."
sleep 30
echo ""

# 9. Verificar logs
echo "9. Verificando logs do frontend..."
docker-compose logs frontend | tail -50
echo ""

# 10. Verificar status
echo "10. Status dos containers:"
docker-compose ps
echo ""

echo "============================================"
echo "✅ Rebuild concluído!"
echo "============================================"
echo ""
echo "Teste a página:"
echo "curl -k https://www.boraindicar.com.br/politica-privacidade"
echo ""
echo "Ou acesse pelo navegador:"
echo "https://www.boraindicar.com.br/politica-privacidade"
echo ""
