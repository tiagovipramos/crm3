# 🔄 Reverter VPS para Commit f3c3682

## ✅ Status do Processo

- [x] Repositório local revertido para f3c3682
- [x] GitHub atualizado (force push realizado)
- [ ] VPS precisa ser revertido

## 📋 O Que Fazer na VPS

### Opção 1: Executar Script Automático (Recomendado)

1. **Conecte-se à VPS via SSH:**
```bash
ssh root@185.217.125.72
# OU
ssh seu_usuario@185.217.125.72
```

2. **Navegue até o diretório do projeto:**
```bash
cd /root/crm3
# OU o caminho onde o projeto está instalado
```

3. **Execute o script de reversão:**
```bash
# Baixar o script de reversão
curl -o reverter-commit.sh https://raw.githubusercontent.com/tiagovipramos/crm3/master/reverter-vps-para-commit.sh

# OU copie e cole o conteúdo do script reverter-vps-para-commit.sh que está na raiz do projeto

# Dar permissão de execução
chmod +x reverter-commit.sh

# Executar
./reverter-commit.sh
```

### Opção 2: Executar Comandos Manualmente

Se preferir executar passo a passo:

```bash
# 1. Conectar à VPS
ssh root@185.217.125.72

# 2. Navegar até o diretório do projeto
cd /root/crm3

# 3. Parar containers
docker-compose down

# 4. Fazer backup do .env (importante!)
cp .env .env.backup

# 5. Resetar para o commit f3c3682
git fetch origin
git reset --hard f3c3682

# 6. Restaurar o .env (ele não está no git)
cp .env.backup .env

# 7. Limpar imagens Docker antigas
docker system prune -af

# 8. Rebuild e iniciar containers
docker-compose up -d --build

# 9. Verificar logs
docker-compose logs -f
```

## ⚠️ IMPORTANTE - Arquivo .env

O arquivo `.env` **NÃO está no Git** (está no .gitignore).

**Após fazer o git reset, você DEVE verificar se o .env está correto:**

```bash
# Verificar se o .env existe
ls -la .env

# Verificar conteúdo
cat .env
```

Se o `.env` não existir ou estiver incorreto, recrie:

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

## 🔍 Verificar Se Funcionou

Após o rebuild, verifique:

```bash
# Ver containers rodando
docker ps

# Ver logs do backend
docker logs crm-backend -f

# Ver logs do frontend
docker logs crm-frontend -f

# Ver logs do banco
docker logs crm-mysql -f
```

### Testar Acesso

1. **Frontend:** https://boraindicar.com.br
2. **Backend API:** https://boraindicar.com.br/api/health
3. **Admin:** https://boraindicar.com.br/admin
4. **CRM:** https://boraindicar.com.br/crm

## 🐛 Troubleshooting

### Se os containers não subirem:

```bash
# Ver logs de erro
docker-compose logs

# Forçar rebuild completo
docker-compose down -v
docker system prune -af
docker-compose up -d --build
```

### Se o banco de dados tiver problemas:

```bash
# Verificar se o MySQL está rodando
docker ps | grep mysql

# Ver logs do MySQL
docker logs crm-mysql

# Se necessário, recriar o volume do banco
docker-compose down -v
docker volume rm crm_mysql_data
docker-compose up -d --build
```

⚠️ **ATENÇÃO:** Recriar o volume do banco **apagará todos os dados**! Faça backup primeiro se necessário.

### Fazer Backup do Banco (Antes de Recriar)

```bash
# Backup
docker exec crm-mysql mysqldump -u root -p'Crm@VPS2025!Secure#ProdDB' protecar_crm > backup-$(date +%Y%m%d-%H%M%S).sql

# Restaurar depois (se necessário)
docker exec -i crm-mysql mysql -u root -p'Crm@VPS2025!Secure#ProdDB' protecar_crm < backup-XXXXXXXX.sql
```

## 📊 Commit f3c3682 - O Que Este Commit Contém

```
f3c3682 - fix: Corrigir números LID (@lid) - normalização e formatação
```

Este commit corrige problemas com a normalização e formatação dos números LID no sistema.

## ✅ Checklist Final

- [ ] Conectado à VPS via SSH
- [ ] Navegado até o diretório do projeto
- [ ] Containers parados
- [ ] Backup do .env feito
- [ ] Git resetado para f3c3682
- [ ] Arquivo .env verificado/restaurado
- [ ] Imagens Docker limpas
- [ ] Containers rebuilded
- [ ] Logs verificados
- [ ] Sistema testado no navegador

## 🎯 Resultado Esperado

Após concluir todos os passos:
- ✅ Sistema local no commit f3c3682
- ✅ GitHub no commit f3c3682
- ✅ VPS no commit f3c3682
- ✅ Todos os containers rodando normalmente
- ✅ Sistema acessível e funcional

## 📞 Suporte

Se houver problemas:
1. Verifique os logs: `docker-compose logs -f`
2. Verifique o status dos containers: `docker ps`
3. Verifique o arquivo .env: `cat .env`
4. Tire prints dos erros para análise
