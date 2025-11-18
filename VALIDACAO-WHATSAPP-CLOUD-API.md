# 🔍 GUIA DE VALIDAÇÃO - WhatsApp Cloud API

Este guia garante que a integração com WhatsApp Cloud API funcionará corretamente.

---

## ✅ CHECKLIST DE VALIDAÇÃO PRÉ-CONFIGURAÇÃO

### 1. Verificar Pré-requisitos no Facebook Developers

- [ ] **App criado** no Facebook Developers
- [ ] **Produto WhatsApp** adicionado ao app
- [ ] **Número de telefone** verificado e configurado
- [ ] **Access Token** gerado (temporário ou permanente)
- [ ] **Phone Number ID** obtido
- [ ] **Business Account ID** identificado (opcional mas recomendado)

### 2. Verificar Backend

- [ ] Migration executada (`15-whatsapp-cloud-api.sql`)
- [ ] Colunas criadas na tabela `consultores`:
  - `whatsapp_access_token`
  - `whatsapp_phone_number_id`
  - `whatsapp_business_account_id`
  - `whatsapp_webhook_verify_token`
- [ ] Rotas registradas em `server.ts`
- [ ] Serviço inicializado com Socket.IO

### 3. Verificar Infraestrutura

- [ ] **Domínio HTTPS** configurado (obrigatório para webhook)
- [ ] **Porta 443** acessível publicamente
- [ ] **URL do webhook** acessível: `https://seu-dominio.com/api/whatsapp-cloud/webhook`
- [ ] **NGINX/Apache** configurado para proxy reverso

---

## 🧪 TESTES AUTOMATIZADOS

### Teste 1: Validar Credenciais

```bash
# Testar se as credenciais são válidas
curl -X GET "https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID?access_token=YOUR_ACCESS_TOKEN"
```

**Resposta esperada:**
```json
{
  "verified_name": "Seu Nome Business",
  "code_verification_status": "VERIFIED",
  "display_phone_number": "+55 11 98765-4321",
  "quality_rating": "GREEN",
  "platform_type": "CLOUD_API",
  "id": "106540352242922"
}
```

**❌ Se der erro 400/401:** Credenciais inválidas ou expiradas

---

### Teste 2: Validar Webhook (Verificação GET)

```bash
# Testar verificação do webhook
curl -X GET "https://seu-dominio.com/api/whatsapp-cloud/webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=CHALLENGE_STRING"
```

**Resposta esperada:** Deve retornar `CHALLENGE_STRING`

**❌ Se der 403:** Token de verificação incorreto
**❌ Se der 404:** Rota não configurada

---

### Teste 3: Enviar Mensagem de Teste

```bash
# Enviar mensagem via API do Meta diretamente
curl -X POST "https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511987654321",
    "type": "text",
    "text": {
      "body": "Teste de mensagem - API configurada corretamente!"
    }
  }'
```

**Resposta esperada:**
```json
{
  "messaging_product": "whatsapp",
  "contacts": [{
    "input": "5511987654321",
    "wa_id": "5511987654321"
  }],
  "messages": [{
    "id": "wamid.HBgLNTUxMTk4NzY1NDMyMRUCABIYFjNBMDhGNEE3RjU5QzVDMDQ3QTE5AA=="
  }]
}
```

**❌ Se der erro 131026:** Número não registrado no WhatsApp
**❌ Se der erro 100:** Access Token inválido
**❌ Se der erro 133:** Limite de mensagens atingido

---

### Teste 4: Enviar Mensagem pelo CRM

```bash
# Fazer login
LOGIN_RESPONSE=$(curl -X POST "https://seu-dominio.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@exemplo.com",
    "senha": "sua-senha"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

# Enviar mensagem via CRM
curl -X POST "https://seu-dominio.com/api/mensagens" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "ID_DO_LEAD",
    "conteudo": "Mensagem de teste via CRM",
    "tipo": "texto"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "messageId": "wamid.HBgLNTUxMTk4NzY1NDMyMRUCABIYFjNBMDhGNEE3RjU5QzVDMDQ3QTE5AA=="
}
```

