# Deploy do Arquivo de Verificação Meta no VPS

## 📋 Resumo

Este documento explica como aplicar o arquivo de verificação do Meta/Facebook no VPS.

## 📁 O que foi feito

1. **Arquivo criado**: `mryypl6j4u4onejl9jefuwj10ms4au.html`
2. **Localização**: Movido para a pasta `public/` do Next.js
3. **Conteúdo**: Token de verificação do Meta
4. **Commits**: 
   - Commit 1: Adicionar arquivo de verificação Meta
   - Commit 2: Mover arquivo para pasta public

## 🎯 Por que precisa rebuild?

**SIM, é necessário fazer `docker-compose build frontend`!**

### Motivo:
- O arquivo está na pasta `public/` do Next.js
- Arquivos em `public/` são copiados durante o **build** do Docker
- No Dockerfile, a linha `COPY . .` copia os arquivos para dentro da imagem
- Sem rebuild, o arquivo novo não estará na imagem Docker

## 🚀 Como Aplicar no VPS

### Opção 1: Script Automatizado (RECOMENDADO)

```bash
# 1. Copiar o script para o VPS
scp aplicar-arquivo-meta-vps.sh root@SEU_IP:/root/

# 2. Conectar no VPS
ssh root@SEU_IP

# 3. Dar permissão de execução
chmod +x /root/aplicar-arquivo-meta-vps.sh

# 4. Executar o script
/root/aplicar-arquivo-meta-vps.sh
```

### Opção 2: Passo a Passo Manual

```bash
# 1. Conectar no VPS
ssh root@SEU_IP

# 2. Ir para o diretório do projeto
cd /root/crm

# 3. Fazer git pull
git pull origin master

# 4. Parar os containers
docker-compose down

# 5. Fazer rebuild do frontend (IMPORTANTE!)
docker-compose build frontend

# 6. Iniciar os containers
docker-compose up -d

# 7. Verificar os logs
docker-compose logs -f frontend
```

## ✅ Como Testar

1. Aguarde os containers iniciarem completamente (30-60 segundos)

2. Teste no navegador:
   ```
   https://seudominio.com/mryypl6j4u4onejl9jefuwj10ms4au.html
   ```

3. Você deve ver apenas o texto:
   ```
   mryypl6j4u4onejl9jefuwj10ms4au
   ```

4. Se funcionar, vá no painel do Meta/Facebook e finalize a verificação

## 📊 Verificando o Status

```bash
# Ver se o container está rodando
docker-compose ps

# Ver logs do frontend
docker-compose logs frontend

# Ver logs em tempo real
docker-compose logs -f frontend

# Verificar se o arquivo está dentro do container
docker exec crm-frontend-1 ls -la /app/.next/static
```

## ❓ Troubleshooting

### Erro: Arquivo não encontrado (404)

**Solução**: O rebuild não foi feito corretamente

```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Erro: Container não inicia

**Solução**: Verificar os logs

```bash
docker-compose logs frontend
```

### Erro: Porta já em uso

**Solução**: Verificar processos conflitantes

```bash
netstat -tulpn | grep 3000
docker-compose down
docker-compose up -d
```

## 📝 Notas Importantes

1. **Rebuild é obrigatório**: Sem rebuild, o arquivo não estará disponível
2. **Arquivos públicos**: Todos os arquivos em `public/` ficam acessíveis via URL
3. **Next.js**: Arquivos em `public/` são servidos na raiz do domínio
4. **Docker**: Mudanças em arquivos estáticos requerem rebuild da imagem

## 🔗 URLs do Arquivo

Dependendo da configuração do seu domínio, o arquivo estará disponível em:

- `https://seudominio.com/mryypl6j4u4onejl9jefuwj10ms4au.html`
- `http://seudominio.com/mryypl6j4u4onejl9jefuwj10ms4au.html`

## ⏱️ Tempo Estimado

- Git pull: 5-10 segundos
- Docker build: 2-5 minutos
- Deploy completo: 3-7 minutos

## 🎉 Sucesso!

Após aplicar, o Meta/Facebook conseguirá verificar seu domínio e você poderá:
- Configurar a API do WhatsApp Cloud
- Usar webhooks do Facebook
- Integrar produtos do Meta
