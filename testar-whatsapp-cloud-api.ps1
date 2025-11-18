#############################################
# Script de Validação - WhatsApp Cloud API
# Testa toda a integração automaticamente
# Versão PowerShell para Windows
#############################################

# Contador de testes
$global:TOTAL_TESTS = 0
$global:PASSED_TESTS = 0
$global:FAILED_TESTS = 0

# Função para imprimir cabeçalho
function Print-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "  $Title" -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host ""
}

# Função para verificar resposta HTTP
function Test-HttpResponse {
    param(
        [string]$Url,
        [int]$ExpectedCode,
        [string]$Description
    )
    
    $global:TOTAL_TESTS++
    Write-Host "🌐 Testando: $Description... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -ErrorAction SilentlyContinue
        $code = $response.StatusCode
        
        if ($code -eq $ExpectedCode) {
            Write-Host "✅ PASSOU (HTTP $code)" -ForegroundColor Green
            $global:PASSED_TESTS++
            return $true
        } else {
            Write-Host "❌ FALHOU (HTTP $code, esperado $ExpectedCode)" -ForegroundColor Red
            $global:FAILED_TESTS++
            return $false
        }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq $ExpectedCode) {
            Write-Host "✅ PASSOU (HTTP $code)" -ForegroundColor Green
            $global:PASSED_TESTS++
            return $true
        } else {
            Write-Host "❌ FALHOU (HTTP $code, esperado $ExpectedCode)" -ForegroundColor Red
            $global:FAILED_TESTS++
            return $false
        }
    }
}

# Função para fazer requisição POST
function Invoke-PostRequest {
    param(
        [string]$Url,
        [string]$Body,
        [hashtable]$Headers
    )
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Post -Body $Body -Headers $Headers -ContentType "application/json"
        return $response
    } catch {
        return $_.Exception.Response
    }
}

# Iniciar testes
Clear-Host
Print-Header "🔍 VALIDAÇÃO AUTOMÁTICA - WhatsApp Cloud API"

Write-Host "Este script irá validar toda a integração com WhatsApp Cloud API"
Write-Host ""

# Solicitar informações
Write-Host "Por favor, insira as seguintes informações:" -ForegroundColor Yellow
Write-Host ""

$ACCESS_TOKEN = Read-Host "🔑 Access Token do Facebook"
$PHONE_NUMBER_ID = Read-Host "📱 Phone Number ID"
$DOMAIN_URL = Read-Host "🌐 URL do seu domínio (ex: https://boraindicar.com)"
$TEST_PHONE = Read-Host "📞 Número de telefone para teste (ex: 5511987654321)"

Write-Host ""
Write-Host "Iniciando testes..." -ForegroundColor Blue
Start-Sleep -Seconds 2

# ============================================
# TESTES DE INFRAESTRUTURA
# ============================================
Print-Header "1️⃣ TESTES DE INFRAESTRUTURA"

# Verificar se backend está rodando
Test-HttpResponse "$DOMAIN_URL/api/health" 200 "Backend online"

# Verificar se webhook está acessível
Test-HttpResponse "$DOMAIN_URL/api/whatsapp-cloud/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=test123" 200 "Webhook acessível"

# Verificar HTTPS
$global:TOTAL_TESTS++
if ($DOMAIN_URL -like "https*") {
    Write-Host "🔒 HTTPS: ✅ Configurado" -ForegroundColor Green
    $global:PASSED_TESTS++
} else {
    Write-Host "🔒 HTTPS: ❌ Não configurado (obrigatório!)" -ForegroundColor Red
    $global:FAILED_TESTS++
}

# ============================================
# TESTES DE BANCO DE DADOS
# ============================================
Print-Header "2️⃣ TESTES DE BANCO DE DADOS"

