#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║  🚨 RECUPERAÇÃO DE MIGRATIONS NA VPS 🚨               ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Ler IP da VPS do arquivo .env.vps
if [ -f ".env.vps" ]; then
    VPS_IP=$(grep "VPS_IP" .env.vps | cut -d '=' -f2 | tr -d ' "' || echo "")
fi

# Se não encontrou, pedir ao usuário
if [ -z "$VPS_IP" ]; then
    echo -e "${YELLOW}Digite o IP da VPS:${NC}"
    read VPS_IP
fi

VPS_USER="root"
VPS_PATH="~/crm/backend/migrations"

echo -e "${BLUE}Configuração:${NC}"
echo -e "  IP: ${GREEN}$VPS_IP${NC}"
echo -e "  Usuário: ${GREEN}$VPS_USER${NC}"
echo -e "  Caminho: ${GREEN}$VPS_PATH${NC}"
echo ""

# Verificar conexão SSH
echo -e "${YELLOW}► Testando conexão SSH...${NC}"
if ! ssh -o ConnectTimeout=5 $VPS_USER@$VPS_IP "echo 'Conexão OK'" 2>/dev/null; then
    echo -e "${RED}❌ Erro: Não foi possível conectar na VPS!${NC}"
    echo -e "${YELLOW}Verifique:${NC}"
    echo "  1. IP está correto: $VPS_IP"
    echo "  2. Servidor está ligado"
    echo "  3. Você tem acesso SSH"
    exit 1
fi
echo -e "${GREEN}✅ Conexão SSH OK${NC}"
echo ""

# Verificar se os arquivos locais existem
echo -e "${YELLOW}► Verificando arquivos locais...${NC}"
ARQUIVOS_OK=true

for arquivo in "01-estrutura.sql" "02-dados-admin.sql" "03-indicadores-saques.sql" "04-lootbox-indicadores.sql" "05-criar-tabela-indicacoes.sql"; do
    if [ ! -f "backend/migrations/$arquivo" ]; then
        echo -e "${RED}❌ Arquivo não encontrado: $arquivo${NC}"
        ARQUIVOS_OK=false
    else
        echo -e "${GREEN}✅ $arquivo${NC}"
    fi
done

if [ "$ARQUIVOS_OK" = false ]; then
    echo -e "${RED}Erro: Alguns arquivos locais não foram encontrados!${NC}"
    exit 1
fi
echo ""

# Fazer backup na VPS
echo -e "${YELLOW}► Fazendo backup dos arquivos atuais na VPS...${NC}"
BACKUP_DIR="migrations_backup_$(date +%Y%m%d_%H%M%S)"
ssh $VPS_USER@$VPS_IP "mkdir -p ~/$BACKUP_DIR && cp ~/crm/backend/migrations/* ~/$BACKUP_DIR/ 2>/dev/null || true"

if ssh $VPS_USER@$VPS_IP "[ -d ~/$BACKUP_DIR ]"; then
    echo -e "${GREEN}✅ Backup criado em: ~/$BACKUP_DIR${NC}"
else
    echo -e "${YELLOW}⚠️  Aviso: Não foi possível criar backup (diretório pode estar vazio)${NC}"
fi
echo ""

# Listar arquivos antes da limpeza
echo -e "${YELLOW}► Arquivos atuais na VPS (ANTES da limpeza):${NC}"
ssh $VPS_USER@$VPS_IP "ls -lh ~/crm/backend/migrations/ 2>/dev/null || echo 'Diretório não existe ou está vazio'"
echo ""

# Limpar arquivos incorretos
echo -e "${YELLOW}► Limpando arquivos incorretos na VPS...${NC}"
ssh $VPS_USER@$VPS_IP "cd ~/crm/backend/migrations && rm -f 019_*.sql 020_*.sql 021_*.sql 022_*.sql README.md 2>/dev/null || true"
echo -e "${GREEN}✅ Arquivos incorretos removidos${NC}"
echo ""

# Enviar arquivos corretos
echo -e "${YELLOW}► Enviando arquivos corretos para a VPS...${NC}"

# Criar diretório se não existir
ssh $VPS_USER@$VPS_IP "mkdir -p ~/crm/backend/migrations"

# Enviar cada arquivo
for arquivo in "01-estrutura.sql" "02-dados-admin.sql" "03-indicadores-saques.sql" "04-lootbox-indicadores.sql" "05-criar-tabela-indicacoes.sql"; do
    echo -e "  Enviando ${BLUE}$arquivo${NC}..."
    if scp -q "backend/migrations/$arquivo" "$VPS_USER@$VPS_IP:$VPS_PATH/"; then
        echo -e "  ${GREEN}✅ $arquivo enviado${NC}"
    else
        echo -e "  ${RED}❌ Erro ao enviar $arquivo${NC}"
    fi
