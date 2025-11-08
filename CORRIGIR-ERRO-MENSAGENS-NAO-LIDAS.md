# 🔧 Correção - Erro de Mensagens Não Lidas

## 📋 Problema Identificado

O sistema está quebrando ao receber mensagens do WhatsApp com o erro:

```
Error: Unknown column 'mensagens_nao_lidas' in 'field list'
```

**Causa:** O código foi atualizado para incluir contagem de mensagens não lidas, mas a migration não foi executada no banco de dados da VPS.

---

## ✅ Solução: Executar Migration 12

### 📦 Arquivos Criados

1. **backend/migrations/12-adicionar-mensagens-nao-lidas.sql** - Migration SQL
2. **backend/executar-migration-mensagens-nao-lidas.sh** - Script de execução

---

## 🚀 Passo a Passo para Corrigir na VPS

### 1️⃣ Fazer commit e push dos arquivos (Local)

```bash
# Adicionar arquivos
git add backend/migrations/12-adicionar-mensagens-nao-lidas.sql
git add backend/executar-migration-mensagens-nao-lidas.sh

# Commit
git commit -m "fix: adicionar migration para coluna mensagens_nao_lidas"

# Push
git push origin main
```

### 2️⃣ Conectar na VPS e atualizar código

```bash
# SSH na VPS
ssh root@vmi2789491.contaboserver.net

# Navegar até o diretório do projeto
cd ~/crm

# Baixar atualizações
git pull origin main
```

### 3️⃣ Executar a Migration

**Opção A: Usando o script (Recomendado)**

```bash
# Dar permissão de execução
chmod +x backend/executar-migration-mensagens-nao-lidas.sh

# Executar o script
./backend/executar-migration-mensagens-nao-lidas.sh
```

**Opção B: Manualmente**

```bash
# Executar SQL diretamente no container MySQL
docker exec -i crm-mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB protecar_crm < backend/migrations/12-adicionar-mensagens-nao-lidas.sql
```

### 4️⃣ Reiniciar o Backend

```bash
# Reiniciar apenas o backend
docker-compose restart backend

# Ou reiniciar todos os containers
docker-compose restart
```

### 5️⃣ Verificar os Logs

```bash
# Ver logs do backend
docker-compose logs -f backend

# Você deve ver:
# ✅ Conectado ao MySQL
# ✅ Banco de dados conectado
# 🚀 Servidor rodando em: http://localhost:3001
```

---

## 🔍 Verificar se a Correção Funcionou

### Teste 1: Verificar se a coluna foi criada

```bash
docker exec -it crm-mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB protecar_crm -e "DESCRIBE leads;"
```

**Resultado esperado:** Deve aparecer a coluna `mensagens_nao_lidas`

### Teste 2: Testar recebimento de mensagens

1. Acesse o CRM pelo navegador
2. Conecte o WhatsApp
3. Envie uma mensagem de teste do seu celular
4. Verifique se a mensagem aparece no CRM **SEM ERROS nos logs**

### Teste 3: Verificar logs

```bash
docker-compose logs -f backend | grep "mensagens_nao_lidas"
```

**Resultado esperado:** NÃO deve aparecer o erro `Unknown column 'mensagens_nao_lidas'`

---

## 📊 O que a Migration Faz

1. **Adiciona a coluna** `mensagens_nao_lidas` na tabela `leads`
   - Tipo: INT
   - Default: 0
   - NOT NULL

2. **Cria um índice** para melhorar performance

3. **Atualiza leads existentes** para garantir valor 0

---

## 🐛 Troubleshooting

### Se o erro persistir após executar a migration:

**1. Verificar se a migration foi aplicada:**

```bash
docker exec -it crm-mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB protecar_crm -e "SHOW COLUMNS FROM leads LIKE 'mensagens_nao_lidas';"
```

**2. Verificar se o backend reiniciou:**

```bash
docker ps | grep crm-backend
```

**3. Forçar rebuild do backend:**

```bash
docker-compose down
docker-compose up -d --build
```

**4. Verificar se há cache de conexão:**

```bash
docker-compose restart mysql
docker-compose restart backend
```

---

## ⚠️ IMPORTANTE

- A migration é **idempotente** (pode ser executada múltiplas vezes sem problemas)
- A coluna será criada apenas se não existir (`IF NOT EXISTS`)
- Todos os leads existentes receberão valor 0 automaticamente
- O índice melhora a performance de consultas

---

## 📝 Checklist de Execução

- [ ] Commit e push dos arquivos
- [ ] Pull na VPS
- [ ] Executar migration
- [ ] Reiniciar backend
- [ ] Verificar logs sem erros
- [ ] Testar recebimento de mensagens
- [ ] Confirmar funcionamento normal

---

## 💡 Por que isso aconteceu?

O código foi atualizado localmente para adicionar a funcionalidade de contagem de mensagens não lidas, mas a migration correspondente não foi enviada/executada junto com o código na VPS. Isso criou uma incompatibilidade entre o código (que espera a coluna) e o banco de dados (que não tem a coluna).

**Prevenção futura:** Sempre executar migrations após fazer deploy de código que depende de mudanças no banco de dados.