Write-Host "📋 Verificando estrutura da tabela consultores..."
try {
    $dbCheck = docker exec crm-backend node -e @"
const mysql = require('mysql2/promise');
(async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        const [columns] = await connection.execute('SHOW COLUMNS FROM consultores WHERE Field LIKE \"%whatsapp%\"');
        
        const requiredColumns = [
            'whatsapp_access_token',
            'whatsapp_phone_number_id',
            'whatsapp_business_account_id',
            'whatsapp_webhook_verify_token'
        ];
        
        let allPresent = true;
        requiredColumns.forEach(col => {
            const found = columns.find(c => c.Field === col);
            if (found) {
                console.log('✅ Coluna ' + col + ' presente');
            } else {
                console.log('❌ Coluna ' + col + ' ausente');
                allPresent = false;
            }
        });
        
        await connection.end();
        process.exit(allPresent ? 0 : 1);
    } catch (error) {
        console.error('❌ Erro ao verificar banco:', error.message);
        process.exit(1);
    }
})();
"@
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Estrutura do banco OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Estrutura do banco com problemas" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao verificar banco de dados" -ForegroundColor Red
}

# ============================================
# TESTES DE API META/FACEBOOK
# ============================================
Print-Header "3️⃣ TESTES DE API META/FACEBOOK"

Write-Host "🧪 Testando credenciais do Facebook..."
$global:TOTAL_TESTS++

try {
    $credResponse = Invoke-RestMethod -Uri "https://graph.facebook.com/v21.0/$PHONE_NUMBER_ID?access_token=$ACCESS_TOKEN"
    
    if ($credResponse.verified_name) {
        Write-Host "✅ Credenciais válidas" -ForegroundColor Green
        Write-Host "📱 Número verificado: $($credResponse.verified_name)"
        Write-Host "📊 Status de qualidade: $($credResponse.quality_rating)"
        $global:PASSED_TESTS++
    } else {
        Write-Host "❌ Credenciais inválidas ou expiradas" -ForegroundColor Red
        $global:FAILED_TESTS++
    }
} catch {
    Write-Host "❌ Credenciais inválidas ou expiradas" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Yellow
    $global:FAILED_TESTS++
}

Write-Host ""
Write-Host "🧪 Testando envio de mensagem via API do Meta..."
$global:TOTAL_TESTS++

$messageBody = @{
    messaging_product = "whatsapp"
    to = $TEST_PHONE
    type = "text"
    text = @{
        body = "✅ Teste automatizado do CRM - $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
    }
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $ACCESS_TOKEN"
    "Content-Type" = "application/json"
}