---

### Teste 5: Simular Recebimento de Mensagem

```bash
# Simular webhook POST do Meta
curl -X POST "https://seu-dominio.com/api/whatsapp-cloud/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "5511987654321",
            "phone_number_id": "YOUR_PHONE_NUMBER_ID"
          },
          "messages": [{
            "from": "5511912345678",
            "id": "wamid.HBgLNTUxMTkxMjM0NTY3OBUCABEYEjBCMzVEQzIxQjlCQzJBRkQ4NwA=",
            "timestamp": "1699999999",
            "type": "text",
            "text": {
              "body": "Olá, esta é uma mensagem de teste!"
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

**Resposta esperada:** `200 OK`

**Verificar:**
- [ ] Mensagem salva no banco de dados
- [ ] Lead criado/atualizado
- [ ] Evento Socket.IO emitido
- [ ] Frontend recebe notificação

---

## 🔧 VALIDAÇÕES NO CÓDIGO

### Validação 1: Estrutura do Banco

```sql
-- Executar no MySQL
DESCRIBE consultores;

-- Verificar se as colunas existem:
-- whatsapp_access_token (VARCHAR)
-- whatsapp_phone_number_id (VARCHAR)
-- whatsapp_business_account_id (VARCHAR)
-- whatsapp_webhook_verify_token (VARCHAR)
```

### Validação 2: Rotas Registradas

```bash
# Verificar logs do servidor ao iniciar
# Deve aparecer:
✅ Rotas WhatsApp Cloud API registradas
```

### Validação 3: Service Inicializado

```bash
# Verificar logs do servidor
# Deve aparecer:
✅ WhatsApp Cloud Service inicializado com Socket.IO
```

---

## 📋 CHECKLIST DE VALIDAÇÃO PÓS-CONFIGURAÇÃO

### 1. Testar Fluxo Completo - Envio

- [ ] Fazer login no CRM
- [ ] Ir em Configurações → WhatsApp
- [ ] Clicar em "Configurar API Oficial"
- [ ] Inserir credenciais do Facebook
- [ ] Salvar configuração
- [ ] Verificar status "Online" ✅
- [ ] Abrir um chat de lead
- [ ] Enviar mensagem de texto
- [ ] Verificar se mensagem foi entregue no WhatsApp real
- [ ] Verificar status: enviada → entregue → lida

### 2. Testar Fluxo Completo - Recebimento

- [ ] Do seu WhatsApp pessoal, enviar mensagem para o número configurado
- [ ] Verificar se mensagem aparece no CRM instantaneamente
- [ ] Verificar se lead é criado (se não existir)
- [ ] Verificar se contador de mensagens não lidas aumenta
- [ ] Responder a mensagem pelo CRM
- [ ] Verificar se resposta chega no WhatsApp pessoal

### 3. Testar Webhook

- [ ] Acessar Facebook Developers → WhatsApp → Configuration
- [ ] Clicar em "Edit" nos Webhooks
- [ ] Inserir URL: `https://seu-dominio.com/api/whatsapp-cloud/webhook`
- [ ] Inserir verify token (mesmo configurado no CRM)
- [ ] Clicar em "Verify and Save"
- [ ] Verificar ✅ ao lado do webhook
- [ ] Ativar todos os campos de webhook:
   - [x] messages
   - [x] message_status
   - [x] messaging_postbacks
   - [x] message_echoes

---

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### ❌ Erro: "WhatsApp não configurado"

**Causa:** Credenciais não salvas ou consultor não autenticado

**Solução:**
```sql
-- Verificar se credenciais estão salvas
SELECT id, nome, whatsapp_access_token, whatsapp_phone_number_id 
FROM consultores 
WHERE id = 'SEU_ID';
```

---

### ❌ Erro 100: "Invalid OAuth 2.0 Access Token"

**Causa:** Access Token inválido ou expirado

