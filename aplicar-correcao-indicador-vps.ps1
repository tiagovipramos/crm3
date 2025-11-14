# Script PowerShell para aplicar correcao do erro ao cadastrar indicador no VPS
# Copia o arquivo corrigido diretamente para o VPS

Write-Host "=========================================="
Write-Host "CORRECAO: Erro ao Cadastrar Indicador" -ForegroundColor Cyan
Write-Host "=========================================="
Write-Host ""

$VPS_USER = "root"
$VPS_HOST = "191.252.92.202"
$VPS_PATH = "/root/crm/backend/src/controllers"
$LOCAL_FILE = "backend\src\controllers\adminController.ts"

Write-Host "Verificando arquivo local..." -ForegroundColor Yellow

if (!(Test-Path $LOCAL_FILE)) {
    Write-Host "Erro: Arquivo nao encontrado: $LOCAL_FILE" -ForegroundColor Red
    exit 1
}

Write-Host "Arquivo encontrado!" -ForegroundColor Green
Write-Host ""

Write-Host "Copiando arquivo corrigido para o VPS..." -ForegroundColor Yellow
& scp $LOCAL_FILE "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/adminController.ts"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao copiar arquivo para o VPS" -ForegroundColor Red
    Write-Host "Verifique sua conexao SSH e tente novamente" -ForegroundColor Yellow
    exit 1
}

Write-Host "Arquivo copiado com sucesso!" -ForegroundColor Green
Write-Host ""

Write-Host "Reiniciando backend no VPS..." -ForegroundColor Yellow

$commands = "cd /root/crm && docker-compose restart backend && sleep 3 && docker-compose logs --tail=20 backend"

& ssh "${VPS_USER}@${VPS_HOST}" $commands

Write-Host ""
Write-Host "=========================================="
Write-Host "PROCESSO CONCLUIDO!" -ForegroundColor Green
Write-Host "=========================================="
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Acesse o painel admin em https://admin.boraindicar.com.br"
Write-Host "2. Tente cadastrar um novo indicador"
Write-Host "3. Verifique se nao ha mais erros no console"
Write-Host ""
