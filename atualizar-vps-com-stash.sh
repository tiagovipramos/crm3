#!/bin/bash

# Script para atualizar VPS fazendo stash das alterações locais
# Uso: bash atualizar-vps-com-stash.sh

echo "🔄 Fazendo stash das alterações locais..."
git stash

echo "📥 Baixando atualizações do GitHub..."
git pull origin master

echo "🧹 Removendo containers antigos..."
docker rm -f crm-mysql crm-backend crm-frontend 2>/dev/null || true

echo "🐳 Parando e removendo tudo..."
docker-compose down --remove-orphans

echo "🔨 Reconstruindo imagens..."
docker-compose build

echo "🚀 Iniciando containers..."
docker-compose up -d

echo "⏳ Aguardando containers iniciarem..."
sleep 5

echo "📋 Mostrando logs do frontend..."
docker-compose logs -f frontend
