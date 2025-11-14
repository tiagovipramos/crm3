# 🚀 Instruções para Aplicar Correção do Erro 400 no Login (VPS)

## 📋 Resumo da Correção

Foi identificado e corrigido um erro 400 no login causado por **token JWT expirado** sendo enviado no header `Authorization` das requisições de login.

**Commit aplicado:** `c3b1216` - "fix: corrigir erro 400 no login removendo token expirado das requisições de autenticação"

---

## 🔧 Aplicar Correção no VPS

### Opção 1: Script Automatizado (Recomendado)

```bash
# Conectar no VPS
ssh root@vmi2789491.contaboserver.net

# Ir para o diretório do projeto
cd ~/crm

# Baixar código atualizado
git pull origin main

# Executar script de correção
chmod +x corrigir-login-400-vps.sh
./corrigir-login-400-vps.sh
```

O script irá:
1. ✅ Atualizar código do repositório
2. ✅ Verificar se correção está presente
3. ✅ Parar frontend
4. ✅ Fazer rebuild do frontend (sem cache)
5. ✅ Iniciar frontend novamente
6. ✅ Verificar logs

---

### Opção 2: Passo a Passo Manual

```bash
# 1. Conectar no VPS
ssh root@vmi2789491.contaboserver.net

# 2. Ir para o diretório
cd ~/crm

# 3. Atualizar código
git pull origin main

# 4. Verificar se correção está presente
grep -q "isLoginRoute" lib/api.ts && echo "✅ Correção encontrada" || echo "❌ Erro"

# 5. Parar frontend
docker-compose stop frontend

# 6. Rebuild do frontend (SEM CACHE)
docker-compose build --no-cache frontend

# 7. Iniciar frontend
docker-compose up -d frontend

# 8. Aguardar 30 segundos
sleep 30

# 9. Verificar logs
docker-compose logs --tail=50 frontend
docker-compose logs --tail=20 backend | grep -E "(400|login)"
```

---

## 🧪 Testar Correção

### 1. Limpar Cache do Navegador

**Importante:** O navegador pode ter cacheado a versão antiga do código.

- **Chrome/Edge:** `Ctrl + Shift + Delete` → Selecionar "Imagens e arquivos em cache" → Limpar
- **Firefox:** `Ctrl + Shift + Delete` → Selecionar "Cache" → Limpar

### 2. Acessar e Testar Login

1. Acesse: https://boraindicar.com.br
2. Abra DevTools (F12)
3. Vá para aba **Network**
4. Tente fazer login

### 3. Verificar Requisição de Login

Na aba Network, clique na requisição `/api/auth/login` e verifique:

**✅ CORRETO:**
```
Request Headers:
- Content-Type: application/json
- (NÃO deve ter Authorization header)

Request Payload:
{
  "email": "seu@email.com",
  "senha": "suasenha"
}

Response:
Status: 200 OK
{
  "token": "eyJhbGc...",
  "consultor": {...}
}
```

**❌ INCORRETO (se ainda tiver erro):**
```
Response:
Status: 400 Bad Request
{
  "error": "Email e senha são obrigatórios"
}
```

---

## 📊 Monitorar Logs em Tempo Real

```bash
# Conectado no VPS, execute:
docker-compose logs -f frontend backend
```

Pressione `Ctrl + C` para sair.

---

## 🐛 Troubleshooting

### Erro persiste após rebuild

```bash
# 1. Parar TODOS os containers
docker-compose down

# 2. Remover imagens antigas
docker rmi crm-frontend crm-backend

# 3. Rebuild completo
docker-compose build --no-cache

# 4. Iniciar novamente
docker-compose up -d

# 5. Verificar logs
docker-compose logs -f
```

### Frontend não está atualizando

```bash
# Verificar se build pegou código atualizado
docker-compose exec frontend cat /app/lib/api.ts | grep "isLoginRoute"

# Deve mostrar a linha com a verificação:
# const isLoginRoute = config.url?.includes('/auth/login')
```

### Cache do navegador não limpa

1. Acesse DevTools (F12)
2. Clique com botão direito no botão Atualizar
3. Selecione "Esvaziar cache e atualizar forçadamente"

---

## ✅ Checklist de Verificação

Após aplicar a correção, verifique:

- [ ] Código atualizado no VPS (`git pull` executado)
- [ ] Frontend reconstruído (`docker-compose build --no-cache frontend`)
- [ ] Containers rodando (`docker-compose ps` mostra frontend e backend "Up")
- [ ] Cache do navegador limpo
- [ ] Login funciona sem erro 400
- [ ] Requisição de login NÃO tem header Authorization
- [ ] Token é retornado corretamente

---

## 📞 Suporte

Se o erro persistir:

1. Capture logs: `docker-compose logs backend > logs-backend.txt`
2. Capture screenshot da requisição no DevTools
3. Verifique se código foi realmente atualizado no VPS
4. Confirme que frontend foi reconstruído (não apenas reiniciado)

---

## 📝 Arquivos Modificados

- **lib/api.ts** - Interceptores do Axios corrigidos
- **corrigir-login-400-vps.sh** - Script de aplicação da correção

## 🎯 Commit

```
commit c3b1216
Author: Tiago
Date: 2025-11-14

fix: corrigir erro 400 no login removendo token expirado das requisições de autenticação

- Interceptor do Axios não adiciona token em rotas de login
- Limpa token anterior antes de nova requisição de login
- Evita loops de redirecionamento em erro 401
```
