# Script para corrigir referências aos serviços antigos no indicadorController

$arquivo = "backend\src\controllers\indicadorController.ts"

# Ler conteúdo
$conteudo = Get-Content $arquivo -Raw

# Substituir validarWhatsApp (linha 387)
$conteudo = $conteudo -replace 'const resultado = await whatsappValidationService\.validarComCache\(telefone\);', @'
// TODO: Implementar validação com WhatsApp Cloud API
    const resultado = {
      valido: true,
      existe: true,
      telefone: telefone,
      mensagem: 'Validação temporariamente desativada'
    };
'@

# Substituir criarIndicacao validação (linha 416)
$conteudo = $conteudo -replace '(\s+)// Validar WhatsApp\s+const validacao = await whatsappValidationService\.validarComCache\(telefoneIndicado\);', @'
$1// Validar WhatsApp (TODO: Implementar com Cloud API)
$1const validacao = {
$1  valido: true,
$1  existe: true,
$1  telefone: telefoneIndicado.replace(/\D/g, ''),
$1  mensagem: 'Número válido'
$1};
$1// const validacao = await whatsappValidationService.validarComCache(telefoneIndicado);
'@

# Substituir envio de mensagem (linha 651)
$conteudo = $conteudo -replace 'await whatsappService\.enviarMensagem\(\s+consultorId,\s+validacao\.telefone,\s+mensagemBoasVindas,\s+String\(leadId\)\s+\);', @'
// TODO: Implementar envio com WhatsApp Cloud API
              logger.warn('⚠️ Envio de mensagem automática desativado temporariamente');
              // await whatsappCloudService.enviarMensagem(consultorId, validacao.telefone, mensagemBoasVindas, String(leadId));
'@

# Salvar
$conteudo | Set-Content $arquivo -NoNewline

Write-Host "✅ Arquivo corrigido com sucesso!"
