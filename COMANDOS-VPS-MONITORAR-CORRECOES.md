# 🚀 Comandos para Testar Correções Anti-Ban na VPS Ubuntu

Execute estes comandos na sua VPS Ubuntu em **PRODUÇÃO**.

---

## 📥 **PASSO 1: Atualizar o Código na VPS**

```bash
# 1. Conectar na VPS (se ainda não estiver conectado)
ssh seu-usuario@seu-servidor

# 2. Ir para o diretório do projeto
cd /caminho/do/seu/projeto

# 3. Fazer backup do estado atual (opcional, mas recomendado)
git stash

# 4. Fazer pull das mudanças do GitHub
git pull origin master

# 5. Se fez stash, pode aplicar de volta (se necessário)
# git stash pop
```

---

## 🔧 **PASSO 2: Dar Permissão ao Script de Monitoramento**

```bash
# ⚠️ IMPORTANTE: Para VPS com Docker, use o script Docker-específico
chmod +x monitorar-correcoes-docker.sh
```

---

## 📊 **PASSO 3: Executar o Script de Monitoramento Docker**

### **Opção A: Monitoramento em Tempo Real (Com Cores)**
```bash
# Executar o script Docker diretamente
./monitorar-correcoes-docker.sh
```

**Pressione `Ctrl+C` para parar**

---

### **Opção B: Salvar Logs em Arquivo (Recomendado para Produção)**

```bash
# Executar e salvar logs em arquivo
./monitorar-correcoes-docker.sh 2>&1 | tee logs-correcoes-whatsapp.txt
```

Isso vai:
- Mostrar logs na tela em tempo real
- Salvar tudo no arquivo `logs-correcoes-whatsapp.txt`

**Pressione `Ctrl+C` para parar quando quiser**

---

### **Opção C: Rodar em Background e Coletar Logs Depois**

```bash
# Rodar em background
nohup ./monitorar-correcoes-whatsapp.sh > logs-correcoes-whatsapp.txt 2>&1 &

# Ver o PID (ID do processo)
echo $!

# Ver os logs em tempo real
tail -f logs-correcoes-whatsapp.txt

# Parar de ver os logs (Ctrl+C)
# Mas o script continua rodando em background
```

Para parar o script em background:
```bash
# Encontrar o PID
ps aux | grep monitorar-correcoes

# Matar o processo (substitua PID pelo número)
kill PID
```

---

## 🧪 **PASSO 4: Testar as Correções**

### **Teste 1: Correções de Conexão (1, 2, 5, 8)**
```bash
# 1. Inicie o script de monitoramento
./monitorar-correcoes-whatsapp.sh 2>&1 | tee logs-correcoes-whatsapp.txt

# 2. Aguarde o servidor iniciar
# 3. Conecte um WhatsApp escaneando o QR Code no CRM

# Você deve ver:
# ✅ CORREÇÃO 5: "Aguardando Xs antes de tentar reconexões"
# ✅ CORREÇÃO 1+2: "Usando browser identifier realista: Windows / Chrome / ..."
```

---

### **Teste 2: Correções de Envio de Mensagem (6, 7)**
```bash
# Com o monitoramento rodando:
# 1. Vá no CRM
# 2. Envie uma mensagem para qualquer lead

# Você DEVE ver estas linhas na sequência:
# ✅ CORREÇÃO 6: "⏱️ Simulando leitura: 3s"
# ✅ CORREÇÃO 7: "⌨️ Enviando presença 'composing' (digitando...)"
# ✅ CORREÇÃO 6: "⌨️ Simulando digitação: 4s (82 caracteres)"
# ✅ CORREÇÃO 7: "✋ Parando de digitar (paused)"
# 📱 "📤 Enviando mensagem agora..."
```

---

### **Teste 3: Correção de Reconexão (4)**
```bash
# Para forçar uma reconexão e ver o backoff exponencial:
# 1. Desconecte o WhatsApp manualmente no CRM
# 2. Aguarde ele tentar reconectar automaticamente

# Você deve ver:
# ✅ CORREÇÃO 4: "Aguardando 47s antes de reconectar (base: 30s, exponencial: 30s, jitter: 12s)"
# (Os valores variam a cada tentativa)
```

---

## 📤 **PASSO 5: Coletar e Enviar os Logs**

### **Método 1: Ver últimas 100 linhas dos logs**
```bash
tail -n 100 logs-correcoes-whatsapp.txt
```

