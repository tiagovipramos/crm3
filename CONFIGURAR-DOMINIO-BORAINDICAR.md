# 🌐 Guia Completo: Configurar Domínio boraindicar.com.br

## 📋 Situação Atual

✅ **DNS Configurado no Registro.br:**
- `boraindicar.com.br` → 185.217.125.72
- `admin.boraindicar.com.br` → 185.217.125.72
- `crm.boraindicar.com.br` → 185.217.125.72
- `indicador.boraindicar.com.br` → 185.217.125.72

⏳ **Próximos Passos:**
1. Aguardar propagação DNS (até 48h, geralmente 2-6h)
2. Instalar Nginx como proxy reverso
3. Configurar SSL/HTTPS com Let's Encrypt
4. Atualizar variáveis de ambiente
5. Configurar roteamento dos subdomínios

---

## ⏰ PASSO 1: Aguardar Propagação DNS (2-6 horas)

Antes de prosseguir, verifique se o DNS já está propagado:

```bash
# Testar resolução DNS
nslookup boraindicar.com.br
ping boraindicar.com.br

# Deve retornar: 185.217.125.72
```

**Online:** https://www.whatsmydns.net/#A/boraindicar.com.br

---

## 🔧 PASSO 2: Instalar e Configurar Nginx

### 2.1. Conectar na VPS via SSH

```bash
ssh root@185.217.125.72
```

### 2.2. Instalar Nginx

```bash
# Atualizar sistema
sudo apt update

# Instalar Nginx
sudo apt install nginx -y

# Iniciar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar status
sudo systemctl status nginx
```

### 2.3. Configurar Firewall

```bash
# Permitir HTTP e HTTPS
sudo ufw allow 'Nginx Full'

# Verificar status
sudo ufw status
```

### 2.4. Criar Configuração do Nginx

```bash
# Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/boraindicar.com.br
```

**Cole o seguinte conteúdo:**

```nginx
# Redirecionar HTTP para HTTPS (será usado após configurar SSL)
server {
    listen 80;
    server_name boraindicar.com.br www.boraindicar.com.br;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Site principal - boraindicar.com.br
server {
    listen 80;
    server_name boraindicar.com.br www.boraindicar.com.br;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# CRM - crm.boraindicar.com.br
server {
    listen 80;
    server_name crm.boraindicar.com.br;
    
    location / {
        proxy_pass http://localhost:3000/crm;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin - admin.boraindicar.com.br
server {
    listen 80;
    server_name admin.boraindicar.com.br;
    
    location / {
        proxy_pass http://localhost:3000/admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Indicador - indicador.boraindicar.com.br
server {
    listen 80;
    server_name indicador.boraindicar.com.br;
    
    location / {
        proxy_pass http://localhost:3000/indicador;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API Backend - api.boraindicar.com.br (opcional, mas recomendado)
server {
    listen 80;
    server_name api.boraindicar.com.br;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Salvar:** `Ctrl+O`, Enter, `Ctrl+X`

### 2.5. Ativar Configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/boraindicar.com.br /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 2.6. Testar Domínio

Abra no navegador:
- http://boraindicar.com.br (deve mostrar página inicial)
- http://crm.boraindicar.com.br (deve mostrar CRM)
- http://admin.boraindicar.com.br (deve mostrar Admin)
- http://indicador.boraindicar.com.br (deve mostrar Indicador)

---

## 🔒 PASSO 3: Instalar SSL/HTTPS com Let's Encrypt

### 3.1. Instalar Certbot

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### 3.2. Gerar Certificados SSL

```bash
# Gerar certificados para todos os domínios
sudo certbot --nginx -d boraindicar.com.br -d www.boraindicar.com.br -d crm.boraindicar.com.br -d admin.boraindicar.com.br -d indicador.boraindicar.com.br -d api.boraindicar.com.br
```

**Durante a instalação:**
1. Digite seu email
2. Aceite os termos (Y)
3. Compartilhar email com EFF (opcional)
4. Escolha opção 2 (redirecionar HTTP para HTTPS)

### 3.3. Verificar Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Ver timer de renovação automática
sudo systemctl status certbot.timer
```

O certificado será renovado automaticamente a cada 60 dias.

---

## 📝 PASSO 4: Atualizar Variáveis de Ambiente

### 4.1. Criar Novo Arquivo .env para Produção

```bash
# Na VPS, no diretório do projeto
cd /caminho/do/projeto

# Backup do .env atual
cp .env .env.backup

# Editar .env
nano .env
```

