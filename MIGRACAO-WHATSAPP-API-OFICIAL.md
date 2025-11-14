# Migração para WhatsApp Business Cloud API (API Oficial)

## 📋 Visão Geral

Este documento descreve a migração da API não oficial (Baileys) para a **WhatsApp Business Cloud API oficial do Meta**.

### ✅ Benefícios da API Oficial

- ✅ **Mais estável e confiável** - Hospedada pela Meta
- ✅ **Sem QR Code** - Configuração via token
- ✅ **Escalável** - Suporta até 80 mensagens/segundo (padrão) ou 1.000 mps (automático)
- ✅ **Profissional** - Aprovada oficialmente pela Meta
- ✅ **Menos bloqueios** - Menor risco de banimento
- ✅ **Webhooks nativos** - Receba mensagens em tempo real
- ✅ **Suporte oficial** - Documentação completa da Meta

### ⚠️ Requisitos

- Conta no Facebook Developers
- WhatsApp Business Account (WABA)
- Número de telefone registrado no WhatsApp Business
- Verificação de negócio (recomendado, mas não obrigatório para teste)

---

## 🚀 Passo 1: Executar Migration no Banco de Dados

A migration adiciona as colunas necessárias na tabela `consultores` para armazenar as credenciais da Cloud API.

### Opção A: Executar via MySQL/MariaDB CLI

```bash
cd backend
mysql -u root -p nome_do_banco < migrations/15-whatsapp-cloud-api.sql
```

### Opção B: Executar via script PowerShell (Windows)

```powershell
cd backend
.\executar-migration-whatsapp-cloud.ps1
```

### Opção C: Executar via script Bash (Linux/Mac)

```bash
cd backend
chmod +x executar-migration-whatsapp-cloud.sh
./executar-migration-whatsapp-cloud.sh
```

### Opção D: Executar manualmente

Acesse seu banco de dados MySQL/MariaDB e execute:

```sql
-- Adicionar colunas para configuração da Cloud API
ALTER TABLE consultores
ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT NULL COMMENT 'Token de acesso da WhatsApp Cloud API',
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id VARCHAR(50) NULL COMMENT 'ID do número de telefone da WhatsApp Cloud API',
ADD COLUMN IF NOT EXISTS whatsapp_business_account_id VARCHAR(50) NULL COMMENT 'ID da conta business do WhatsApp',
ADD COLUMN IF NOT EXISTS whatsapp_webhook_verify_token VARCHAR(255) NULL COMMENT 'Token de verificação do webhook';

-- Adicionar índice para melhor performance
ALTER TABLE consultores
ADD INDEX IF NOT EXISTS idx_whatsapp_phone_number_id (whatsapp_phone_number_id);
```

---

## 🔧 Passo 2: Configurar WhatsApp Business no Meta

### 2.1 Criar/Acessar App no Facebook Developers

1. Acesse: https://developers.facebook.com/apps
2. Clique em **"Criar App"** (ou selecione um existente)
3. Escolha o tipo: **"Business"**
4. Preencha as informações básicas

### 2.2 Adicionar Produto WhatsApp

1. No painel do app, clique em **"Adicionar Produto"**
2. Selecione **"WhatsApp"** → **"Configurar"**
3. Você será redirecionado para o painel de configuração

### 2.3 Obter Credenciais

No painel **"API Setup"**, você verá:

#### **Phone Number ID** (obrigatório)
```
106540352242922
```
- Localização: API Setup → Número de telefone → ID
- Copie este valor

#### **Access Token** (obrigatório)
```
EAABsBCS1iHgBO...
```
- Localização: API Setup → Token de acesso temporário
- **IMPORTANTE:** Token temporário expira em 24h
- Para token permanente: veja seção 2.4

#### **Business Account ID** (opcional)
```
123456789012345
```
- Localização: API Setup → WhatsApp Business Account ID
- Recomendado para produção

### 2.4 Gerar Token Permanente (Recomendado)

Tokens temporários expiram em 24 horas. Para produção, use um token permanente:

1. No painel do app → **"Configurações"** → **"Básico"**
2. Copie o **App ID** e **App Secret**
3. Gere um token permanente:
   - Acesse: https://developers.facebook.com/tools/accesstoken/
   - Ou use a API do Graph para trocar o token temporário por permanente
   - Documentação: https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#1--acquire-an-access-token-using-a-system-user-or-facebook-login

### 2.5 Configurar Webhook

1. No painel WhatsApp → **"Configuration"** → **"Webhooks"**
2. Clique em **"Edit"**
3. Configure:

**Callback URL:**
```
https://seu-dominio.com/api/whatsapp-cloud/webhook
```

**Verify Token:** (escolha qualquer valor secreto)
```
meu_token_secreto_123
```

4. Inscreva-se nos eventos:
   - ✅ messages
   - ✅ message_status
   - ✅ messaging_handovers (opcional)

5. Clique em **"Verificar e Salvar"**

---

## 💻 Passo 3: Configurar no Frontend

### 3.1 Acessar Configurações

1. Faça login no CRM como consultor
2. Vá em **"Configurações"** (menu lateral)
3. Você verá duas opções:
   - ☁️ **API Oficial (Recomendado)**
   - 📱 API Não Oficial (QR Code)

### 3.2 Configurar API Oficial

1. Clique em **"Configurar API Oficial"**
2. Preencha o formulário:

**Access Token*** (obrigatório)
```
Cole o token obtido no passo 2.3
```

**Phone Number ID*** (obrigatório)
```
Cole o ID obtido no passo 2.3
```

**Business Account ID** (opcional)
```
Cole o ID (recomendado para produção)
```

**Webhook Verify Token** (opcional)
```
Cole o mesmo token definido no passo 2.5
```

3. Clique em **"Salvar Configuração"**

### 3.3 Verificar Conexão

- O status deve mudar para **"Conectado ✅"**
- Você verá uma bolinha verde pulsando
- Número do WhatsApp será exibido (se disponível)

---

## 🧪 Passo 4: Testar

### 4.1 Enviar Mensagem de Teste

1. Acesse a aba **"Chat"** no CRM
2. Selecione um lead existente (ou crie um novo)
3. Digite e envie uma mensagem
4. Verifique se a mensagem foi entregue no WhatsApp do lead

### 4.2 Receber Mensagem de Teste

1. Peça para o lead responder a mensagem
2. A resposta deve aparecer no CRM em tempo real
3. Verifique se o contador de mensagens não lidas é atualizado

### 4.3 Verificar Logs

Monitore os logs do backend:

```bash
# Ver logs em tempo real
docker-compose logs -f backend

# Ou no servidor local
cd backend
npm run dev
```

Procure por:
- ✅ `📤 Enviando mensagem via WhatsApp Cloud API`
- ✅ `📥 Webhook recebido`
- ✅ `✅ Mensagem processada com sucesso`

---

## 🔄 Compatibilidade com API Antiga

### Sistema Híbrido

O sistema agora suporta **AMBAS as APIs simultaneamente**:

- Se o consultor tiver **Cloud API configurada** → usa API oficial
- Se o consultor tiver **sessão Baileys ativa** → usa API não oficial
- Detecção automática na hora de enviar mensagens

### Migração Gradual

Você pode migrar consultores gradualmente:

1. Configure a Cloud API para alguns consultores
2. Mantenha outros usando Baileys
3. Migre todos quando estiver confiante

### Remover API Não Oficial (Futuro)

Quando todos estiverem usando a API oficial, você pode:

1. Remover dependências do Baileys no `package.json`:
```bash
npm uninstall baileys @hapi/boom qrcode
```

2. Deletar arquivos relacionados:
```bash
rm backend/src/services/whatsappService.ts
rm backend/src/controllers/whatsappController.ts
rm backend/src/routes/whatsapp.ts
rm components/WhatsAppQRModal.tsx
rm -rf backend/auth_sessions
```

3. Atualizar `server.ts` para remover imports do Baileys

---

## 🎯 Arquitetura Técnica

### Backend