### **Método 2: Filtrar apenas as correções**
```bash
grep "✅ CORREÇÃO" logs-correcoes-whatsapp.txt | tail -n 50
```

### **Método 3: Baixar o arquivo de log completo**
```bash
# Na sua máquina local (não na VPS), execute:
scp seu-usuario@seu-servidor:/caminho/do/projeto/logs-correcoes-whatsapp.txt ./logs-vps.txt

# Depois envie o arquivo logs-vps.txt para mim
```

### **Método 4: Copiar e colar diretamente**
```bash
# Ver todo o conteúdo do arquivo
cat logs-correcoes-whatsapp.txt

# Ou apenas as últimas 200 linhas
tail -n 200 logs-correcoes-whatsapp.txt

# Copie a saída e me envie
```

---

## 🔍 **O QUE PROCURAR NOS LOGS:**

### ✅ **Logs de Sucesso:**

```
[10:30:15] ✅ CORREÇÃO 1+2 (Browser/User-Agent): ✅ Usando browser identifier realista: Windows / Chrome / 130.0.6723.116
[10:30:15] 📱 ✅ WhatsApp conectado para consultor: 123
[10:30:20] ✅ CORREÇÃO 5 (Boot Randomizado): ⏱️ Aguardando 67s antes de tentar reconexões automáticas
[10:30:45] ✅ CORREÇÃO 6 (Delays Humanos): ⏱️ Simulando leitura: 3s
[10:30:48] ✅ CORREÇÃO 7 (Presence/Typing): ⌨️ Enviando presença "composing" (digitando...)
[10:30:51] ✅ CORREÇÃO 6 (Delays Humanos): ⌨️ Simulando digitação: 4s (82 caracteres)
[10:30:55] ✅ CORREÇÃO 7 (Presence/Typing): ✋ Parando de digitar (paused)
```

### ❌ **Se NÃO ver esses logs:**
- As correções podem não estar funcionando
- Me envie os logs para eu analisar

---

## 🛠️ **TROUBLESHOOTING:**

### **Script não inicia:**
```bash
# Verificar se tem permissão
ls -la monitorar-correcoes-whatsapp.sh

# Deve mostrar: -rwxr-xr-x (com 'x' de executável)

# Se não tiver, dar permissão:
chmod +x monitorar-correcoes-whatsapp.sh
```

### **Servidor já está rodando em outra porta:**
```bash
# Verificar se já tem um processo rodando
ps aux | grep "npm run dev"

# Matar processos antigos
pkill -f "npm run dev"

# Tentar rodar o script novamente
```

### **Logs não aparecem coloridos:**
- Isso é normal no arquivo de log
- As cores só aparecem no terminal
- Use a **Opção A** (sem salvar em arquivo) para ver com cores

---

## 📋 **RESUMO DOS COMANDOS PRINCIPAIS:**

```bash
# 1. Atualizar código
cd /caminho/do/projeto && git pull origin master

# 2. Dar permissão
chmod +x monitorar-correcoes-whatsapp.sh

# 3. Executar com logs salvos
./monitorar-correcoes-whatsapp.sh 2>&1 | tee logs-correcoes-whatsapp.txt

# 4. Em outro terminal, enviar mensagem pelo CRM e observar logs

# 5. Ver últimas linhas dos logs
tail -n 100 logs-correcoes-whatsapp.txt

# 6. Filtrar apenas correções
grep "✅ CORREÇÃO" logs-correcoes-whatsapp.txt

# 7. Baixar log para sua máquina (executar localmente)
scp seu-usuario@seu-servidor:/caminho/do/projeto/logs-correcoes-whatsapp.txt ./
```

---

## 📨 **ENVIAR LOGS PARA ANÁLISE:**

Depois de executar os testes, me envie:

1. **Últimas 100-200 linhas do log:**
   ```bash
   tail -n 200 logs-correcoes-whatsapp.txt
   ```

2. **Ou baixe o arquivo completo:**
   ```bash
   scp seu-usuario@seu-servidor:/caminho/do/projeto/logs-correcoes-whatsapp.txt ./
   ```

3. **Diga se:**
   - ✅ Viu os logs das correções 1, 2, 5, 6, 7
   - ❌ Não viu alguns logs
   - Se enviou mensagens e viu os delays funcionando

---

**🎯 Pronto! Execute esses comandos e me envie os logs para análise!**
