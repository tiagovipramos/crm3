# 🚨 RECUPERAÇÃO DE ARQUIVOS DE MIGRATION NA VPS

## 🔴 PROBLEMA IDENTIFICADO

Os arquivos de migration corretos **SUMIRAM DA VPS** e foram substituídos por arquivos incorretos que misturam MySQL e PostgreSQL.

### Arquivos Incorretos na VPS (vistos na imagem):
```
019_add_missing_leads_columns.sql
019_add_missing_leads_columns_postgres.sql
020_create_leads_table_complete_postgres.sql
021_create_leads_table_complete_mysql.sql
022_fix_leads_uuid_columns.sql
README.md
```

### Arquivos Corretos que Deveriam Estar:
```
01-estrutura.sql
02-dados-admin.sql
03-indicadores-saques.sql
04-lootbox-indicadores.sql
05-criar-tabela-indicacoes.sql
```

## 🤔 O QUE PODE TER ACONTECIDO?

1. **Comando Errado Executado**: Algum script ou comando pode ter deletado os arquivos originais
2. **Redeploy com Git**: Um `git pull` ou similar pode ter sobrescrito os arquivos
3. **Script Automatizado**: Algum script de correção pode ter executado incorretamente
4. **Deploy Errado**: Um deploy pode ter enviado arquivos incorretos

## ⚠️ CONSEQUÊNCIAS

- ❌ Tabelas do banco de dados podem ter sido deletadas
- ❌ Estrutura do banco desorganizada
- ❌ Dados podem estar perdidos se não houver backup
- ❌ Sistema pode estar apresentando erros

## 🔧 SOLUÇÃO - PASSO A PASSO

### PASSO 1: Fazer Backup Imediato do Banco Atual

```bash
# Na VPS, fazer backup do banco atual (mesmo que incompleto)
mysqldump -u root -p crm_db > ~/backup_antes_correcao_$(date +%Y%m%d_%H%M%S).sql

# Verificar se o backup foi criado
ls -lh ~/backup_*.sql
```

### PASSO 2: Limpar Arquivos Incorretos na VPS

```bash
# Na VPS, ir para o diretório de migrations
cd ~/crm/backend/migrations

# Fazer backup dos arquivos atuais
mkdir -p ~/migrations_backup_$(date +%Y%m%d_%H%M%S)
cp -r * ~/migrations_backup_$(date +%Y%m%d_%H%M%S)/

# Deletar arquivos incorretos
rm -f 019_*.sql
rm -f 020_*.sql
rm -f 021_*.sql
rm -f 022_*.sql
rm -f README.md

# Verificar se foram deletados
ls -la
```

### PASSO 3: Enviar Arquivos Corretos da Máquina Local

**No seu computador local (Windows):**

```bash
# Ir para o diretório do projeto
cd C:\Users\Tiago\Desktop\CRM

# Enviar arquivos corretos via SCP
scp backend/migrations/01-estrutura.sql root@SEU_IP_VPS:~/crm/backend/migrations/
scp backend/migrations/02-dados-admin.sql root@SEU_IP_VPS:~/crm/backend/migrations/
scp backend/migrations/03-indicadores-saques.sql root@SEU_IP_VPS:~/crm/backend/migrations/
scp backend/migrations/04-lootbox-indicadores.sql root@SEU_IP_VPS:~/crm/backend/migrations/
scp backend/migrations/05-criar-tabela-indicacoes.sql root@SEU_IP_VPS:~/crm/backend/migrations/
```

### PASSO 4: Recriar as Tabelas na VPS

```bash
# Na VPS
cd ~/crm/backend/migrations

# Executar migrations na ordem correta
mysql -u root -p crm_db < 01-estrutura.sql
mysql -u root -p crm_db < 02-dados-admin.sql
mysql -u root -p crm_db < 03-indicadores-saques.sql
mysql -u root -p crm_db < 04-lootbox-indicadores.sql
mysql -u root -p crm_db < 05-criar-tabela-indicacoes.sql
```

### PASSO 5: Verificar se as Tabelas Foram Criadas

```bash
# Na VPS, verificar tabelas
mysql -u root -p crm_db -e "SHOW TABLES;"

# Verificar estrutura de algumas tabelas importantes
mysql -u root -p crm_db -e "DESCRIBE consultores;"
mysql -u root -p crm_db -e "DESCRIBE leads;"
mysql -u root -p crm_db -e "DESCRIBE indicadores;"
```

## 📋 SCRIPT AUTOMATIZADO DE RECUPERAÇÃO

### Script para Limpar e Reenviar (Local → VPS)

Crie o arquivo `recuperar-migrations-vps.sh`:

