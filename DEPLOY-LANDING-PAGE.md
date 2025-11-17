# Deploy da Landing Page - Bora Indicar
## Subdomínio: lp.boraindicar.com.br

Este documento contém todas as instruções para fazer o deploy da landing page do sistema Bora Indicar no subdomínio **lp.boraindicar.com.br**.

---

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de ter:

1. ✅ Acesso SSH ao VPS
2. ✅ DNS configurado (registro A apontando lp.boraindicar.com.br para o IP do VPS)
3. ✅ Node.js e npm instalados no VPS
4. ✅ Nginx instalado e configurado
5. ✅ Git instalado no VPS
6. ✅ Repositório clonado no VPS

---

## 🚀 Deploy Automático (Recomendado)

### Passo 1: Conectar ao VPS

```bash
ssh usuario@seu-vps-ip
```

### Passo 2: Navegar até o diretório do projeto

```bash
cd /caminho/para/CRM
```

### Passo 3: Executar script de deploy

```bash
chmod +x deploy-landing-page-vps.sh
./deploy-landing-page-vps.sh
```

O script irá:
- ✅ Atualizar o código do repositório
- ✅ Instalar dependências
- ✅ Fazer build da aplicação
- ✅ Configurar Nginx
- ✅ Configurar certificado SSL
- ✅ Reiniciar a aplicação com PM2

---

## 🔧 Deploy Manual (Passo a Passo)

Se preferir fazer o deploy manualmente, siga os passos abaixo:

### 1. Atualizar Código

```bash
cd /caminho/para/CRM
git pull origin main
```

### 2. Instalar Dependências

```bash
npm install --production
```

### 3. Build da Aplicação

```bash
npm run build
```

### 4. Configurar DNS

Adicione um registro A no seu provedor de DNS:

```
Tipo: A
Nome: lp
Valor: [IP do seu VPS]
TTL: 3600 (ou automático)
```

**Importante:** Aguarde a propagação do DNS (pode levar de 5 minutos a 48 horas).

### 5. Configurar Nginx

```bash
# Copiar configuração do nginx
sudo cp nginx-lp-subdomain.conf /etc/nginx/sites-available/lp.boraindicar.com.br

# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/lp.boraindicar.com.br /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar nginx
sudo systemctl reload nginx
```

### 6. Configurar SSL (HTTPS)

```bash
# Instalar Certbot (se não estiver instalado)
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d lp.boraindicar.com.br
```

### 7. Iniciar Aplicação com PM2

```bash
# Instalar PM2 globalmente (se não estiver instalado)
sudo npm install -g pm2

# Iniciar aplicação
pm2 start npm --name "nextjs-app" -- start

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
```

---

## 🔍 Verificação Pós-Deploy

### Checklist de Verificação

