import { Request, Response } from 'express';
import pool from '../config/database';
import { logger } from '../config/logger';

// Função para normalizar telefone para WhatsApp
// Remove o 9º dígito após o DDD (números novos brasileiros)
const normalizarTelefoneParaWhatsApp = (telefone: string): string => {
  // Remove tudo que não é número
  const apenasNumeros = telefone.replace(/\D/g, '');
  
  logger.info('📱 Normalizando telefone:', telefone);
  logger.info('📱 Apenas números:', apenasNumeros);
  
  // Se tem 13 dígitos (55 + DDD com 2 dígitos + 9 + 8 dígitos)
  // Exemplo: 5581987780566
  if (apenasNumeros.length === 13 && apenasNumeros.startsWith('55')) {
    const ddi = apenasNumeros.substring(0, 2); // 55
    const ddd = apenasNumeros.substring(2, 4); // 81
    const nono = apenasNumeros.substring(4, 5); // 9
    const resto = apenasNumeros.substring(5); // 87780566
    
    // Se o quinto dígito é 9, remove ele
    if (nono === '9') {
      const numeroNormalizado = ddi + ddd + resto;
      logger.info('📱 Número normalizado (removeu 9):', numeroNormalizado);
      return numeroNormalizado;
    }
  }
  
  logger.info('📱 Número mantido sem alteração:', apenasNumeros);
  return apenasNumeros;
};

// Função para converter snake_case para camelCase
const toCamelCase = (obj: any) => {
  const converted: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    let value = obj[key];
    
    // Parse JSON fields
    if ((key === 'notas_internas' || key === 'tags') && typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Se falhar o parse, mantém o valor original
      }
    }
    
    converted[camelKey] = value;
  }
  return converted;
};

export const getLeads = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;
    
    // Paginação
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    logger.info('📥 Carregando leads do consultor:', consultorId);
    logger.info('📄 Paginação:', { page, limit, offset });

    // Buscar leads com paginação
    const [rows] = await pool.query(
      `SELECT * FROM leads 
       WHERE consultor_id = ? 
       ORDER BY data_criacao DESC
       LIMIT ? OFFSET ?`,
      [consultorId, limit, offset]
    );

    // Contar total de leads
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as total FROM leads WHERE consultor_id = ?',
      [consultorId]
    );

    const leadsArray = rows as any[];
    const total = (countRows as any[])[0].total;
    const totalPages = Math.ceil(total / limit);
    
    logger.info('📊 Total de leads:', total);
    logger.info('📄 Página atual:', page, 'de', totalPages);
    logger.info('📋 Leads nesta página:', leadsArray.length);

    // Converter para camelCase
    const leads = leadsArray.map(toCamelCase);
    
    // Retornar com informações de paginação
    res.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
};

export const getLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const consultorId = req.user?.id;

    const [rows] = await pool.query(
      'SELECT * FROM leads WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    const leadsArray = rows as any[];
    if (leadsArray.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json(toCamelCase(leadsArray[0]));
  } catch (error) {
    logger.error('Erro ao buscar lead:', error);
    res.status(500).json({ error: 'Erro ao buscar lead' });
  }
};

