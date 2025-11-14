#!/bin/bash

echo "=========================================="
echo "🔧 Aplicando Correção de API URL no VPS"
echo "=========================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ir para o diretório do projeto
cd /root/crm || { echo -e "${RED}❌ Diretório /root/crm não encontrado${NC}"; exit 1; }

echo -e "${YELLOW}📁 Diretório atual: $(pwd)${NC}"
echo ""

# Fazer backup dos arquivos antes de modificar
echo -e "${YELLOW}💾 Fazendo backup dos arquivos...${NC}"
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

cp components/views/FollowUpView.tsx $BACKUP_DIR/ 2>/dev/null
cp components/admin/MensagensPredefinidasPanel.tsx $BACKUP_DIR/ 2>/dev/null
cp components/admin/views/ConfiguracoesAdminView.tsx $BACKUP_DIR/ 2>/dev/null
cp components/MensagensPredefinidasChatPanel.tsx $BACKUP_DIR/ 2>/dev/null

echo -e "${GREEN}✅ Backup criado em: $BACKUP_DIR${NC}"
echo ""

# Função para corrigir API_URL em um arquivo
corrigir_arquivo() {
    local arquivo=$1
    echo -e "${YELLOW}📝 Corrigindo: $arquivo${NC}"
    
    if [ -f "$arquivo" ]; then
        # Substituir API_URL sem /api por API_URL com /api
        sed -i "s|const API_URL = process\.env\.NEXT_PUBLIC_API_URL || 'http://localhost:3001';|const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';|g" "$arquivo"
        
        # Substituir API_BASE_URL sem /api por API_BASE_URL com /api
        sed -i "s|const API_BASE_URL = process\.env\.NEXT_PUBLIC_API_URL || 'http://localhost:3001';|const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';|g" "$arquivo"
        
        echo -e "${GREEN}   ✅ Arquivo corrigido${NC}"
    else
        echo -e "${RED}   ⚠️  Arquivo não encontrado${NC}"
    fi
}

echo -e "${YELLOW}🔄 Aplicando correções nos arquivos...${NC}"
echo ""

# Corrigir cada arquivo
corrigir_arquivo "components/views/FollowUpView.tsx"
corrigir_arquivo "components/admin/MensagensPredefinidasPanel.tsx"
corrigir_arquivo "components/admin/views/ConfiguracoesAdminView.tsx"
corrigir_arquivo "components/MensagensPredefinidasChatPanel.tsx"

echo ""
echo -e "${GREEN}✅ Correções aplicadas!${NC}"
echo ""

# Commitar as mudanças
echo -e "${YELLOW}📦 Commitando alterações...${NC}"
git add .
git commit -m "Fix: Corrigir API_URL sem prefixo /api em componentes (erro 500)" || echo "Nada para commitar"
echo ""

# Parar os containers
echo -e "${YELLOW}🛑 Parando containers...${NC}"
docker-compose down
echo ""

# Rebuild do frontend
echo -e "${YELLOW}🔨 Fazendo rebuild do frontend...${NC}"
docker-compose build frontend
echo ""

# Reiniciar todos os containers
echo -e "${YELLOW}🚀 Iniciando containers...${NC}"
docker-compose up -d
echo ""

# Aguardar um pouco para os containers iniciarem
echo -e "${YELLOW}⏳ Aguardando containers iniciarem (15 segundos)...${NC}"
sleep 15
echo ""

# Verificar status dos containers
echo -e "${YELLOW}📊 Status dos containers:${NC}"
docker-compose ps
echo ""

# Mostrar logs recentes do backend para verificar se não há mais erros 500
echo -e "${YELLOW}📋 Últimas linhas do log do backend:${NC}"
docker-compose logs --tail=20 backend
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Correção aplicada com sucesso!${NC}"
echo "=========================================="
echo ""
echo "📝 Próximos passos:"
echo "   1. Acesse a aplicação e teste as funcionalidades"
echo "   2. Verifique se não há mais erros 500 nos logs"
echo "   3. Monitore com: docker-compose logs -f backend"
echo ""
