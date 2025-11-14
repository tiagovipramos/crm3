import axios from 'axios';
import pool from '../config/database';
import { logger } from '../config/logger';

interface WhatsAppCloudConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
}

interface SendMessageParams {
  to: string;
  message: string;
  consultorId: string;
  leadId?: string;
}

interface SendMediaParams {
  to: string;
  type: 'image' | 'video' | 'audio' | 'document';
  mediaUrl: string;
  caption?: string;
  filename?: string;
  consultorId: string;
  leadId?: string;
}

class WhatsAppCloudService {
  private io: any;
  private readonly WHATSAPP_API_VERSION = 'v21.0';
  private readonly WHATSAPP_API_URL = 'https://graph.facebook.com';

  setSocketIO(io: any) {
    this.io = io;
  }

  /**
   * Obter configuração do WhatsApp para um consultor
   */
  private async getConfig(consultorId: string): Promise<WhatsAppCloudConfig | null> {
    try {
      const [rows] = await pool.query(
        `SELECT whatsapp_access_token, whatsapp_phone_number_id, 
                whatsapp_business_account_id, whatsapp_webhook_verify_token
         FROM consultores 
         WHERE id = ?`,
        [consultorId]
      );

      const consultor = (rows as any[])[0];
      
      if (!consultor || !consultor.whatsapp_access_token || !consultor.whatsapp_phone_number_id) {
        logger.warn(`Configuração do WhatsApp não encontrada para consultor: ${consultorId}`);
        return null;
      }

      return {
        accessToken: consultor.whatsapp_access_token,
        phoneNumberId: consultor.whatsapp_phone_number_id,
        businessAccountId: consultor.whatsapp_business_account_id,
        webhookVerifyToken: consultor.whatsapp_webhook_verify_token
      };
    } catch (error) {
      logger.error('Erro ao buscar configuração do WhatsApp:', error);
      return null;
    }
  }

  /**
   * Salvar configuração do WhatsApp
   */
  async saveConfig(
    consultorId: string,
    accessToken: string,
    phoneNumberId: string,
    businessAccountId?: string,
    webhookVerifyToken?: string
  ): Promise<boolean> {
    try {
      await pool.query(
        `UPDATE consultores 
         SET whatsapp_access_token = ?,
             whatsapp_phone_number_id = ?,
             whatsapp_business_account_id = ?,
             whatsapp_webhook_verify_token = ?,
             status_conexao = 'online',
             updated_at = NOW()
         WHERE id = ?`,
        [accessToken, phoneNumberId, businessAccountId, webhookVerifyToken, consultorId]
      );

      logger.info(`✅ Configuração do WhatsApp salva para consultor: ${consultorId}`);
      
      // Emitir evento de conexão
      if (this.io) {
        this.io.to(`consultor_${consultorId}`).emit('whatsapp_connected', {
          consultorId,
          status: 'online'
        });
        
        this.io.to('admins').emit('whatsapp_connected', {
          consultorId,
          status: 'online'
        });
      }

      return true;
    } catch (error) {
      logger.error('Erro ao salvar configuração do WhatsApp:', error);
      return false;
    }
  }

  /**
   * Remover configuração do WhatsApp
   */
  async removeConfig(consultorId: string): Promise<boolean> {
    try {
      await pool.query(
        `UPDATE consultores 
         SET whatsapp_access_token = NULL,
             whatsapp_phone_number_id = NULL,
             whatsapp_business_account_id = NULL,
             whatsapp_webhook_verify_token = NULL,
             status_conexao = 'offline',
             updated_at = NOW()
         WHERE id = ?`,
        [consultorId]
      );

      logger.info(`✅ Configuração do WhatsApp removida para consultor: ${consultorId}`);
      
      // Emitir evento de desconexão
      if (this.io) {
        this.io.to(`consultor_${consultorId}`).emit('whatsapp_disconnected', {
          consultorId,
          reason: 'manual_disconnect'
        });
        
        this.io.to('admins').emit('whatsapp_disconnected', {
          consultorId,
          reason: 'manual_disconnect'
        });
      }

      return true;
    } catch (error) {
      logger.error('Erro ao remover configuração do WhatsApp:', error);
      return false;
    }
  }

  /**
   * Verificar se está conectado (tem configuração válida)
   */
  async isConnected(consultorId: string): Promise<boolean> {
    const config = await this.getConfig(consultorId);
    return config !== null;
  }

  /**
   * Obter status da conexão
   */
  async getStatus(consultorId: string): Promise<{ connected: boolean; hasSession: boolean }> {
    const connected = await this.isConnected(consultorId);
    return {
      connected,
      hasSession: connected
    };
  }