**Conteúdo do .env com domínio:**

```bash
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

# Frontend - ATUALIZADO COM DOMÍNIO
FRONTEND_URL=https://boraindicar.com.br
NEXT_PUBLIC_API_URL=https://api.boraindicar.com.br/api
NEXT_PUBLIC_WS_URL=https://api.boraindicar.com.br

# URLs dos Subdomínios
NEXT_PUBLIC_CRM_URL=https://crm.boraindicar.com.br
NEXT_PUBLIC_ADMIN_URL=https://admin.boraindicar.com.br
NEXT_PUBLIC_INDICADOR_URL=https://indicador.boraindicar.com.br
```

**Salvar:** `Ctrl+O`, Enter, `Ctrl+X`

### 4.2. Atualizar docker-compose.yml (LOCAL)

No seu computador local, edite o `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
        NEXT_PUBLIC_WS_URL: ${NEXT_PUBLIC_WS_URL}
        NEXT_PUBLIC_CRM_URL: ${NEXT_PUBLIC_CRM_URL}
        NEXT_PUBLIC_ADMIN_URL: ${NEXT_PUBLIC_ADMIN_URL}
        NEXT_PUBLIC_INDICADOR_URL: ${NEXT_PUBLIC_INDICADOR_URL}
    container_name: crm-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
      - NEXT_PUBLIC_CRM_URL=${NEXT_PUBLIC_CRM_URL}
      - NEXT_PUBLIC_ADMIN_URL=${NEXT_PUBLIC_ADMIN_URL}
      - NEXT_PUBLIC_INDICADOR_URL=${NEXT_PUBLIC_INDICADOR_URL}
    depends_on:
      - backend
    networks:
      - crm-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: crm-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=${NODE_ENV}
      - PORT=${PORT}
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
      - FRONTEND_URL=${FRONTEND_URL}
    depends_on:
      mysql:
        condition: service_healthy
    volumes:
      - ./backend/uploads:/app/uploads
    networks:
      - crm-network

  mysql:
    image: mysql:8.0
    container_name: crm-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./backend/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - crm-network

volumes:
  mysql-data:

networks:
  crm-network:
    driver: bridge
```

### 4.3. Atualizar Dockerfile (LOCAL)

Edite o `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código
COPY . .

# Argumentos de build para variáveis NEXT_PUBLIC_*
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_CRM_URL
ARG NEXT_PUBLIC_ADMIN_URL
ARG NEXT_PUBLIC_INDICADOR_URL

# Definir variáveis de ambiente
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_CRM_URL=$NEXT_PUBLIC_CRM_URL
ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL
ENV NEXT_PUBLIC_INDICADOR_URL=$NEXT_PUBLIC_INDICADOR_URL

# Build da aplicação
RUN npm run build

# Expor porta
EXPOSE 3000

# Comando de inicialização
CMD ["npm", "start"]
```

---

## 🚀 PASSO 5: Deploy com Domínio

### 5.1. No Computador Local

```bash
# 1. Fazer commit das mudanças
git add docker-compose.yml Dockerfile
git commit -m "feat: configurar domínio boraindicar.com.br"
git push origin main
```

### 5.2. Na VPS

```bash
# 1. Navegar para o projeto
cd /caminho/do/projeto

# 2. Atualizar código
git pull origin main

# 3. Parar containers
docker-compose down

# 4. Limpar imagens antigas
docker rmi crm-frontend crm-backend

# 5. Rebuild completo
docker-compose up -d --build

# 6. Verificar logs
docker-compose logs -f
```

### 5.3. Aguardar Inicialização

Aguarde cerca de 60 segundos para:
- MySQL inicializar
- Backend conectar ao banco
- Frontend compilar e iniciar

---

## ✅ PASSO 6: Testar Funcionamento

### 6.1. Testar HTTP (será redirecionado para HTTPS)

```bash
curl -I http://boraindicar.com.br
# Deve retornar: 301 Moved Permanently → https://boraindicar.com.br
```

### 6.2. Testar HTTPS

Abra no navegador:

1. **Site Principal:** https://boraindicar.com.br
2. **CRM:** https://crm.boraindicar.com.br
3. **Admin:** https://admin.boraindicar.com.br
4. **Indicador:** https://indicador.boraindicar.com.br
5. **API:** https://api.boraindicar.com.br/api/health

### 6.3. Verificar SSL

No navegador:
- Clique no cadeado 🔒 na barra de endereço
- Deve mostrar: "Conexão segura"
- Certificado válido de Let's Encrypt

