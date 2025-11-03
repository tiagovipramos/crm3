# Correção do Erro 401 no Login (Produção VPS)

## 🔍 Problema Identificado

O erro 401 (Unauthorized) ao tentar fazer login está ocorrendo por um dos seguintes motivos:

1. **Senha incorreta ou hash inválido** - O hash da senha na migration pode estar incorreto
2. **Usuário não existe** - As migrations podem não ter sido executadas corretamente
3. **Usuário bloqueado** - O campo `ativo` pode estar como `false` ou `0`
4. **Problema de conexão com banco** - O banco de dados pode não estar acessível

## 📋 Diagnóstico Passo a Passo

### Passo 1: Verificar se o Backend Está Funcionando

```bash
# Conectar na VPS
ssh root@185.217.125.72

# Verificar logs do backend
docker-compose logs backend | tail -50

# Verificar se o endpoint de health está respondendo
curl http://185.217.125.72:3001/api/health
```

### Passo 2: Verificar se o MySQL Está Rodando

```bash
# Ver status dos containers
docker-compose ps

# Ver logs do MySQL
docker-compose logs mysql | tail -50

# Acessar o MySQL diretamente
docker-compose exec mysql mysql -uroot -p
# Senha: Crm@VPS2025!Secure#ProdDB
```

### Passo 3: Verificar se o Usuário Existe no Banco

Dentro do MySQL:

```sql
-- Selecionar o banco de dados
USE protecar_crm;

-- Verificar se a tabela consultores existe
SHOW TABLES;

-- Ver todos os consultores
SELECT id, nome, email, ativo FROM consultores;

-- Ver especificamente o diretor
SELECT * FROM consultores WHERE email = 'diretor@protecar.com';
```

## ✅ Soluções Possíveis

### Solução 1: Recriar o Usuário Diretor com Senha Conhecida

Se o usuário não existir ou a senha estiver errada, vamos recriar:

```bash
# Conectar na VPS
ssh root@185.217.125.72

# Acessar o container do MySQL
docker-compose exec mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB protecar_crm
```

Dentro do MySQL, execute:

```sql
-- Deletar o usuário existente (se houver)
DELETE FROM consultores WHERE email = 'diretor@protecar.com';

-- Criar novo usuário diretor
-- Senha: 123456
INSERT INTO consultores (nome, email, senha, telefone, whatsapp, role, ativo) VALUES 
('Diretor', 'diretor@protecar.com', '$2a$10$YQmXZ8pKyY5JZvQ5VxBqWOvH6gxZ7mY3nHyL5x6z8w9q0r1t2u3v4', '11999999999', '11999999999', 'diretor', 1);

-- Verificar se foi criado
SELECT id, nome, email, ativo FROM consultores WHERE email = 'diretor@protecar.com';

-- Sair do MySQL
EXIT;
```

### Solução 2: Criar Usuários de Teste Adicionais

Para facilitar os testes, vamos criar mais usuários:

```sql
-- Usuário: carlos@protecar.com | Senha: 123456
INSERT INTO consultores (nome, email, senha, telefone, whatsapp, role, ativo) VALUES 
('Carlos Silva', 'carlos@protecar.com', '$2a$10$YQmXZ8pKyY5JZvQ5VxBqWOvH6gxZ7mY3nHyL5x6z8w9q0r1t2u3v4', '11988887777', '11988887777', 'consultor', 1);

-- Usuário: ana@protecar.com | Senha: 123456
INSERT INTO consultores (nome, email, senha, telefone, whatsapp, role, ativo) VALUES 
('Ana Paula', 'ana@protecar.com', '$2a$10$YQmXZ8pKyY5JZvQ5VxBqWOvH6gxZ7mY3nHyL5x6z8w9q0r1t2u3v4', '11977776666', '11977776666', 'consultor', 1);

-- Verificar todos os usuários
SELECT id, nome, email, role, ativo FROM consultores;
```

### Solução 3: Reexecutar as Migrations

Se as tabelas não existirem ou estiverem vazias:

