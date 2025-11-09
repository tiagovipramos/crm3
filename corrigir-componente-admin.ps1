# Script CORRIGIDO para adicionar MensagensAudiosManager no ConfiguracoesAdminView

$file = "components/admin/views/ConfiguracoesAdminView.tsx"

Write-Host "Lendo arquivo..." -ForegroundColor Yellow
$lines = Get-Content $file -Encoding UTF8

Write-Host "Processando linhas..." -ForegroundColor Yellow

$newLines = @()
$importAdded = $false
$componentAdded = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Adicionar import após a linha do useAdminStore
    if ($line -match "import \{ useAdminStore \} from '@/store/useAdminStore';" -and -not $importAdded) {
        $newLines += $line
        $newLines += "import MensagensAudiosManager from '@/components/admin/MensagensAudiosManager';"
        $importAdded = $true
        Write-Host "  ✓ Import adicionado" -ForegroundColor Green
        continue
    }
    
    # Adicionar componente antes da última linha do arquivo
    if ($i -eq ($lines.Count - 1) -and -not $componentAdded) {
        # Adicionar componente antes da última linha
        $newLines += ""
        $newLines += "      {/* Gerenciamento de Mensagens e Áudios Pré-Definidos */}"
        $newLines += "      <MensagensAudiosManager "
        $newLines += "        token={token}"
        $newLines += "        onSuccess={(msg) => {"
        $newLines += "          setSuccess(msg);"
        $newLines += "          setTimeout(() => setSuccess(''), 3000);"
        $newLines += "        }}"
        $newLines += "        onError={(msg) => {"
        $newLines += "          setError(msg);"
        $newLines += "          setTimeout(() => setError(''), 3000);"
        $newLines += "        }}"
        $newLines += "      />"
        $componentAdded = $true
        Write-Host "  ✓ Componente adicionado" -ForegroundColor Green
    }
    
    $newLines += $line
}

Write-Host "Salvando arquivo..." -ForegroundColor Yellow
$newLines | Out-File -FilePath $file -Encoding UTF8

Write-Host "`n✅ Componente adicionado com sucesso!" -ForegroundColor Green
Write-Host "Arquivo atualizado: $file" -ForegroundColor Cyan
Write-Host "Total de linhas: $($newLines.Count)" -ForegroundColor Cyan
