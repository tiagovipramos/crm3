#!/bin/bash

# Script de Debug Profundo do Erro 400 no Login
# Analisa logs, testa requisições e identifica o problema

echo "🔍 ============================================"
echo "🔍  DEBUG PROFUNDO - ERRO 400 LOGIN"
echo "🔍 ============================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ir para o diretório do projeto
cd ~/crm || exit 1

echo "📋 1. INFORMAÇÕES DO SISTEMA"
echo "============================================"
echo -e "${BLUE}Data/Hora:${NC} $(date)"
echo -e "${BLUE}Hostname:${NC} $(hostname)"
echo -e "${BLUE}Uptime:${NC} $(uptime -p)"
echo ""

echo "🐳 2. STATUS DOS CONTAINERS"
echo "============================================"
docker-compose ps
echo ""

echo "📊 3. VERIFICAR SE BACKEND ESTÁ RESPONDENDO"
echo "============================================"
echo "Testando health check do backend..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
if [ -n "$HEALTH_RESPONSE" ]; then
    echo -e "${GREEN}✅ Backend respondeu:${NC}"
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Backend NÃO está respondendo!${NC}"
fi
echo ""

echo "🔍 4. TESTAR LOGIN DIRETO NO BACKEND (CURL)"
echo "============================================"
echo "Testando POST para /api/auth/login com credenciais de teste..."
echo ""
echo "Requisição enviada:"
echo '{"email":"vendas@vipseg.org","senha":"testesenha123"}'
echo ""
echo "Resposta:"
CURL_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendas@vipseg.org","senha":"testesenha123"}')

HTTP_CODE=$(echo "$CURL_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$CURL_RESPONSE" | sed '/HTTP_CODE:/d')

echo -e "${BLUE}Status Code:${NC} $HTTP_CODE"
echo -e "${BLUE}Response Body:${NC}"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"

if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${RED}❌ ERRO 400 CONFIRMADO!${NC}"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Login funcionando!${NC}"
else
    echo -e "${YELLOW}⚠️  Status code inesperado: $HTTP_CODE${NC}"
fi
echo ""

echo "📝 5. ÚLTIMOS LOGS DO BACKEND (50 linhas)"
echo "============================================"
docker-compose logs --tail=50 backend
echo ""

echo "🔎 6. FILTRAR ERROS E WARNINGS NO BACKEND"
echo "============================================"
echo "Procurando por erros relacionados a login..."
docker-compose logs --tail=100 backend | grep -iE "(400|login|error|erro|warn|email|senha)" | tail -20
echo ""

echo "🌐 7. VERIFICAR CONFIGURAÇÕES CORS"
echo "============================================"
echo "Testando requisição com Origin header..."
CORS_TEST=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X OPTIONS http://localhost:3001/api/auth/login \
  -H "Origin: https://boraindicar.com.br" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type")

CORS_CODE=$(echo "$CORS_TEST" | grep "HTTP_CODE:" | cut -d: -f2)
echo -e "${BLUE}CORS Preflight Status:${NC} $CORS_CODE"

if [ "$CORS_CODE" = "204" ] || [ "$CORS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ CORS configurado corretamente${NC}"
else
    echo -e "${RED}❌ Problema com CORS (código: $CORS_CODE)${NC}"
fi
echo ""

echo "🔍 8. VERIFICAR CORPO DA REQUISIÇÃO NO BACKEND"
echo "============================================"
echo "Analisando logs para ver se body está chegando..."
docker-compose logs --tail=200 backend | grep -A 5 -B 5 "req.body" | tail -30
echo ""

echo "📦 9. VERIFICAR MIDDLEWARE EXPRESS"
echo "============================================"
echo "Testando se express.json() está funcionando..."
TEST_PARSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","senha":"123456"}' \
  -v 2>&1 | grep -E "(Content-Type|Content-Length)")
echo "$TEST_PARSE"
echo ""

echo "🔐 10. VERIFICAR BANCO DE DADOS"
echo "============================================"
echo "Testando conexão com MySQL..."
docker-compose exec -T mysql mysql -u root -p\${MYSQL_ROOT_PASSWORD} -e "SELECT 1;" 2>&1 | grep -q "1" && \
  echo -e "${GREEN}✅ MySQL respondendo${NC}" || \
  echo -e "${RED}❌ MySQL não está respondendo${NC}"

echo ""
echo "Verificando se existe usuário de teste no banco..."
docker-compose exec -T mysql mysql -u root -p\${MYSQL_ROOT_PASSWORD} crm_db \
  -e "SELECT id, email, ativo FROM consultores WHERE email='vendas@vipseg.org';" 2>/dev/null
echo ""

echo "🧪 11. TESTE COM DIFERENTES PAYLOADS"
echo "============================================"

# Teste 1: Payload válido
echo -e "${BLUE}Teste 1: Payload válido${NC}"
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendas@vipseg.org","senha":"123456"}' \
  | jq '.' 2>/dev/null || echo "Erro ao parsear JSON"
echo ""

# Teste 2: Payload sem email
echo -e "${BLUE}Teste 2: Payload sem email (deve retornar erro específico)${NC}"
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"senha":"123456"}' \
  | jq '.' 2>/dev/null || echo "Erro ao parsear JSON"
