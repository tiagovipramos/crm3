# ⚠️ RESOLVER DIVERGÊNCIA DE BRANCHES NA VPS

## Problema Atual

```
fatal: Need to specify how to reconcile divergent branches.
```

Isso aconteceu porque fizemos force push no GitHub, e a VPS tem commits diferentes.

## ✅ SOLUÇÃO RÁPIDA

Execute estes comandos **EXATAMENTE NESTA ORDEM** na VPS:

```bash
# 1. Parar containers primeiro (importante!)
docker-compose down

# 2. Fazer backup do .env
cp .env .env.backup-$(date +%Y%m%d-%H%M%S)

# 3. Descartar todas as mudanças locais e forçar reset
git fetch origin
git reset --hard origin/master

# 4. Restaurar o .env
cp .env.backup-* .env 2>/dev/null || echo ".env já existe"

# 5. Verificar o commit atual
git log -1 --oneline

# 6. Limpar Docker
docker system prune -af

# 7. Rebuild e iniciar
docker-compose up -d --build

# 8. Ver logs
docker-compose logs -f
```

## 📋 Comandos Individuais (Copie e Cole)

Se preferir copiar e colar um por vez:

```bash
docker-compose down
```

```bash
cp .env .env.backup-$(date +%Y%m%d-%H%M%S)
```

```bash
git fetch origin
```

```bash
git reset --hard origin/master
```

```bash
ls -la .env
```

```bash
docker system prune -af
```

```bash
docker-compose up -d --build
```

```bash
docker-compose logs -f
```

## 🔍 Verificar Se Funcionou

Após executar, você deve ver:

```bash
git log -1 --oneline
```

Saída esperada:
```
3db450d docs: Adicionar instruções e script para reverter VPS ao commit f3c3682
```

E os containers devem estar rodando:

```bash
docker ps
```

## ⚠️ IMPORTANTE

- O arquivo `.env` será preservado pelos backups automáticos
- Se por algum motivo o `.env` sumir, recrie com:

```bash
cat > .env << 'EOF'
# Banco de Dados MySQL
DB_HOST=mysql
DB_NAME=protecar_crm
DB_USER=root
DB_PASSWORD=Crm@VPS2025!Secure#ProdDB
DB_PORT=3306

# Backend
PORT=3001
NODE_ENV=production
JWT_SECRET=vps-prod-jwt-secret-a9f8e7d6c5b4a3f2e1d0c9b8a7e6d5c4b3a2f1e0d9c8b7a6
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=https://boraindicar.com.br
NEXT_PUBLIC_API_URL=https://boraindicar.com.br/api
NEXT_PUBLIC_WS_URL=https://boraindicar.com.br
EOF
```

## 🎯 Após Concluir

Teste o sistema:
- Frontend: https://boraindicar.com.br
- Backend: https://boraindicar.com.br/api/health
- Admin: https://boraindicar.com.br/admin
- CRM: https://boraindicar.com.br/crm
