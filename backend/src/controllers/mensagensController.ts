import { Request, Response } from 'express';
import pool from '../config/database';
import { whatsappService } from '../services/whatsappService';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { logger } from '../config/logger';

// Configurar caminho do ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Função para converter áudio de webm para ogg
const convertWebmToOgg = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    logger.info('🔄 Iniciando conversão de áudio:', { inputPath, outputPath });
    
    ffmpeg(inputPath)
      .toFormat('ogg')
      .audioCodec('libopus') // Codec Opus para OGG
      .audioBitrate('128k')
      .on('start', (commandLine) => {
        logger.info('▶️ Comando FFmpeg:', commandLine);
      })
      .on('progress', (progress) => {
        logger.info('⏳ Progresso:', progress.percent ? `${progress.percent.toFixed(1)}%` : 'processando...');
      })
      .on('end', () => {
        logger.info('✅ Conversão concluída com sucesso!');
        resolve();
      })
      .on('error', (err) => {
        logger.error('❌ Erro na conversão:', err.message);
        reject(err);
      })
      .save(outputPath);
  });
};

export const getMensagens = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const consultorId = req.user?.id;

    logger.info('📥 [GET MENSAGENS] Lead ID:', leadId, 'Consultor ID:', consultorId);

    // Verificar se o lead existe (sem verificar consultor por enquanto)
    const [leadCheckRows] = await pool.query(
      'SELECT id, consultor_id FROM leads WHERE id = ?',
      [leadId]
    );

    const leadCheckArray = leadCheckRows as any[];
    logger.info('🔍 [GET MENSAGENS] Lead encontrado?', leadCheckArray.length > 0);
    if (leadCheckArray.length > 0) {
      logger.info('👤 [GET MENSAGENS] Consultor do lead:', leadCheckArray[0].consultor_id);
    }

    if (leadCheckArray.length === 0) {
      logger.error('❌ [GET MENSAGENS] Lead não encontrado no banco!');
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    // Buscar mensagens
    const [mensagensRows] = await pool.query(
      `SELECT * FROM mensagens 
       WHERE lead_id = ? 
       ORDER BY timestamp ASC`,
      [leadId]
    );

    const mensagensArray = mensagensRows as any[];
    logger.info('📨 [GET MENSAGENS] Total de mensagens encontradas:', mensagensArray.length);

    // Converter para camelCase
    const mensagens = mensagensArray.map((msg: any) => ({
      id: msg.id,
      leadId: msg.lead_id,
      consultorId: msg.consultor_id,
      conteudo: msg.conteudo,
      tipo: msg.tipo,
      remetente: msg.remetente,
      status: msg.status,
      mediaUrl: msg.media_url,
      mediaName: msg.media_name,
      timestamp: msg.timestamp
    }));

    res.json(mensagens);
  } catch (error) {
    logger.error('❌ [GET MENSAGENS] Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
};

export const enviarMensagem = async (req: Request, res: Response) => {
  try {
    const { leadId, conteudo, tipo = 'texto' } = req.body;
    const consultorId = req.user?.id;

    logger.info('📨 Recebendo pedido para enviar mensagem:', { leadId, consultorId, conteudoLength: conteudo?.length });

    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID é obrigatório' });
    }

    if (!conteudo) {
      return res.status(400).json({ error: 'Conteúdo é obrigatório' });
    }

    // Buscar telefone do lead
    const [leadRows] = await pool.query(
      'SELECT telefone FROM leads WHERE id = ? AND consultor_id = ?',
      [leadId, consultorId]
    );

    const leadArray = leadRows as any[];
    logger.info('🔍 Resultado busca lead:', leadArray.length);

    if (leadArray.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const telefone = leadArray[0].telefone;

    // Enviar via WhatsApp (já salva no banco dentro do whatsappService)
    try {
      await whatsappService.enviarMensagem(consultorId!, telefone, conteudo);
      logger.info('📤 Mensagem enviada via WhatsApp e salva no banco');
    } catch (whatsappError: any) {
      logger.error('⚠️ Erro ao enviar via WhatsApp:', whatsappError.message);
      return res.status(500).json({ error: 'Erro ao enviar mensagem: ' + whatsappError.message });
    }

    // Buscar a mensagem recém-salva pelo whatsappService
    logger.info('🔍 Buscando mensagem salva no banco...');
    const [mensagemRows] = await pool.query(
      `SELECT * FROM mensagens 
       WHERE lead_id = ? AND consultor_id = ? AND remetente = 'consultor'
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [leadId, consultorId]
    );

    const mensagemArray = mensagemRows as any[];
    let mensagemSalva: any = null;
    
    if (mensagemArray.length > 0) {
      mensagemSalva = mensagemArray[0];
      logger.info('✅ Mensagem encontrada no banco:', mensagemSalva.id);
    } else {
      logger.error('❌ Mensagem não encontrada no banco após envio');
      // Criar fallback
      mensagemSalva = {
        id: Date.now(),
        lead_id: leadId,
        consultor_id: consultorId,
        conteudo,
        tipo,
        remetente: 'consultor',
        status: 'enviada',
        media_url: null,
        media_name: null,
        timestamp: new Date().toISOString()
      };
    }

    // ✅ EMITIR via Socket.IO para todos os clientes do consultor
    try {
      const io = req.app.get('io');
      if (io) {
        logger.info('📡 Emitindo nova_mensagem via Socket.IO para consultor:', consultorId);
        io.to(`consultor_${consultorId}`).emit('nova_mensagem', {
          id: mensagemSalva.id,
          leadId: mensagemSalva.lead_id,
          consultorId: mensagemSalva.consultor_id,
          conteudo: mensagemSalva.conteudo,
          tipo: mensagemSalva.tipo,
          remetente: mensagemSalva.remetente,
          status: mensagemSalva.status,
          mediaUrl: mensagemSalva.media_url,
          mediaName: mensagemSalva.media_name,
          timestamp: mensagemSalva.timestamp
        });
        logger.info('✅ Evento emitido com sucesso');
      } else {
        logger.warn('⚠️ Socket.IO não disponível no req.app');
      }
    } catch (socketError) {
      logger.error('❌ Erro ao emitir via Socket.IO:', socketError);
    }

    res.status(201).json(mensagemSalva);
  } catch (error) {
    logger.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
};

export const marcarComoLida = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const consultorId = req.user?.id;

    // Verificar se o lead pertence ao consultor
    const [leadCheckRows2] = await pool.query(
      'SELECT id FROM leads WHERE id = ? AND consultor_id = ?',
      [leadId, consultorId]
    );

    if ((leadCheckRows2 as any[]).length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    // Marcar mensagens como lidas
    await pool.query(
      `UPDATE mensagens 
       SET status = 'lida' 
       WHERE lead_id = ? AND remetente = 'lead' AND status = 'enviada'`,
      [leadId]
    );

    // Zerar contador de não lidas
    await pool.query(
      'UPDATE leads SET mensagens_nao_lidas = 0 WHERE id = ?',
      [leadId]
    );

    res.json({ message: 'Mensagens marcadas como lidas' });
  } catch (error) {
    logger.error('Erro ao marcar mensagens como lidas:', error);
    res.status(500).json({ error: 'Erro ao marcar mensagens como lidas' });
  }
};

export const enviarAudio = async (req: Request, res: Response) => {
  try {
    const { leadId, duracao } = req.body;
    const consultorId = req.user?.id;
    
    logger.info('🎤 Recebendo pedido para enviar áudio:', { leadId, consultorId, duracao });
    logger.info('📁 Arquivo recebido:', req.file);

    if (!leadId) {
      logger.error('❌ Lead ID não fornecido');
      return res.status(400).json({ error: 'Lead ID é obrigatório' });
    }

    if (!req.file) {
      logger.error('❌ Arquivo de áudio não fornecido');
      return res.status(400).json({ error: 'Arquivo de áudio é obrigatório' });
    }

    // Buscar telefone do lead
    const [audioLeadRows] = await pool.query(
      'SELECT telefone FROM leads WHERE id = ? AND consultor_id = ?',
      [leadId, consultorId]
    );

    const audioLeadArray = audioLeadRows as any[];
    if (audioLeadArray.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const telefone = audioLeadArray[0].telefone;
    
    // Criar diretório de áudios se não existir
    // process.cwd() já aponta para a pasta backend quando o servidor está rodando
    const audioDir = path.join(process.cwd(), 'uploads', 'audios');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
      logger.info('📁 Diretório de áudios criado:', audioDir);
    }
    
    // Caminhos para arquivo temporário e final
    const audioNameWebm = `audio_${Date.now()}_${telefone}.webm`;
    const audioNameOgg = `audio_${Date.now()}_${telefone}.ogg`;
    const audioPathWebm = path.join(audioDir, audioNameWebm);
    const audioPathOgg = path.join(audioDir, audioNameOgg);
    
    // Mover arquivo temporário para o diretório de áudios
    fs.renameSync(req.file.path, audioPathWebm);
    logger.info('📁 Áudio .webm temporário salvo em:', audioPathWebm);
    
    // Converter de .webm para .ogg
    try {
      await convertWebmToOgg(audioPathWebm, audioPathOgg);
      logger.info('✅ Áudio convertido para .ogg:', audioPathOgg);
      
      // Deletar arquivo .webm temporário após conversão bem-sucedida
      fs.unlinkSync(audioPathWebm);
      logger.info('🗑️ Arquivo .webm temporário removido');
    } catch (conversionError) {
      logger.error('❌ Erro ao converter áudio:', conversionError);
      // Limpar arquivo temporário em caso de erro
      if (fs.existsSync(audioPathWebm)) {
        fs.unlinkSync(audioPathWebm);
      }
      return res.status(500).json({ error: 'Erro ao converter áudio para .ogg' });
    }
    
    // Usar o arquivo .ogg convertido
    const audioPath = audioPathOgg;
    const audioName = audioNameOgg;
    logger.info('📁 Usando áudio final .ogg:', audioPath);

    logger.info('📤 Preparando para enviar áudio via WhatsApp...', { consultorId, telefone, audioPath });
    
    // Enviar áudio via WhatsApp (já salva no banco dentro do whatsappService)
    try {
      await whatsappService.enviarArquivo(consultorId!, telefone, audioPath, 'audio');
      logger.info('✅ Áudio enviado via WhatsApp e salvo no banco');
    } catch (whatsappError: any) {
      logger.error('⚠️ Erro ao enviar áudio via WhatsApp:', whatsappError);
      logger.error('Stack:', whatsappError.stack);
      return res.status(500).json({ error: 'Erro ao enviar áudio via WhatsApp: ' + whatsappError.message });
    }

    // Buscar a mensagem de áudio recém-salva pelo whatsappService
    logger.info('🔍 Buscando mensagem de áudio salva no banco...');
    const [audioMensagemRows] = await pool.query(
      `SELECT * FROM mensagens 
       WHERE lead_id = ? AND consultor_id = ? AND tipo = 'audio' AND remetente = 'consultor'
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [leadId, consultorId]
    );

    const audioMensagemArray = audioMensagemRows as any[];
    if (audioMensagemArray.length > 0) {
      const mensagemSalva = audioMensagemArray[0];
      logger.info('✅ Mensagem de áudio encontrada no banco:', mensagemSalva.id);
      
      // ✅ EMITIR via Socket.IO para todos os clientes do consultor
      try {
        const io = req.app.get('io');
        if (io) {
          logger.info('📡 Emitindo nova_mensagem (áudio) via Socket.IO para consultor:', consultorId);
          io.to(`consultor_${consultorId}`).emit('nova_mensagem', {
            id: mensagemSalva.id,
            leadId: mensagemSalva.lead_id,
            consultorId: mensagemSalva.consultor_id,
            conteudo: mensagemSalva.conteudo,
            tipo: mensagemSalva.tipo,
            remetente: mensagemSalva.remetente,
            status: mensagemSalva.status,
            mediaUrl: mensagemSalva.media_url,
            mediaName: mensagemSalva.media_name,
            timestamp: mensagemSalva.timestamp
          });
          logger.info('✅ Evento de áudio emitido com sucesso, mediaUrl:', mensagemSalva.media_url);
        }
      } catch (socketError) {
        logger.error('❌ Erro ao emitir via Socket.IO:', socketError);
      }
      
      return res.status(201).json(mensagemSalva);
    }

    // Fallback caso não encontre (não deveria acontecer)
    logger.error('❌ Mensagem de áudio não encontrada no banco após envio');
    const duracaoSegundos = parseInt(duracao || '0', 10);
    const minutos = Math.floor(duracaoSegundos / 60);
    const segundos = duracaoSegundos % 60;
    
    res.status(201).json({
      id: Date.now(),
      leadId,
      consultorId,
      conteudo: `🎤 Áudio (${minutos}:${segundos.toString().padStart(2, '0')})`,
      tipo: 'audio',
      remetente: 'consultor',
      status: 'enviada',
      mediaUrl: `/uploads/audios/${audioName}`,
      mediaName: audioName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Erro ao enviar áudio:', error);
    res.status(500).json({ error: 'Erro ao enviar áudio' });
  }
};
