import { Request, Response } from 'express';
import pool from '../config/database';
import { logger } from '../config/logger';

// =====================================================
// COMISSÕES
// =====================================================

export const getComissoes = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM configuracoes_comissao LIMIT 1');
    const comissoes = (rows as any[])[0];
    
    if (!comissoes) {
      return res.status(404).json({ error: 'Configurações não encontradas' });
    }
    
    res.json({
      comissaoResposta: parseFloat(comissoes.comissao_resposta),
      comissaoVenda: parseFloat(comissoes.comissao_venda)
    });
  } catch (error) {
    logger.error('Erro ao buscar comissões:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações de comissão' });
  }
};

export const updateComissoes = async (req: Request, res: Response) => {
  try {
    const { comissaoResposta, comissaoVenda } = req.body;
    
    if (!comissaoResposta || !comissaoVenda) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    if (comissaoResposta < 0 || comissaoVenda < 0) {
      return res.status(400).json({ error: 'Valores não podem ser negativos' });
    }
    
    await pool.query(
      `UPDATE configuracoes_comissao 
       SET comissao_resposta = ?, comissao_venda = ? 
       WHERE id = 1`,
      [comissaoResposta, comissaoVenda]
    );
    
    res.json({ 
      message: 'Comissões atualizadas com sucesso',
      comissaoResposta: parseFloat(comissaoResposta),
      comissaoVenda: parseFloat(comissaoVenda)
    });
  } catch (error) {
    logger.error('Erro ao atualizar comissões:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações de comissão' });
  }
};

// =====================================================
// LOOTBOX
// =====================================================

export const getLootbox = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM configuracoes_lootbox LIMIT 1');
    const lootbox = (rows as any[])[0];
    
    if (!lootbox) {
      return res.status(404).json({ error: 'Configurações não encontradas' });
    }
    
    res.json({
      // Lootbox de Indicações
      indicacoesNecessarias: lootbox.indicacoes_necessarias,
      premioMinimoIndicacoes: parseFloat(lootbox.premio_minimo_indicacoes),
      premioMaximoIndicacoes: parseFloat(lootbox.premio_maximo_indicacoes),
      probabilidadeBaixoIndicacoes: lootbox.probabilidade_baixo_indicacoes,
      probabilidadeMedioIndicacoes: lootbox.probabilidade_medio_indicacoes,
      probabilidadeAltoIndicacoes: lootbox.probabilidade_alto_indicacoes,
      
      // Lootbox de Vendas
      vendasNecessarias: lootbox.vendas_necessarias,
      premioMinimoVendas: parseFloat(lootbox.premio_minimo_vendas),
      premioMaximoVendas: parseFloat(lootbox.premio_maximo_vendas),
      probabilidadeBaixoVendas: lootbox.probabilidade_baixo_vendas,
      probabilidadeMedioVendas: lootbox.probabilidade_medio_vendas,
      probabilidadeAltoVendas: lootbox.probabilidade_alto_vendas
    });
  } catch (error) {
    logger.error('Erro ao buscar lootbox:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações de lootbox' });
  }
};

