#!/bin/bash

##############################################
# Script de Validação - WhatsApp Cloud API
# Testa toda a integração automaticamente
##############################################

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contador de testes
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Função para imprimir cabeçalho
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Função para teste com resultado
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "🧪 Testando: $test_name... "
    
    result=$(eval "$test_command" 2>&1)
    
    if [[ "$result" == *"$expected_result"* ]] || [ -z "$expected_result" ]; then
        echo -e "${GREEN}✅ PASSOU${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FALHOU${NC}"
        echo -e "${YELLOW}Resultado: $result${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Função para verificar resposta HTTP
check_http_response() {
    local url="$1"
    local expected_code="$2"
    local description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "🌐 Testando: $description... "
    
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response_code" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASSOU (HTTP $response_code)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FALHOU (HTTP $response_code, esperado $expected_code)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Função para verificar estrutura do banco
check_database() {
    local description="$1"
    local query="$2"
    local expected="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "🗄️  Testando: $description... "
    
    # Você precisará configurar as credenciais do banco
    result=$(docker exec crm-backend node -e "
        const mysql = require('mysql2/promise');
        (async () => {
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME
            });
            const [rows] = await connection.execute('$query');
            console.log(JSON.stringify(rows));
            await connection.end();
        })();
    " 2>&1)
    
    if [[ "$result" == *"$expected"* ]] || [ -z "$expected" ]; then
        echo -e "${GREEN}✅ PASSOU${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FALHOU${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Iniciar testes
clear
print_header "🔍 VALIDAÇÃO AUTOMÁTICA - WhatsApp Cloud API"

echo "Este script irá validar toda a integração com WhatsApp Cloud API"
echo ""

# Solicitar informações
echo -e "${YELLOW}Por favor, insira as seguintes informações:${NC}"
echo ""

read -p "🔑 Access Token do Facebook: " ACCESS_TOKEN
read -p "📱 Phone Number ID: " PHONE_NUMBER_ID
read -p "🌐 URL do seu domínio (ex: https://boraindicar.com): " DOMAIN_URL
read -p "📞 Número de telefone para teste (ex: 5511987654321): " TEST_PHONE

echo ""
echo -e "${BLUE}Iniciando testes...${NC}"
sleep 2

# ============================================
# TESTES DE INFRAESTRUTURA
# ============================================
print_header "1️⃣ TESTES DE INFRAESTRUTURA"

# Verificar se backend está rodando
check_http_response "$DOMAIN_URL/api/health" "200" "Backend online"

# Verificar se webhook está acessível
check_http_response "$DOMAIN_URL/api/whatsapp-cloud/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=test123" "200" "Webhook acessível"

# Verificar HTTPS
if [[ "$DOMAIN_URL" == https* ]]; then
    echo -e "🔒 HTTPS: ${GREEN}✅ Configurado${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "🔒 HTTPS: ${RED}❌ Não configurado (obrigatório!)${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ============================================
# TESTES DE BANCO DE DADOS
# ============================================
print_header "2️⃣ TESTES DE BANCO DE DADOS"

echo "📋 Verificando estrutura da tabela consultores..."
docker exec crm-backend node -e "
const mysql = require('mysql2/promise');
(async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        const [columns] = await connection.execute('SHOW COLUMNS FROM consultores WHERE Field LIKE \"%whatsapp%\"');
        
        const requiredColumns = [
            'whatsapp_access_token',
            'whatsapp_phone_number_id',
            'whatsapp_business_account_id',
            'whatsapp_webhook_verify_token'
        ];
        
        let allPresent = true;
        requiredColumns.forEach(col => {
            const found = columns.find(c => c.Field === col);
            if (found) {
                console.log('✅ Coluna ' + col + ' presente');
            } else {
                console.log('❌ Coluna ' + col + ' ausente');
                allPresent = false;
            }
        });
        
        await connection.end();
        process.exit(allPresent ? 0 : 1);
    } catch (error) {
        console.error('❌ Erro ao verificar banco:', error.message);
        process.exit(1);
    }
})();
" && echo -e "${GREEN}✅ Estrutura do banco OK${NC}" || echo -e "${RED}❌ Estrutura do banco com problemas${NC}"

# ============================================
# TESTES DE API META/FACEBOOK
# ============================================
print_header "3️⃣ TESTES DE API META/FACEBOOK"

echo "🧪 Testando credenciais do Facebook..."
CRED_RESPONSE=$(curl -s "https://graph.facebook.com/v21.0/$PHONE_NUMBER_ID?access_token=$ACCESS_TOKEN")

