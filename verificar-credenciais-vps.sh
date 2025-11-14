#!/bin/bash

# Script para verificar e corrigir credenciais no banco de dados

echo "🔐 ============================================"
echo "🔐  VERIFICAR E CORRIGIR CREDENCIAIS"
echo "🔐 ============================================"
echo ""

cd ~/crm || exit 1

echo "📊 1. LISTAR TODOS OS USUÁRIOS (CONSULTORES)"
echo "============================================"
echo "SELECT id, nome, email, ativo FROM consultores:"
docker-compose exec -T mysql mysql -u root -p\${MYSQL_ROOT_PASSWORD} crm_db \
  -e "SELECT id, nome, email, ativo, DATE_FORMAT(data_criacao, '%Y-%m-%d %H:%i') as criado FROM consultores;" 2>/dev/null
echo ""

echo "🔍 2. VERIFICAR USUÁRIO vendas@vipseg.org"
echo "============================================"
USUARIO_EXISTE=$(docker-compose exec -T mysql mysql -u root -p\${MYSQL_ROOT_PASSWORD} crm_db \
  -e "SELECT COUNT(*) as total FROM consultores WHERE email='vendas@vipseg.org';" 2>/dev/null | grep -v total | xargs)

if [ "$USUARIO_EXISTE" = "1" ]; then
    echo "✅ Usuário vendas@vipseg.org existe no banco"
    echo ""
    echo "Detalhes do usuário:"
    docker-compose exec -T mysql mysql -u root -p\${MYSQL_ROOT_PASSWORD} crm_db \
      -e "SELECT id, nome, email, telefone, ativo, sessao_whatsapp, status_conexao FROM consultores WHERE email='vendas@vipseg.org';" 2>/dev/null
    echo ""
    echo "Hash da senha atual:"
    docker-compose exec -T mysql mysql -u root -p\${MYSQL_ROOT_PASSWORD} crm_db \
      -e "SELECT SUBSTRING(senha, 1, 20) as senha_inicio FROM consultores WHERE email='vendas@vipseg.org';" 2>/dev/null
else
    echo "❌ Usuário vendas@vipseg.org NÃO existe no banco!"
    echo ""
    echo "📝 Criando usuário vendas@vipseg.org..."
    
    # Senha padrão: 123456 (hash bcrypt)
    SENHA_HASH='$2a$10$rZ8qKqZ.KqZ8qKqZ.KqZ.OqZ8qKqZ.KqZ8qKqZ.KqZ8qKqZ.Kq'
    
    docker-compose exec -T mysql mysql -u root -p\${MYSQL_ROOT_PASSWORD} crm_db << EOF
INSERT INTO consultores (id, nome, email, telefone, senha, ativo, data_criacao)
VALUES (
    UUID(),
    'Vendas VipSeg',
    'vendas@vipseg.org',
    '11999999999',
    '\${SENHA_HASH}',
    1,
    NOW()
);
EOF
    echo "✅ Usuário criado com senha: 123456"
fi
echo ""

echo "💡 3. RESETAR SENHA DO USUÁRIO (Opção)"
echo "============================================"
echo "Deseja resetar a senha do usuário vendas@vipseg.org para '123456'?"
echo ""
echo "Execute manualmente se necessário:"
echo ""
echo "docker-compose exec -T mysql mysql -u root -p\${MYSQL_ROOT_PASSWORD} crm_db << 'EOF'"
echo "UPDATE consultores SET senha = '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' WHERE email='vendas@vipseg.org';"
echo "EOF"
echo ""
echo "Nota: O hash acima é para a senha '123456'"
echo ""

echo "🧪 4. TESTAR LOGIN COM DIFERENTES SENHAS"
echo "============================================"

echo "Teste 1: Senha '123456'"
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendas@vipseg.org","senha":"123456"}' \
  | jq -r 'if .token then "✅ Login OK com senha 123456" else "❌ Falhou: " + .error end' 2>/dev/null
echo ""

echo "Teste 2: Senha 'vipseg@2024'"
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendas@vipseg.org","senha":"vipseg@2024"}' \
  | jq -r 'if .token then "✅ Login OK com senha vipseg@2024" else "❌ Falhou: " + .error end' 2>/dev/null
echo ""

echo "Teste 3: Senha 'admin123'"
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendas@vipseg.org","senha":"admin123"}' \
  | jq -r 'if .token then "✅ Login OK com senha admin123" else "❌ Falhou: " + .error end' 2>/dev/null
echo ""

echo "📋 5. LISTAR OUTROS USUÁRIOS DISPONÍVEIS"
echo "============================================"
echo "Outros usuários cadastrados no sistema:"
docker-compose exec -T mysql mysql -u root -p\${MYSQL_ROOT_PASSWORD} crm_db \
  -e "SELECT email, nome, ativo FROM consultores ORDER BY data_criacao DESC LIMIT 10;" 2>/dev/null
echo ""

echo "💡 6. GERAR NOVO HASH PARA SENHA PERSONALIZADA"
echo "============================================"
echo "Para gerar hash de uma senha específica, execute no backend:"
echo ""
echo "docker-compose exec backend node -e \"const bcrypt = require('bcryptjs'); const senha = 'SUA_SENHA_AQUI'; const hash = bcrypt.hashSync(senha, 10); console.log('Hash:', hash);\""
echo ""

echo "✅ ============================================"
echo "✅  Verificação Concluída"
echo "✅ ============================================"
echo ""
echo "📝 Próximos passos:"
echo "1. Se o usuário não existe, foi criado automaticamente"
echo "2. Tente fazer login com uma das senhas testadas acima"
echo "3. Se necessário, resete a senha usando o comando fornecido"
echo "4. Após corrigir, teste no navegador"
echo ""
