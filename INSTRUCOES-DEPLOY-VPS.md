# 🚀 Instruções de Deploy - Correção WebSocket na VPS

## 📋 Problema Identificado

O frontend estava tentando conectar ao WebSocket em `ws://localhost:3001`, mas na VPS deveria conectar em `ws://185.217.125.72:3001`.

## ✅ Correções Realizadas

### 1. **docker-compose.yml**
- Adicionada variável `NEXT_PUBLIC_WS_URL` nos args do build
- Adicionada variável `NEXT_PUBLIC_WS_URL` no environment do container

### 2. **Dockerfile**
- Adicionado `ARG NEXT_PUBLIC_WS_URL` para receber a variável durante o build
- Adicionado `ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL` para configurar a variável

### 3. **.env.vps**
- Já estava correto com `NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001`

---

## 🔧 Passo a Passo para Aplicar na VPS

### 1. **Fazer Commit e Push no Git (Local)**

```bash
# Verificar arquivos modificados
git status

# Adicionar arquivos modificados
git add docker-compose.yml Dockerfile

# Fazer commit
git commit -m "fix: corrigir configuração WebSocket para VPS"

# Enviar para o repositório
git push origin main
```

### 2. **Atualizar Código na VPS**

Conecte-se à VPS via SSH e execute:

```bash
# Navegar até o diretório do projeto
cd /caminho/do/seu/projeto

# Baixar as atualizações
git pull origin main

# Verificar se .env está configurado corretamente
cat .env
```

**⚠️ CRÍTICO:** O arquivo `.env` **NÃO vai pro Git** (está no .gitignore).

**NA VPS, você DEVE criar o .env manualmente:**

```bash
# Opção 1: Copiar do template
cp .env.vps .env

# Opção 2: Criar manualmente
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
FRONTEND_URL=http://185.217.125.72:3000
NEXT_PUBLIC_API_URL=http://185.217.125.72:3001/api
NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001
EOF

# Verificar se foi criado corretamente
cat .env
```

**ATENÇÃO:** Sem o `.env` configurado, o frontend vai usar `localhost:3001` e NÃO VAI FUNCIONAR!

### 3. **Rebuild dos Containers Docker**

```bash
# Parar containers atuais
docker-compose down

# Remover imagem antiga do frontend (IMPORTANTE!)
docker rmi crm-frontend

# Rebuild e iniciar containers
docker-compose up -d --build

# Verificar logs
docker-compose logs -f frontend
```

### 4. **Verificar Se Funcionou**

Após o rebuild, acesse:
- **Frontend:** http://185.217.125.72:3000/crm
- **Backend:** http://185.217.125.72:3001/api/health

Abra o console do navegador (F12) e verifique:
- ✅ Deve aparecer: `Socket.IO conectado em: ...`
- ❌ NÃO deve aparecer: `Firefox can't establish a connection to ws://localhost:3001`

### 5. **Testar WhatsApp**

1. Faça login no CRM
2. Clique em "Conectar WhatsApp"
3. O QR Code deve aparecer
4. Escaneie com seu celular
5. O status deve atualizar automaticamente para "Online"

---

## 🐛 Troubleshooting

### Se o WebSocket ainda não conectar:

**1. Verificar se a porta 3001 está aberta no firewall:**
```bash
sudo ufw status
sudo ufw allow 3001
```

**2. Verificar se o backend está rodando:**
```bash
docker ps
docker logs crm-backend
```

**3. Verificar variáveis de ambiente do frontend:**
```bash
docker exec crm-frontend env | grep NEXT_PUBLIC
```

Deve mostrar:
```
NEXT_PUBLIC_API_URL=http://185.217.125.72:3001/api
NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001
```

**4. Forçar rebuild completo (última opção):**
```bash
docker-compose down -v
docker system prune -af
docker-compose up -d --build
```

---

## 📝 Checklist de Deploy

- [ ] Commit e push das mudanças
- [ ] Pull na VPS
- [ ] Verificar arquivo .env na VPS
- [ ] Parar containers
- [ ] Remover imagem antiga do frontend
- [ ] Rebuild com --build
- [ ] Verificar logs do frontend
- [ ] Testar no navegador (F12 Console)
- [ ] Testar conexão WhatsApp

---

## 💡 Dicas

- **Sempre use `--build`** ao fazer `docker-compose up` após mudanças no código
- **Variáveis NEXT_PUBLIC_*** precisam de rebuild para serem atualizadas
- **Firewall**: Certifique-se que as portas 3000 e 3001 estão abertas
- **Console do Navegador**: É seu melhor amigo para debug do WebSocket

---

## ⚠️ IMPORTANTE

Após o rebuild, pode levar alguns segundos para:
1. O MySQL inicializar
2. O Backend conectar ao banco
3. O Frontend estar disponível

**Aguarde cerca de 30-60 segundos** antes de testar.

---

## 🎯 Resultado Esperado

Após seguir todos os passos, você deve conseguir:
- ✅ Conectar no CRM sem erros de WebSocket
- ✅ Ver o QR Code do WhatsApp
- ✅ Receber atualizações em tempo real do status
- ✅ Receber mensagens instantaneamente
- ✅ Ver notificações de novos leads

---

## 📞 Suporte

Se após seguir todos os passos ainda houver problemas:
1. Verifique os logs: `docker-compose logs -f`
2. Verifique o console do navegador (F12)
3. Tire prints dos erros para análise
