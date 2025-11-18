# ============================================
# Script de Remoção Completa do Baileys
# Mantém apenas WhatsApp Cloud API Oficial
# PowerShell - Windows
# ============================================

Write-Host "🗑️  INICIANDO REMOÇÃO COMPLETA DO BAILEYS..." -ForegroundColor Yellow
Write-Host ""

# ============================================
# 1. REMOVER ARQUIVOS DO BAILEYS
# ============================================
Write-Host "📁 Removendo arquivos do Baileys..." -ForegroundColor Cyan

# Services
if (Test-Path "backend\src\services\whatsappService.ts") {
    Remove-Item "backend\src\services\whatsappService.ts" -Force
    Write-Host "✅ Removido: whatsappService.ts" -ForegroundColor Green
}

if (Test-Path "backend\src\services\whatsappValidationService.ts") {
    Remove-Item "backend\src\services\whatsappValidationService.ts" -Force
    Write-Host "✅ Removido: whatsappValidationService.ts" -ForegroundColor Green
}

# Controllers
if (Test-Path "backend\src\controllers\whatsappController.ts") {
    Remove-Item "backend\src\controllers\whatsappController.ts" -Force
    Write-Host "✅ Removido: whatsappController.ts" -ForegroundColor Green
}

# Routes
if (Test-Path "backend\src\routes\whatsapp.ts") {
    Remove-Item "backend\src\routes\whatsapp.ts" -Force
    Write-Host "✅ Removido: whatsapp.ts (routes)" -ForegroundColor Green
}

# Frontend Components
if (Test-Path "components\WhatsAppQRModal.tsx") {
    Remove-Item "components\WhatsAppQRModal.tsx" -Force
    Write-Host "✅ Removido: WhatsAppQRModal.tsx" -ForegroundColor Green
}

Write-Host ""

# ============================================
# 2. REMOVER PASTAS DE SESSÃO DO BAILEYS
# ============================================
Write-Host "📁 Removendo pastas de sessão do Baileys..." -ForegroundColor Cyan

# Remover pasta auth_sessions
if (Test-Path "backend\auth_sessions") {
    Remove-Item "backend\auth_sessions" -Recurse -Force
    Write-Host "✅ Removido: backend\auth_sessions\" -ForegroundColor Green
}

# Remover pastas auth_* na raiz do backend
Get-ChildItem -Path "backend" -Filter "auth_*" -Directory | ForEach-Object {
    Remove-Item $_.FullName -Recurse -Force
    Write-Host "✅ Removido: $($_.FullName)" -ForegroundColor Green
}

Write-Host ""

# ============================================
# 3. REMOVER DEPENDÊNCIAS DO PACKAGE.JSON
# ============================================
Write-Host "📦 Removendo dependências do Baileys do package.json..." -ForegroundColor Cyan

Set-Location backend

# Remover dependências usando npm
npm uninstall baileys @hapi/boom qrcode qrcode-terminal 2>$null

Write-Host "✅ Dependências do Baileys removidas" -ForegroundColor Green
Write-Host ""

Set-Location ..

# ============================================
# 4. RESUMO
# ============================================
Write-Host "✅ REMOÇÃO COMPLETA CONCLUÍDA!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 ARQUIVOS REMOVIDOS:" -ForegroundColor Cyan
Write-Host "   • backend/src/services/whatsappService.ts"
Write-Host "   • backend/src/services/whatsappValidationService.ts"
Write-Host "   • backend/src/controllers/whatsappController.ts"
Write-Host "   • backend/src/routes/whatsapp.ts"
Write-Host "   • components/WhatsAppQRModal.tsx"
Write-Host "   • backend/auth_sessions/ (e todas subpastas)"
Write-Host ""
Write-Host "📦 DEPENDÊNCIAS REMOVIDAS:" -ForegroundColor Cyan
Write-Host "   • baileys"
Write-Host "   • @hapi/boom"
Write-Host "   • qrcode"
Write-Host "   • qrcode-terminal"
Write-Host ""
Write-Host "✅ ARQUIVOS ATUALIZADOS:" -ForegroundColor Cyan
Write-Host "   • backend/src/controllers/mensagensController.ts"
Write-Host "   • backend/src/server.ts"
Write-Host ""
Write-Host "🎉 Sistema agora usa APENAS WhatsApp Cloud API Oficial!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Verificar compilação: cd backend && npm run build"
Write-Host "2. Testar servidor: cd backend && npm run dev"
Write-Host "3. Configurar WhatsApp Cloud API no frontend"
Write-Host ""
