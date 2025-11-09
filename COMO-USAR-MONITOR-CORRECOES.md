# 📊 Como Usar o Monitor de Correções Anti-Ban

Este guia explica como usar os scripts de monitoramento para verificar se as 8 correções anti-ban estão funcionando corretamente.

---

## 🖥️ **PARA WINDOWS**

### **1. Executar o Script:**
```powershell
.\monitorar-correcoes-whatsapp.ps1
```

### **2. Se der erro de execução, libere o script:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\monitorar-correcoes-whatsapp.ps1
```

---

## 🐧 **PARA LINUX/MAC**

### **1. Dar permissão de execução:**
```bash
chmod +x monitorar-correcoes-whatsapp.sh
```

### **2. Executar o Script:**
```bash
./monitorar-correcoes-whatsapp.sh
```

---

## 📋 **O QUE O SCRIPT MONITORA:**

O script destaca com cores diferentes cada uma das 8 correções:

### ✅ **CORREÇÃO 1+2** (Verde) - Browser/User-Agent
- Logs a procurar:
  - `"Usando browser identifier realista"`
  - `"Primeira conexão: índice inicial aleatório"`
  - `"Reconexão detectada: rotacionando"`

**Quando aparece:** Ao conectar ou reconectar o WhatsApp

---

### ✅ **CORREÇÃO 3** (Amarelo) - ContextInfo
- Logs a procurar:
  - Qualquer linha com `"contextInfo"`

**Quando aparece:** Durante o envio de mensagens (raramente aparece nos logs visíveis, mas está no código)

---

### ✅ **CORREÇÃO 4** (Azul) - Backoff Exponencial
- Logs a procurar:
  - `"Aguardando Xs antes de reconectar"`
  - `"base: 30s, exponencial: Xs, jitter: Xs"`

**Quando aparece:** Quando o WhatsApp desconecta e tenta reconectar

---

### ✅ **CORREÇÃO 5** (Ciano) - Boot Randomizado
- Logs a procurar:
  - `"Aguardando Xs antes de tentar reconexões automáticas"`
  - `"Aguardando Xs antes da próxima reconexão"`

**Quando aparece:** 
- Logo após iniciar o servidor (30-90 segundos de espera)
- Entre reconexões de diferentes consultores

---

### ✅ **CORREÇÃO 6** (Magenta) - Delays Humanos
- Logs a procurar:
  - `"Simulando leitura: Xs"`
  - `"Simulando digitação: Xs"`

**Quando aparece:** Toda vez que você **envia uma mensagem**

---

### ✅ **CORREÇÃO 7** (Vermelho) - Presence/Typing
- Logs a procurar:
  - `"Enviando presença 'composing' (digitando...)"`
  - `"Parando de digitar (paused)"`

**Quando aparece:** Toda vez que você **envia uma mensagem**

---

### ✅ **CORREÇÃO 8** (Verde) - markOnlineOnConnect
- Logs a procurar:
  - `"markOnlineOnConnect"`

**Quando aparece:** Raramente aparece nos logs, mas está configurado no código

---

## 🧪 **COMO TESTAR:**

### **1. Teste de Conexão (Correções 1, 2, 5, 8):**
- Inicie o servidor com o script de monitoramento
- Conecte o WhatsApp escaneando o QR Code
- **Você deve ver:**
  - ✅ Browser identifier sendo usado
  - ✅ Delay randomizado antes da reconexão automática (se houver sessões salvas)

### **2. Teste de Reconexão (Correção 4):**
- Com o WhatsApp conectado, force uma desconexão
- **Você deve ver:**
  - ✅ Delays exponenciais com jitter sendo calculados
  - ✅ Tempo de espera aumentando a cada tentativa

### **3. Teste de Envio de Mensagem (Correções 6, 7):**
- Envie uma mensagem pelo CRM
- **Você deve ver:**
  - ✅ "Simulando leitura: 2-5s"
  - ✅ "Enviando presença 'composing'"
  - ✅ "Simulando digitação: Xs" (baseado no tamanho da mensagem)
  - ✅ "Parando de digitar (paused)"
  - ✅ "Enviando mensagem agora..."

---

## 🎯 **EXEMPLO DE SAÍDA ESPERADA:**

```
[10:30:15] ✅ CORREÇÃO 1+2 (Browser/User-Agent): ✅ Usando browser identifier realista: Windows / Chrome / 130.0.6723.116
[10:30:15] 📱 ✅ WhatsApp conectado para consultor: 123
[10:30:45] ✅ CORREÇÃO 6 (Delays Humanos): ⏱️ Simulando leitura: 3s
[10:30:48] ✅ CORREÇÃO 7 (Presence/Typing): ⌨️ Enviando presença "composing" (digitando...)
[10:30:51] ✅ CORREÇÃO 6 (Delays Humanos): ⌨️ Simulando digitação: 4s (82 caracteres)
[10:30:55] ✅ CORREÇÃO 7 (Presence/Typing): ✋ Parando de digitar (paused)
[10:30:55] 📱 📤 Enviando mensagem agora...
```

---

## ⚠️ **TROUBLESHOOTING:**

### **Não vejo nenhuma correção nos logs:**
1. Certifique-se de que está usando o código corrigido
2. Teste enviando uma mensagem - as correções 6 e 7 são as mais fáceis de visualizar
3. Verifique se o servidor iniciou corretamente

### **Script não executa no Windows:**
Execute antes:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### **Script não executa no Linux/Mac:**
Execute antes:
```bash
chmod +x monitorar-correcoes-whatsapp.sh
```

---

## 📈 **RESUMO DE VERIFICAÇÃO:**

| # | Correção | Quando Testar | Log Esperado |
|---|----------|---------------|--------------|
| 1-2 | Browser/User-Agent | Ao conectar | `"Usando browser identifier realista"` |
| 3 | ContextInfo | Ao enviar mensagem | Sem log visível (está no código) |
| 4 | Backoff Exponencial | Ao reconectar após erro | `"Aguardando Xs antes de reconectar"` |
| 5 | Boot Randomizado | Ao iniciar servidor | `"Aguardando Xs antes de tentar reconexões"` |
| 6 | Delays Humanos | Ao enviar mensagem | `"Simulando leitura"` e `"Simulando digitação"` |
| 7 | Presence/Typing | Ao enviar mensagem | `"Enviando presença 'composing'"` |
| 8 | markOnlineOnConnect | Ao conectar | Configurado no código (sem log) |

---

**✅ Se você vê os logs das correções 1, 2, 5, 6 e 7, todas as correções estão funcionando corretamente!**