try {
    $msgResponse = Invoke-RestMethod -Uri "https://graph.facebook.com/v21.0/$PHONE_NUMBER_ID/messages" `
                                     -Method Post `
                                     -Body $messageBody `
                                     -Headers $headers
    
    if ($msgResponse.messages) {
        Write-Host "✅ Mensagem enviada com sucesso" -ForegroundColor Green
        Write-Host "📨 Message ID: $($msgResponse.messages[0].id)"
        $global:PASSED_TESTS++
    } else {
        Write-Host "❌ Falha ao enviar mensagem" -ForegroundColor Red
        $global:FAILED_TESTS++
    }
} catch {
    Write-Host "❌ Falha ao enviar mensagem" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Yellow
    $global:FAILED_TESTS++
}

# ============================================
# TESTES DE WEBHOOK
# ============================================
Print-Header "4️⃣ TESTES DE WEBHOOK"

Write-Host "🧪 Testando verificação do webhook (GET)..."
$global:TOTAL_TESTS++

try {
    $webhookVerify = Invoke-RestMethod -Uri "$DOMAIN_URL/api/whatsapp-cloud/webhook?hub.mode=subscribe&hub.verify_token=test123&hub.challenge=CHALLENGE_STRING"
    
    if ($webhookVerify -eq "CHALLENGE_STRING") {
        Write-Host "✅ Webhook GET funcionando" -ForegroundColor Green
        $global:PASSED_TESTS++
    } else {
        Write-Host "❌ Webhook GET não retornou challenge" -ForegroundColor Red
        $global:FAILED_TESTS++
    }
} catch {
    Write-Host "❌ Webhook GET com erro" -ForegroundColor Red
    $global:FAILED_TESTS++
}

Write-Host ""
Write-Host "🧪 Testando recebimento de webhook (POST)..."
$global:TOTAL_TESTS++

$webhookBody = @{
    object = "whatsapp_business_account"
    entry = @(
        @{
            id = "TEST_ID"
            changes = @(
                @{
                    value = @{
                        messaging_product = "whatsapp"
                        metadata = @{
                            display_phone_number = $TEST_PHONE
                            phone_number_id = $PHONE_NUMBER_ID
                        }
                        messages = @(
                            @{
                                from = $TEST_PHONE
                                id = "test_message_id_$(Get-Date -UFormat %s)"
                                timestamp = Get-Date -UFormat %s
                                type = "text"
                                text = @{
                                    body = "Teste de webhook automático"
                                }
                            }
                        )
                    }
                    field = "messages"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri "$DOMAIN_URL/api/whatsapp-cloud/webhook" `
                                  -Method Post `
                                  -Body $webhookBody `
                                  -ContentType "application/json" `
                                  -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Webhook POST funcionando (HTTP 200)" -ForegroundColor Green
        $global:PASSED_TESTS++
    } else {
        Write-Host "❌ Webhook POST retornou HTTP $($response.StatusCode)" -ForegroundColor Red
        $global:FAILED_TESTS++
    }
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 200) {
        Write-Host "✅ Webhook POST funcionando (HTTP 200)" -ForegroundColor Green
        $global:PASSED_TESTS++
    } else {
        Write-Host "❌ Webhook POST retornou HTTP $code" -ForegroundColor Red
        $global:FAILED_TESTS++
    }
}

# ============================================
# VERIFICAÇÃO DE LOGS
# ============================================
Print-Header "5️⃣ VERIFICAÇÃO DE LOGS"

Write-Host "📋 Verificando logs recentes do backend..."
Write-Host ""
try {
    $logs = docker logs crm-backend --tail 20 2>&1 | Select-String -Pattern "whatsapp|webhook" -CaseSensitive:$false
    if ($logs) {
        $logs | ForEach-Object { Write-Host $_.Line }
    } else {
        Write-Host "Nenhum log relacionado encontrado"
    }
} catch {
    Write-Host "Erro ao obter logs" -ForegroundColor Yellow
}
Write-Host ""

# ============================================
# RESUMO DOS TESTES
# ============================================
Print-Header "📊 RESUMO DOS TESTES"

Write-Host ""
Write-Host "Total de testes executados: $global:TOTAL_TESTS"
Write-Host "✅ Testes aprovados: $global:PASSED_TESTS" -ForegroundColor Green
Write-Host "❌ Testes falhados: $global:FAILED_TESTS" -ForegroundColor Red
Write-Host ""

$percentage = [math]::Round(($global:PASSED_TESTS / $global:TOTAL_TESTS) * 100)

if ($global:FAILED_TESTS -eq 0) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "🎉 TODOS OS TESTES PASSARAM! (100%)" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Sua integração com WhatsApp Cloud API está funcionando perfeitamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:"
    Write-Host "1. Configure o webhook no Facebook Developers"
    Write-Host "2. Use a URL: $DOMAIN_URL/api/whatsapp-cloud/webhook"
    Write-Host "3. Faça login no CRM e configure suas credenciais"
    Write-Host "4. Teste enviar e receber mensagens reais"
} elseif ($percentage -ge 70) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "⚠️  ALGUNS TESTES FALHARAM ($percentage% aprovados)" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "A integração básica está funcionando, mas há alguns problemas."
    Write-Host "Revise os testes que falharam acima."
} else {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host "❌ MUITOS TESTES FALHARAM ($percentage% aprovados)" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host ""
    Write-Host "Há problemas significativos na integração."
    Write-Host "Revise o guia VALIDACAO-WHATSAPP-CLOUD-API.md"
}

Write-Host ""
Write-Host "📖 Para mais informações, consulte: VALIDACAO-WHATSAPP-CLOUD-API.md"
Write-Host ""