**Novo Serviço:** `whatsappCloudService.ts`
- Gerencia envio/recebimento de mensagens via Cloud API
- Processa webhooks do Meta
- Armazena configurações no banco de dados

**Novo Controller:** `whatsappCloudController.ts`
- `POST /api/whatsapp-cloud/config` - Salvar configuração
- `DELETE /api/whatsapp-cloud/config` - Remover configuração
- `GET /api/whatsapp-cloud/status` - Verificar status
- `GET /api/whatsapp-cloud/webhook` - Verificação do webhook
- `POST /api/whatsapp-cloud/webhook` - Receber mensagens

**Controller Atualizado:** `mensagensController.ts`
- Detecta automaticamente qual API usar
- Fallback para Baileys se Cloud API não estiver configurada

### Frontend

**Novo Componente:** `WhatsAppCloudConfig.tsx`
- Modal para configurar credenciais da Cloud API
- Instruções passo a passo
- Validação de campos obrigatórios

**View Atualizada:** `ConfiguracoesView.tsx`
- Exibe duas opções de conexão
- Recomenda API oficial
- Mantém compatibilidade com QR Code

### Banco de Dados

**Novas Colunas na tabela `consultores`:**
```sql
whatsapp_access_token TEXT
whatsapp_phone_number_id VARCHAR(50)
whatsapp_business_account_id VARCHAR(50)
whatsapp_webhook_verify_token VARCHAR(255)
```

---

## 📊 Limites e Quotas

### Throughput (Mensagens por Segundo)

- **Padrão:** 80 mps
- **Upgrade Automático:** até 1.000 mps (baseado em uso)
- **Por número:** 1 mensagem a cada 6 segundos para o mesmo destinatário

### Rate Limits

- **Teste (não verificado):** 250 conversas únicas em 24h
- **Verificado (Tier 1):** 1.000 conversas únicas em 24h
- **Tier 2:** 10.000 conversas
- **Tier 3:** 100.000 conversas
- **Tier Unlimited:** Ilimitado

Documentação: https://developers.facebook.com/docs/whatsapp/messaging-limits

---

## 🛠️ Troubleshooting

### Erro: "WhatsApp não configurado"

**Causa:** Credenciais não foram salvas corretamente

**Solução:**
1. Verifique se as colunas foram criadas no banco
2. Reconfigure as credenciais no frontend
3. Verifique os logs do backend

### Erro: "Token inválido" ou "Token expirado"

**Causa:** Access Token temporário expirou (24h)

**Solução:**
1. Gere um novo token temporário no Facebook Developers
2. Ou configure um token permanente (recomendado)

### Webhook não está recebendo mensagens

**Causa:** URL do webhook não está acessível ou token de verificação incorreto

**Solução:**
1. Certifique-se que a URL é pública (não localhost)
2. Verifique se o webhook foi verificado com sucesso no Meta
3. Teste a URL manualmente: `curl https://seu-dominio.com/api/whatsapp-cloud/webhook`
4. Verifique os logs do backend

### Mensagens não estão sendo enviadas

**Causa:** Phone Number ID ou Access Token incorretos

**Solução:**
1. Verifique as credenciais no Facebook Developers
2. Reconfigure no CRM
3. Teste enviar mensagem via Postman/cURL primeiro
4. Verifique se o número está aprovado para uso

---

## 📚 Documentação Adicional

- **WhatsApp Cloud API:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **Get Started:** https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- **Webhooks:** https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
- **Message Templates:** https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates
- **Rate Limits:** https://developers.facebook.com/docs/whatsapp/messaging-limits

---

## 🎉 Pronto!

Seu sistema agora está usando a **API oficial do WhatsApp Business Cloud API**!

### Próximos Passos

1. ✅ Teste com mensagens reais
2. ✅ Configure templates de mensagem (opcional)
3. ✅ Solicite verificação do negócio para aumentar limites
4. ✅ Monitore métricas no Facebook Developers
5. ✅ Migre todos os consultores gradualmente

### Suporte

Em caso de dúvidas:
- Consulte a documentação oficial do Meta
- Verifique os logs do backend
- Entre em contato com o suporte técnico