export const createLead = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;
    const {
      nome,
      telefone,
      email,
      origem,
      observacoes
    } = req.body;

    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }

    // Normalizar telefone para WhatsApp (remove o 9º dígito)
    const telefoneNormalizado = normalizarTelefoneParaWhatsApp(telefone);
    
    // Verificar se já existe um lead com este telefone
    const [existenteRows] = await pool.query(
      'SELECT id, nome FROM leads WHERE telefone = ? AND consultor_id = ?',
      [telefoneNormalizado, consultorId]
    );

    const leadExistenteArray = existenteRows as any[];
    if (leadExistenteArray.length > 0) {
      return res.status(400).json({ 
        error: 'Já existe um lead com este número de telefone',
        leadExistente: {
          id: leadExistenteArray[0].id,
          nome: leadExistenteArray[0].nome
        }
      });
    }
    
    const insertResult = await pool.query(
      `INSERT INTO leads (
        nome, telefone, email, origem, status, consultor_id, observacoes,
        data_criacao, data_atualizacao
      ) VALUES (?, ?, ?, ?, 'novo', ?, ?, NOW(), NOW())`,
      [nome, telefoneNormalizado, email, origem || 'Manual', consultorId, observacoes]
    );

    // Buscar lead criado para retornar com todos os campos
    const newLeadId = (insertResult as any).insertId;
    const [leadRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [newLeadId]);
    
    res.status(201).json(toCamelCase((leadRows as any[])[0]));
  } catch (error) {
    logger.error('Erro ao criar lead:', error);
    res.status(500).json({ error: 'Erro ao criar lead' });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const consultorId = req.user?.id;
    const updates = req.body;

    logger.info('');
    logger.info('================================================');
    logger.info('🔄 ATUALIZANDO LEAD:', id);
    logger.info('================================================');
    logger.info('📝 Dados recebidos do frontend:', JSON.stringify(updates, null, 2));
    logger.info('📊 Campos recebidos:', Object.keys(updates));

    // Buscar configurações de comissão do banco
    const [comissaoRows] = await pool.query(
      'SELECT comissao_resposta, comissao_venda FROM configuracoes_comissao LIMIT 1'
    );
    const comissaoConfig = (comissaoRows as any[])[0];
    const comissaoResposta = parseFloat(comissaoConfig?.comissao_resposta || 2.00);
    const comissaoVenda = parseFloat(comissaoConfig?.comissao_venda || 15.00);
    const comissaoTotal = comissaoResposta + comissaoVenda;

    // Verificar se o lead pertence ao consultor
    const [checkRows] = await pool.query(
      'SELECT id FROM leads WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    if ((checkRows as any[]).length === 0) {
      logger.info('❌ Lead não encontrado');
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    // Filtrar campos undefined e construir query dinâmica
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
    const values = fields.map((field) => {
      const value = updates[field];
      // Converter arrays/objetos para JSON
      if (field === 'notasInternas' || field === 'tags') {
        return JSON.stringify(value);
      }
      // Converter strings vazias para null em campos opcionais
      if (value === '' && ['email', 'cidade', 'modeloVeiculo', 'placaVeiculo', 'corVeiculo', 'anoVeiculo', 'observacoes', 'informacoesComerciais', 'mensalidade', 'fipe', 'plano'].includes(field)) {
        return null;
      }
      return value;
    });
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    const setClause = fields
      .map((field) => `${field.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`)
      .join(', ');

    logger.info('📝 Query SQL:', `UPDATE leads SET ${setClause}, data_atualizacao = NOW() WHERE id = ?`);
    logger.info('📊 Valores:', [...values, id]);

    await pool.query(
      `UPDATE leads 
       SET ${setClause}, data_atualizacao = NOW() 
       WHERE id = ?`,
      [...values, id]
    );

    logger.info('✅ Lead atualizado no banco de dados');

    // 🎯 SISTEMA DE COMISSÕES AUTOMÁTICAS PARA INDICADORES
    logger.info('🔍 [DEBUG] Verificando se status foi alterado...');
    logger.info('🔍 [DEBUG] fields:', fields);
    logger.info('🔍 [DEBUG] fields.includes("status"):', fields.includes('status'));
    
    if (fields.includes('status')) {
      logger.info('💰 Status alterado! Verificando comissões do indicador...');
      
      // Buscar se o lead tem indicador
      const [leadIndicadorRows] = await pool.query(
        'SELECT indicador_id FROM leads WHERE id = ?',
        [id]
      );
      
      const leadComIndicador = (leadIndicadorRows as any[])[0];
      
      if (leadComIndicador?.indicador_id) {
        logger.info('✅ Lead tem indicador:', leadComIndicador.indicador_id);
        
        // Buscar a indicação relacionada
        const [indicacaoRows] = await pool.query(
          'SELECT * FROM indicacoes WHERE lead_id = ?',
          [id]
        );
        
        const indicacao = (indicacaoRows as any[])[0];
        
        if (indicacao) {
          logger.info('✅ Indicação encontrada:', indicacao.id, 'Status atual:', indicacao.status);
          
          const novoStatus = updates.status;
          const indicadorId = leadComIndicador.indicador_id;
          
          // Aplicar regras de comissão baseadas no status
          if ((novoStatus === 'primeiro_contato' || novoStatus === 'proposta_enviada') && indicacao.status === 'enviado_crm') {
            logger.info(`💰 Liberando R$ ${comissaoResposta.toFixed(2)} bloqueados (primeiro contato/proposta enviada)`);
            
            // Liberar saldo bloqueado
            await pool.query(
              `UPDATE indicadores 
               SET saldo_disponivel = saldo_disponivel + ?,
                   saldo_bloqueado = saldo_bloqueado - ?,
                   indicacoes_respondidas = indicacoes_respondidas + 1
               WHERE id = ?`,
              [comissaoResposta, comissaoResposta, indicadorId]
            );
            
            // Atualizar indicação
            await pool.query(
              `UPDATE indicacoes 
               SET status = 'respondeu',
                   comissao_resposta = ?,
                   data_resposta = NOW()
               WHERE id = ?`,
              [comissaoResposta, indicacao.id]
            );
            
            // Registrar transação
            await pool.query(
              `INSERT INTO transacoes_indicador (
                indicador_id, indicacao_id, tipo, valor, saldo_anterior, saldo_novo, descricao
              ) SELECT 
                ?, ?, 'desbloqueio', ?, saldo_disponivel - ?, saldo_disponivel,
                'Comissão liberada - Lead respondeu'
               FROM indicadores WHERE id = ?`,
              [indicadorId, indicacao.id, comissaoResposta, comissaoResposta, indicadorId]
            );
            
            logger.info('✅ Comissão de resposta liberada com sucesso!');
            
          } else if (novoStatus === 'convertido' && indicacao.status === 'enviado_crm') {
            logger.info(`💰 Liberando R$ ${comissaoResposta.toFixed(2)} E adicionando R$ ${comissaoVenda.toFixed(2)} (direto para convertido)`);
            
            // Liberar comissão de resposta bloqueada E adicionar comissão de venda
            await pool.query(
              `UPDATE indicadores 
               SET saldo_disponivel = saldo_disponivel + ?,
                   saldo_bloqueado = saldo_bloqueado - ?,
                   indicacoes_respondidas = indicacoes_respondidas + 1,
                   indicacoes_convertidas = indicacoes_convertidas + 1,
                   vendas_para_proxima_caixa = vendas_para_proxima_caixa + 1
               WHERE id = ?`,
              [comissaoTotal, comissaoResposta, indicadorId]
            );
            
            // Atualizar indicação
            await pool.query(
              `UPDATE indicacoes 
               SET status = 'converteu',
                   comissao_resposta = ?,
                   comissao_venda = ?,
                   data_resposta = NOW(),
                   data_conversao = NOW()
               WHERE id = ?`,
              [comissaoResposta, comissaoVenda, indicacao.id]
            );
            
            // Registrar transação
            await pool.query(
              `INSERT INTO transacoes_indicador (
                indicador_id, indicacao_id, tipo, valor, saldo_anterior, saldo_novo, descricao
              ) SELECT 
                ?, ?, 'credito', ?, saldo_disponivel - ?, saldo_disponivel,
                CONCAT('Comissão completa - R$ ', ?, ' liberados + R$ ', ?, ' de venda')
               FROM indicadores WHERE id = ?`,
              [indicadorId, indicacao.id, comissaoTotal, comissaoTotal, comissaoResposta, comissaoVenda, indicadorId]
            );
            
            logger.info(`✅ Comissão completa adicionada! R$ ${comissaoTotal.toFixed(2)} total`);
            
          } else if (novoStatus === 'convertido' && indicacao.status === 'respondeu') {
            logger.info(`💰 Adicionando R$ ${comissaoVenda.toFixed(2)} de comissão de venda`);
            
            // Adicionar comissão de venda
            await pool.query(
              `UPDATE indicadores 
               SET saldo_disponivel = saldo_disponivel + ?,
                   indicacoes_convertidas = indicacoes_convertidas + 1,
                   vendas_para_proxima_caixa = vendas_para_proxima_caixa + 1
               WHERE id = ?`,
              [comissaoVenda, indicadorId]
            );
            
            // Atualizar indicação
            await pool.query(
              `UPDATE indicacoes 
               SET status = 'converteu',
                   comissao_venda = ?,
                   data_conversao = NOW()
               WHERE id = ?`,
              [comissaoVenda, indicacao.id]
            );
            
            // Registrar transação
            await pool.query(
              `INSERT INTO transacoes_indicador (
                indicador_id, indicacao_id, tipo, valor, saldo_anterior, saldo_novo, descricao
              ) SELECT 
                ?, ?, 'credito', ?, saldo_disponivel - ?, saldo_disponivel,
                'Comissão de venda - Lead convertido'
               FROM indicadores WHERE id = ?`,
              [indicadorId, indicacao.id, comissaoVenda, comissaoVenda, indicadorId]
            );
            
            logger.info('✅ Comissão de venda adicionada com sucesso!');
            
          } else if (indicacao.status === 'converteu' && (novoStatus === 'novo' || novoStatus === 'indicacao')) {
            logger.info(`🔄 Reversão COMPLETA - Removendo R$ ${comissaoVenda.toFixed(2)} E bloqueando R$ ${comissaoResposta.toFixed(2)}`);
            
            // Remover comissão de venda E bloquear comissão de resposta
            await pool.query(
              `UPDATE indicadores 
               SET saldo_disponivel = saldo_disponivel - ?,
                   saldo_bloqueado = saldo_bloqueado + ?,
                   indicacoes_convertidas = indicacoes_convertidas - 1,
                   indicacoes_respondidas = GREATEST(indicacoes_respondidas - 1, 0),
                   vendas_para_proxima_caixa = GREATEST(vendas_para_proxima_caixa - 1, 0)
               WHERE id = ?`,
              [comissaoTotal, comissaoResposta, indicadorId]
            );
            
            // Atualizar indicação para estado inicial
            await pool.query(
              `UPDATE indicacoes 
               SET status = 'enviado_crm',
                   comissao_venda = 0,
                   comissao_resposta = 0,
                   data_conversao = NULL,
                   data_resposta = NULL
               WHERE id = ?`,
              [indicacao.id]
            );
            
            // Registrar transação
            await pool.query(
              `INSERT INTO transacoes_indicador (
                indicador_id, indicacao_id, tipo, valor, saldo_anterior, saldo_novo, descricao
              ) SELECT 
                ?, ?, 'debito', ?, saldo_disponivel + ?, saldo_disponivel,
                CONCAT('Reversão completa - R$ ', ?, ' removidos e R$ ', ?, ' bloqueados')
               FROM indicadores WHERE id = ?`,
              [indicadorId, indicacao.id, comissaoTotal, comissaoTotal, comissaoVenda, comissaoResposta, indicadorId]
            );
            
            logger.info(`✅ Reversão completa! R$ ${comissaoVenda.toFixed(2)} removidos + R$ ${comissaoResposta.toFixed(2)} bloqueados`);
            
          } else if (indicacao.status === 'converteu' && novoStatus !== 'convertido') {
            logger.info(`🔄 Revertendo venda - Removendo R$ ${comissaoVenda.toFixed(2)} de comissão`);
            
            // Remover comissão de venda
            await pool.query(
              `UPDATE indicadores 
               SET saldo_disponivel = saldo_disponivel - ?,
                   indicacoes_convertidas = indicacoes_convertidas - 1,
                   vendas_para_proxima_caixa = GREATEST(vendas_para_proxima_caixa - 1, 0)
               WHERE id = ?`,
              [comissaoVenda, indicadorId]
            );
            
            // Atualizar indicação
            await pool.query(
              `UPDATE indicacoes 
               SET status = 'respondeu',
                   comissao_venda = 0,
                   data_conversao = NULL
               WHERE id = ?`,
              [indicacao.id]
            );
            
            // Registrar transação
            await pool.query(
              `INSERT INTO transacoes_indicador (
                indicador_id, indicacao_id, tipo, valor, saldo_anterior, saldo_novo, descricao
              ) SELECT 
                ?, ?, 'debito', ?, saldo_disponivel + ?, saldo_disponivel,
                CONCAT('Reversão de venda - Status alterado para ', ?)
               FROM indicadores WHERE id = ?`,
              [indicadorId, indicacao.id, comissaoVenda, comissaoVenda, novoStatus, indicadorId]
            );
            
            logger.info(`✅ Venda revertida com sucesso! R$ ${comissaoVenda.toFixed(2)} removidos`);
            
          } else if (indicacao.status === 'respondeu' && (novoStatus === 'novo' || novoStatus === 'indicacao')) {
            logger.info(`🔄 Revertendo liberação dos R$ ${comissaoResposta.toFixed(2)} - Bloqueando novamente`);
            
            // Bloquear saldo novamente
            await pool.query(
              `UPDATE indicadores 
               SET saldo_disponivel = saldo_disponivel - ?,
                   saldo_bloqueado = saldo_bloqueado + ?,
                   indicacoes_respondidas = GREATEST(indicacoes_respondidas - 1, 0)
               WHERE id = ?`,
              [comissaoResposta, comissaoResposta, indicadorId]
            );
            
            // Atualizar indicação
            await pool.query(
              `UPDATE indicacoes 
               SET status = 'enviado_crm',
                   comissao_resposta = 0,
                   data_resposta = NULL
               WHERE id = ?`,
              [indicacao.id]
            );
            
            // Registrar transação
            await pool.query(
              `INSERT INTO transacoes_indicador (
                indicador_id, indicacao_id, tipo, valor, saldo_anterior, saldo_novo, descricao
              ) SELECT 
                ?, ?, 'bloqueio', ?, saldo_disponivel + ?, saldo_disponivel,
                'Reversão de resposta - Saldo bloqueado novamente'
               FROM indicadores WHERE id = ?`,
              [indicadorId, indicacao.id, comissaoResposta, comissaoResposta, indicadorId]
            );
            
            logger.info(`✅ R$ ${comissaoResposta.toFixed(2)} bloqueados novamente!`);
            
          } else if (novoStatus === 'perdido' && indicacao.status === 'enviado_crm') {
            logger.info(`❌ Movendo R$ ${comissaoResposta.toFixed(2)} para saldo perdido`);
            
            // Mover saldo bloqueado para perdido
            await pool.query(
              `UPDATE indicadores 
               SET saldo_bloqueado = saldo_bloqueado - ?,
                   saldo_perdido = saldo_perdido + ?
               WHERE id = ?`,
              [comissaoResposta, comissaoResposta, indicadorId]
            );
            
            // Atualizar indicação
            await pool.query(
              `UPDATE indicacoes 
               SET status = 'engano'
               WHERE id = ?`,
              [indicacao.id]
            );
            
            // Registrar transação
            await pool.query(
              `INSERT INTO transacoes_indicador (
                indicador_id, indicacao_id, tipo, valor, saldo_anterior, saldo_novo, descricao
              ) SELECT 
                ?, ?, 'debito', ?, saldo_bloqueado + ?, saldo_bloqueado,
                'Comissão perdida - Lead marcado como perdido'
               FROM indicadores WHERE id = ?`,
              [indicadorId, indicacao.id, comissaoResposta, comissaoResposta, indicadorId]
            );
            
            logger.info('✅ Saldo movido para perdido');
          }
          
          // Emitir Socket.IO para o indicador atualizar em tempo real
          const io = (req.app as any).get('io');
          if (io) {
            logger.info('📡 Emitindo evento para indicador atualizar saldo');
            io.to(`indicador_${indicadorId}`).emit('saldo_atualizado', {
              indicadorId,
              leadId: id,
              status: novoStatus,
              timestamp: new Date().toISOString()
            });
          }
        }
      } else {
        logger.info('ℹ️ Lead não tem indicador (lead manual)');
      }
    }

    // Se o status foi atualizado, emitir evento Socket.IO para admins
    if (fields.includes('status')) {
      const io = (req.app as any).get('io');
      logger.info('🔍 DEBUG: Status foi atualizado! io existe?', !!io);
      if (io) {
        logger.info('📡 Emitindo evento lead_status_atualizado para admins');
        logger.info('� Dados do evento:', { leadId: id, consultorId, status: updates.status });
        io.to('admins').emit('lead_status_atualizado', {
          leadId: id,
          consultorId,
          status: updates.status,
          timestamp: new Date().toISOString()
        });
        logger.info('✅ Evento emitido com sucesso!');
      } else {
        logger.error('❌ Socket.IO não encontrado no app!');
      }
    }

    // Buscar lead atualizado
    const [updatedRows] = await pool.query(
      'SELECT * FROM leads WHERE id = ?',
      [id]
    );

    res.json(toCamelCase((updatedRows as any[])[0]));
  } catch (error) {
    logger.error('❌ Erro ao atualizar lead:', error);
    logger.error('❌ Detalhes do erro:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar lead',
      details: (error as Error).message 
    });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const consultorId = req.user?.id;

    const deleteResult = await pool.query(
      'DELETE FROM leads WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    if ((deleteResult as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json({ message: 'Lead deletado com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar lead:', error);
    res.status(500).json({ error: 'Erro ao deletar lead' });
  }
};

