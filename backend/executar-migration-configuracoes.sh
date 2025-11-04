#!/bin/bash

# Carregar variáveis de ambiente
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

echo "🔄 Executando migration: 10-configuracoes-indicador-admin.sql"

# Executar migration
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < migrations/10-configuracoes-indicador-admin.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration executada com sucesso!"
else
    echo "❌ Erro ao executar migration"
    exit 1
fi