```bash
#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== RECUPERAÇÃO DE MIGRATIONS NA VPS ===${NC}"
echo ""

# Configurações
VPS_IP="SEU_IP_AQUI"
VPS_USER="root"
VPS_PATH="~/crm/backend/migrations"

# Verificar se os arquivos locais existem
echo -e "${YELLOW}1. Verificando arquivos locais...${NC}"
if [ ! -f "backend/migrations/01-estrutura.sql" ]; then
    echo -e "${RED}❌ Arquivo 01-estrutura.sql não encontrado localmente!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Arquivos locais encontrados${NC}"

# Fazer backup na VPS
echo ""
echo -e "${YELLOW}2. Fazendo backup dos arquivos atuais na VPS...${NC}"
ssh $VPS_USER@$VPS_IP "mkdir -p ~/migrations_backup_\$(date +%Y%m%d_%H%M%S) && cp ~/crm/backend/migrations/* ~/migrations_backup_\$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true"
echo -e "${GREEN}✅ Backup criado${NC}"

# Limpar arquivos incorretos
echo ""
echo -e "${YELLOW}3. Limpando arquivos incorretos na VPS...${NC}"
ssh $VPS_USER@$VPS_IP "cd ~/crm/backend/migrations && rm -f 019_*.sql 020_*.sql 021_*.sql 022_*.sql README.md"
echo -e "${GREEN}✅ Arquivos incorretos removidos${NC}"

# Enviar arquivos corretos
echo ""
echo -e "${YELLOW}4. Enviando arquivos corretos...${NC}"
scp backend/migrations/01-estrutura.sql $VPS_USER@$VPS_IP:$VPS_PATH/
scp backend/migrations/02-dados-admin.sql $VPS_USER@$VPS_IP:$VPS_PATH/
scp backend/migrations/03-indicadores-saques.sql $VPS_USER@$VPS_IP:$VPS_PATH/
scp backend/migrations/04-lootbox-indicadores.sql $VPS_USER@$VPS_IP:$VPS_PATH/
scp backend/migrations/05-criar-tabela-indicacoes.sql $VPS_USER@$VPS_IP:$VPS_PATH/
echo -e "${GREEN}✅ Arquivos enviados${NC}"

# Verificar na VPS
echo ""
echo -e "${YELLOW}5. Verificando arquivos na VPS...${NC}"
ssh $VPS_USER@$VPS_IP "ls -lh ~/crm/backend/migrations/"

echo ""
echo -e "${GREEN}=== RECUPERAÇÃO CONCLUÍDA ===${NC}"
echo ""
echo -e "${YELLOW}PRÓXIMOS PASSOS:${NC}"
echo "1. Conecte na VPS: ssh $VPS_USER@$VPS_IP"
echo "2. Execute: cd ~/crm/backend/migrations"
echo "3. Execute as migrations na ordem:"
echo "   mysql -u root -p crm_db < 01-estrutura.sql"
echo "   mysql -u root -p crm_db < 02-dados-admin.sql"
echo "   mysql -u root -p crm_db < 03-indicadores-saques.sql"
echo "   mysql -u root -p crm_db < 04-lootbox-indicadores.sql"
echo "   mysql -u root -p crm_db < 05-criar-tabela-indicacoes.sql"
echo "4. Verifique: mysql -u root -p crm_db -e 'SHOW TABLES;'"
```

## 🔍 COMO PREVENIR NO FUTURO

### 1. Proteger Diretório de Migrations

```bash
# Na VPS, criar um backup permanente
mkdir -p ~/crm_migrations_master
cp ~/crm/backend/migrations/*.sql ~/crm_migrations_master/

# Tornar somente leitura
chmod 444 ~/crm_migrations_master/*.sql
```

### 2. Adicionar ao .gitignore Local

Certifique-se que arquivos temporários não sejam commitados:

```
# backend/migrations/.gitignore
019_*.sql
020_*.sql
021_*.sql
022_*.sql
*_postgres.sql
*_mysql.sql
README.md
```

### 3. Verificar Antes de Deploy

Antes de fazer deploy, sempre verificar:

```bash
# Local
ls -la backend/migrations/

# Deve mostrar apenas:
# 01-estrutura.sql
# 02-dados-admin.sql
# 03-indicadores-saques.sql
# 04-lootbox-indicadores.sql
# 05-criar-tabela-indicacoes.sql
```

## 📞 SE OS DADOS FORAM PERDIDOS

### Opção 1: Restaurar de Backup

```bash
# Se você tem um backup anterior
mysql -u root -p crm_db < backup_anterior.sql
```

### Opção 2: Recriar Dados Básicos

```bash
# Recriar usuário admin
mysql -u root -p crm_db < 02-dados-admin.sql
```

### Opção 3: Importar de Outro Ambiente

```bash
# Se tem dados no ambiente local
mysqldump -u root -p crm_db > backup_local.sql

# Enviar para VPS
scp backup_local.sql root@VPS_IP:~/

# Importar na VPS
mysql -u root -p crm_db < ~/backup_local.sql
```

## ✅ CHECKLIST DE RECUPERAÇÃO

- [ ] Backup do banco atual feito
- [ ] Arquivos incorretos identificados
- [ ] Backup dos arquivos incorretos feito
- [ ] Arquivos incorretos deletados da VPS
- [ ] Arquivos corretos enviados da máquina local
- [ ] Arquivos corretos verificados na VPS
- [ ] Migrations executadas na ordem
- [ ] Tabelas verificadas com SHOW TABLES
- [ ] Estrutura das tabelas verificada
- [ ] Dados de admin verificados
- [ ] Sistema testado e funcionando

## 🔗 COMANDOS RÁPIDOS DE REFERÊNCIA

```bash
# Ver arquivos na VPS
ssh root@VPS_IP "ls -la ~/crm/backend/migrations/"

# Fazer backup rápido
ssh root@VPS_IP "mysqldump -u root -p crm_db > ~/backup_$(date +%Y%m%d_%H%M%S).sql"

# Enviar arquivo específico
scp backend/migrations/01-estrutura.sql root@VPS_IP:~/crm/backend/migrations/

# Executar migration específica
ssh root@VPS_IP "mysql -u root -p crm_db < ~/crm/backend/migrations/01-estrutura.sql"

# Ver tabelas
ssh root@VPS_IP "mysql -u root -p crm_db -e 'SHOW TABLES;'"
```

## ⚠️ IMPORTANTE

- **SEMPRE** faça backup antes de qualquer alteração
- **NUNCA** delete arquivos sem backup
- **SEMPRE** verifique os arquivos antes de executar
- **TESTE** em ambiente local antes de aplicar na VPS
- **DOCUMENTE** todas as alterações feitas

---

**Data do Incidente**: 03/11/2025 08:58  
**Status**: Aguardando correção  
**Prioridade**: 🔴 CRÍTICA
