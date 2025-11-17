#!/bin/bash

echo "=========================================="
echo "ATUALIZANDO PÁGINA DE TERMOS DE USO NA VPS"
echo "=========================================="
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
echo -e "${GREEN}✓ Diretório: $PROJECT_DIR${NC}"
echo ""

echo -e "${YELLOW}2. Fazendo backup do estado atual...${NC}"
git status
echo ""

echo -e "${YELLOW}3. Buscando atualizações do GitHub...${NC}"
git fetch origin master
echo ""

echo -e "${YELLOW}4. Fazendo pull das alterações...${NC}"
git pull origin master
echo ""

echo -e "${YELLOW}5. Verificando se o arquivo foi baixado...${NC}"
if [ -f "app/termos-de-uso/page.tsx" ]; then
    echo -e "${GREEN}✓ Arquivo app/termos-de-uso/page.tsx encontrado!${NC}"
    echo ""
    echo "Primeiras linhas do arquivo:"
    head -n 10 app/termos-de-uso/page.tsx
else
    echo -e "${RED}✗ ERRO: Arquivo app/termos-de-uso/page.tsx não encontrado!${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}6. Instalando dependências (se necessário)...${NC}"
npm install
echo ""

echo -e "${YELLOW}7. Fazendo build da aplicação...${NC}"
npm run build
echo ""

echo -e "${YELLOW}8. Reiniciando container Docker...${NC}"
docker-compose down
docker-compose up -d --build
echo ""

echo -e "${YELLOW}9. Aguardando serviços iniciarem (30 segundos)...${NC}"
sleep 30
echo ""

echo -e "${YELLOW}10. Verificando status dos containers...${NC}"
docker-compose ps
echo ""

echo -e "${YELLOW}11. Testando a página de Termos de Uso...${NC}"
echo "Aguarde enquanto testamos o acesso..."
sleep 5

# Tenta acessar a página
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/termos-de-uso)
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Página de Termos de Uso está acessível! (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ AVISO: Página retornou código HTTP $HTTP_CODE${NC}"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}ATUALIZAÇÃO CONCLUÍDA!${NC}"
echo "=========================================="
echo ""
echo "📄 URLs disponíveis:"
echo "   • Termos de Uso: https://www.boraindicar.com.br/termos-de-uso"
echo "   • Política de Privacidade: https://www.boraindicar.com.br/politica-privacidade"
echo ""
echo "Para verificar logs:"
echo "   docker-compose logs -f app"
echo ""
