# Script PowerShell para monitorar logs das correções anti-ban do WhatsApp
# Uso: .\monitorar-correcoes-whatsapp.ps1

Write-Host "==========================================" -ForegroundColor White
Write-Host "🔍 Monitor de Correções Anti-Ban WhatsApp" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor White
Write-Host ""
Write-Host "Monitorando logs das 8 correções implementadas..." -ForegroundColor Yellow
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
Write-Host ""

# Ir para o diretório backend
Set-Location backend

# Função para exibir log colorido
function Write-LogLine {
    param(
        [string]$timestamp,
        [string]$line,
        [string]$type = "normal"
    )
    
    switch ($type) {
        "correcao1" {
            Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
            Write-Host "✅ CORREÇÃO 1+2 (Browser/User-Agent): " -NoNewline -ForegroundColor Green
            Write-Host $line
        }
        "correcao3" {
            Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
            Write-Host "✅ CORREÇÃO 3 (ContextInfo): " -NoNewline -ForegroundColor Yellow
            Write-Host $line
        }
        "correcao4" {
            Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
            Write-Host "✅ CORREÇÃO 4 (Backoff Exponencial): " -NoNewline -ForegroundColor Blue
            Write-Host $line
        }
        "correcao5" {
            Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
            Write-Host "✅ CORREÇÃO 5 (Boot Randomizado): " -NoNewline -ForegroundColor Cyan
            Write-Host $line
        }
        "correcao6" {
            Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
            Write-Host "✅ CORREÇÃO 6 (Delays Humanos): " -NoNewline -ForegroundColor Magenta
            Write-Host $line
        }
        "correcao7" {
            Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
            Write-Host "✅ CORREÇÃO 7 (Presence/Typing): " -NoNewline -ForegroundColor Red
            Write-Host $line
        }
        "correcao8" {
            Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
            Write-Host "✅ CORREÇÃO 8 (markOnlineOnConnect): " -NoNewline -ForegroundColor Green
            Write-Host $line
        }
        "whatsapp" {
            Write-Host "[$timestamp] 📱 " -NoNewline -ForegroundColor Gray
            Write-Host $line
        }
        "erro" {
            Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
            Write-Host "❌ ERRO: " -NoNewline -ForegroundColor Red
            Write-Host $line
        }
        default {
            Write-Host "[$timestamp] $line" -ForegroundColor DarkGray
        }
    }
}

# Executar npm run dev e capturar output
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "npm"
$psi.Arguments = "run dev"
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $psi

# Event handlers para capturar output em tempo real
$outputHandler = {
    if ($EventArgs.Data) {
        $timestamp = Get-Date -Format "HH:mm:ss"
        $line = $EventArgs.Data
        
        # ERRO 1 e 2: Browser identifier e User-Agent
        if ($line -match "Usando browser identifier realista|Primeira conexão: índice inicial aleatório|Reconexão detectada: rotacionando") {
            Write-LogLine -timestamp $timestamp -line $line -type "correcao1"
        }
        # ERRO 3: ContextInfo
        elseif ($line -match "contextInfo") {
            Write-LogLine -timestamp $timestamp -line $line -type "correcao3"
        }
        # ERRO 4: Backoff exponencial
        elseif ($line -match "Aguardando.*antes de reconectar|base:.*exponencial:.*jitter:") {
            Write-LogLine -timestamp $timestamp -line $line -type "correcao4"
        }
        # ERRO 5: Reconexão no boot
        elseif ($line -match "Aguardando.*antes de tentar reconexões|Aguardando.*antes da próxima reconexão") {
            Write-LogLine -timestamp $timestamp -line $line -type "correcao5"
        }
        # ERRO 6: Delays humanos
        elseif ($line -match "Simulando leitura|Simulando digitação") {
            Write-LogLine -timestamp $timestamp -line $line -type "correcao6"
        }
        # ERRO 7: Presence/Typing
        elseif ($line -match "Enviando presença.*composing|Parando de digitar") {
            Write-LogLine -timestamp $timestamp -line $line -type "correcao7"
        }
        # ERRO 8: markOnlineOnConnect
        elseif ($line -match "markOnlineOnConnect") {
            Write-LogLine -timestamp $timestamp -line $line -type "correcao8"
        }
        # Logs importantes gerais
        elseif ($line -match "WhatsApp conectado|WhatsApp desconectado|Mensagem enviada|nova_mensagem") {
            Write-LogLine -timestamp $timestamp -line $line -type "whatsapp"
        }
        # Erros
        elseif ($line -match "erro|error|failed|falha") {
            Write-LogLine -timestamp $timestamp -line $line -type "erro"
        }
        # Outros logs
        else {
            Write-LogLine -timestamp $timestamp -line $line -type "normal"
        }
    }
}

Register-ObjectEvent -InputObject $process -EventName OutputDataReceived -Action $outputHandler | Out-Null
Register-ObjectEvent -InputObject $process -EventName ErrorDataReceived -Action $outputHandler | Out-Null

$process.Start() | Out-Null
$process.BeginOutputReadLine()
$process.BeginErrorReadLine()

# Aguardar até o processo terminar ou Ctrl+C
try {
    $process.WaitForExit()
} finally {
    if (!$process.HasExited) {
        $process.Kill()
    }
    Set-Location ..
}
