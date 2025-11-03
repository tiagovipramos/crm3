# Correção do Erro 404 no Login (Produção VPS)

## 🔍 Problema Identificado

O erro 404 ao tentar fazer login estava ocorrendo porque:

- **Backend** esperava requisições em: `http://185.217.125.72:3001/api/auth/login`
- **Frontend** estava fazendo requisições para: `http://185.217.125.72:3001/auth/login` (sem `/api`)

A variável de ambiente `NEXT_PUBLIC_API_URL` estava configurada sem o sufixo `/api`.

## ✅ Solução Aplicada

Foi corrigido o arquivo `.env.vps` de:
```env
NEXT_PUBLIC_API_URL=http://185.217.125.72:3001
```

Para:
```env
NEXT_PUBLIC_API_URL=http://185.217.125.72:3001/api
```

## 🚀 Como Aplicar a Correção na VPS

### Opção 1: Usando o Script Automatizado (Recomendado)

1. **Fazer upload dos arquivos atualizados para a VPS:**
   ```bash
   # No seu computador local, fazer upload via SCP/SFTP:
   scp .env.vps root@185.217.125.72:/root/crm/
   scp redeploy-vps.sh root@185.217.125.72:/root/crm/
   ```

2. **Conectar na VPS via SSH:**
   ```bash
   ssh root@185.217.125.72
   ```

3. **Navegar para o diretório do projeto:**
   ```bash
   cd /root/crm
   ```

4. **Dar permissão de execução ao script:**
   ```bash
   chmod +x redeploy-vps.sh
   ```

5. **Executar o script de redeploy:**
   ```bash
   ./redeploy-vps.sh
   ```

### Opção 2: Comandos Manuais

Se preferir executar passo a passo:

```bash
# 1. Conectar na VPS
ssh root@185.217.125.72

# 2. Navegar para o diretório
cd /root/crm

# 3. Fazer backup do .env atual
cp .env .env.backup

# 4. Copiar a nova configuração
cp .env.vps .env

# 5. Parar os containers
docker-compose down

# 6. Reconstruir com as novas variáveis (sem cache)
docker-compose build --no-cache

# 7. Iniciar os containers
docker-compose up -d

# 8. Verificar os logs
docker-compose logs -f
```

## 🔍 Verificação

Após o redeploy:

1. **Acesse o frontend:** http://185.217.125.72:3000
2. **Tente fazer login** com as credenciais de teste
3. **Abra o console do navegador** (F12) e verifique se não há mais erros 404

### Credenciais de Teste

Conforme o arquivo `backend/migrations/02-dados-admin.sql`:

**Carlos Silva (Consultor):**
- Email: carlos@protecar.com
- Senha: 123456

**Ana Paula (Consultora):**
- Email: ana@protecar.com
- Senha: 123456

**Roberto Lima (Consultor):**
- Email: roberto@protecar.com
- Senha: 123456

## 📊 Monitoramento

Para acompanhar os logs em tempo real:

```bash
# Todos os serviços
docker-compose logs -f

# Apenas frontend
docker-compose logs -f frontend

# Apenas backend
docker-compose logs -f backend

# Apenas MySQL
docker-compose logs -f mysql
```

## 🆘 Solução de Problemas

### Se ainda houver erro 404:

1. **Verificar se as variáveis foram aplicadas:**
   ```bash
   docker-compose exec frontend env | grep NEXT_PUBLIC_API_URL
   ```
   Deve mostrar: `NEXT_PUBLIC_API_URL=http://185.217.125.72:3001/api`

2. **Verificar se o backend está respondendo:**
   ```bash
   curl http://185.217.125.72:3001/api/health
   ```
   Deve retornar: `{"status":"ok","message":"VIP CRM Backend funcionando!",...}`

3. **Limpar cache do navegador:**
   - Pressione Ctrl+Shift+Delete
   - Selecione "Cache" e "Cookies"
   - Clique em "Limpar dados"
   - Recarregue a página com Ctrl+F5

### Se os containers não iniciarem:

1. **Verificar status:**
   ```bash
   docker-compose ps
   ```

2. **Ver logs de erro:**
   ```bash
   docker-compose logs --tail=50
   ```

3. **Verificar portas em uso:**
   ```bash
   netstat -tuln | grep -E '3000|3001|3306'
   ```

## 📝 Notas Importantes

- O redeploy com `--no-cache` garante que as novas variáveis sejam aplicadas corretamente
- Todo o processo leva cerca de 2-5 minutos dependendo da conexão
- Os dados do banco de dados são preservados (estão em um volume Docker)
- As sessões de WhatsApp conectadas serão mantidas

## ✅ Checklist de Verificação Final

- [ ] Arquivo `.env.vps` atualizado localmente
- [ ] Script `redeploy-vps.sh` criado
- [ ] Arquivos enviados para a VPS
- [ ] Script executado com sucesso
- [ ] Containers estão rodando (`docker-compose ps`)
- [ ] Frontend acessível em http://185.217.125.72:3000
- [ ] Backend respondendo em http://185.217.125.72:3001/api/health
- [ ] Login funcionando sem erros 404
- [ ] Console do navegador limpo (sem erros)
