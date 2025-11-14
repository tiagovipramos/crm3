#!/bin/bash

# Script para aplicar correção do erro ao cadastrar indicador no VPS
# Corrige o problema do UUID vs insertId

echo "=========================================="
echo "CORREÇÃO: Erro ao Cadastrar Indicador"
echo "=========================================="
echo ""

VPS_USER="root"
VPS_HOST="191.252.92.202"
VPS_PATH="/root/crm"

echo "🔧 Conectando ao VPS..."
echo ""

ssh $VPS_USER@$VPS_HOST << 'ENDSSH'

echo "📁 Navegando para o diretório do projeto..."
cd /root/crm

echo ""
echo "💾 Fazendo backup do arquivo atual..."
cp backend/src/controllers/adminController.ts backend/src/controllers/adminController.ts.backup-$(date +%Y%m%d_%H%M%S)

echo ""
echo "📝 Aplicando correção na função criarIndicador..."

# Criar arquivo temporário com a correção
cat > /tmp/fix-indicador.sed << 'EOF'
/^export const criarIndicador/,/^};$/ {
    /const \[result\]: any = await connection\.query/,/\[nome, email, senhaHash, telefone, cpf, createdBy\]/ {
        s/const \[result\]: any = await connection\.query(/\/\/ Gerar UUID manualmente\n      const indicadorId = crypto.randomUUID();\n      \n      await connection.query(/
        s/INSERT INTO indicadores (nome, email, senha, telefone, cpf, created_by)/INSERT INTO indicadores (id, nome, email, senha, telefone, cpf, created_by)/
        s/VALUES (?, ?, ?, ?, ?, ?)/VALUES (?, ?, ?, ?, ?, ?, ?)/
        s/\[nome, email, senhaHash, telefone, cpf, createdBy\]/[indicadorId, nome, email, senhaHash, telefone, cpf, createdBy]/
    }
    /id: result\.insertId/ {
        s/id: result\.insertId/id: indicadorId/
    }
}
EOF

# Aplicar a correção
sed -i -f /tmp/fix-indicador.sed backend/src/controllers/adminController.ts

echo "✅ Correção aplicada!"
echo ""
echo "🔄 Verificando se o Docker está rodando..."
if docker ps | grep -q crm-backend; then
    echo "🔄 Reiniciando o container backend..."
    docker-compose restart backend
    echo "✅ Backend reiniciado!"
else
    echo "⚠️  Container não está rodando. Iniciando..."
    docker-compose up -d backend
    echo "✅ Backend iniciado!"
fi

echo ""
echo "📋 Verificando logs do backend..."
sleep 3
docker-compose logs --tail=20 backend

echo ""
echo "=========================================="
echo "✅ CORREÇÃO APLICADA COM SUCESSO!"
echo "=========================================="
echo ""
echo "O erro ao cadastrar indicador foi corrigido."
echo "Agora o sistema gera o UUID manualmente antes do INSERT."
echo ""
echo "Teste criando um novo indicador pelo painel admin."

ENDSSH

echo ""
echo "✅ Script executado com sucesso no VPS!"
echo ""
echo "🧪 PRÓXIMOS PASSOS:"
echo "1. Acesse o painel admin"
echo "2. Tente cadastrar um novo indicador"
echo "3. Verifique se não há mais erros no console"