export const updateLootbox = async (req: Request, res: Response) => {
  try {
    const { 
      // Lootbox de Indicações
      indicacoesNecessarias,
      premioMinimoIndicacoes,
      premioMaximoIndicacoes,
      probabilidadeBaixoIndicacoes,
      probabilidadeMedioIndicacoes,
      probabilidadeAltoIndicacoes,
      
      // Lootbox de Vendas
      vendasNecessarias, 
      premioMinimoVendas, 
      premioMaximoVendas, 
      probabilidadeBaixoVendas, 
      probabilidadeMedioVendas, 
      probabilidadeAltoVendas
    } = req.body;
    
    // Validações - Indicações
    if (!indicacoesNecessarias || !premioMinimoIndicacoes || !premioMaximoIndicacoes || 
        probabilidadeBaixoIndicacoes === undefined || probabilidadeMedioIndicacoes === undefined || probabilidadeAltoIndicacoes === undefined) {
      return res.status(400).json({ error: 'Todos os campos de indicações são obrigatórios' });
    }
    
    // Validações - Vendas
    if (!vendasNecessarias || !premioMinimoVendas || !premioMaximoVendas || 
        probabilidadeBaixoVendas === undefined || probabilidadeMedioVendas === undefined || probabilidadeAltoVendas === undefined) {
      return res.status(400).json({ error: 'Todos os campos de vendas são obrigatórios' });
    }
    
    if (indicacoesNecessarias < 1) {
      return res.status(400).json({ error: 'Indicações necessárias deve ser no mínimo 1' });
    }
    
    if (vendasNecessarias < 1) {
      return res.status(400).json({ error: 'Vendas necessárias deve ser no mínimo 1' });
    }
    
    if (premioMinimoIndicacoes < 0 || premioMaximoIndicacoes < 0) {
      return res.status(400).json({ error: 'Prêmios de indicações não podem ser negativos' });
    }
    
    if (premioMinimoVendas < 0 || premioMaximoVendas < 0) {
      return res.status(400).json({ error: 'Prêmios de vendas não podem ser negativos' });
    }
    
    if (premioMinimoIndicacoes >= premioMaximoIndicacoes) {
      return res.status(400).json({ error: 'Prêmio mínimo de indicações deve ser menor que o máximo' });
    }
    
    if (premioMinimoVendas >= premioMaximoVendas) {
      return res.status(400).json({ error: 'Prêmio mínimo de vendas deve ser menor que o máximo' });
    }
    
    const somaProbabilidadesIndicacoes = probabilidadeBaixoIndicacoes + probabilidadeMedioIndicacoes + probabilidadeAltoIndicacoes;
    if (somaProbabilidadesIndicacoes !== 100) {
      return res.status(400).json({ error: 'Soma das probabilidades de indicações deve ser 100%' });
    }
    
    const somaProbabilidadesVendas = probabilidadeBaixoVendas + probabilidadeMedioVendas + probabilidadeAltoVendas;
    if (somaProbabilidadesVendas !== 100) {
      return res.status(400).json({ error: 'Soma das probabilidades de vendas deve ser 100%' });
    }
    
    await pool.query(
      `UPDATE configuracoes_lootbox 
       SET indicacoes_necessarias = ?, premio_minimo_indicacoes = ?, premio_maximo_indicacoes = ?,
           probabilidade_baixo_indicacoes = ?, probabilidade_medio_indicacoes = ?, probabilidade_alto_indicacoes = ?,
           vendas_necessarias = ?, premio_minimo_vendas = ?, premio_maximo_vendas = ?,
           probabilidade_baixo_vendas = ?, probabilidade_medio_vendas = ?, probabilidade_alto_vendas = ?
       WHERE id = 1`,
      [
        indicacoesNecessarias, premioMinimoIndicacoes, premioMaximoIndicacoes,
        probabilidadeBaixoIndicacoes, probabilidadeMedioIndicacoes, probabilidadeAltoIndicacoes,
        vendasNecessarias, premioMinimoVendas, premioMaximoVendas,
        probabilidadeBaixoVendas, probabilidadeMedioVendas, probabilidadeAltoVendas
      ]
    );
    
    // 🔥 EMITIR EVENTO SOCKET.IO PARA TODOS OS INDICADORES EM TEMPO REAL
    const io = (global as any).io;
    if (io) {
      logger.info('📡 Emitindo atualização de configurações de lootbox para todos os indicadores...');
      
      // Buscar todos os indicadores ativos
      const [indicadoresRows] = await pool.query('SELECT id FROM indicadores WHERE ativo = true');
      const indicadores = indicadoresRows as any[];
      
      // Emitir para cada indicador
      indicadores.forEach((indicador: any) => {
        io.to(`indicador_${indicador.id}`).emit('configuracoes_lootbox_atualizadas', {
          indicacoesNecessarias,
          vendasNecessarias,
          premioMinimoIndicacoes: parseFloat(premioMinimoIndicacoes),
          premioMaximoIndicacoes: parseFloat(premioMaximoIndicacoes),
          premioMinimoVendas: parseFloat(premioMinimoVendas),
          premioMaximoVendas: parseFloat(premioMaximoVendas),
          timestamp: new Date().toISOString()
        });
      });
      
      logger.info(`✅ Evento emitido para ${indicadores.length} indicadores`);
    }
    
    res.json({ 
      message: 'Configurações de lootbox atualizadas com sucesso',
      indicacoesNecessarias,
      premioMinimoIndicacoes: parseFloat(premioMinimoIndicacoes),
      premioMaximoIndicacoes: parseFloat(premioMaximoIndicacoes),
      probabilidadeBaixoIndicacoes,
      probabilidadeMedioIndicacoes,
      probabilidadeAltoIndicacoes,
      vendasNecessarias,
      premioMinimoVendas: parseFloat(premioMinimoVendas),
      premioMaximoVendas: parseFloat(premioMaximoVendas),
      probabilidadeBaixoVendas,
      probabilidadeMedioVendas,
      probabilidadeAltoVendas
    });
  } catch (error) {
    logger.error('Erro ao atualizar lootbox:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações de lootbox' });
  }
};