**Solução:**
1. Gerar novo Access Token no Facebook Developers
2. Se usar token temporário (24h), gerar token permanente:
   - Settings → Basic → App Secret
   - Usar Graph API Explorer para gerar token de longa duração

---

### ❌ Erro 131026: "Message Undeliverable"

**Causa:** Número não registrado no WhatsApp ou bloqueado

**Solução:**
1. Verificar se número tem WhatsApp ativo
2. Verificar formato: deve ser `55DDNNNNNNNNN` (Brasil)
3. Remover símbolos: apenas números

---

### ❌ Erro 133: "Rate Limit Hit"

**Causa:** Muitas mensagens enviadas em pouco tempo

**Solução:**
1. Aguardar alguns minutos
2. Verificar limites da conta:
   - Tier 1: 1.000 conversas/dia
   - Tier 2: 10.000 conversas/dia
   - Tier 3: 100.000 conversas/dia

---

### ❌ Webhook não recebe mensagens

**Causa:** URL não acessível ou não configurada

**Solução:**
1. Verificar se URL é HTTPS (obrigatório)
2. Testar webhook manualmente (curl)
3. Verificar logs do servidor
4. Verificar firewall/porta 443
5. Reconfigurar webhook no Facebook Developers

---

### ❌ Mensagens não aparecem no CRM

**Causa:** Socket.IO não conectado ou webhook não processando

**Solução:**
1. Verificar logs do servidor: `📥 Webhook recebido`
2. Verificar console do navegador: Socket.IO conectado
3. Verificar se phone_number_id corresponde ao consultor
4. Verificar duplicidade: mensagem já processada

---

## 📊 MONITORAMENTO CONTÍNUO

### Logs Importantes

```bash
# Ver logs do backend (Docker)
docker logs -f crm-backend --tail 100

# Ver logs específicos do WhatsApp
docker logs -f crm-backend 2>&1 | grep -i whatsapp
```

### Logs de Sucesso

```
✅ Configuração do WhatsApp salva para consultor: abc-123
📤 Enviando mensagem via WhatsApp Cloud API
✅ Mensagem enviada! WhatsApp Message ID: wamid.HBg...
📥 Webhook recebido
✅ Mensagem processada com sucesso
✅ Status da mensagem atualizado: entregue
```

### Logs de Erro

```
❌ Erro ao enviar mensagem: { error: {...} }
❌ Erro ao processar webhook: {...}
⚠️ Webhook sem entries
⚠️ Consultor não encontrado para phone_number_id
```

---

## 🎯 GARANTIA DE FUNCIONAMENTO

Para garantir 100% de funcionamento:

### ✅ Antes de colocar em produção:

1. **Executar script de teste automatizado** (ver próximo arquivo)
2. **Validar todos os checkpoints** deste guia
3. **Testar com número real** (seu WhatsApp pessoal)
4. **Verificar logs em tempo real** durante teste
5. **Simular webhook** com curl
6. **Testar fluxo completo**: envio + recebimento
7. **Verificar banco de dados** após cada teste

### ✅ Após colocar em produção:

1. **Monitorar logs** nas primeiras horas
2. **Verificar rate limits** da conta WhatsApp Business
3. **Configurar alertas** para erros 400/500
4. **Backup das credenciais** em local seguro
5. **Documentar phone_number_id** de cada consultor

---

## 📞 SUPORTE META/FACEBOOK

Se após todos os testes ainda houver problemas:

1. **Suporte oficial:** https://business.facebook.com/business/help
2. **Documentação:** https://developers.facebook.com/docs/whatsapp/cloud-api
3. **Status da API:** https://developers.facebook.com/status/
4. **Community:** https://developers.facebook.com/community/

---

## ✨ CONCLUSÃO

Seguindo este guia completo, você terá **100% de certeza** de que a integração funcionará corretamente. Todos os pontos de falha foram mapeados e as soluções documentadas.

**Próximo passo:** Execute o script de teste automatizado (`testar-whatsapp-cloud-api.sh`)