echo ""

# Teste 3: Payload sem senha
echo -e "${BLUE}Teste 3: Payload sem senha (deve retornar erro específico)${NC}"
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendas@vipseg.org"}' \
  | jq '.' 2>/dev/null || echo "Erro ao parsear JSON"
echo ""

# Teste 4: Payload vazio
echo -e "${BLUE}Teste 4: Payload vazio${NC}"
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{}' \
  | jq '.' 2>/dev/null || echo "Erro ao parsear JSON"
echo ""

echo "📋 12. VERIFICAR VARIÁVEIS DE AMBIENTE"
echo "============================================"
docker-compose exec -T backend env | grep -E "(JWT_SECRET|MYSQL|PORT|NODE_ENV)" | head -10
echo ""

echo "🔍 13. LOGS EM TEMPO REAL (últimos 10 segundos)"
echo "============================================"
echo "Monitorando logs enquanto faz nova requisição..."
(docker-compose logs -f backend &) &
LOGS_PID=$!
sleep 2

echo "Fazendo requisição de teste..."
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendas@vipseg.org","senha":"123456"}' > /dev/null

sleep 3
kill $LOGS_PID 2>/dev/null
echo ""

echo "📊 14. RESUMO DO DIAGNÓSTICO"
echo "============================================"

# Verificar status geral
BACKEND_UP=$(docker-compose ps backend | grep -c "Up")
MYSQL_UP=$(docker-compose ps mysql | grep -c "Up")
HEALTH_OK=$([ -n "$HEALTH_RESPONSE" ] && echo 1 || echo 0)

echo -e "${BLUE}Backend Status:${NC} $([ "$BACKEND_UP" -eq 1 ] && echo "${GREEN}✅ Running${NC}" || echo "${RED}❌ Down${NC}")"
echo -e "${BLUE}MySQL Status:${NC} $([ "$MYSQL_UP" -eq 1 ] && echo "${GREEN}✅ Running${NC}" || echo "${RED}❌ Down${NC}")"
echo -e "${BLUE}Health Check:${NC} $([ "$HEALTH_OK" -eq 1 ] && echo "${GREEN}✅ OK${NC}" || echo "${RED}❌ Failed${NC}")"
echo -e "${BLUE}Login Test:${NC} $([ "$HTTP_CODE" = "200" ] && echo "${GREEN}✅ OK${NC}" || echo "${RED}❌ Failed (HTTP $HTTP_CODE)${NC}")"
echo ""

echo "💡 15. RECOMENDAÇÕES"
echo "============================================"

if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${RED}❌ ERRO 400 DETECTADO${NC}"
    echo ""
    echo "Possíveis causas:"
    echo "1. Backend não está recebendo o body da requisição"
    echo "2. Middleware express.json() não está funcionando"
    echo "3. Validação no controller está rejeitando a requisição"
    echo ""
    echo "Ações recomendadas:"
    echo "• Verificar logs acima para mensagens específicas"
    echo "• Adicionar logs no authController.ts para debug"
    echo "• Verificar se Content-Type está correto"
    echo "• Testar com Postman/Insomnia direto no servidor"
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${YELLOW}⚠️  ERRO 401 - Credenciais inválidas${NC}"
    echo "• Verifique se o usuário existe no banco"
    echo "• Verifique se a senha está correta"
    echo "• Verifique hash da senha no banco"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ LOGIN FUNCIONANDO NO BACKEND!${NC}"
    echo ""
    echo "O backend está funcionando corretamente."
    echo "O problema pode estar no frontend ou cache do navegador."
    echo ""
    echo "Ações recomendadas:"
    echo "• Limpar cache do navegador (Ctrl+Shift+Delete)"
    echo "• Fazer hard refresh (Ctrl+F5)"
    echo "• Verificar se frontend foi reconstruído"
    echo "• Testar em modo anônimo/privado"
else
    echo -e "${YELLOW}⚠️  Status inesperado: $HTTP_CODE${NC}"
    echo "• Verificar logs do backend acima"
    echo "• Verificar se todas as dependências estão instaladas"
fi

echo ""
echo "🔧 Para mais informações, execute:"
echo "   docker-compose logs -f backend"
echo ""
echo "============================================"
echo "Debug concluído!"
echo "============================================"
