# Visualizar Tabelas no PostgreSQL da VPS

## Comandos para Ver Todas as Tabelas Criadas

### 1. Conectar ao PostgreSQL via SSH

```bash
# Conectar na VPS via SSH
ssh user@seu-servidor

# Conectar ao PostgreSQL
psql -U postgres -d nome_do_banco
```

### 2. Comandos Dentro do psql

```sql
-- Ver todas as tabelas do schema público
\dt

-- Ver todas as tabelas com mais detalhes (tamanho, descrição, etc)
\dt+

-- Ver tabelas de todos os schemas
\dt *.*

-- Listar todos os schemas
\dn

-- Ver estrutura de uma tabela específica
\d nome_da_tabela

-- Ver estrutura detalhada de uma tabela
\d+ nome_da_tabela
```

### 3. Comando SQL Direto

```sql
-- Listar todas as tabelas do schema público
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Listar tabelas com mais informações
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### 4. Comando Único via SSH (sem entrar no psql)

```bash
# Ver lista de tabelas
psql -U postgres -d nome_do_banco -c "\dt"

# Ver tabelas com SQL
psql -U postgres -d nome_do_banco -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

### 5. Usando Docker (se aplicável)

```bash
# Se o PostgreSQL está em container Docker
docker exec -it nome_do_container psql -U postgres -d nome_do_banco -c "\dt"

# Ou entrar no container
docker exec -it nome_do_container bash
psql -U postgres -d nome_do_banco
\dt
```

## Comandos Úteis Adicionais

```sql
-- Ver todas as colunas de uma tabela
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'nome_da_tabela';

-- Ver índices de uma tabela
\di nome_da_tabela

-- Ver foreign keys
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- Contar registros de uma tabela
SELECT COUNT(*) FROM nome_da_tabela;

-- Ver últimos registros inseridos
SELECT * FROM nome_da_tabela ORDER BY id DESC LIMIT 10;
```

## Verificar Nome do Banco de Dados

Se não souber o nome do banco, verifique no arquivo `.env` ou `.env.vps`:

```bash
# Na VPS
cat .env.vps | grep DB_NAME
# ou
grep DB_NAME .env.vps

# Local
cat .env | grep DB_NAME
```

## Comandos de Navegação no psql

```
\q          - Sair do psql
\l          - Listar todos os bancos de dados
\c dbname   - Conectar a outro banco
\du         - Listar usuários/roles
\?          - Ajuda sobre comandos
\h          - Ajuda sobre comandos SQL
```

## Exemplo Prático Completo

```bash
# 1. Conectar via SSH na VPS
ssh user@ip-da-vps

# 2. Ver nome do banco no .env
cat .env.vps | grep DB_NAME

# 3. Conectar ao PostgreSQL
psql -U postgres -d nome_do_banco_encontrado

# 4. Listar todas as tabelas
\dt

# 5. Ver estrutura de uma tabela específica
\d usuarios

# 6. Sair
\q
```

## Tabelas Esperadas (baseado nas migrations)

Com base nos arquivos de migração mostrados, as tabelas esperadas são:

1. **usuarios** - Tabela de usuários do sistema
2. **leads** - Tabela de leads/clientes
3. **mensagens** - Tabela de mensagens
4. **tarefas** - Tabela de tarefas
5. **indicadores** - Tabela de indicadores
6. **saques** - Tabela de saques de indicadores
7. **lootbox** - Tabela de lootbox/recompensas
8. **indicacoes** - Tabela de indicações

## Troubleshooting

### Se não conseguir conectar:

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar porta do PostgreSQL
sudo netstat -plnt | grep 5432

# Verificar logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Se tiver erro de autenticação:

```bash
# Editar pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Procurar e ajustar a linha:
# local   all   postgres   peer
# para:
# local   all   postgres   md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

## Script Rápido para Ver Tabelas

Crie um arquivo `ver-tabelas.sh`:

```bash
#!/bin/bash

echo "=== Tabelas no PostgreSQL ==="
echo ""

# Substitua 'nome_do_banco' pelo nome real do seu banco
DB_NAME=$(grep DB_NAME .env.vps | cut -d '=' -f2)

psql -U postgres -d "$DB_NAME" -c "\dt"

echo ""
echo "=== Contagem de registros ==="
echo ""

psql -U postgres -d "$DB_NAME" -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins AS inserted_rows,
    n_tup_upd AS updated_rows,
    n_tup_del AS deleted_rows,
    n_live_tup AS live_rows
FROM pg_stat_user_tables
ORDER BY tablename;
"
```

Execute com:

```bash
chmod +x ver-tabelas.sh
./ver-tabelas.sh