export const addTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tag } = req.body;
    const consultorId = req.user?.id;

    if (!tag) {
      return res.status(400).json({ error: 'Tag é obrigatória' });
    }

    // Buscar tags atuais
    const [tagRows] = await pool.query(
      'SELECT tags FROM leads WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    const tagArray = tagRows as any[];
    if (tagArray.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const tagsAtuais = tagArray[0].tags ? JSON.parse(tagArray[0].tags) : [];

    if (tagsAtuais.includes(tag)) {
      return res.status(400).json({ error: 'Tag já existe' });
    }

    tagsAtuais.push(tag);

    await pool.query(
      `UPDATE leads 
       SET tags = ?, data_atualizacao = NOW() 
       WHERE id = ?`,
      [JSON.stringify(tagsAtuais), id]
    );

    const [updatedTagRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);
    res.json(toCamelCase((updatedTagRows as any[])[0]));
  } catch (error) {
    logger.error('Erro ao adicionar tag:', error);
    res.status(500).json({ error: 'Erro ao adicionar tag' });
  }
};

export const removeTag = async (req: Request, res: Response) => {
  try {
    const { id, tag } = req.params;
    const consultorId = req.user?.id;

    const [removeTagRows] = await pool.query(
      'SELECT tags FROM leads WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    const removeTagArray = removeTagRows as any[];
    if (removeTagArray.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const tagsAtuais = removeTagArray[0].tags ? JSON.parse(removeTagArray[0].tags) : [];
    const novasTags = tagsAtuais.filter((t: string) => t !== tag);

    await pool.query(
      `UPDATE leads 
       SET tags = ?, data_atualizacao = NOW() 
       WHERE id = ?`,
      [JSON.stringify(novasTags), id]
    );

    const [updatedRemoveTagRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);
    res.json(toCamelCase((updatedRemoveTagRows as any[])[0]));
  } catch (error) {
    logger.error('Erro ao remover tag:', error);
    res.status(500).json({ error: 'Erro ao remover tag' });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const consultorId = req.user?.id;

    logger.info('🔄 Atualizando status do lead:', id, 'para:', status);

    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }

    // Verificar se o status é válido
    const statusValidos = ['novo', 'primeiro_contato', 'proposta_enviada', 'convertido', 'perdido'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    // Verificar se o lead pertence ao consultor
    const [statusCheckRows] = await pool.query(
      'SELECT id FROM leads WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    if ((statusCheckRows as any[]).length === 0) {
      logger.info('❌ Lead não encontrado');
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    await pool.query(
      `UPDATE leads 
       SET status = ?, data_atualizacao = NOW() 
       WHERE id = ?`,
      [status, id]
    );

    logger.info('✅ Status atualizado com sucesso');

    // Emitir evento Socket.IO para admins atualizarem em tempo real
    const io = (req.app as any).get('io');
    logger.info('🔍 DEBUG: io existe?', !!io);
    if (io) {
      logger.info('📡 Emitindo evento lead_status_atualizado para admins');
      logger.info('📊 Dados do evento:', { leadId: id, consultorId, status });
      io.to('admins').emit('lead_status_atualizado', {
        leadId: id,
        consultorId,
        status,
        timestamp: new Date().toISOString()
      });
      logger.info('✅ Evento emitido com sucesso!');
    } else {
      logger.error('❌ Socket.IO não encontrado no app!');
    }

    // Buscar lead atualizado
    const [statusUpdatedRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);
    res.json(toCamelCase((statusUpdatedRows as any[])[0]));
  } catch (error) {
    logger.error('❌ Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
};