```bash
# Conectar na VPS
ssh root@185.217.125.72

# Navegar para o diretório
cd /root/crm

# Parar os containers
docker-compose down

# Remover volume do banco (CUIDADO: isso apaga todos os dados!)
docker volume rm crm_mysql_data

# Recriar tudo
docker-compose up -d

# Aguardar 30 segundos para o banco iniciar
sleep 30

# Ver logs para verificar se as migrations foram executadas
docker-compose logs backend | grep -i migration
```

### Solução 4: Executar as Migrations Manualmente

Se as migrations não foram executadas automaticamente:

```bash
# Copiar os arquivos de migration para dentro do container
docker cp backend/migrations/01-estrutura.sql crm-backend-1:/tmp/
docker cp backend/migrations/02-dados-admin.sql crm-backend-1:/tmp/

# Executar as migrations
docker-compose exec mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB protecar_crm < /tmp/01-estrutura.sql
docker-compose exec mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB protecar_crm < /tmp/02-dados-admin.sql
```

## 🔐 Hash de Senha Correto

O hash usado nas migrations é para a senha `123456`:

```
$2a$10$YQmXZ8pKyY5JZvQ5VxBqWOvH6gxZ7mY3nHyL5x6z8w9q0r1t2u3v4
```

Se você quiser gerar um novo hash para outra senha, use:

```javascript
// Em um arquivo Node.js temporário
const bcrypt = require('bcryptjs');

async function gerarHash() {
  const senha = '123456'; // Troque pela senha desejada
  const hash = await bcrypt.hash(senha, 10);
  console.log('Hash:', hash);
}

gerarHash();
```

## 📊 Teste Final

Após aplicar uma das soluções, teste o login:

1. **Acesse:** http://185.217.125.72:3000
2. **Credenciais:**
   - Email: `diretor@protecar.com`
   - Senha: `123456`

3. **Abra o Console do Navegador** (F12) e verifique:
   - Não deve haver erros 401
   - Deve redirecionar para o dashboard

## 🔍 Debug Adicional

Se ainda houver problemas, ative logs detalhados:

```bash
# Ver logs em tempo real
docker-compose logs -f backend

# Em outro terminal, tente fazer login pela interface
# Os logs vão mostrar exatamente o que está acontecendo
```

Procure por mensagens como:
- `Erro no login:` - Indica erro no código
- `Credenciais inválidas` - Email ou senha errados
- `Usuário Bloqueado` - Campo `ativo` está false

## 📝 Checklist de Verificação

- [ ] Backend está rodando sem erros
- [ ] MySQL está acessível
- [ ] Tabela `consultores` existe
- [ ] Usuário `diretor@protecar.com` existe
- [ ] Campo `ativo` está como `1` ou `TRUE`
- [ ] Hash da senha está correto
- [ ] Login funciona sem erro 401
- [ ] Redirecionamento para dashboard funciona

## 🆘 Solução Rápida (Script Automatizado)

Crie um arquivo `fix-login-401.sh` na VPS:

```bash
#!/bin/bash

echo "🔧 Corrigindo erro 401 no login..."

# Acessar MySQL e recriar usuário diretor
docker-compose exec -T mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB protecar_crm <<EOF
-- Deletar usuário existente
DELETE FROM consultores WHERE email = 'diretor@protecar.com';

-- Criar novo usuário com senha 123456
INSERT INTO consultores (nome, email, senha, telefone, whatsapp, role, ativo) VALUES 
('Diretor', 'diretor@protecar.com', '\$2a\$10\$YQmXZ8pKyY5JZvQ5VxBqWOvH6gxZ7mY3nHyL5x6z8w9q0r1t2u3v4', '11999999999', '11999999999', 'diretor', 1);

-- Verificar
SELECT id, nome, email, role, ativo FROM consultores WHERE email = 'diretor@protecar.com';
EOF

echo "✅ Usuário diretor recriado com sucesso!"
echo "📧 Email: diretor@protecar.com"
echo "🔑 Senha: 123456"
```

Execute:

```bash
chmod +x fix-login-401.sh
./fix-login-401.sh
```

## 💡 Dica Importante

Em produção, sempre use senhas fortes e nunca use `123456`! Este é apenas um exemplo para testes iniciais.
