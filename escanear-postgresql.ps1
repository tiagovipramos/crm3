# Script para escanear referências ao PostgreSQL no repositório
# Uso: .\escanear-postgresql.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ESCANEANDO REPOSITÓRIO - PostgreSQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Termos a procurar
$termos = @("postgres", "pg", "5432", "uuid_generate")

# Diretórios e arquivos a excluir
$exclusoes = @(
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "uploads",
    "*.log",
    "*.lock",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock"
)

# Construir pattern de exclusão
$excludePattern = ($exclusoes | ForEach-Object { "*$_*" }) -join "|"

foreach ($termo in $termos) {
    Write-Host "Buscando por: '$termo'" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    $found = $false
    
    # Buscar em todos os arquivos, excluindo os diretórios especificados
    Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue | 
        Where-Object { 
            $path = $_.FullName
            $exclude = $false
            foreach ($excl in $exclusoes) {
                if ($path -like "*$excl*") {
                    $exclude = $true
                    break
                }
            }
            -not $exclude
        } | 
        ForEach-Object {
            $file = $_
            $lineNumber = 0
            
            try {
                Get-Content $file.FullName -ErrorAction Stop | ForEach-Object {
                    $lineNumber++
                    $line = $_
                    
                    if ($line -match $termo) {
                        $found = $true
                        $relativePath = $file.FullName.Replace((Get-Location).Path, ".")
                        
                        Write-Host "  Arquivo: " -NoNewline -ForegroundColor White
                        Write-Host $relativePath -ForegroundColor Green
                        Write-Host "  Linha $lineNumber" -NoNewline -ForegroundColor White
                        Write-Host ": " -NoNewline
                        
                        # Destacar o termo encontrado
                        $highlightedLine = $line -replace "($termo)", '>>>$1<<<'
                        Write-Host $highlightedLine.Trim() -ForegroundColor Cyan
                        Write-Host ""
                    }
                }
            }
            catch {
                # Ignorar arquivos binários ou inacessíveis
            }
        }
    
    if (-not $found) {
        Write-Host "  Nenhuma ocorrência encontrada." -ForegroundColor DarkGray
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ESCANEAMENTO CONCLUÍDO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
