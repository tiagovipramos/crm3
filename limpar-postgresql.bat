@echo off
echo ========================================
echo LIMPEZA DE ARQUIVOS POSTGRESQL
echo ========================================
echo.

echo Removendo schemas PostgreSQL...
if exist "backend\migrations\schema.sql" (
    del "backend\migrations\schema.sql"
    echo [OK] Removido: backend\migrations\schema.sql
) else (
    echo [SKIP] Arquivo nao encontrado: backend\migrations\schema.sql
)

if exist "backend\migrations\schema-indicadores.sql" (
    del "backend\migrations\schema-indicadores.sql"
    echo [OK] Removido: backend\migrations\schema-indicadores.sql
) else (
    echo [SKIP] Arquivo nao encontrado: backend\migrations\schema-indicadores.sql
)

echo.
echo Removendo wrapper de compatibilidade...
if exist "backend\src\config\db-helper.ts" (
    del "backend\src\config\db-helper.ts"
    echo [OK] Removido: backend\src\config\db-helper.ts
) else (
    echo [SKIP] Arquivo nao encontrado: backend\src\config\db-helper.ts
)

echo.
echo ========================================
echo LIMPEZA CONCLUIDA!
echo ========================================
echo.
echo Proximos passos:
echo 1. Atualize os imports nos controllers
echo 2. Execute: npm run verificar-postgresql
echo.
pause