// =====================================================
// MENSAGENS AUTOMÁTICAS
// =====================================================

export const getMensagens = async (req: Request, res: Response) => {
  try {
    const { tipo } = req.query;
    
    let query = 'SELECT * FROM mensagens_automaticas';
    const params: any[] = [];
    
    if (tipo) {
      query += ' WHERE tipo = ?';
      params.push(tipo);
    }
    
    query += ' ORDER BY tipo, ordem';
    
    const [rows] = await pool.query(query, params);
    
    res.json(rows);
  } catch (error) {
    logger.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens automáticas' });
  }
};

export const createMensagem = async (req: Request, res: Response) => {
  try {
    const { tipo, mensagem, ativo = true } = req.body;
    
    if (!tipo || !mensagem) {
      return res.status(400).json({ error: 'Tipo e mensagem são obrigatórios' });
    }
    
    const tiposValidos = ['boas_vindas', 'proposta', 'conversao', 'lootbox'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }
    
    // Buscar próxima ordem
    const [ordemRows] = await pool.query(
      'SELECT COALESCE(MAX(ordem), 0) + 1 as proxima_ordem FROM mensagens_automaticas WHERE tipo = ?',
      [tipo]
    );
    const proximaOrdem = (ordemRows as any[])[0].proxima_ordem;
    
    const [result] = await pool.query(
      'INSERT INTO mensagens_automaticas (tipo, mensagem, ativo, ordem) VALUES (?, ?, ?, ?)',
      [tipo, mensagem, ativo, proximaOrdem]
    );
    
    const insertId = (result as any).insertId;
    
    const [newMensagem] = await pool.query(
      'SELECT * FROM mensagens_automaticas WHERE id = ?',
      [insertId]
    );
    
    res.status(201).json((newMensagem as any[])[0]);
  } catch (error) {
    logger.error('Erro ao criar mensagem:', error);
    res.status(500).json({ error: 'Erro ao criar mensagem automática' });
  }
};

export const updateMensagem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mensagem, ativo } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (mensagem !== undefined) {
      updates.push('mensagem = ?');
      values.push(mensagem);
    }
    
    if (ativo !== undefined) {
      updates.push('ativo = ?');
      values.push(ativo);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    
    values.push(id);
    
    await pool.query(
      `UPDATE mensagens_automaticas SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const [updatedMensagem] = await pool.query(
      'SELECT * FROM mensagens_automaticas WHERE id = ?',
      [id]
    );
    
    if ((updatedMensagem as any[]).length === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    
    res.json((updatedMensagem as any[])[0]);
  } catch (error) {
    logger.error('Erro ao atualizar mensagem:', error);
    res.status(500).json({ error: 'Erro ao atualizar mensagem automática' });
  }
};

export const deleteMensagem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query(
      'DELETE FROM mensagens_automaticas WHERE id = ?',
      [id]
    );
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    
    res.json({ message: 'Mensagem deletada com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar mensagem:', error);
    res.status(500).json({ error: 'Erro ao deletar mensagem automática' });
  }
};

// =====================================================
// MENSAGENS E ÁUDIOS PRÉ-DEFINIDOS
// =====================================================

export const getMensagensPredefinidas = async (req: Request, res: Response) => {
  try {
    const { tipo } = req.query;
    
    let query = 'SELECT * FROM mensagens_predefinidas WHERE ativo = TRUE';
    const params: any[] = [];
    
    if (tipo && (tipo === 'mensagem' || tipo === 'audio')) {
      query += ' AND tipo = ?';
      params.push(tipo);
    }
    
    query += ' ORDER BY ordem ASC, data_criacao DESC';
    
    const [rows] = await pool.query(query, params);
    
    res.json(rows);
  } catch (error) {
    logger.error('Erro ao buscar mensagens pré-definidas:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens pré-definidas' });
  }
};

export const createMensagemPredefinida = async (req: Request, res: Response) => {
  try {
    const { tipo, titulo, conteudo, arquivoUrl, duracaoAudio } = req.body;
    
    if (!tipo || !titulo) {
      return res.status(400).json({ error: 'Tipo e título são obrigatórios' });
    }
    
    if (tipo !== 'mensagem' && tipo !== 'audio') {
      return res.status(400).json({ error: 'Tipo inválido. Use "mensagem" ou "audio"' });
    }
    
    if (tipo === 'mensagem' && !conteudo) {
      return res.status(400).json({ error: 'Conteúdo é obrigatório para mensagens de texto' });
    }
    
    if (tipo === 'audio' && !arquivoUrl) {
      return res.status(400).json({ error: 'Arquivo de áudio é obrigatório' });
    }
    
    // Buscar próxima ordem
    const [ordemRows] = await pool.query(
      'SELECT COALESCE(MAX(ordem), 0) + 1 as proxima_ordem FROM mensagens_predefinidas'
    );
    const proximaOrdem = (ordemRows as any[])[0].proxima_ordem;
    
    const [result] = await pool.query(
      `INSERT INTO mensagens_predefinidas (tipo, titulo, conteudo, arquivo_url, duracao_audio, ordem, ativo) 
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [tipo, titulo, conteudo || null, arquivoUrl || null, duracaoAudio || null, proximaOrdem]
    );
    
    const insertId = (result as any).insertId;
    
    const [novaMensagem] = await pool.query(
      'SELECT * FROM mensagens_predefinidas WHERE id = ?',
      [insertId]
    );
    
    // 🔥 EMITIR EVENTO SOCKET.IO EM TEMPO REAL
    const io = (global as any).io;
    if (io) {
      logger.info('📡 Emitindo nova mensagem pré-definida para todos os consultores...');
      io.emit('mensagem_predefinida_criada', (novaMensagem as any[])[0]);
    }
    
    res.status(201).json((novaMensagem as any[])[0]);
  } catch (error) {
    logger.error('Erro ao criar mensagem pré-definida:', error);
    res.status(500).json({ error: 'Erro ao criar mensagem pré-definida' });
  }
};