if [[ "$CRED_RESPONSE" == *"verified_name"* ]]; then
    echo -e "${GREEN}✅ Credenciais válidas${NC}"
    echo "📱 Número verificado: $(echo $CRED_RESPONSE | grep -o '"verified_name":"[^"]*"' | cut -d'"' -f4)"
    echo "📊 Status de qualidade: $(echo $CRED_RESPONSE | grep -o '"quality_rating":"[^"]*"' | cut -d'"' -f4)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Credenciais inválidas ou expiradas${NC}"
    echo "Resposta: $CRED_RESPONSE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🧪 Testando envio de mensagem via API do Meta..."
MSG_RESPONSE=$(curl -s -X POST "https://graph.facebook.com/v21.0/$PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"messaging_product\": \"whatsapp\",
    \"to\": \"$TEST_PHONE\",
    \"type\": \"text\",
    \"text\": {
      \"body\": \"✅ Teste automatizado do CRM - $(date '+%d/%m/%Y %H:%M:%S')\"
    }
  }")

if [[ "$MSG_RESPONSE" == *"messages"* ]]; then
    echo -e "${GREEN}✅ Mensagem enviada com sucesso${NC}"
    MESSAGE_ID=$(echo $MSG_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "📨 Message ID: $MESSAGE_ID"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Falha ao enviar mensagem${NC}"
    echo "Resposta: $MSG_RESPONSE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ============================================
# TESTES DE WEBHOOK
# ============================================
print_header "4️⃣ TESTES DE WEBHOOK"

echo "🧪 Testando verificação do webhook (GET)..."
WEBHOOK_VERIFY=$(curl -s "$DOMAIN_URL/api/whatsapp-cloud/webhook?hub.mode=subscribe&hub.verify_token=test123&hub.challenge=CHALLENGE_STRING")

if [[ "$WEBHOOK_VERIFY" == "CHALLENGE_STRING" ]]; then
    echo -e "${GREEN}✅ Webhook GET funcionando${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Webhook GET não retornou challenge${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🧪 Testando recebimento de webhook (POST)..."
WEBHOOK_POST=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$DOMAIN_URL/api/whatsapp-cloud/webhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"object\": \"whatsapp_business_account\",
    \"entry\": [{
      \"id\": \"TEST_ID\",
      \"changes\": [{
        \"value\": {
          \"messaging_product\": \"whatsapp\",
          \"metadata\": {
            \"display_phone_number\": \"$TEST_PHONE\",
            \"phone_number_id\": \"$PHONE_NUMBER_ID\"
          },
          \"messages\": [{
            \"from\": \"$TEST_PHONE\",
            \"id\": \"test_message_id_$(date +%s)\",
            \"timestamp\": \"$(date +%s)\",
            \"type\": \"text\",
            \"text\": {
              \"body\": \"Teste de webhook automático\"
            }
          }]
        },
        \"field\": \"messages\"
      }]
    }]
  }")

if [ "$WEBHOOK_POST" = "200" ]; then
    echo -e "${GREEN}✅ Webhook POST funcionando (HTTP $WEBHOOK_POST)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Webhook POST retornou HTTP $WEBHOOK_POST${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ============================================
# VERIFICAÇÃO DE LOGS
# ============================================
print_header "5️⃣ VERIFICAÇÃO DE LOGS"

echo "📋 Verificando logs recentes do backend..."
echo ""
docker logs crm-backend --tail 20 2>&1 | grep -i "whatsapp\|webhook" || echo "Nenhum log relacionado encontrado"
echo ""

# ============================================
# RESUMO DOS TESTES
# ============================================
print_header "📊 RESUMO DOS TESTES"

echo ""
echo "Total de testes executados: $TOTAL_TESTS"
echo -e "${GREEN}✅ Testes aprovados: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Testes falhados: $FAILED_TESTS${NC}"
echo ""

PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM! (100%)${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}✅ Sua integração com WhatsApp Cloud API está funcionando perfeitamente!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Configure o webhook no Facebook Developers"
    echo "2. Use a URL: $DOMAIN_URL/api/whatsapp-cloud/webhook"
    echo "3. Faça login no CRM e configure suas credenciais"
    echo "4. Teste enviar e receber mensagens reais"
elif [ $PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  ALGUNS TESTES FALHARAM ($PERCENTAGE% aprovados)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "A integração básica está funcionando, mas há alguns problemas."
    echo "Revise os testes que falharam acima."
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ MUITOS TESTES FALHARAM ($PERCENTAGE% aprovados)${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Há problemas significativos na integração."
    echo "Revise o guia VALIDACAO-WHATSAPP-CLOUD-API.md"
fi

echo ""
echo "📖 Para mais informações, consulte: VALIDACAO-WHATSAPP-CLOUD-API.md"
echo ""
