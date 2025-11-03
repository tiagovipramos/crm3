#!/bin/bash

# Script para corrigir erros 500 na Dashboard de Indicação
# Este script aplica a migration 03-indicadores-saques.sql no banco de dados

echo "=========================================="
echo "Correção Dashboard de Indicação - VPS"
echo "=========================================="

# Verificar se está rodando no VPS
if [ ! -f ".env.vps" ]; then
    echo "⚠️  Arquivo .env.vps não encontrado!"
    echo "Este script deve ser executado no diretório do projeto no VPS"
    exit 1
fi

# Carregar variáveis de ambiente
echo "📋 Carregando variáveis de ambiente..."
export $(cat .env.vps | grep -v '^#' | xargs)

# Verificar se docker-compose está disponível
echo "🔍 Verificando docker-compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose não encontrado!"
    exit 1
fi

# Verificar containers em execução
echo "🔍 Verificando containers em execução..."
docker-compose ps

# Identificar o nome do container backend
BACKEND_CONTAINER=$(docker-compose ps -q backend)
if [ -z "$BACKEND_CONTAINER" ]; then
    echo "❌ Container backend não está rodando!"
    echo "Execute: docker-compose up -d"
    exit 1
fi

echo "✅ Container backend encontrado: $BACKEND_CONTAINER"

# Fazer backup do banco de dados antes da migration
echo ""
echo "💾 Criando backup do banco de dados..."
BACKUP_FILE="backup-before-indicacao-fix-$(date +%Y%m%d_%H%M%S).sql"
docker-compose exec -T backend mysqldump -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup criado: $BACKUP_FILE"
else
    echo "⚠️  Aviso: Não foi possível criar backup, mas continuando..."
fi

# Aplicar a migration
echo ""
echo "🔧 Aplicando migration de correção..."
cat backend/migrations/03-indicadores-saques.sql | docker-compose exec -T backend mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"

if [ $? -eq 0 ]; then
    echo "✅ Migration aplicada com sucesso!"
else
    echo "❌ Erro ao aplicar migration!"
    echo ""
    echo "Para restaurar o backup, execute:"
    echo "cat $BACKUP_FILE | docker-compose exec -T backend mysql -u\$DB_USER -p\$DB_PASSWORD \$DB_NAME"
    exit 1
fi

# Reiniciar o backend para garantir que as mudanças sejam aplicadas
echo ""
echo "🔄 Reiniciando backend..."
docker-compose restart backend

if [ $? -eq 0 ]; then
    echo "✅ Backend reiniciado!"
else
    echo "⚠️  Aviso: Erro ao reiniciar backend"
fi

# Verificar se os endpoints estão funcionando
echo ""
echo "🧪 Aguardando 10 segundos para o backend inicializar..."
sleep 10

echo ""
echo "🔍 Testando endpoints..."

# Obter o IP do servidor
SERVER_IP=$(hostname -I | awk '{print $1}')

# Verificar estatísticas de indicação
echo -n "  - Estatísticas de indicação... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/admin/estatisticas/indicacao -H "Authorization: Bearer test")
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "200" ]; then
    echo "✅ OK (Status: $RESPONSE)"
else
    echo "⚠️  Status: $RESPONSE"
fi

# Verificar top indicadores
echo -n "  - Top indicadores... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/admin/top-indicadores -H "Authorization: Bearer test")
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "200" ]; then
    echo "✅ OK (Status: $RESPONSE)"
else
    echo "⚠️  Status: $RESPONSE"
fi

# Verificar alertas
echo -n "  - Alertas... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/admin/alertas -H "Authorization: Bearer test")
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "200" ]; then
    echo "✅ OK (Status: $RESPONSE)"
else
    echo "⚠️  Status: $RESPONSE"
fi

# Verificar saques pendentes
echo -n "  - Saques pendentes... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/admin/saques/pendentes -H "Authorization: Bearer test")
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "200" ]; then
    echo "✅ OK (Status: $RESPONSE)"
else
    echo "⚠️  Status: $RESPONSE"
fi

echo ""
echo "=========================================="
echo "✅ Correção concluída!"
echo "=========================================="
echo ""
echo "📝 Resumo:"
echo "  - Migration aplicada: backend/migrations/03-indicadores-saques.sql"
echo "  - Backup criado: $BACKUP_FILE"
echo "  - Backend reiniciado"
echo ""
echo "🌐 Teste no navegador:"
echo "  http://$SERVER_IP:3000/admin?view=dashboard-indicacao"
echo ""
echo "📊 Logs do backend (se necessário):"
echo "  docker-compose logs backend --tail 50 -f"
echo ""
