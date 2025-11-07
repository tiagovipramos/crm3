# 🚀 Preparar VPS Enquanto Aguarda Propagação DNS

## ⏰ Situação Atual

❌ **DNS ainda não propagado:**
```bash
root@vmi2789491:~# nslookup boraindicar.com.br
*** Can't find boraindicar.com.br: No answer
```

✅ **Isso é NORMAL!** O DNS pode levar de 2 a 48 horas para propagar (geralmente 2-6 horas).

---

## 🔍 Como Monitorar a Propagação

### Opção 1: Online (Recomendado)
Acesse: https://www.whatsmydns.net/#A/boraindicar.com.br

Este site mostra a propagação em tempo real em servidores DNS ao redor do mundo.

### Opção 2: Testar com Google DNS
```bash
nslookup boraindicar.com.br 8.8.8.8
```

### Opção 3: Testar com Cloudflare DNS
```bash
nslookup boraindicar.com.br 1.1.1.1
```

**Quando estiver propagado**, você verá:
```
Server:         8.8.8.8
Address:        8.8.8.8#53

Name:   boraindicar.com.br
Address: 185.217.125.72
```

---

## 💡 Enquanto Aguarda: Prepare a VPS!

Você pode adiantar todo o trabalho instalando e configurando o Nginx AGORA. Quando o DNS propagar, tudo já estará pronto!

### ✅ PASSO 1: Instalar Nginx

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Nginx
sudo apt install nginx -y

# Verificar status
sudo systemctl status nginx

# Habilitar inicialização automática
sudo systemctl enable nginx
```

### ✅ PASSO 2: Configurar Firewall

```bash
# Verificar status atual
sudo ufw status

# Permitir HTTP e HTTPS
sudo ufw allow 'Nginx Full'

# Permitir SSH (se ainda não estiver)
sudo ufw allow 22

# Ativar firewall (se não estiver ativo)
sudo ufw enable

# Verificar novamente
sudo ufw status
```

**Resultado esperado:**
```
Status: active

To                         Action      From
--                         ------      ----
22                         ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
```

### ✅ PASSO 3: Criar Configuração do Nginx

```bash
# Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/boraindicar.com.br
```

**Cole o seguinte conteúdo:**

```nginx
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

# API Backend - api.boraindicar.com.br
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

### ✅ PASSO 4: Ativar Configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/boraindicar.com.br /etc/nginx/sites-enabled/

# Remover configuração padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Se OK, recarregar Nginx
sudo systemctl reload nginx

# Verificar status
sudo systemctl status nginx
```

**Resultado esperado do teste:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### ✅ PASSO 5: Instalar Certbot (para SSL)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Verificar instalação
certbot --version
```

**⚠️ NÃO execute o certbot ainda!** Apenas instale. Vamos gerar os certificados SSL DEPOIS que o DNS estiver propagado.

### ✅ PASSO 6: Verificar Docker

Verifique se seus containers estão rodando:

```bash
# Ver containers ativos
docker ps

# Ver logs do frontend
docker logs crm-frontend --tail 50

# Ver logs do backend
docker logs crm-backend --tail 50
```

Se não estiverem rodando:

```bash
# Navegar para o diretório do projeto
cd /root/crm  # ou onde está seu projeto

# Subir containers
docker-compose up -d

# Verificar novamente
docker ps
```

---

## 📋 Checklist de Preparação

Execute cada comando acima e marque quando concluir:

- [ ] Nginx instalado e rodando
- [ ] Firewall configurado (portas 80, 443, 22)
- [ ] Configuração do Nginx criada
- [ ] Link simbólico criado
- [ ] Teste do Nginx OK (nginx -t)
- [ ] Nginx recarregado
- [ ] Certbot instalado
- [ ] Docker containers rodando

---

## 🎯 Quando o DNS Propagar

Assim que o comando `nslookup boraindicar.com.br 8.8.8.8` retornar `185.217.125.72`, execute:

### 1. Gerar Certificados SSL

```bash
sudo certbot --nginx -d boraindicar.com.br -d www.boraindicar.com.br -d crm.boraindicar.com.br -d admin.boraindicar.com.br -d indicador.boraindicar.com.br -d api.boraindicar.com.br
```

**Durante a instalação:**
1. Digite seu email
2. Aceite os termos (Y)
3. Compartilhar email com EFF (opcional - Y ou N)
4. Escolha opção 2 (redirecionar HTTP para HTTPS)

### 2. Testar Acesso

Abra no navegador:
- https://boraindicar.com.br
- https://crm.boraindicar.com.br
- https://admin.boraindicar.com.br
- https://indicador.boraindicar.com.br
- https://api.boraindicar.com.br/api/health

### 3. Verificar SSL

No navegador, clique no cadeado 🔒 e verifique:
- ✅ Conexão segura
- ✅ Certificado válido de Let's Encrypt

---

## 🔄 Monitoramento Contínuo

Enquanto aguarda, você pode verificar a propagação a cada hora:

```bash
# Criar script de monitoramento
cat > /root/check-dns.sh << 'EOF'
#!/bin/bash
echo "=== Verificando DNS - $(date) ==="
nslookup boraindicar.com.br 8.8.8.8 | grep -A 1 "Name:"
if [ $? -eq 0 ]; then
    echo "✅ DNS PROPAGADO!"
else
    echo "⏳ Aguardando propagação..."
fi
echo ""
EOF

chmod +x /root/check-dns.sh

# Executar script
/root/check-dns.sh
```

Execute esse script de tempos em tempos para verificar.

---

## ⚡ Dica Pro

Para receber notificação quando o DNS propagar, você pode usar este script:

```bash
cat > /root/monitor-dns.sh << 'EOF'
#!/bin/bash
while true; do
    if nslookup boraindicar.com.br 8.8.8.8 | grep -q "185.217.125.72"; then
        echo "🎉 DNS PROPAGADO! Execute: sudo certbot --nginx -d boraindicar.com.br -d www.boraindicar.com.br -d crm.boraindicar.com.br -d admin.boraindicar.com.br -d indicador.boraindicar.com.br -d api.boraindicar.com.br"
        break
    else
        echo "⏳ $(date): Aguardando DNS..."
        sleep 300  # Verifica a cada 5 minutos
    fi
done
EOF

chmod +x /root/monitor-dns.sh

# Executar em background
nohup /root/monitor-dns.sh > /root/dns-monitor.log 2>&1 &

# Ver log em tempo real
tail -f /root/dns-monitor.log
```

Pressione `Ctrl+C` para parar de ver o log. O script continuará rodando em background.

---

## 📊 Timeline Esperado

| Tempo | Status |
|-------|--------|
| 0h | DNS configurado no Registro.br ✅ |
| 0-2h | Propagação inicial (alguns servidores) |
| 2-6h | Maioria dos servidores propagados ⏳ |
| 6-48h | Propagação completa mundial |

**Média brasileira:** 2-4 horas

---

## 🎉 Vantagem de Preparar Agora

Ao fazer tudo isso AGORA, quando o DNS propagar você terá:

✅ Nginx instalado e configurado
✅ Firewall ajustado
✅ Certbot pronto
✅ Configuração testada

**E precisará apenas:**
1. Executar 1 comando do certbot
2. Abrir o navegador e testar

**Total: 2 minutos para finalizar!** 🚀

---

## 📞 Próximo Passo

Após preparar a VPS:
1. Continue monitorando o DNS
2. Quando propagar, execute o certbot
3. Teste os domínios
4. Pronto! Sistema em produção com SSL! 🎉
