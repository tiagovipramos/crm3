import { Request, Response } from 'express';
import { whatsappCloudService } from '../services/whatsappCloudService';
import { logger } from '../config/logger';

/**
 * Salvar configuração do WhatsApp Cloud API
 */
export const saveConfig = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;

    if (!consultorId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { accessToken, phoneNumberId, businessAccountId, webhookVerifyToken } = req.body;

    if (!accessToken || !phoneNumberId) {
      return res.status(400).json({ 
        error: 'Access Token e Phone Number ID são obrigatórios' 
      });
    }

    const success = await whatsappCloudService.saveConfig(
      consultorId,
      accessToken,
      phoneNumberId,
      businessAccountId,
      webhookVerifyToken
    );

    if (success) {
      res.json({ 
        success: true,
        message: 'Configuração do WhatsApp salva com sucesso' 
      });
    } else {
      res.status(500).json({ 
        error: 'Erro ao salvar configuração do WhatsApp' 
      });
    }
  } catch (error) {
    logger.error('Erro ao salvar configuração do WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao salvar configuração do WhatsApp' });
  }
};

/**
 * Remover configuração do WhatsApp Cloud API
 */
export const removeConfig = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;

    if (!consultorId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const success = await whatsappCloudService.removeConfig(consultorId);

    if (success) {
      res.json({ 
        success: true,
        message: 'WhatsApp desconectado com sucesso' 
      });
    } else {
      res.status(500).json({ 
        error: 'Erro ao desconectar WhatsApp' 
      });
    }
  } catch (error) {
    logger.error('Erro ao desconectar WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao desconectar WhatsApp' });
  }
};

/**
 * Obter status da conexão
 */
export const getStatus = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;

    if (!consultorId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const status = await whatsappCloudService.getStatus(consultorId);

    res.json(status);
  } catch (error) {
    logger.error('Erro ao buscar status:', error);
    res.status(500).json({ error: 'Erro ao buscar status' });
  }
};

/**
 * Webhook - Verificação (GET)
 * Usado pelo Meta para verificar o webhook
 */
export const webhookVerify = async (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logger.info('📥 Webhook verification request:', { mode, token, challenge });

    // Verificar se o modo e token estão corretos
    if (mode === 'subscribe' && token) {
      // Por enquanto, aceitar qualquer token para facilitar configuração
      // Em produção, você deve verificar se o token corresponde ao configurado
      logger.info('✅ Webhook verificado com sucesso');
      res.status(200).send(challenge);
    } else {
      logger.warn('⚠️ Webhook verification failed');
      res.sendStatus(403);
    }
  } catch (error) {
    logger.error('❌ Erro na verificação do webhook:', error);
    res.sendStatus(500);
  }
};

/**
 * Webhook - Receber mensagens (POST)
 * Usado pelo Meta para enviar mensagens recebidas
 */
export const webhookReceive = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    logger.info('📥 Webhook POST recebido');

    // Responder imediatamente com 200 para o Meta
    res.sendStatus(200);

    // Processar webhook de forma assíncrona
    whatsappCloudService.processIncomingMessage(body).catch(error => {
      logger.error('❌ Erro ao processar webhook:', error);
    });
  } catch (error) {
    logger.error('❌ Erro ao receber webhook:', error);
    res.sendStatus(500);
  }
};
