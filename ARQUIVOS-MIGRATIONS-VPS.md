# 📋 Arquivos de Migrations para Criar Tabelas na VPS

## Os 5 arquivos SQL principais:

### 1. **01-estrutura.sql**
- Cria todas as tabelas principais do sistema
- Localização: `backend/migrations/01-estrutura.sql`
- Contém: consultores, leads, mensagens, tarefas, follow_ups, propostas, etc.

### 2. **02-dados-admin.sql**
- Insere dados iniciais (usuário admin)
- Localização: `backend/migrations/02-dados-admin.sql`
- Cria o primeiro usuário administrador

### 3. **03-indicadores-saques.sql**
- Cria tabelas do sistema de indicadores
- Localização: `backend/migrations/03-indicadores-saques.sql`
- Contém: indicadores, saques, comissões

### 4. **04-lootbox-indicadores.sql**
- Cria tabelas do sistema de lootbox
- Localização: `backend/migrations/04-lootbox-indicadores.sql`
- Contém: lootbox, vendas, prêmios

### 5. **05-criar-tabela-indicacoes.sql**
- Cria tabela de indicações
- Localização: `backend/migrations/05-criar-tabela-indicacoes.sql`

---

## 🚀 Como executar na VPS:

### Opção 1: Via Docker (mais fácil)

```bash
# Copiar arquivos para dentro do container
docker cp backend/migrations/01-estrutura.sql protecar-mysql:/tmp/
docker cp backend/migrations/02-dados-admin.sql protecar-mysql:/tmp/
docker cp backend/migrations/03-indicadores-saques.sql protecar-mysql:/tmp/
docker cp backend/migrations/04-lootbox-indicadores.sql protecar-mysql:/tmp/
docker cp backend/migrations/05-criar-tabela-indicacoes.sql protecar-mysql:/tmp/

# Executar cada migration
docker-compose exec mysql mysql -u protecar_user -pprotecar_dev_2025 protecar_crm < backend/migrations/01-estrutura.sql
docker-compose exec mysql mysql -u protecar_user -pprotecar_dev_2025 protecar_crm < backend/migrations/02-dados-admin.sql
docker-compose exec mysql mysql -u protecar_user -pprotecar_dev_2025 protecar_crm < backend/migrations/03-indicadores-saques.sql
docker-compose exec mysql mysql -u protecar_user -pprotecar_dev_2025 protecar_crm < backend/migrations/04-lootbox-indicadores.sql
docker-compose exec mysql mysql -u protecar_user -pprotecar_dev_2025 protecar_crm < backend/migrations/05-criar-tabela-indicacoes.sql
```

### Opção 2: Comando único

```bash
cd /root/crm

for file in backend/migrations/*.sql; do
  echo "Executando $file..."
  docker-compose exec -T mysql mysql -u protecar_user -pprotecar_dev_2025 protecar_crm < "$file"
done
```

### Opção 3: Script automatizado

Crie um arquivo `executar-migrations.sh`:

```bash
#!/bin/bash
echo "🔄 Executando migrations..."

docker-compose exec -T mysql mysql -u protecar_user -pprotecar_dev_2025 protecar_crm < backend/migrations/01-estrutura.sql
docker-compose exec -T mysql mysql -u protecar_user -pprotecar_dev_2025 protecar_crm < backend/migrations/02-dados-admin.sql
docker-compose exec -T mysql mysql -u protecar_user -pprotecar_dev_2025 protecar_crm < backend/migrations/03-indicadores-saques.sql
docker-compose exec -T mysql mysql -u protecar_user -pprotecar_dev_2025 protecar_crm < backend/migrations/04-lootbox-indicadores.sql
docker-compose exec -T mysql mysql -u protecar_user -pprotecar_dev_2025 protecar_crm < backend/migrations/05-criar-tabela-indicacoes.sql

echo "✅ Migrations executadas!"
docker-compose exec mysql mysql -u protecar_user -pprotecar_dev_2025 -D protecar_crm -e "SHOW TABLES;"
```

Depois execute:
```bash
chmod +x executar-migrations.sh
./executar-migrations.sh
```

---

## ✅ Verificar se funcionou:

```bash
docker-compose exec mysql mysql -u protecar_user -pprotecar_dev_2025 -D protecar_crm -e "SHOW TABLES;"
```

Deve mostrar todas as tabelas criadas!
