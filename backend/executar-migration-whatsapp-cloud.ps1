# Script para executar migration do WhatsApp Cloud API no Windows
# Autor: Sistema CRM
# Data: 2025-11-14

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Migration: WhatsApp Cloud API" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo .env existe
if (-Not (Test-Path ".env")) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, crie o arquivo .env com as configurações do banco de dados." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Ler variáveis do .env
Write-Host "📄 Lendo configurações do arquivo .env..." -ForegroundColor Yellow
$envContent = Get-Content ".env" -Raw
$dbHost = if ($envContent -match 'DB_HOST=(.+)') { $matches[1].Trim() } else { "localhost" }
$dbPort = if ($envContent -match 'DB_PORT=(.+)') { $matches[1].Trim() } else { "3306" }
$dbName = if ($envContent -match 'DB_NAME=(.+)') { $matches[1].Trim() } else { "" }
$dbUser = if ($envContent -match 'DB_USER=(.+)') { $matches[1].Trim() } else { "root" }
$dbPass = if ($envContent -match 'DB_PASSWORD=(.+)') { $matches[1].Trim() } else { "" }

Write-Host "✅ Configurações carregadas:" -ForegroundColor Green
Write-Host "   Host: $dbHost" -ForegroundColor Gray
Write-Host "   Port: $dbPort" -ForegroundColor Gray
Write-Host "   Database: $dbName" -ForegroundColor Gray
Write-Host "   User: $dbUser" -ForegroundColor Gray
Write-Host ""

if (-Not $dbName) {
    Write-Host "❌ DB_NAME não encontrado no arquivo .env!" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

# Perguntar senha se não estiver no .env
if (-Not $dbPass) {
    $securePass = Read-Host "Digite a senha do banco de dados" -AsSecureString
    $dbPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
    )
}

Write-Host "🚀 Executando migration..." -ForegroundColor Yellow
Write-Host ""

# Verificar se o arquivo de migration existe
if (-Not (Test-Path "migrations/15-whatsapp-cloud-api.sql")) {
    Write-Host "❌ Arquivo de migration não encontrado: migrations/15-whatsapp-cloud-api.sql" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

# Executar migration usando mysql CLI
try {
    $mysqlCmd = "mysql"
    
    # Verificar se mysql está disponível
    $mysqlExists = Get-Command mysql -ErrorAction SilentlyContinue
    if (-Not $mysqlExists) {
        Write-Host "❌ MySQL CLI não encontrado no PATH!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Opções:" -ForegroundColor Yellow
        Write-Host "1. Instale o MySQL CLI" -ForegroundColor Gray
        Write-Host "2. Adicione o MySQL ao PATH" -ForegroundColor Gray
        Write-Host "3. Execute a migration manualmente pelo phpMyAdmin ou outro cliente" -ForegroundColor Gray
        Write-Host ""
        pause
        exit 1
    }
    
    # Executar comando
    $command = "mysql -h $dbHost -P $dbPort -u $dbUser -p$dbPass $dbName < migrations/15-whatsapp-cloud-api.sql"
    
    # Note: Por segurança, vamos usar um arquivo temporário para a senha
    $tempFile = [System.IO.Path]::GetTempFileName()
    Set-Content -Path $tempFile -Value "[client]`npassword=$dbPass"
    
    $result = & mysql --defaults-extra-file=$tempFile -h $dbHost -P $dbPort -u $dbUser $dbName -e "source migrations/15-whatsapp-cloud-api.sql" 2>&1
    
    # Remover arquivo temporário
    Remove-Item $tempFile -Force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Green
        Write-Host "  ✅ Migration executada com sucesso!" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "As seguintes colunas foram adicionadas à tabela 'consultores':" -ForegroundColor Cyan
        Write-Host "  • whatsapp_access_token" -ForegroundColor Gray
        Write-Host "  • whatsapp_phone_number_id" -ForegroundColor Gray
        Write-Host "  • whatsapp_business_account_id" -ForegroundColor Gray
        Write-Host "  • whatsapp_webhook_verify_token" -ForegroundColor Gray
        Write-Host ""
        Write-Host "📚 Próximos passos:" -ForegroundColor Yellow
        Write-Host "  1. Configure sua conta no Facebook Developers" -ForegroundColor Gray
        Write-Host "  2. Obtenha o Access Token e Phone Number ID" -ForegroundColor Gray
        Write-Host "  3. Configure no frontend do CRM" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Consulte o arquivo MIGRACAO-WHATSAPP-API-OFICIAL.md para instruções detalhadas." -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Erro ao executar migration!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Erro: $result" -ForegroundColor Red
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao executar migration: $_" -ForegroundColor Red
    Write-Host ""
}

pause
