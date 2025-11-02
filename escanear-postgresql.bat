@echo off
REM Script para escanear referências ao PostgreSQL no repositório
REM Uso: escanear-postgresql.bat

echo ========================================
echo   ESCANEANDO REPOSITÓRIO - PostgreSQL
echo ========================================
echo.

REM Procurar por "postgres"
echo Buscando por: 'postgres'
echo ----------------------------------------
findstr /S /I /N /C:"postgres" *.* 2>nul | findstr /V /I "node_modules .git dist build .next uploads .log .lock"
echo.

REM Procurar por "pg"
echo Buscando por: 'pg'
echo ----------------------------------------
findstr /S /I /N /C:"pg" *.* 2>nul | findstr /V /I "node_modules .git dist build .next uploads .log .lock"
echo.

REM Procurar por "5432"
echo Buscando por: '5432'
echo ----------------------------------------
findstr /S /I /N /C:"5432" *.* 2>nul | findstr /V /I "node_modules .git dist build .next uploads .log .lock"
echo.

REM Procurar por "uuid_generate"
echo Buscando por: 'uuid_generate'
echo ----------------------------------------
findstr /S /I /N /C:"uuid_generate" *.* 2>nul | findstr /V /I "node_modules .git dist build .next uploads .log .lock"
echo.

echo ========================================
echo   ESCANEAMENTO CONCLUÍDO
echo ========================================
pause
