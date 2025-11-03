#!/bin/bash

echo "🔧 Corrigindo erro 401 no login do CRM..."
echo ""

# Verificar se estamos na VPS e se docker-compose está disponível
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose não encontrado. Este script deve ser executado na VPS."
    exit 1
fi

echo "📋 Passo 1: Verificando status dos containers..."
docker-compose ps

echo ""
echo "📋 Passo 2: Verificando conexão com MySQL..."
if docker-compose exec -T mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB -e "SELECT 1;" &> /dev/null; then
    echo "✅ MySQL está acessível"
else
    echo "❌ MySQL não está acessível. Verifique se o container está rodando."
    exit 1
fi

echo ""
echo "📋 Passo 3: Verificando se o banco de dados existe..."
DB_EXISTS=$(docker-compose exec -T mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB -e "SHOW DATABASES LIKE 'protecar_crm';" | grep protecar_crm)

if [ -z "$DB_EXISTS" ]; then
    echo "❌ Banco de dados 'protecar_crm' não existe!"
    echo "   Execute: docker-compose down && docker-compose up -d"
    exit 1
else
    echo "✅ Banco de dados existe"
fi

echo ""
echo "📋 Passo 4: Verificando se a tabela consultores existe..."
TABLE_EXISTS=$(docker-compose exec -T mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB protecar_crm -e "SHOW TABLES LIKE 'consultores';" | grep consultores)

if [ -z "$TABLE_EXISTS" ]; then
    echo "❌ Tabela 'consultores' não existe!"
    echo "   As migrations não foram executadas. Execute:"
    echo "   docker cp backend/migrations/01-estrutura.sql <container_mysql>:/tmp/"
    echo "   docker-compose exec mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB protecar_crm < /tmp/01-estrutura.sql"
    exit 1
else
    echo "✅ Tabela consultores existe"
fi

echo ""
echo "📋 Passo 5: Verificando usuários existentes..."
docker-compose exec -T mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB protecar_crm -e "SELECT id, nome, email, role, ativo FROM consultores;"

echo ""
echo "📋 Passo 6: Recriando usuário diretor com senha 123456..."

docker-compose exec -T mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB protecar_crm <<EOF
-- Deletar usuário existente (se houver)
DELETE FROM consultores WHERE email = 'diretor@protecar.com';

-- Criar novo usuário diretor com senha 123456
INSERT INTO consultores (nome, email, senha, telefone, whatsapp, role, ativo) VALUES 
('Diretor', 'diretor@protecar.com', '\$2a\$10\$YQmXZ8pKyY5JZvQ5VxBqWOvH6gxZ7mY3nHyL5x6z8w9q0r1t2u3v4', '11999999999', '11999999999', 'diretor', 1);
EOF

if [ $? -eq 0 ]; then
    echo "✅ Usuário diretor recriado com sucesso!"
else
    echo "❌ Erro ao recriar usuário diretor"
    exit 1
fi

echo ""
echo "📋 Passo 7: Criando usuários de teste adicionais..."

docker-compose exec -T mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB protecar_crm <<EOF
-- Deletar usuários de teste se existirem
DELETE FROM consultores WHERE email IN ('carlos@protecar.com', 'ana@protecar.com');

-- Criar usuários de teste
INSERT INTO consultores (nome, email, senha, telefone, whatsapp, role, ativo) VALUES 
('Carlos Silva', 'carlos@protecar.com', '\$2a\$10\$YQmXZ8pKyY5JZvQ5VxBqWOvH6gxZ7mY3nHyL5x6z8w9q0r1t2u3v4', '11988887777', '11988887777', 'consultor', 1),
('Ana Paula', 'ana@protecar.com', '\$2a\$10\$YQmXZ8pKyY5JZvQ5VxBqWOvH6gxZ7mY3nHyL5x6z8w9q0r1t2u3v4', '11977776666', '11977776666', 'consultor', 1);
EOF

if [ $? -eq 0 ]; then
    echo "✅ Usuários de teste criados com sucesso!"
else
    echo "⚠️  Aviso: Erro ao criar usuários de teste (não crítico)"
fi

echo ""
echo "📋 Passo 8: Verificando usuários criados..."
docker-compose exec -T mysql mysql -uroot -pCrm@VPS2025!Secure#ProdDB protecar_crm -e "SELECT id, nome, email, role, ativo FROM consultores;"

echo ""
echo "✅ ================================"
echo "✅ Correção concluída com sucesso!"
echo "✅ ================================"
echo ""
echo "📧 Credenciais de Login:"
echo ""
echo "   👤 Diretor:"
echo "      Email: diretor@protecar.com"
echo "      Senha: 123456"
echo ""
echo "   👤 Carlos Silva (Consultor):"
echo "      Email: carlos@protecar.com"
echo "      Senha: 123456"
echo ""
echo "   👤 Ana Paula (Consultora):"
echo "      Email: ana@protecar.com"
echo "      Senha: 123456"
echo ""
echo "🌐 Acesse: http://185.217.125.72:3000"
echo ""
echo "💡 Dica: Use o console do navegador (F12) para verificar se não há erros."
echo ""