### 6.4. Testar WebSocket

Abra o Console (F12) em https://crm.boraindicar.com.br:
- ✅ Deve conectar sem erros
- ✅ Status do WhatsApp deve funcionar
- ✅ Notificações em tempo real devem funcionar

---

## 🐛 Troubleshooting

### Problema: "DNS_PROBE_FINISHED_NXDOMAIN"
**Causa:** DNS ainda não propagado
**Solução:** Aguardar mais tempo (até 48h)

### Problema: "502 Bad Gateway"
**Causa:** Containers não estão rodando
**Solução:**
```bash
docker-compose ps
docker-compose up -d
docker-compose logs
```

### Problema: "ERR_SSL_PROTOCOL_ERROR"
**Causa:** SSL não configurado corretamente
**Solução:**
```bash
sudo certbot --nginx -d boraindicar.com.br
sudo nginx -t
sudo systemctl reload nginx
```

### Problema: WebSocket não conecta com HTTPS
**Causa:** Nginx não está fazendo proxy do WebSocket corretamente
**Solução:** Verificar se a configuração do Nginx tem:
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
```

### Problema: Página carrega mas estilos não aparecem
**Causa:** CSP (Content Security Policy) ou variáveis NEXT_PUBLIC_* incorretas
**Solução:** Rebuild do frontend:
```bash
docker-compose down
docker rmi crm-frontend
docker-compose up -d --build
```

---

## 📊 Checklist Final

- [ ] DNS propagado e resolvendo para 185.217.125.72
- [ ] Nginx instalado e rodando
- [ ] Configuração do Nginx criada e ativada
- [ ] SSL/HTTPS configurado com Let's Encrypt
- [ ] Certificados válidos para todos os subdomínios
- [ ] .env atualizado na VPS com URLs corretas
- [ ] docker-compose.yml atualizado com variáveis
- [ ] Dockerfile atualizado com ARG e ENV
- [ ] Código commitado e pushed para Git
- [ ] Pull realizado na VPS
- [ ] Containers rebuilded com --build
- [ ] Todos os domínios acessíveis via HTTPS
- [ ] WebSocket funcionando
- [ ] WhatsApp conectando corretamente
- [ ] Notificações em tempo real funcionando

---

## 🎯 URLs Finais

Após todos os passos, você terá:

| Subdomínio | URL | Descrição |
|------------|-----|-----------|
| Principal | https://boraindicar.com.br | Página inicial |
| CRM | https://crm.boraindicar.com.br | Sistema CRM |
| Admin | https://admin.boraindicar.com.br | Painel Admin |
| Indicador | https://indicador.boraindicar.com.br | Portal Indicador |
| API | https://api.boraindicar.com.br | Backend API |

---

## 🔄 Renovação Automática SSL

O Certbot configurou renovação automática:

```bash
# Ver status do timer
sudo systemctl status certbot.timer

# Forçar renovação manual (se necessário)
sudo certbot renew

# Logs da renovação
sudo cat /var/log/letsencrypt/letsencrypt.log
```

Certificados são renovados automaticamente 30 dias antes de expirar.

---

## 📞 Suporte

Se tiver problemas:

1. **Verificar logs do Nginx:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Verificar logs do Docker:**
   ```bash
   docker-compose logs -f
   ```

3. **Verificar status dos serviços:**
   ```bash
   sudo systemctl status nginx
   docker ps
   ```

4. **Teste de conectividade:**
   ```bash
   curl -I https://boraindicar.com.br
   curl https://api.boraindicar.com.br/api/health
   ```

---

## ⚠️ IMPORTANTE

1. **Backup:** Sempre faça backup do .env antes de modificar
2. **Firewall:** Mantenha apenas as portas necessárias abertas (80, 443, 22)
3. **Senhas:** Use senhas fortes no .env
4. **Git:** Nunca commite o .env (está no .gitignore)
5. **SSL:** Certificados expiram em 90 dias, mas renovam automaticamente

---

## 🎉 Parabéns!

Seu sistema CRM agora está rodando com:
- ✅ Domínio próprio (boraindicar.com.br)
- ✅ SSL/HTTPS (cadeado verde)
- ✅ Subdomínios organizados
- ✅ Renovação automática de SSL
- ✅ Proxy reverso com Nginx
- ✅ WebSocket funcionando
- ✅ Sistema completo em produção!

**Agora você tem um sistema profissional e seguro! 🚀**
