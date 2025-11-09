# Script PowerShell para executar a migration de mensagens e áudios pré-definidos

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Executando Migration: Mensagens Pré-Definidas" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Carregar variáveis de ambiente do arquivo .env
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

# Ler o arquivo SQL
$sqlContent = Get-Content -Path "migrations/13-mensagens-audios-predefinidos.sql" -Raw

# Executar migration usando mysql
try {
    $sqlContent | mysql -h "$env:DB_HOST" -u "$env:DB_USER" -p"$env:DB_PASSWORD" "$env:DB_NAME"
    Write-Host ""
    Write-Host "✅ Migration executada com sucesso!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao executar migration!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
}
