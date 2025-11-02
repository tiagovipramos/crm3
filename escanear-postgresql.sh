#!/bin/bash
# Script para escanear referências ao PostgreSQL no repositório
# Uso: ./escanear-postgresql.sh

echo "========================================"
echo "  ESCANEANDO REPOSITÓRIO - PostgreSQL"
echo "========================================"
echo ""

# Termos a procurar
termos=("postgres" "pg" "5432" "uuid_generate")

# Diretórios e arquivos a excluir
exclusoes=(
    "node_modules"
    ".git"
    "dist"
    "build"
    ".next"
    "uploads"
    "*.log"
    "*.lock"
    "package-lock.json"
    "pnpm-lock.yaml"
    "yarn.lock"
)

# Construir pattern de exclusão para grep
exclude_args=""
for excl in "${exclusoes[@]}"; do
    exclude_args="$exclude_args --exclude-dir=$excl --exclude=$excl"
done

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

for termo in "${termos[@]}"; do
    echo -e "${YELLOW}Buscando por: '$termo'${NC}"
    echo "----------------------------------------"
    
    # Usar grep com cores e número de linha
    resultado=$(grep -rn -i --color=always $exclude_args "$termo" . 2>/dev/null)
    
    if [ -n "$resultado" ]; then
        echo "$resultado" | while IFS= read -r linha; do
            # Extrair arquivo e conteúdo
            arquivo=$(echo "$linha" | cut -d: -f1)
            numero_linha=$(echo "$linha" | cut -d: -f2)
            conteudo=$(echo "$linha" | cut -d: -f3-)
            
            echo -e "  ${WHITE}Arquivo: ${GREEN}$arquivo${NC}"
            echo -e "  ${WHITE}Linha $numero_linha${NC}: ${CYAN}$conteudo${NC}"
            echo ""
        done
    else
        echo -e "  ${GRAY}Nenhuma ocorrência encontrada.${NC}"
    fi
    
    echo ""
done

echo "========================================"
echo "  ESCANEAMENTO CONCLUÍDO"
echo "========================================"
