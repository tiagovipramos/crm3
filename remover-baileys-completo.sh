#!/bin/bash

# ============================================
# Script de Remoção Completa do Baileys
# Mantém apenas WhatsApp Cloud API Oficial
# ============================================

echo "🗑️  INICIANDO REMOÇÃO COMPLETA DO BAILEYS..."
echo ""

# ============================================
# 1. REMOVER ARQUIVOS DO BAILEYS
# ============================================
echo "📁 Removendo arquivos do Baileys..."

# Services
if [ -f "backend/src/services/whatsappService.ts" ]; then
    rm backend/src/services/whatsappService.ts
    echo "✅ Removido: whatsappService.ts"
fi

if [ -f "backend/src/services/whatsappValidationService.ts" ]; then
    rm backend/src/services/whatsappValidationService.ts
    echo "✅ Removido: whatsappValidationService.ts"
fi

# Controllers
if [ -f "backend/src/controllers/whatsappController.ts" ]; then
    rm backend/src/controllers/whatsappController.ts
    echo "✅ Removido: whatsappController.ts"
fi

# Routes
if [ -f "backend/src/routes/whatsapp.ts" ]; then
    rm backend/src/routes/whatsapp.ts
    echo "✅ Removido: whatsapp.ts (routes)"
fi

# Frontend Components
if [ -f "components/WhatsAppQRModal.tsx" ]; then
    rm components/WhatsAppQRModal.tsx
    echo "✅ Removido: WhatsAppQRModal.tsx"
fi

echo ""

# ============================================
# 2. REMOVER PASTAS DE SESSÃO DO BAILEYS
# ============================================
echo "📁 Removendo pastas de sessão do Baileys..."

# Remover pasta auth_sessions
if [ -d "backend/auth_sessions" ]; then
    rm -rf backend/auth_sessions
    echo "✅ Removido: backend/auth_sessions/"
fi

# Remover pastas auth_* na raiz do backend
for dir in backend/auth_*; do
    if [ -d "$dir" ]; then
        rm -rf "$dir"
        echo "✅ Removido: $dir"
    fi
done

echo ""

# ============================================
# 3. REMOVER DEPENDÊNCIAS DO PACKAGE.JSON
# ============================================
echo "📦 Removendo dependências do Baileys do package.json..."

cd backend

# Remover dependências usando npm
npm uninstall baileys @hapi/boom qrcode qrcode-terminal 2>/dev/null

echo "✅ Dependências do Baileys removidas"
echo ""

cd ..

# ============================================
# 4. CRIAR BACKUP DOS ARQUIVOS QUE SERÃO MODIFICADOS
# ============================================
echo "💾 Criando backups dos arquivos que serão modificados..."

cp backend/src/controllers/mensagensController.ts backend/src/controllers/mensagensController.ts.backup.baileys
cp backend/src/server.ts backend/src/server.ts.backup.baileys
cp components/views/ConfiguracoesView.tsx components/views/ConfiguracoesView.tsx.backup.baileys

echo "✅ Backups criados com extensão .backup.baileys"
echo ""

echo "✅ REMOÇÃO DE ARQUIVOS CONCLUÍDA!"
echo ""
echo "📝 PRÓXIMOS PASSOS MANUAIS:"
echo ""
echo "1. Editar backend/src/controllers/mensagensController.ts"
echo "   - Remover import de whatsappService"
echo "   - Remover detecção dual (useCloudApi)"
echo "   - Usar apenas whatsappCloudService"
echo ""
echo "2. Editar backend/src/server.ts"
echo "   - Remover import de whatsappService"
echo "   - Remover reconexão automática do Baileys"
echo "   - Remover setSocketIO do whatsappService"
echo ""
echo "3. Editar components/views/ConfiguracoesView.tsx"
echo "   - Remover opção de QR Code"
echo "   - Remover import de WhatsAppQRModal"
echo "   - Manter apenas opção de Cloud API"
echo ""
echo "Os backups foram salvos com extensão .backup.baileys"
echo ""
echo "Execute: ./atualizar-arquivos-cloud-only.sh para aplicar as modificações"