- [ ] DNS propagado (verifique em https://dnschecker.org/)
- [ ] Acesso HTTPS funcionando (https://lp.boraindicar.com.br)
- [ ] Certificado SSL válido (cadeado verde no navegador)
- [ ] Todos os links de navegação funcionando
- [ ] Formulário de contato funcionando
- [ ] Responsividade mobile OK
- [ ] Redirecionamento HTTP → HTTPS funcionando

### Comandos Úteis

```bash
# Ver logs da aplicação
pm2 logs nextjs-app

# Ver status da aplicação
pm2 status

# Reiniciar aplicação
pm2 restart nextjs-app

# Ver logs do Nginx
sudo tail -f /var/log/nginx/lp.boraindicar.com.br.access.log
sudo tail -f /var/log/nginx/lp.boraindicar.com.br.error.log

# Verificar status do Nginx
sudo systemctl status nginx

# Testar configuração do Nginx
sudo nginx -t
```

---

## 📁 Estrutura de Arquivos

```
CRM/
├── app/
│   └── lp/
│       ├── page.tsx          # Página principal da landing page
│       └── layout.tsx         # Layout com meta tags SEO
├── nginx-lp-subdomain.conf    # Configuração do Nginx
└── deploy-landing-page-vps.sh # Script de deploy automático
```

---

## 🎨 Recursos da Landing Page

### Seções Incluídas

1. **Header/Navbar**
   - Logo Bora Indicar
   - Menu de navegação
   - Botão de login

2. **Hero Section**
   - Título impactante
   - Call-to-action
   - Card com estatísticas animado

3. **Stats Section**
   - Números de impacto
   - Estatísticas do programa

4. **Benefícios**
   - 6 cards com principais benefícios
   - Ícones e animações hover

5. **Como Funciona**
   - 4 passos ilustrados
   - Processo simplificado

6. **Depoimentos**
   - 3 depoimentos de indicadores
   - Avaliações e ganhos

7. **Formulário de Contato**
   - Captura de leads
   - Validação de campos

8. **FAQ**
   - Perguntas frequentes
   - Acordeon expansível

9. **Footer**
   - Links úteis
   - Informações de contato
   - Links legais

### Tecnologias Utilizadas

- **Next.js 15** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **Framer Motion** - Animações (disponível no projeto)

---

## 🔒 Segurança

### Configurações de Segurança Implementadas

- ✅ HTTPS obrigatório (redirecionamento automático)
- ✅ Headers de segurança configurados no Nginx:
  - X-Frame-Options
  - X-Content-Type-Options
  - X-XSS-Protection
  - Referrer-Policy
  - Content-Security-Policy
- ✅ Certificado SSL válido (Let's Encrypt)
- ✅ Renovação automática do certificado

---

## ⚡ Performance

### Otimizações Implementadas

- ✅ Compressão Gzip habilitada
- ✅ Cache de arquivos estáticos (1 ano)
- ✅ Cache de assets do Next.js
- ✅ Build otimizado para produção
- ✅ Lazy loading de imagens
- ✅ Code splitting automático (Next.js)

---

## 🐛 Troubleshooting

### Problema: DNS não propaga

**Solução:**
```bash
# Verificar propagação DNS
nslookup lp.boraindicar.com.br

# Verificar com ferramenta online
# https://dnschecker.org/
```

### Problema: Erro 502 Bad Gateway

**Solução:**
```bash
# Verificar se a aplicação está rodando
pm2 status

# Reiniciar aplicação
pm2 restart nextjs-app

# Verificar logs
pm2 logs nextjs-app
```

### Problema: Certificado SSL não funciona

**Solução:**
```bash
# Renovar certificado manualmente
sudo certbot renew

# Verificar status do certbot
sudo certbot certificates

# Testar renovação
sudo certbot renew --dry-run
```

### Problema: Página não carrega CSS/JS

**Solução:**
```bash
# Verificar permissões da pasta .next
ls -la .next/

# Refazer build
npm run build

# Limpar cache do Next.js
rm -rf .next/
npm run build
```

### Problema: Erro "Module not found"

**Solução:**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

---

## 📊 Monitoramento

### Logs a Monitorar

1. **Logs da Aplicação (PM2)**
   ```bash
   pm2 logs nextjs-app --lines 100
   ```

2. **Logs de Acesso (Nginx)**
   ```bash
   sudo tail -f /var/log/nginx/lp.boraindicar.com.br.access.log
   ```

3. **Logs de Erro (Nginx)**
   ```bash
   sudo tail -f /var/log/nginx/lp.boraindicar.com.br.error.log
   ```

---

## 🔄 Atualizações Futuras

### Para atualizar a landing page:

1. Fazer alterações no código localmente
2. Commit e push para o repositório
3. No VPS, executar:

```bash
cd /caminho/para/CRM
./deploy-landing-page-vps.sh
```

Ou manualmente:

```bash
git pull origin main
npm run build
pm2 restart nextjs-app
```

---

## 📞 Suporte

Se encontrar problemas durante o deploy:

1. Verifique os logs da aplicação: `pm2 logs`
2. Verifique os logs do Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Verifique o status dos serviços: `sudo systemctl status nginx`
4. Teste a configuração do Nginx: `sudo nginx -t`

---

## ✅ Conclusão

Após seguir todos os passos, sua landing page estará disponível em:

🌐 **https://lp.boraindicar.com.br**

A landing page está otimizada para:
- ✅ SEO
- ✅ Performance
- ✅ Segurança
- ✅ Conversão de leads
- ✅ Experiência mobile

---

**Desenvolvido por:** Sistema Bora Indicar  
**Data:** Novembro 2025  
**Versão:** 1.0.0
