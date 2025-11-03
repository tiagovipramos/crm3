#!/bin/bash

echo "=========================================="
echo "🔧 Corrigindo erro 500 do Loot Box na VPS"
echo "=========================================="

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Carregar variáveis de ambiente da VPS
if [ -f .env.vps ]; then
    export $(cat .env.vps | grep -v '^#' | xargs)
    echo -e "${GREEN}✓${NC} Variáveis de ambiente carregadas"
else
    echo -e "${RED}✗${NC} Arquivo .env.vps não encontrado"
    exit 1
fi

# Verificar se as variáveis necessárias estão definidas
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo -e "${RED}✗${NC} Variáveis de banco de dados não encontradas no .env.vps"
    exit 1
fi

echo ""
echo "📋 Configurações do Banco:"
echo "   Host: $DB_HOST"
echo "   User: $DB_USER"
echo "   Database: $DB_NAME"
echo ""

# Aguardar confirmação
read -p "Deseja continuar com a correção na VPS? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada${NC}"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Passo 1: Verificando containers Docker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se os containers estão rodando
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠${NC} Containers não estão rodando. Iniciando..."
    docker-compose up -d
    sleep 15
    echo -e "${GREEN}✓${NC} Containers iniciados"
else
    echo -e "${GREEN}✓${NC} Containers já estão rodando"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Passo 2: Executando migration 04-lootbox"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Copiar arquivo de migration para dentro do container
docker cp backend/migrations/04-lootbox-indicadores.sql $(docker-compose ps -q db):/tmp/migration.sql

# Executar migration dentro do container
docker-compose exec -T db sh -c "mysql -u root -p\$MYSQL_ROOT_PASSWORD \$MYSQL_DATABASE < /tmp/migration.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Migration executada com sucesso!"
    # Limpar arquivo temporário
    docker-compose exec -T db rm /tmp/migration.sql
else
    echo -e "${RED}✗${NC} Erro ao executar migration"
    echo ""
    echo "Tentando abordagem alternativa..."
    # Tentar executar linha por linha
    docker-compose exec -T db mysql -u root -p"$DB_PASSWORD" "$DB_NAME" < backend/migrations/04-lootbox-indicadores.sql
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Migration executada com sucesso (método alternativo)!"
    else
        echo -e "${RED}✗${NC} Erro ao executar migration mesmo com método alternativo"
        exit 1
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Passo 3: Verificando colunas criadas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se as colunas foram criadas via docker-compose exec
docker-compose exec -T db sh -c "mysql -u root -p\$MYSQL_ROOT_PASSWORD \$MYSQL_DATABASE -e \"
SHOW COLUMNS FROM indicadores WHERE Field IN (
    'leads_para_proxima_caixa',
    'total_caixas_abertas',
    'total_ganho_caixas',
    'vendas_para_proxima_caixa',
    'total_caixas_vendas_abertas',
    'total_ganho_caixas_vendas',
    'pix_chave',
    'pix_tipo'
);\""

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Colunas verificadas!"
else
    echo -e "${RED}✗${NC} Erro ao verificar colunas"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Passo 4: Reiniciando containers Docker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Rebuild e restart dos containers
docker-compose down
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Containers reiniciados com sucesso!"
else
    echo -e "${RED}✗${NC} Erro ao reiniciar containers"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏳ Passo 5: Aguardando containers iniciarem"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sleep 10

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Passo 6: Verificando status dos containers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker-compose ps

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Resumo das alterações:"
echo "   • Migration 04-lootbox-indicadores.sql executada"
echo "   • Colunas de Loot Box adicionadas à tabela indicadores"
echo "   • Containers Docker reiniciados"
echo ""
echo "🌐 Teste o sistema em: http://185.217.125.72:3000/indicador"
echo ""
echo "📋 Para verificar os logs do backend:"
echo "   docker-compose logs -f backend"
echo ""