done
echo ""

# Verificar arquivos enviados
echo -e "${YELLOW}► Verificando arquivos na VPS (DEPOIS do envio):${NC}"
ssh $VPS_USER@$VPS_IP "ls -lh ~/crm/backend/migrations/"
echo ""

# Fazer backup do banco antes de executar migrations
echo -e "${YELLOW}► Fazendo backup do banco de dados...${NC}"
BACKUP_SQL="backup_antes_migrations_$(date +%Y%m%d_%H%M%S).sql"
echo -e "${BLUE}Digite a senha do MySQL quando solicitado:${NC}"
ssh -t $VPS_USER@$VPS_IP "mysqldump -u root -p crm_db > ~/$BACKUP_SQL 2>/dev/null && echo 'Backup criado: ~/$BACKUP_SQL' || echo 'Erro ao criar backup'"
echo ""

# Perguntar se quer executar as migrations
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}Deseja executar as migrations agora?${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${RED}ATENÇÃO: Isso irá recriar todas as tabelas!${NC}"
echo -e "Digite ${GREEN}SIM${NC} para continuar ou qualquer outra coisa para pular:"
read EXECUTAR

if [ "$EXECUTAR" = "SIM" ] || [ "$EXECUTAR" = "sim" ]; then
    echo ""
    echo -e "${YELLOW}► Executando migrations na ordem...${NC}"
    echo -e "${BLUE}Digite a senha do MySQL quando solicitado (5x):${NC}"
    echo ""
    
    for arquivo in "01-estrutura.sql" "02-dados-admin.sql" "03-indicadores-saques.sql" "04-lootbox-indicadores.sql" "05-criar-tabela-indicacoes.sql"; do
        echo -e "  Executando ${BLUE}$arquivo${NC}..."
        ssh -t $VPS_USER@$VPS_IP "mysql -u root -p crm_db < ~/crm/backend/migrations/$arquivo"
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✅ $arquivo executado com sucesso${NC}"
        else
            echo -e "  ${RED}❌ Erro ao executar $arquivo${NC}"
        fi
        echo ""
    done
    
    # Verificar tabelas criadas
    echo -e "${YELLOW}► Verificando tabelas criadas...${NC}"
    echo -e "${BLUE}Digite a senha do MySQL quando solicitado:${NC}"
    ssh -t $VPS_USER@$VPS_IP "mysql -u root -p crm_db -e 'SHOW TABLES;'"
    echo ""
else
    echo -e "${YELLOW}⚠️  Migrations não foram executadas${NC}"
    echo ""
fi

# Resumo final
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ RECUPERAÇÃO CONCLUÍDA COM SUCESSO!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Resumo:${NC}"
echo -e "  ${GREEN}✅${NC} Arquivos incorretos removidos"
echo -e "  ${GREEN}✅${NC} Arquivos corretos enviados para VPS"
echo -e "  ${GREEN}✅${NC} Backup criado: ~/$BACKUP_DIR"

if [ "$EXECUTAR" = "SIM" ] || [ "$EXECUTAR" = "sim" ]; then
    echo -e "  ${GREEN}✅${NC} Migrations executadas"
    echo -e "  ${GREEN}✅${NC} Backup do banco: ~/$BACKUP_SQL"
else
    echo ""
    echo -e "${YELLOW}📝 PRÓXIMOS PASSOS MANUAIS:${NC}"
    echo ""
    echo -e "1. Conectar na VPS:"
    echo -e "   ${BLUE}ssh $VPS_USER@$VPS_IP${NC}"
    echo ""
    echo -e "2. Ir para o diretório de migrations:"
    echo -e "   ${BLUE}cd ~/crm/backend/migrations${NC}"
    echo ""
    echo -e "3. Executar as migrations na ordem:"
    echo -e "   ${BLUE}mysql -u root -p crm_db < 01-estrutura.sql${NC}"
    echo -e "   ${BLUE}mysql -u root -p crm_db < 02-dados-admin.sql${NC}"
    echo -e "   ${BLUE}mysql -u root -p crm_db < 03-indicadores-saques.sql${NC}"
    echo -e "   ${BLUE}mysql -u root -p crm_db < 04-lootbox-indicadores.sql${NC}"
    echo -e "   ${BLUE}mysql -u root -p crm_db < 05-criar-tabela-indicacoes.sql${NC}"
    echo ""
    echo -e "4. Verificar tabelas:"
    echo -e "   ${BLUE}mysql -u root -p crm_db -e 'SHOW TABLES;'${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}Script concluído!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
