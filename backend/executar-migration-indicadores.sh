#!/bin/bash

# Script para executar a migration de indicadores e saques

echo "==================================="
echo "Executando Migration de Indicadores"
echo "==================================="

# Carregar variáveis de ambiente do .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Executar a migration
docker exec -i crm-backend-1 mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < migrations/03-indicadores-saques.sql

if [ $? -eq 0 ]; then
    echo "✓ Migration executada com sucesso!"
else
    echo "✗ Erro ao executar migration"
    exit 1
fi

echo "==================================="
echo "Migration concluída!"
echo "==================================="
