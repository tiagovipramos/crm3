# 🚀 Guia Rápido - Deploy Landing Page em Produção

## ⚡ Para fazer o deploy AGORA no VPS:

### 1️⃣ Configurar DNS (URGENTE - fazer primeiro!)

No painel do seu provedor de domínio (ex: Registro.br, GoDaddy, etc):

```
Adicionar registro DNS:
- Tipo: A
- Nome: lp
- Valor: [IP_DO_SEU_VPS]
- TTL: 3600
```

**Aguarde 5-30 minutos para propagação do DNS**

---

### 2️⃣ Commit e Push dos arquivos

No seu computador local (Windows):

```powershell
# Adicionar arquivos ao git
git add app/lp/
git add nginx-lp-subdomain.conf
git add deploy-landing-page-vps.sh
git add DEPLOY-LANDING-PAGE.md
git add GUIA-RAPIDO-LANDING-PAGE.md

# Commit
git commit -m "feat: adiciona landing page no subdomínio lp.boraindicar.com.br"

# Push para o repositório
git push origin main
```

---

### 3️⃣ Deploy no VPS

Conecte ao seu VPS via SSH e execute:

```bash
# 1. Conectar ao VPS
ssh usuario@seu-vps-ip

# 2. Navegar até o projeto
cd /caminho/do/projeto/CRM

# 3. Atualizar código
git pull origin main

# 4. Dar permissão de execução ao script
chmod +x deploy-landing-page-vps.sh

# 5. EXECUTAR O DEPLOY!
./deploy-landing-page-vps.sh
```

**Pronto! A landing page estará no ar em:**
👉 **https://lp.boraindicar.com.br**

---

## ✅ Checklist de Produção

Após o deploy, verifique:

- [ ] **DNS funcionando**
  ```bash
  nslookup lp.boraindicar.com.br
  ```

- [ ] **Site acessível**
  - Abrir https://lp.boraindicar.com.br
  
- [ ] **SSL configurado** (cadeado verde)

- [ ] **Todas as seções carregando**
  - Header com navegação
  - Hero section
  - Estatísticas
  - Benefícios
  - Como funciona
  - Depoimentos
  - Formulário
  - FAQ
  - Footer

- [ ] **Links funcionando**
  - Navegação interna (âncoras)
  - Link para login
  - Links de termos e privacidade

- [ ] **Responsividade**
  - Testar no celular
  - Testar em tablet

- [ ] **Formulário**
  - Preencher e enviar
  - Verificar mensagem de sucesso

---

## 🔧 Comandos Úteis no VPS

```bash
# Ver status da aplicação
pm2 status

# Ver logs em tempo real
pm2 logs nextjs-app

# Reiniciar aplicação
pm2 restart nextjs-app

# Ver logs do Nginx
sudo tail -f /var/log/nginx/lp.boraindicar.com.br.access.log

# Verificar status do Nginx
sudo systemctl status nginx

# Testar configuração do Nginx
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 🐛 Problemas Comuns e Soluções

### Problema: "502 Bad Gateway"

```bash
pm2 restart nextjs-app
```

### Problema: DNS não resolve

```bash
# Verificar DNS
nslookup lp.boraindicar.com.br

# Se não resolver, aguardar mais tempo (até 48h em casos extremos)
# Mas geralmente resolve em 5-30 minutos
```

### Problema: SSL não funciona

```bash
# Gerar certificado manualmente
sudo certbot --nginx -d lp.boraindicar.com.br
```

### Problema: Página não carrega CSS

```bash
cd /caminho/do/projeto
npm run build
pm2 restart nextjs-app
```

---

## 📱 Testar em Diferentes Dispositivos

### Desktop
- Chrome
- Firefox
- Safari
- Edge

### Mobile
- iPhone (Safari)
- Android (Chrome)

### Ferramentas Online
- https://www.browserstack.com/
- https://responsivedesignchecker.com/
- Google Lighthouse (DevTools)

---

## 🎯 Próximos Passos (Opcional)

### Integrar com Backend
Edite `app/lp/page.tsx` e adicione integração com sua API:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, telefone })
    });
    
    if (response.ok) {
      setSubmitted(true);
    }
  } catch (error) {
    console.error('Erro ao enviar:', error);
  }
};
```

### Analytics
Adicione Google Analytics ou Facebook Pixel em `app/lp/layout.tsx`:

```typescript
export default function Layout({ children }) {
  return (
    <html>
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### WhatsApp Link
Adicione botão flutuante de WhatsApp (opcional):

```tsx
<a 
  href="https://wa.me/5511999999999?text=Olá!%20Quero%20ser%20indicador"
  className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 z-50"
  target="_blank"
  rel="noopener noreferrer"
>
  <MessageCircle className="h-8 w-8" />
</a>
```

---

## 📊 Métricas para Acompanhar

- Taxa de conversão do formulário
- Tempo médio na página
- Taxa de rejeição
- Páginas mais visitadas
- Origem do tráfego
- Dispositivos mais usados

---

## 🎨 Personalização

Para personalizar cores, edite `app/lp/page.tsx`:

- **Azul principal:** `bg-blue-600` → `bg-[SUA_COR]`
- **Roxo secundário:** `bg-purple-600` → `bg-[SUA_COR]`
- **Verde (sucesso):** `bg-green-500` → `bg-[SUA_COR]`

---

## 📞 Suporte

Dúvidas? Problemas?

1. Verifique os logs: `pm2 logs`
2. Consulte a documentação completa: `DEPLOY-LANDING-PAGE.md`
3. Verifique o status: `pm2 status` e `sudo nginx -t`

---

**✨ Boa sorte com sua Landing Page!**

A landing page foi desenvolvida com as melhores práticas de:
- ✅ SEO
- ✅ Performance
- ✅ Conversão
- ✅ UX/UI
- ✅ Segurança

🚀 **Está tudo pronto para converter visitantes em indicadores!**
