#!/bin/bash

echo "=========================================="
echo "  LISTANDO USUÁRIOS DO BANCO DE DADOS"
echo "=========================================="
echo ""

# Usar aspas simples para evitar interpretação do bash
docker exec crm-mysql mysql -u root -p'Crm@VPS2025!Secure#ProdDB' -e "SELECT id, nome, email, tipo FROM protecar_crm.consultores;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Usuários listados com sucesso!"
    echo ""
    echo "Para testar o login, use um dos emails acima com a senha correta."
    echo ""
    echo "Exemplo de teste:"
    echo "curl -X POST https://boraindicar.com.br/api/auth/login \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{\"email\":\"EMAIL_ACIMA\",\"senha\":\"SENHA_CORRETA\"}'"
else
    echo "✗ Erro ao conectar ao banco de dados"
fi
