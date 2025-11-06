# 🔍 Comandos para Diagnóstico na VPS

## ✅ Verificar se Backend está Funcionando

### 1. **Ver logs do backend:**
```bash
docker-compose logs -f backend
```

**Procure por:**
```
✅ Conectado ao MySQL
🚀 Servidor rodando na porta 3001
```

### 2. **Verificar status dos containers:**
```bash
docker-compose ps
```

**Deve mostrar:**
```
NAME            STATUS
crm-mysql       Up (healthy)
crm-backend     Up
crm-frontend    Up
```

### 3. **Testar API do backend diretamente:**
```bash
curl http://localhost:3001/api/health
```

**Deve retornar:**
```json
{"status":"ok","message":"VIP CRM Backend funcionando!"}
```

### 4. **Testar rota de funis:**
```bash
curl http://localhost:3001/api/funis/etapas \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 🔍 Verificar Variáveis de Ambiente do Frontend

### 5. **Ver variáveis dentro do container do frontend:**
```bash
docker exec crm-frontend env | grep NEXT_PUBLIC
```

**Deve mostrar:**
```
NEXT_PUBLIC_API_URL=http://185.217.125.72:3001/api
NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001
```

### 6. **Verificar se está usando localhost:**
```bash
docker exec crm-frontend cat /app/.next/BUILD_ID
docker exec crm-frontend ls -la /app/.next/
```

---

## 🔍 Verificar Arquivo .env na VPS

### 7. **Ver conteúdo do .env (sem senhas):**
```bash
cat .env | grep -v PASSWORD
```

### 8. **Verificar se Docker Compose está lendo o .env:**
```bash
docker-compose config | grep -A5 "NEXT_PUBLIC"
```

---

## 🛠️ Se Frontend Estiver com Variáveis Erradas

### 9. **Rebuild do frontend com variáveis corretas:**
```bash
# Parar containers
docker-compose down

# Rebuild APENAS do frontend (mais rápido)
docker-compose build --no-cache frontend

# Subir novamente
docker-compose up -d

# Ver logs do frontend
docker-compose logs -f frontend
```

---

## 🔍 Verificar Build do Frontend

### 10. **Ver arquivos de build do Next.js:**
```bash
docker exec crm-frontend ls -la /app/.next/static/chunks/
```

### 11. **Procurar por localhost nos arquivos builded:**
```bash
docker exec crm-frontend grep -r "localhost:3001" /app/.next/ 2>/dev/null | head -5
```

Se retornar resultados, significa que o frontend foi builded com localhost.

---

## 🎯 Verificação Completa (Executar na ordem)

```bash
# 1. Status dos containers
echo "=== STATUS DOS CONTAINERS ==="
docker-compose ps

# 2. Logs do backend (últimas 30 linhas)
echo ""
echo "=== LOGS DO BACKEND ==="
docker-compose logs --tail=30 backend

# 3. Variáveis do frontend
echo ""
echo "=== VARIÁVEIS DO FRONTEND ==="
docker exec crm-frontend env | grep NEXT_PUBLIC

# 4. Teste da API
echo ""
echo "=== TESTE DA API ==="
curl -s http://localhost:3001/api/health | jq

# 5. Verificar .env
echo ""
echo "=== ARQUIVO .ENV ==="
cat .env | grep -v PASSWORD | grep -v SECRET

# 6. Verificar se frontend tem localhost
echo ""
echo "=== PROCURAR LOCALHOST NO FRONTEND ==="
docker exec crm-frontend grep -r "localhost:3001" /app/.next/ 2>/dev/null | wc -l
echo "linhas encontradas com localhost:3001"
```

---

## 🚨 Solução se Frontend Tiver localhost

### Se o comando 11 encontrar "localhost:3001":

```bash
# 1. Parar tudo
docker-compose down

# 2. Verificar se .env está correto
cat .env | grep NEXT_PUBLIC

# 3. Se estiver errado, corrigir:
nano .env
# Ajustar para:
# NEXT_PUBLIC_API_URL=http://185.217.125.72:3001/api
# NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001

# 4. Rebuild do frontend
docker-compose build --no-cache frontend

# 5. Subir novamente
docker-compose up -d

# 6. Verificar logs
docker-compose logs -f frontend
```

---

## 📊 Output Esperado de Cada Comando

### Status (comando 2):
```
NAME            COMMAND                  SERVICE     STATUS              PORTS
crm-mysql       "docker-entrypoint.s…"   mysql       Up (healthy)        33060/tcp, 0.0.0.0:3307->3306/tcp
crm-backend     "docker-entrypoint.s…"   backend     Up                  0.0.0.0:3001->3001/tcp
crm-frontend    "docker-entrypoint.s…"   frontend    Up                  0.0.0.0:3000->3000/tcp
```

### Logs Backend (comando 1):
```
✅ Banco de dados conectado
🚀 Servidor rodando em: http://localhost:3001
🚀 API disponível em: http://localhost:3001/api
```

### Variáveis Frontend (comando 5):
```
NEXT_PUBLIC_API_URL=http://185.217.125.72:3001/api
NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001
```

Se mostrar `localhost`, precisa fazer rebuild!
