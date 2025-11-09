#!/bin/bash

# Script para reverter VPS para commit f3c3682
# Autor: Sistema CRM
# Data: 08/11/2025

set -e  # Parar em caso de erro

echo "============================================"
echo "🔄 REVERTER VPS PARA COMMIT f3c3682"
echo "============================================"
echo ""

# Verificar se está rodando como root ou com sudo
if [ "$EUID" -ne 0 ] && [ -z "$SUDO_USER" ]; then 
    echo "⚠️  Este script requer privilégios de root"
    echo "Execute com: sudo ./reverter-vps-para-commit.sh"
    exit 1
fi

# Verificar se está no diretório correto (deve ter docker-compose.yml)
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: docker-compose.yml não encontrado"
    echo "Certifique-se de estar no diretório do projeto"
    echo "Execute: cd /root/crm3"
    exit 1
fi

echo "📍 Diretório atual: $(pwd)"
echo ""

# Passo 1: Parar containers
echo "1️⃣  Parando containers..."
docker-compose down
echo "✅ Containers parados"
echo ""

# Passo 2: Fazer backup do .env
echo "2️⃣  Fazendo backup do arquivo .env..."
if [ -f ".env" ]; then
    cp .env .env.backup-$(date +%Y%m%d-%H%M%S)
    echo "✅ Backup do .env criado"
else
    echo "⚠️  Arquivo .env não encontrado - será necessário criar manualmente"
fi
echo ""

# Passo 3: Fetch e reset para commit f3c3682
echo "3️⃣  Atualizando repositório e resetando para commit f3c3682..."
git fetch origin
git reset --hard f3c3682
echo "✅ Código revertido para commit f3c3682"
echo ""

# Passo 4: Verificar e restaurar .env
echo "4️⃣  Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado após reset"
    echo "Procurando backup mais recente..."
    
    LATEST_BACKUP=$(ls -t .env.backup-* 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        cp "$LATEST_BACKUP" .env
        echo "✅ .env restaurado do backup: $LATEST_BACKUP"
    else
        echo "❌ Nenhum backup encontrado!"
        echo ""
        echo "CRIANDO .env COM CONFIGURAÇÕES PADRÃO DA VPS..."
        cat > .env << 'EOF'
# Banco de Dados MySQL
DB_HOST=mysql
DB_NAME=protecar_crm
DB_USER=root
DB_PASSWORD=Crm@VPS2025!Secure#ProdDB
DB_PORT=3306

# Backend
PORT=3001
NODE_ENV=production
JWT_SECRET=vps-prod-jwt-secret-a9f8e7d6c5b4a3f2e1d0c9b8a7e6d5c4b3a2f1e0d9c8b7a6
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=https://boraindicar.com.br
NEXT_PUBLIC_API_URL=https://boraindicar.com.br/api
NEXT_PUBLIC_WS_URL=https://boraindicar.com.br
EOF
        echo "✅ Arquivo .env criado com configurações padrão"
        echo "⚠️  IMPORTANTE: Verifique se as senhas estão corretas!"
    fi
else
    echo "✅ Arquivo .env encontrado"
fi
echo ""

# Mostrar conteúdo do .env (sem senhas)
echo "📄 Configurações atuais do .env:"
grep -v "PASSWORD\|SECRET" .env || true
echo ""

# Passo 5: Limpar imagens Docker antigas
echo "5️⃣  Limpando imagens Docker antigas..."
echo "⚠️  Isso pode levar alguns minutos..."
docker system prune -af
echo "✅ Imagens limpas"
echo ""

# Passo 6: Rebuild e iniciar containers
echo "6️⃣  Rebuilding e iniciando containers..."
echo "⚠️  Isso pode levar alguns minutos..."
docker-compose up -d --build
echo "✅ Containers iniciados"
echo ""

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem (30 segundos)..."
sleep 30
echo ""

# Passo 7: Verificar status dos containers
echo "7️⃣  Verificando status dos containers..."
docker-compose ps
echo ""

# Passo 8: Mostrar logs recentes
echo "8️⃣  Logs recentes dos containers:"
echo ""
echo "--- BACKEND ---"
docker logs crm-backend --tail 20
echo ""
echo "--- FRONTEND ---"
docker logs crm-frontend --tail 20
echo ""

# Verificar se os containers estão rodando
BACKEND_RUNNING=$(docker ps --filter "name=crm-backend" --format "{{.Status}}" | grep -c "Up" || echo "0")
FRONTEND_RUNNING=$(docker ps --filter "name=crm-frontend" --format "{{.Status}}" | grep -c "Up" || echo "0")
MYSQL_RUNNING=$(docker ps --filter "name=crm-mysql" --format "{{.Status}}" | grep -c "Up" || echo "0")

echo "============================================"
echo "📊 RESULTADO DA REVERSÃO"
echo "============================================"
echo ""
echo "Status dos Containers:"
echo "  Backend:  $([ $BACKEND_RUNNING -eq 1 ] && echo '✅ Rodando' || echo '❌ Parado')"
echo "  Frontend: $([ $FRONTEND_RUNNING -eq 1 ] && echo '✅ Rodando' || echo '❌ Parado')"
echo "  MySQL:    $([ $MYSQL_RUNNING -eq 1 ] && echo '✅ Rodando' || echo '❌ Parado')"
echo ""

if [ $BACKEND_RUNNING -eq 1 ] && [ $FRONTEND_RUNNING -eq 1 ] && [ $MYSQL_RUNNING -eq 1 ]; then
    echo "✅ SUCESSO! Todos os containers estão rodando"
    echo ""
    echo "🌐 URLs de Acesso:"
    echo "  Frontend:    https://boraindicar.com.br"
    echo "  Backend API: https://boraindicar.com.br/api/health"
    echo "  Admin:       https://boraindicar.com.br/admin"
    echo "  CRM:         https://boraindicar.com.br/crm"
    echo ""
    echo "📝 Próximos Passos:"
    echo "  1. Acesse https://boraindicar.com.br no navegador"
    echo "  2. Verifique se o sistema está funcionando"
    echo "  3. Teste o login e funcionalidades principais"
    echo ""
    echo "📊 Para ver logs em tempo real:"
    echo "  docker-compose logs -f"
else
    echo "⚠️  ATENÇÃO! Alguns containers não estão rodando"
    echo ""
    echo "🔍 Diagnóstico:"
    echo "  Ver logs completos: docker-compose logs"
    echo "  Ver status: docker-compose ps"
    echo "  Reiniciar: docker-compose restart"
    echo ""
    echo "Se o problema persistir:"
    echo "  1. docker-compose down -v"
    echo "  2. docker system prune -af"
    echo "  3. docker-compose up -d --build"
fi

echo ""
echo "============================================"
echo "✅ PROCESSO CONCLUÍDO"
echo "============================================"
echo ""
echo "Commit Atual:"
git log -1 --oneline
echo ""
echo "Para suporte adicional, consulte: REVERTER-VPS-PARA-f3c3682.md"
echo ""
