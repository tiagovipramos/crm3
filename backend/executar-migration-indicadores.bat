@echo off
REM Script para executar a migration de indicadores e saques

echo ===================================
echo Executando Migration de Indicadores
echo ===================================

REM Carregar variáveis de ambiente
if exist .env (
    for /f "usebackq tokens=*" %%a in (".env") do (
        set %%a
    )
)

REM Executar a migration
docker exec -i crm-backend-1 mysql -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% < migrations/03-indicadores-saques.sql

if %errorlevel% equ 0 (
    echo Sucesso: Migration executada com sucesso!
) else (
    echo Erro: Falha ao executar migration
    exit /b 1
)

echo ===================================
echo Migration concluida!
echo ===================================
pause
