#!/bin/bash

echo "======================================"
echo "  DEPLOY ARQUIVO VERIFICAÇÃO META"
echo "======================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diretório do projeto
PROJECT_DIR="/root/crm"

echo -e "${YELLOW}1. Navegando para o diretório do projeto...${NC}"
cd $PROJECT_DIR || exit 1

echo -e "${YELLOW}2. Descartando alterações locais...${NC}"
git reset --hard HEAD

echo -e "${YELLOW}3. Fazendo git pull para obter a rota Meta...${NC}"
git pull origin master

echo -e "${GREEN}✓ Rota Meta obtida: app/mryypl6j4u4onejl9jefuwj10ms4au.html/route.ts${NC}"

echo -e "${YELLOW}4. Parando os containers...${NC}"
docker-compose down

echo -e "${YELLOW}5. Fazendo rebuild do frontend (necessário para incluir a rota)...${NC}"
docker-compose build frontend

echo -e "${YELLOW}6. Iniciando os containers...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}======================================"
echo "  DEPLOY CONCLUÍDO!"
echo "======================================${NC}"
echo ""
echo "O arquivo de verificação Meta agora está disponível em:"
echo "https://seudominio.com/mryypl6j4u4onejl9jefuwj10ms4au.html"
echo ""
echo "Aguarde alguns segundos para os containers iniciarem completamente."
echo ""
echo "Para verificar os logs do frontend:"
echo "  docker-compose logs -f frontend"
echo ""
