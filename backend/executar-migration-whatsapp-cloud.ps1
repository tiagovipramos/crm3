# Script PowerShell para executar migration 15 - WhatsApp Business Cloud API
# Data: 14/11/2025

Write-Host "🚀 ============================================" -ForegroundColor Cyan
Write-Host "🚀  Executando Migration 15" -ForegroundColor Cyan
Write-Host "🚀  WhatsApp Business Cloud API" -ForegroundColor Cyan
Write-Host "🚀 ============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o container MySQL está rodando
$containerRunning = docker ps | Select-String "crm-mysql"

if (-not $containerRunning) {
    Write-Host "❌ Erro: Container MySQL não está rodando!" -ForegroundColor Red
    Write-Host "Execute: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "📊 Conectando ao banco de dados..." -ForegroundColor White
Write-Host ""

# Executar a migration
Get-Content "migrations\15-whatsapp-cloud-api.sql" | docker exec -i crm-mysql mysql -uroot -p'Crm@VPS2025!Secure#ProdDB' protecar_crm

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ ============================================" -ForegroundColor Green
    Write-Host "✅  Migration 15 executada com sucesso!" -ForegroundColor Green
    Write-Host "✅ ============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Colunas WhatsApp Cloud API adicionadas:" -ForegroundColor White
    Write-Host "   - whatsapp_access_token" -ForegroundColor Gray
    Write-Host "   - whatsapp_phone_number_id" -ForegroundColor Gray
    Write-Host "   - whatsapp_business_account_id" -ForegroundColor Gray
    Write-Host "   - whatsapp_webhook_verify_token" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔄 Agora reinicie o backend: docker-compose restart backend" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ ============================================" -ForegroundColor Red
    Write-Host "❌  Erro ao executar migration!" -ForegroundColor Red
    Write-Host "❌ ============================================" -ForegroundColor Red
    Write-Host ""
    exit 1
}
