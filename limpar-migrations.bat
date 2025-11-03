@echo off
echo Limpando arquivos de migrations problematicos...
echo.

cd backend\migrations

echo Removendo arquivos ALTER TABLE...
del /Q adicionar-campos-veiculo.sql 2>nul
del /Q adicionar-coluna-ativo-consultores.sql 2>nul
del /Q adicionar-coluna-avatar-indicadores.sql 2>nul
del /Q adicionar-coluna-created-by-indicadores.sql 2>nul
del /Q adicionar-coluna-created-by.sql 2>nul
del /Q adicionar-coluna-notas-internas-simples.sql 2>nul
del /Q adicionar-coluna-notas-internas.sql 2>nul
del /Q adicionar-coluna-numero-whatsapp.sql 2>nul
del /Q adicionar-coluna-role.sql 2>nul
del /Q adicionar-coluna-sistema-online.sql 2>nul
del /Q adicionar-coluna-whatsapp-message-id.sql 2>nul
del /Q adicionar-lootbox-vendas.sql 2>nul
del /Q adicionar-tabela-tarefas.sql 2>nul
del /Q atualizar-senha.sql 2>nul
del /Q corrigir-tabela-tarefas.sql 2>nul
del /Q create-database.sql 2>nul
del /Q fix-admin-login.sql 2>nul
del /Q LIMPAR-DUPLICATAS-MANUALMENTE.sql 2>nul
del /Q recriar-registro-audio.sql 2>nul
del /Q remover-campanhas.sql 2>nul

echo.
echo Arquivos mantidos (schemas principais):
dir /B schema-*.sql
dir /B inserir-admin.sql

echo.
echo Limpeza concluida!
echo.
echo Agora execute:
echo 1. git add backend/migrations/
echo 2. git commit -m "fix: manter apenas schemas principais nas migrations"
echo 3. git push
echo.

cd ..\..
pause
