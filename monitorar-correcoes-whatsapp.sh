#!/bin/bash
# Script para monitorar logs das correções anti-ban do WhatsApp
# Uso: ./monitorar-correcoes-whatsapp.sh

echo "=========================================="
echo "🔍 Monitor de Correções Anti-Ban WhatsApp"
echo "=========================================="
echo ""
echo "Monitorando logs das 8 correções implementadas..."
echo "Pressione Ctrl+C para parar"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ir para o diretório backend
cd backend

# Iniciar o servidor em background e capturar logs
npm run dev 2>&1 | while IFS= read -r line; do
    timestamp=$(date '+%H:%M:%S')
    
    # ERRO 1 e 2: Browser identifier e User-Agent
    if echo "$line" | grep -q "Usando browser identifier realista\|Primeira conexão: índice inicial aleatório\|Reconexão detectada: rotacionando"; then
        echo -e "${GREEN}[$timestamp] ✅ CORREÇÃO 1+2 (Browser/User-Agent):${NC} $line"
    
    # ERRO 3: ContextInfo
    elif echo "$line" | grep -q "contextInfo"; then
        echo -e "${YELLOW}[$timestamp] ✅ CORREÇÃO 3 (ContextInfo):${NC} $line"
    
    # ERRO 4: Backoff exponencial
    elif echo "$line" | grep -q "Aguardando.*antes de reconectar\|base:.*exponencial:.*jitter:"; then
        echo -e "${BLUE}[$timestamp] ✅ CORREÇÃO 4 (Backoff Exponencial):${NC} $line"
    
    # ERRO 5: Reconexão no boot
    elif echo "$line" | grep -q "Aguardando.*antes de tentar reconexões\|Aguardando.*antes da próxima reconexão"; then
        echo -e "${CYAN}[$timestamp] ✅ CORREÇÃO 5 (Boot Randomizado):${NC} $line"
    
    # ERRO 6: Delays humanos
    elif echo "$line" | grep -q "Simulando leitura\|Simulando digitação"; then
        echo -e "${MAGENTA}[$timestamp] ✅ CORREÇÃO 6 (Delays Humanos):${NC} $line"
    
    # ERRO 7: Presence/Typing
    elif echo "$line" | grep -q "Enviando presença.*composing\|Parando de digitar"; then
        echo -e "${RED}[$timestamp] ✅ CORREÇÃO 7 (Presence/Typing):${NC} $line"
    
    # ERRO 8: markOnlineOnConnect (aparece nos logs de conexão)
    elif echo "$line" | grep -q "markOnlineOnConnect"; then
        echo -e "${GREEN}[$timestamp] ✅ CORREÇÃO 8 (markOnlineOnConnect):${NC} $line"
    
    # Logs importantes gerais
    elif echo "$line" | grep -qE "WhatsApp conectado|WhatsApp desconectado|Mensagem enviada|nova_mensagem"; then
        echo "[$timestamp] 📱 $line"
    
    # Erros
    elif echo "$line" | grep -qiE "erro|error|failed|falha"; then
        echo -e "${RED}[$timestamp] ❌ ERRO:${NC} $line"
    
    # Outros logs (cinza, menos destaque)
    else
        echo "[$timestamp] $line"
    fi
done
