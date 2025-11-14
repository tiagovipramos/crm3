# Script para corrigir API_URL em todos os componentes
# Adicionar /api no final do URL

Write-Host "Corrigindo API_URL em todos os componentes..." -ForegroundColor Cyan

$arquivos = @(
    "components\views\FollowUpView.tsx",
    "components\admin\MensagensPredefinidasPanel.tsx",
    "components\admin\views\ConfiguracoesAdminView.tsx",
    "components\MensagensPredefinidasChatPanel.tsx",
    "store\useIndicadorStore.ts",
    "store\useAdminStore.ts"
)

foreach ($arquivo in $arquivos) {
    $caminhoCompleto = Join-Path $PSScriptRoot $arquivo
    
    if (Test-Path $caminhoCompleto) {
        Write-Host "  Corrigindo: $arquivo" -ForegroundColor Yellow
        
        $conteudo = Get-Content $caminhoCompleto -Raw -Encoding UTF8
        $modificado = $false
        
        # Substituir API_URL sem /api
        if ($conteudo -match "const API_URL = process\.env\.NEXT_PUBLIC_API_URL \|\| 'http://localhost:3001';") {
            $conteudo = $conteudo -replace "const API_URL = process\.env\.NEXT_PUBLIC_API_URL \|\| 'http://localhost:3001';", "const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';"
            Write-Host "    OK - Corrigido API_URL" -ForegroundColor Green
            $modificado = $true
        }
        
        # Substituir API_BASE_URL sem /api
        if ($conteudo -match "const API_BASE_URL = process\.env\.NEXT_PUBLIC_API_URL \|\| 'http://localhost:3001';") {
            $conteudo = $conteudo -replace "const API_BASE_URL = process\.env\.NEXT_PUBLIC_API_URL \|\| 'http://localhost:3001';", "const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';"
            Write-Host "    OK - Corrigido API_BASE_URL" -ForegroundColor Green
            $modificado = $true
        }
        
        # Salvar arquivo se foi modificado
        if ($modificado) {
            [System.IO.File]::WriteAllText($caminhoCompleto, $conteudo, [System.Text.UTF8Encoding]::new($false))
        } else {
            Write-Host "    Nenhuma alteracao necessaria" -ForegroundColor Gray
        }
    } else {
        Write-Host "  Arquivo nao encontrado: $arquivo" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Correcao concluida!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "   1. Reiniciar o frontend (npm run dev)" -ForegroundColor White
Write-Host "   2. Testar as funcionalidades que estavam com erro 500" -ForegroundColor White