  /**
   * Normalizar número de telefone (remover caracteres não numéricos)
   */
  private normalizePhoneNumber(phone: string): string {
    // Remover tudo exceto números
    let normalized = phone.replace(/\D/g, '');
    
    // Se não começar com 55 (Brasil), adicionar
    if (!normalized.startsWith('55') && normalized.length <= 11) {
      normalized = '55' + normalized;
    }
    
    return normalized;
  }

  /**
   * Enviar mensagem de texto
   */
  async sendMessage({ to, message, consultorId, leadId }: SendMessageParams): Promise<any> {
    try {
      const config = await this.getConfig(consultorId);
      
      if (!config) {
        throw new Error('WhatsApp não configurado. Configure o Access Token e Phone Number ID.');
      }

      const normalizedPhone = this.normalizePhoneNumber(to);
      
      const url = `${this.WHATSAPP_API_URL}/${this.WHATSAPP_API_VERSION}/${config.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedPhone,
        type: 'text',
        text: {
          preview_url: true,
          body: message
        }
      };

      logger.info('📤 Enviando mensagem via WhatsApp Cloud API:', { to: normalizedPhone, message: message.substring(0, 50) });

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const whatsappMessageId = response.data.messages?.[0]?.id || null;
      logger.info('✅ Mensagem enviada! WhatsApp Message ID:', whatsappMessageId);

      // Buscar lead_id se não fornecido
      if (!leadId) {
        const [leadRows] = await pool.query(
          'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ? ORDER BY data_criacao DESC LIMIT 1',
          [normalizedPhone, consultorId]
        );

        if ((leadRows as any[]).length === 0) {
          throw new Error(`Lead não encontrado para telefone: ${normalizedPhone}`);
        }

        leadId = (leadRows as any[])[0].id;
      }

      // Salvar mensagem no banco
      await pool.query(
        `INSERT INTO mensagens (lead_id, consultor_id, conteudo, tipo, remetente, status, whatsapp_message_id, timestamp)
         VALUES (?, ?, ?, 'texto', 'consultor', 'enviada', ?, NOW())`,
        [leadId, consultorId, message, whatsappMessageId]
      );

      // Atualizar última mensagem do lead
      await pool.query(
        `UPDATE leads SET ultima_mensagem = ?, data_atualizacao = NOW() 
         WHERE id = ?`,
        [message.substring(0, 50), leadId]
      );

      return { success: true, messageId: whatsappMessageId };
    } catch (error: any) {
      logger.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Enviar mídia (imagem, vídeo, áudio, documento)
   */
  async sendMedia({ to, type, mediaUrl, caption, filename, consultorId, leadId }: SendMediaParams): Promise<any> {
    try {
      const config = await this.getConfig(consultorId);
      
      if (!config) {
        throw new Error('WhatsApp não configurado. Configure o Access Token e Phone Number ID.');
      }

      const normalizedPhone = this.normalizePhoneNumber(to);
      
      const url = `${this.WHATSAPP_API_URL}/${this.WHATSAPP_API_VERSION}/${config.phoneNumberId}/messages`;
      
      // Construir payload baseado no tipo de mídia
      const mediaObject: any = {
        link: mediaUrl
      };

      if (caption && (type === 'image' || type === 'video')) {
        mediaObject.caption = caption;
      }

      if (filename && type === 'document') {
        mediaObject.filename = filename;
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedPhone,
        type: type,
        [type]: mediaObject
      };

      logger.info(`📤 Enviando ${type} via WhatsApp Cloud API:`, { to: normalizedPhone, mediaUrl });

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const whatsappMessageId = response.data.messages?.[0]?.id || null;
      logger.info(`✅ ${type} enviado! WhatsApp Message ID:`, whatsappMessageId);

      // Buscar lead_id se não fornecido
      if (!leadId) {
        const [leadRows] = await pool.query(
          'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ? ORDER BY data_criacao DESC LIMIT 1',
          [normalizedPhone, consultorId]
        );

        if ((leadRows as any[]).length === 0) {
          throw new Error(`Lead não encontrado para telefone: ${normalizedPhone}`);
        }

        leadId = (leadRows as any[])[0].id;
      }

      // Mapear tipo para o banco
      const tipoMapeado = type === 'image' ? 'imagem' :
                          type === 'video' ? 'video' :
                          type === 'audio' ? 'audio' :
                          'documento';

      const tipoTexto = type === 'image' ? '📷 Imagem' :
                        type === 'video' ? '🎥 Vídeo' :
                        type === 'audio' ? '🎤 Áudio' :
                        '📄 Documento';
      
      const conteudo = caption || tipoTexto;

      // Salvar mensagem no banco
      await pool.query(
        `INSERT INTO mensagens (lead_id, consultor_id, conteudo, tipo, remetente, status, media_url, media_name, whatsapp_message_id, timestamp)
         VALUES (?, ?, ?, ?, 'consultor', 'enviada', ?, ?, ?, NOW())`,
        [leadId, consultorId, conteudo, tipoMapeado, mediaUrl, filename, whatsappMessageId]
      );

      // Atualizar última mensagem do lead
      await pool.query(
        `UPDATE leads SET ultima_mensagem = ?, data_atualizacao = NOW() 
         WHERE id = ?`,
        [conteudo.substring(0, 50), leadId]
      );

      return { success: true, messageId: whatsappMessageId };
    } catch (error: any) {
      logger.error(`❌ Erro ao enviar ${type}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Processar webhook de mensagem recebida
   */
  async processIncomingMessage(webhookData: any): Promise<void> {
    try {
      logger.info('📥 Webhook recebido:', JSON.stringify(webhookData, null, 2));

      // Validar estrutura do webhook
      if (!webhookData.entry || webhookData.entry.length === 0) {
        logger.warn('⚠️ Webhook sem entries');
        return;
      }

      for (const entry of webhookData.entry) {
        if (!entry.changes || entry.changes.length === 0) continue;

        for (const change of entry.changes) {
          if (change.field !== 'messages') continue;

          const value = change.value;
          
          // Processar mensagens recebidas
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              await this.handleIncomingMessage(message, value.metadata);
            }
          }

          // Processar status de mensagens enviadas
          if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              await this.handleMessageStatus(status);
            }
          }
        }
      }
    } catch (error) {
      logger.error('❌ Erro ao processar webhook:', error);
    }
  }

  /**
   * Processar mensagem recebida individual
   */
  private async handleIncomingMessage(message: any, metadata: any): Promise<void> {
    try {
      // Ignorar mensagens enviadas pelo sistema
      if (message.from === metadata.phone_number_id) {
        logger.info('⏩ Ignorando mensagem enviada pelo sistema');
        return;
      }

      const whatsappMessageId = message.id;
      const fromNumber = message.from;
      
      // Verificar duplicidade
      const [existingMsg] = await pool.query(
        'SELECT id FROM mensagens WHERE whatsapp_message_id = ?',
        [whatsappMessageId]
      );

      if ((existingMsg as any[]).length > 0) {
        logger.info('⏩ Mensagem já processada:', whatsappMessageId);
        return;
      }

      // Buscar consultor pelo phone_number_id
      const [consultorRows] = await pool.query(
        'SELECT id FROM consultores WHERE whatsapp_phone_number_id = ?',
        [metadata.phone_number_id]
      );

      if ((consultorRows as any[]).length === 0) {
        logger.warn('⚠️ Consultor não encontrado para phone_number_id:', metadata.phone_number_id);
        return;
      }

      const consultorId = (consultorRows as any[])[0].id;

      // Extrair conteúdo da mensagem
      let conteudo = '';
      let tipo = 'texto';
      let mediaUrl: string | null = null;
      let mediaName: string | null = null;

      if (message.type === 'text') {
        conteudo = message.text.body;
      } else if (message.type === 'image') {
        tipo = 'imagem';
        conteudo = '📷 Imagem';
        if (message.image.caption) conteudo += `: ${message.image.caption}`;
        // Nota: Para baixar mídia, precisa fazer requisição adicional
        mediaUrl = message.image.id; // ID temporário, precisa baixar depois
      } else if (message.type === 'video') {
        tipo = 'video';
        conteudo = '🎥 Vídeo';
        if (message.video.caption) conteudo += `: ${message.video.caption}`;
        mediaUrl = message.video.id;
      } else if (message.type === 'audio') {
        tipo = 'audio';
        conteudo = '🎤 Áudio';
        mediaUrl = message.audio.id;
      } else if (message.type === 'document') {
        tipo = 'documento';
        conteudo = `📄 ${message.document.filename || 'Documento'}`;
        mediaUrl = message.document.id;
        mediaName = message.document.filename;
      } else {
        logger.info('⏩ Tipo de mensagem não suportado:', message.type);
        return;
      }

      // Buscar ou criar lead
      const [leadRows] = await pool.query(
        'SELECT id, nome FROM leads WHERE telefone = ? AND consultor_id = ?',
        [fromNumber, consultorId]
      );

      let leadId: string;
      let isNovoLead = false;

      if ((leadRows as any[]).length === 0) {
        // Criar novo lead
        const nomeFormatado = this.formatPhoneNumber(fromNumber);
        
        const novoLeadResult = await pool.query(
          `INSERT INTO leads (nome, telefone, origem, status, consultor_id, mensagens_nao_lidas, data_criacao, data_atualizacao)
           VALUES (?, ?, 'WhatsApp', 'novo', ?, 1, NOW(), NOW())`,
          [nomeFormatado, fromNumber, consultorId]
        );
        
        leadId = String((novoLeadResult as any).insertId || (novoLeadResult as any[])[0]?.id);
        isNovoLead = true;
        logger.info('✅ Novo lead criado:', leadId);
      } else {
        leadId = (leadRows as any[])[0].id;
        
        // Incrementar mensagens não lidas
        await pool.query(
          'UPDATE leads SET mensagens_nao_lidas = mensagens_nao_lidas + 1, data_atualizacao = NOW() WHERE id = ?',
          [leadId]
        );
      }

      // Salvar mensagem no banco
      await pool.query(
        `INSERT INTO mensagens (lead_id, consultor_id, conteudo, tipo, remetente, status, media_url, media_name, whatsapp_message_id, timestamp)
         VALUES (?, ?, ?, ?, 'lead', 'lida', ?, ?, ?, NOW())`,
        [leadId, consultorId, conteudo, tipo, mediaUrl, mediaName, whatsappMessageId]
      );

      // Atualizar última mensagem do lead
      await pool.query(
        'UPDATE leads SET ultima_mensagem = ? WHERE id = ?',
        [conteudo.substring(0, 50), leadId]
      );

      // Buscar lead completo para enviar ao frontend
      const [leadCompleto] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);
      const lead = (leadCompleto as any[])[0];

      // Emitir evento Socket.IO
      if (this.io) {
        this.io.to(`consultor_${consultorId}`).emit('nova_mensagem', {
          leadId,
          lead: {
            id: lead.id,
            nome: lead.nome,
            telefone: lead.telefone,
            origem: lead.origem,
            status: lead.status,
            mensagensNaoLidas: lead.mensagens_nao_lidas
          },
          numero: fromNumber,
          conteudo,
          tipo,
          remetente: 'lead',
          mediaUrl,
          mediaName,
          timestamp: new Date().toISOString(),
          isNovoLead
        });

        this.io.to('admins').emit('nova_mensagem', {
          leadId,
          lead: {
            id: lead.id,
            nome: lead.nome,
            telefone: lead.telefone,
            origem: lead.origem,
            status: lead.status,
            mensagensNaoLidas: lead.mensagens_nao_lidas
          },
          numero: fromNumber,
          conteudo,
          tipo,
          remetente: 'lead',
          mediaUrl,
          mediaName,
          timestamp: new Date().toISOString(),
          isNovoLead
        });

        if (isNovoLead) {
          this.io.to(`consultor_${consultorId}`).emit('novo_lead', { lead });
          this.io.to('admins').emit('novo_lead', { lead });
        }
      }

      logger.info('✅ Mensagem processada com sucesso');
    } catch (error) {
      logger.error('❌ Erro ao processar mensagem recebida:', error);
    }
  }

  /**
   * Processar status de mensagem
   */
  private async handleMessageStatus(status: any): Promise<void> {
    try {
      const whatsappMessageId = status.id;
      const statusValue = status.status; // sent, delivered, read, failed

      // Mapear status
      let novoStatus: 'enviada' | 'entregue' | 'lida' = 'enviada';
      
      if (statusValue === 'delivered') {
        novoStatus = 'entregue';
      } else if (statusValue === 'read') {
        novoStatus = 'lida';
      }

      logger.info(`✅ Atualizando status da mensagem ${whatsappMessageId}: ${novoStatus}`);

      // Atualizar status no banco
      const [result] = await pool.query(
        `UPDATE mensagens 
         SET status = ? 
         WHERE whatsapp_message_id = ?`,
        [novoStatus, whatsappMessageId]
      );

      if ((result as any).affectedRows > 0) {
        // Buscar mensagem para emitir evento
        const [msgRows] = await pool.query(
          'SELECT lead_id, consultor_id FROM mensagens WHERE whatsapp_message_id = ?',
          [whatsappMessageId]
        );

        if ((msgRows as any[]).length > 0) {
          const msg = (msgRows as any[])[0];
          
          if (this.io) {
            this.io.to(`consultor_${msg.consultor_id}`).emit('status_mensagem_atualizado', {
              leadId: msg.lead_id,
              status: novoStatus,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      logger.error('❌ Erro ao atualizar status da mensagem:', error);
    }
  }

  /**
   * Formatar número de telefone para exibição
   */
  private formatPhoneNumber(phone: string): string {
    const normalized = phone.replace(/\D/g, '');
    
    // Remover código do país (55) se presente
    const numeroSem55 = normalized.startsWith('55') 
      ? normalized.substring(2) 
      : normalized;
    
    // Extrair DDD (2 primeiros dígitos)
    const ddd = numeroSem55.substring(0, 2);
    const resto = numeroSem55.substring(2);
    
    return `(${ddd}) ${resto}`;
  }
}

export const whatsappCloudService = new WhatsAppCloudService();
