import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { whatsappService } from '../services/whatsappService';
import { logger } from './config/logger';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar consultor no banco
    const [rows] = await pool.query(
      'SELECT id, nome, email, senha, telefone, avatar, sessao_whatsapp, status_conexao, numero_whatsapp, ativo FROM consultores WHERE email = ?',
      [email]
    ) as any;

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const consultor = rows[0];

    // Verificar se o usuário está ativo
    if (consultor.ativo === false || consultor.ativo === 0) {
      return res.status(403).json({ error: 'Usuário Bloqueado' });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, consultor.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Atualizar último acesso
    await pool.query(
      'UPDATE consultores SET ultimo_acesso = NOW() WHERE id = ?',
      [consultor.id]
    );

    // Gerar token JWT
    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      { id: consultor.id, email: consultor.email },
      secret,
      { expiresIn: '7d' }
    );

    // Verificar status real do WhatsApp
    let statusWhatsapp = whatsappService.getStatus(consultor.id);
    let statusConexao = 'offline';
    
    if (statusWhatsapp.connected) {
      statusConexao = 'online';
    } else if (statusWhatsapp.hasSession) {
      statusConexao = 'connecting';
    } else {
      // Se não está conectado, tentar reconectar sessão existente
      logger.info('🔍 Verificando se existe sessão salva para reconectar...');
      const reconectado = await whatsappService.tryReconnectExistingSessions(consultor.id);
      
      if (reconectado) {
        // Aguardar um momento para a conexão estabelecer
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar novamente o status
        statusWhatsapp = whatsappService.getStatus(consultor.id);
        if (statusWhatsapp.connected) {
          statusConexao = 'online';
        } else {
          statusConexao = 'connecting';
        }
      }
    }

    // Atualizar status no banco
    await pool.query(
      'UPDATE consultores SET status_conexao = ? WHERE id = ?',
      [statusConexao, consultor.id]
    );

    // Não retornar a senha
    delete consultor.senha;

    // Converter para camelCase e adicionar status
    const consultorResponse = {
      id: consultor.id,
      nome: consultor.nome,
      email: consultor.email,
      telefone: consultor.telefone,
      avatar: consultor.avatar,
      sessaoWhatsapp: consultor.sessao_whatsapp,
      statusConexao: statusConexao,
      numeroWhatsapp: consultor.numero_whatsapp,
      dataCriacao: consultor.data_criacao,
      ultimoAcesso: consultor.ultimo_acesso
    };

    res.json({
      token,
      consultor: consultorResponse
    });
  } catch (error) {
    logger.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;

    const [rows] = await pool.query(
      'SELECT id, nome, email, telefone, avatar, sessao_whatsapp, status_conexao, numero_whatsapp, data_criacao, ultimo_acesso FROM consultores WHERE id = ?',
      [consultorId]
    ) as any;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Consultor não encontrado' });
    }

    const consultor = rows[0];

    // Converter para camelCase
    const consultorResponse = {
      id: consultor.id,
      nome: consultor.nome,
      email: consultor.email,
      telefone: consultor.telefone,
      avatar: consultor.avatar,
      sessaoWhatsapp: consultor.sessao_whatsapp,
      statusConexao: consultor.status_conexao || 'offline',
      numeroWhatsapp: consultor.numero_whatsapp,
      dataCriacao: consultor.data_criacao,
      ultimoAcesso: consultor.ultimo_acesso
    };

    res.json({ consultor: consultorResponse });
  } catch (error) {
    logger.error('Erro ao buscar consultor:', error);
    res.status(500).json({ error: 'Erro ao buscar consultor' });
  }
};
