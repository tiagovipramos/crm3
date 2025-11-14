import { Request, Response } from 'express';
import { logger } from '../config/logger';

/**
 * Controller para atender requisitos de exclusão de dados do Facebook
 * Conforme política da plataforma Facebook
 */

/**
 * Endpoint de callback de exclusão de dados
 * O Facebook envia um signed_request quando o usuário solicita exclusão
 */
export const handleDataDeletionRequest = async (req: Request, res: Response) => {
  try {
    const { signed_request } = req.body;

    if (!signed_request) {
      return res.status(400).json({
        error: 'Missing signed_request parameter'
      });
    }

    // Gerar um código de confirmação único
    const confirmationCode = generateConfirmationCode();
    const timestamp = new Date().toISOString();

    // Log da solicitação de exclusão
    logger.info('📋 Solicitação de exclusão de dados recebida do Facebook', {
      confirmationCode,
      timestamp,
      signed_request: signed_request.substring(0, 20) + '...'
    });

    // TODO: Implemente aqui a lógica de exclusão de dados do seu sistema
    // Por exemplo:
    // 1. Decodificar o signed_request para obter o user_id
    // 2. Marcar os dados do usuário para exclusão
    // 3. Agendar a exclusão (pode ser imediata ou após período legal)
    
    // Responder ao Facebook com URL de status
    const statusUrl = `https://${req.get('host')}/facebook/data-deletion-status?id=${confirmationCode}`;
    
    res.json({
      url: statusUrl,
      confirmation_code: confirmationCode
    });

  } catch (error) {
    logger.error('❌ Erro ao processar solicitação de exclusão de dados:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

/**
 * Página de status da exclusão de dados
 */
export const getDataDeletionStatus = async (req: Request, res: Response) => {
  const confirmationCode = req.query.id;

  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Status de Exclusão de Dados - VipSeg CRM</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 48px;
          margin-bottom: 10px;
        }
        h1 {
          color: #333;
          font-size: 24px;
          margin-bottom: 10px;
        }
        .status {
          background: #f0f9ff;
          border-left: 4px solid #3b82f6;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .status-title {
          color: #1e40af;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .confirmation-code {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
          text-align: center;
        }
        .confirmation-code strong {
          color: #92400e;
          font-size: 18px;
          font-family: monospace;
        }
        .info {
          color: #666;
          line-height: 1.6;
          margin: 15px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #9ca3af;
          font-size: 14px;
        }
        .alert {
          background: #fee;
          border-left: 4px solid #dc2626;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .alert-title {
          color: #991b1b;
          font-weight: 600;
          margin-bottom: 5px;
        }
        ul {
          margin: 15px 0;
          padding-left: 20px;
        }
        li {
          margin: 8px 0;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🗑️</div>
          <h1>Solicitação de Exclusão de Dados</h1>
          <p style="color: #666;">VipSeg CRM - Proteção Veicular</p>
        </div>

        <div class="status">
          <div class="status-title">✅ Solicitação Recebida com Sucesso</div>
          <p class="info">
            Sua solicitação de exclusão de dados foi registrada e será processada conforme a legislação vigente (LGPD/GDPR).
          </p>
        </div>

        ${confirmationCode ? `
          <div class="confirmation-code">
            <p style="margin-bottom: 5px; color: #92400e;">Código de Confirmação:</p>
            <strong>${confirmationCode}</strong>
          </div>
        ` : ''}

        <div class="info">
          <h3 style="color: #333; margin-bottom: 10px;">📋 O que será excluído:</h3>
          <ul>
            <li>Dados de autenticação via Facebook</li>
            <li>Informações de perfil vinculadas à sua conta</li>
            <li>Registros de interações com o aplicativo</li>
            <li>Outras informações pessoais armazenadas</li>
          </ul>
        </div>

        <div class="alert">
          <div class="alert-title">⏰ Prazo de Processamento</div>
          <p class="info" style="margin: 10px 0 0 0;">
            A exclusão completa dos dados será realizada em até <strong>30 dias úteis</strong>, 
            conforme previsto na Lei Geral de Proteção de Dados (LGPD).
          </p>
        </div>

        <div class="info">
          <h3 style="color: #333; margin-bottom: 10px;">📧 Precisa de ajuda?</h3>
          <p>
            Se você tiver dúvidas sobre a exclusão dos seus dados ou deseja cancelar esta solicitação,
            entre em contato conosco:
          </p>
          <p style="margin-top: 10px;">
            <strong>Email:</strong> suporte@boraindicar.com.br<br>
            <strong>Site:</strong> https://www.boraindicar.com.br
          </p>
        </div>

        <div class="footer">
          <p>© 2025 VipSeg CRM - Todos os direitos reservados</p>
          <p style="margin-top: 5px;">Conforme LGPD (Lei 13.709/2018) e GDPR</p>
        </div>
      </div>
    </body>
    </html>
  `);
};

/**
 * Gerar código de confirmação único
 */
function generateConfirmationCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `DEL-${timestamp}-${random}`.toUpperCase();
}
