# 📊 LOGS PARA PRODUÇÃO - IMPLEMENTADO

## ✅ O QUE FOI IMPLEMENTADO

### **1. Request ID Middleware** 🆔

Cada requisição agora recebe um ID único para rastreamento completo.

```typescript
// Localização: backend/src/server.ts

app.use((req, res, next) => {
  // Gerar ID único para esta requisição
  const requestId = crypto.randomUUID();
  (req as any).requestId = requestId;
  
  // Adicionar no header de resposta
  res.setHeader('X-Request-ID', requestId);
  
  // Log estruturado da requisição
  logger.info({
    msg: '📨 Nova requisição',
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent']?.substring(0, 100)
  });
});
```

### **Benefícios:**
- ✅ Rastrear requisição do início ao fim
- ✅ Correlacionar logs de diferentes partes do sistema
- ✅ Identificar problemas específicos de usuários
- ✅ Header `X-Request-ID` na resposta para debug

---

## 📝 EXEMPLO DE LOGS

### **ANTES (Log Enxuto):**
```json
{"level":"ERROR","msg":"Erro ao enviar arquivo"}
```

### **DEPOIS (Log Rico):**
```json
{
  "level": "INFO",
  "time": 1762709148472,
  "msg": "📨 Nova requisição",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
  "method": "POST",
  "url": "/api/mensagens/upload",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

---

## 🔍 COMO USAR EM PRODUÇÃO

### **1. Rastrear Erro de Usuário:**

```bash
# Usuário reporta: "Não consegui enviar arquivo"
# Você pede o horário: "14:25"

# Buscar logs daquele horário
docker logs crm-backend | grep "14:25" | grep "upload"

# Encontra o requestId: a1b2c3d4-e5f6-7890...
# Buscar TODOS os logs daquela requisição
docker logs crm-backend | grep "a1b2c3d4-e5f6-7890"

# Resultado: Vê TODO o fluxo da requisição!
```

### **2. Identificar Padrões:**

```bash
# Ver todas as requisições com erro
docker logs crm-backend | grep "⚠️ Requisição com erro"

# Ver requisições lentas (> 1000ms)
docker logs crm-backend | grep "duration" | grep -E "[0-9]{4,}ms"

# Ver erros de um usuário específico
docker logs crm-backend | grep "IP_DO_USUARIO"
```

---

## 🎯 BOAS PRÁTICAS PARA CONTINUAR

### **Em Controllers (Exemplo):**

#### **❌ Log Ruim:**
```typescript
catch (error) {
  logger.error("Erro ao criar lead");
  res.status(500).json({ error: "Erro" });
}
```

#### **✅ Log Bom:**
```typescript
catch (error) {
  logger.error({
    msg: "Erro ao criar lead",
    requestId: (req as any).requestId, // ← Request ID!
    err: {
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    context: {
      userId: req.userId,
      leadName: req.body.nome,
      leadPhone: req.body.telefone,
      consultorId: req.body.consultorId
    }
  });
  res.status(500).json({ error: "Erro ao criar lead" });
}
```

---

## 📊 INFORMAÇÕES QUE SEMPRE INCLUIR

### **Em Logs de Erro:**

```typescript
{
  msg: "Descrição clara do erro",
  requestId: req.requestId,           // ← ID da requisição
  err: {                               // ← Erro completo
    message: error.message,
    stack: error.stack,
    code: error.code
  },
  context: {                           // ← Contexto rico
    userId: "abc-123",
    userName: "João Silva",
    operation: "upload_arquivo",
    fileName: "document.pdf",
    fileSize: "2MB"
  }
}
```

### **Em Logs de Operações:**

```typescript
{
  msg: "Lead criado com sucesso",
  requestId: req.requestId,
  userId: req.userId,
  leadId: leadId,
  leadName: nome,
  consultorId: consultorId,
  origin: "Indicação"
}
```

---

## 🚀 PRÓXIMOS PASSOS (Opcional)

### **1. Adicionar em Controllers Críticos:**
- ✅ `mensagensController.ts` (upload)
- ✅ `leadsController.ts` (criar lead)
- ✅ `indicadorController.ts` (criar indicação)
- ✅ `whatsappController.ts` (enviar mensagem)

### **2. Centralizar Logs (Futuro):**
- **Sentry** - Captura erros automaticamente
- **Datadog** - Logs + métricas + APM
- **ELK Stack** - Elasticsearch + Kibana
- **Grafana Loki** - Open source

### **3. Alertas Automáticos:**
```javascript
// Exemplo de alerta
if (error.level === "error" && count > 10) {
  enviarAlerta("Muitos erros detectados!");
}
```

---

## 📋 CHECKLIST DE PRODUÇÃO

### **Antes de Lançar:**
- [x] Request ID implementado
- [x] Logs estruturados (Pino)
- [ ] Contexto rico em controllers críticos
- [ ] Teste de busca de logs
- [ ] Documentação para equipe

### **Após Lançar:**
- [ ] Monitorar logs diariamente
- [ ] Configurar alertas
- [ ] Dashboard de erros
- [ ] Processo de incident response

---

## 💡 EXEMPLOS PRÁTICOS

### **Cenário 1: Upload Falhou**

**Log Completo:**
```json
{
  "level": "ERROR",
  "time": 1762709148472,
  "requestId": "a1b2c3d4...",
  "msg": "Erro ao fazer upload",
  "err": {
    "message": "File size exceeds limit",
    "code": "LIMIT_FILE_SIZE"
  },
  "context": {
    "userId": "abc-123",
    "fileName": "video.mp4",
    "fileSize": "50MB",
    "maxSize": "20MB"
  }
}
```

**Diagnóstico:** Arquivo muito grande
**Solução:** Aumentar limite ou informar usuário

### **Cenário 2: WhatsApp Não Enviou**

**Log Completo:**
```json
{
  "level": "ERROR",
  "time": 1762709098366,
  "requestId": "xyz-789...",
  "msg": "Erro ao enviar mensagem WhatsApp",
  "err": {
    "message": "Session closed",
    "code": "SESSION_CLOSED"
  },
  "context": {
    "consultorId": "def-456",
    "consultorNome": "João Silva",
    "leadPhone": "+5511999999999",
    "messageText": "Olá Maria..."
  }
}
```

**Diagnóstico:** Sessão WhatsApp caiu
**Solução:** Reconectar WhatsApp do consultor

---

## 🎯 RESULTADO ESPERADO

### **Debug Time:**
- **Antes:** 2-4 horas
- **Depois:** 5-15 minutos ⚡

### **Informação:**
- **Antes:** Quase nada
- **Depois:** Tudo que precisa ✅

### **Experiência:**
- **Antes:** Frustrante ❌
- **Depois:** Tranquilo ✅

---

## 📞 SUPORTE

Se precisar adicionar logs detalhados em mais controllers:

1. Siga o padrão de log rico
2. Sempre inclua `requestId`
3. Capture `error.stack` completo
4. Adicione contexto relevante

**Request ID está ativo e pronto para produção!** 🚀
