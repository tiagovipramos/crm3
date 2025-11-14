#!/bin/bash

# Script para criar usuário de teste no banco

echo "🔐 ============================================"
echo "🔐  CRIAR USUÁRIO DE TESTE"
echo "🔐 ============================================"
echo ""

cd ~/crm || exit 1

echo "📋 1. VERIFICAR SENHA DO MYSQL"
echo "============================================"
echo "Lendo senha do arquivo .env..."
MYSQL_PASSWORD=$(grep "MYSQL_ROOT_PASSWORD=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
echo "Senha encontrada: ${MYSQL_PASSWORD:0:5}****"
echo ""

echo "📊 2. LISTAR USUÁRIOS EXISTENTES"
echo "============================================"
docker-compose exec -T mysql mysql -u root -p"$MYSQL_PASSWORD" crm_db \
  -e "SELECT id, email, nome, ativo FROM consultores;" 2>/dev/null || echo "Erro ao conectar no MySQL"
echo ""

echo "👤 3. CRIAR USUÁRIO vendas@vipseg.org"
echo "============================================"
# Hash bcrypt para senha: 123456
# Gerado com: bcrypt.hashSync('123456', 10)
SENHA_HASH='$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

echo "Criando usuário com senha: 123456"
docker-compose exec -T mysql mysql -u root -p"$MYSQL_PASSWORD" crm_db << EOF
-- Deletar se já existir
DELETE FROM consultores WHERE email='vendas@vipseg.org';

-- Criar novo usuário
INSERT INTO consultores (id, nome, email, telefone, senha, ativo, data_criacao, ultimo_acesso)
VALUES (
    UUID(),
    'Vendas VipSeg',
    'vendas@vipseg.org',
    '11999999999',
    '$SENHA_HASH',
    1,
    NOW(),
    NOW()
);

SELECT 'Usuário criado com sucesso!' as resultado;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Usuário criado com sucesso!"
else
    echo ""
    echo "❌ Erro ao criar usuário"
fi
echo ""

echo "🧪 4. TESTAR LOGIN"
echo "============================================"
echo "Testando login com email: vendas@vipseg.org e senha: 123456"
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendas@vipseg.org","senha":"123456"}')

if echo "$RESPONSE" | grep -q "token"; then
    echo "✅ LOGIN FUNCIONANDO!"
    echo "Token recebido:"
    echo "$RESPONSE" | jq -r '.token' | head -c 50
    echo "..."
else
    echo "❌ Login falhou"
    echo "Resposta:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
fi
echo ""

echo "📋 5. VERIFICAR USUÁRIO CRIADO"
echo "============================================"
docker-compose exec -T mysql mysql -u root -p"$MYSQL_PASSWORD" crm_db \
  -e "SELECT id, email, nome, telefone, ativo, DATE_FORMAT(data_criacao, '%Y-%m-%d %H:%i') as criado FROM consultores WHERE email='vendas@vipseg.org';" 2>/dev/null
echo ""

echo "✅ ============================================"
echo "✅  CONCLUÍDO"
echo "✅ ============================================"
echo ""
echo "📝 Credenciais de acesso:"
echo "   Email: vendas@vipseg.org"
echo "   Senha: 123456"
echo ""
echo "🌐 Teste no navegador:"
echo "   1. Acesse: https://boraindicar.com.br"
echo "   2. Use as credenciais acima"
echo "   3. Limpe o cache antes (Ctrl+Shift+Delete)"
echo ""