export const updateMensagemPredefinida = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { titulo, conteudo, ativo, ordem } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (titulo !== undefined) {
      updates.push('titulo = ?');
      values.push(titulo);
    }
    
    if (conteudo !== undefined) {
      updates.push('conteudo = ?');
      values.push(conteudo);
    }
    
    if (ativo !== undefined) {
      updates.push('ativo = ?');
      values.push(ativo);
    }
    
    if (ordem !== undefined) {
      updates.push('ordem = ?');
      values.push(ordem);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    
    values.push(id);
    
    await pool.query(
      `UPDATE mensagens_predefinidas SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const [updatedMensagem] = await pool.query(
      'SELECT * FROM mensagens_predefinidas WHERE id = ?',
      [id]
    );
    
    if ((updatedMensagem as any[]).length === 0) {
      return res.status(404).json({ error: 'Mensagem pré-definida não encontrada' });
    }
    
    // 🔥 EMITIR EVENTO SOCKET.IO EM TEMPO REAL
    const io = (global as any).io;
    if (io) {
      logger.info('📡 Emitindo atualização de mensagem pré-definida para todos os consultores...');
      io.emit('mensagem_predefinida_atualizada', (updatedMensagem as any[])[0]);
    }
    
    res.json((updatedMensagem as any[])[0]);
  } catch (error) {
    logger.error('Erro ao atualizar mensagem pré-definida:', error);
    res.status(500).json({ error: 'Erro ao atualizar mensagem pré-definida' });
  }
};

export const deleteMensagemPredefinida = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query(
      'DELETE FROM mensagens_predefinidas WHERE id = ?',
      [id]
    );
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Mensagem pré-definida não encontrada' });
    }
    
    // 🔥 EMITIR EVENTO SOCKET.IO EM TEMPO REAL
    const io = (global as any).io;
    if (io) {
      logger.info('📡 Emitindo remoção de mensagem pré-definida para todos os consultores...');
      io.emit('mensagem_predefinida_deletada', { id });
    }
    
    res.json({ message: 'Mensagem pré-definida deletada com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar mensagem pré-definida:', error);
    res.status(500).json({ error: 'Erro ao deletar mensagem pré-definida' });
  }
};

export const uploadAudioPredefinido = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    const arquivoUrl = `/uploads/${req.file.filename}`;
    
    res.json({ 
      arquivoUrl,
      filename: req.file.filename,
      message: 'Áudio enviado com sucesso' 
    });
  } catch (error) {
    logger.error('Erro ao fazer upload de áudio pré-definido:', error);
    res.status(500).json({ error: 'Erro ao fazer upload de áudio' });
  }
};
