import { Request, Response } from 'express';
import pool from '../config/database';

// Função para normalizar telefone para WhatsApp
// Remove o 9º dígito após o DDD (números novos brasileiros)
const normalizarTelefoneParaWhatsApp = (telefone: string): string => {
  // Remove tudo que não é número
  const apenasNumeros = telefone.replace(/\D/g, '');
  
  console.log('📱 Normalizando telefone:', telefone);
  console.log('📱 Apenas números:', apenasNumeros);
  
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
      console.log('📱 Número normalizado (removeu 9):', numeroNormalizado);
      return numeroNormalizado;
    }
  }
  
  console.log('📱 Número mantido sem alteração:', apenasNumeros);
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

    console.log('📥 Carregando leads do consultor:', consultorId);

    const [rows] = await pool.query(
      `SELECT * FROM leads 
       WHERE consultor_id = ? 
       ORDER BY data_criacao DESC`,
      [consultorId]
    );

    const leadsArray = rows as any[];
    console.log('📊 Total de leads encontrados:', leadsArray.length);
    console.log('📋 Status dos leads:', leadsArray.map((l: any) => ({ id: l.id, nome: l.nome, status: l.status })));

    // Converter para camelCase
    const leads = leadsArray.map(toCamelCase);
    res.json(leads);
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
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
    console.error('Erro ao buscar lead:', error);
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
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ error: 'Erro ao criar lead' });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const consultorId = req.user?.id;
    const updates = req.body;

    console.log('');
    console.log('================================================');
    console.log('🔄 ATUALIZANDO LEAD:', id);
    console.log('================================================');
    console.log('📝 Dados recebidos do frontend:', JSON.stringify(updates, null, 2));
    console.log('📊 Campos recebidos:', Object.keys(updates));

    // Verificar se o lead pertence ao consultor
    const [checkRows] = await pool.query(
      'SELECT id FROM leads WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    if ((checkRows as any[]).length === 0) {
      console.log('❌ Lead não encontrado');
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

    console.log('📝 Query SQL:', `UPDATE leads SET ${setClause}, data_atualizacao = NOW() WHERE id = ?`);
    console.log('📊 Valores:', [...values, id]);

    await pool.query(
      `UPDATE leads 
       SET ${setClause}, data_atualizacao = NOW() 
       WHERE id = ?`,
      [...values, id]
    );

    console.log('✅ Lead atualizado no banco de dados');

    // 🎯 SISTEMA DE COMISSÕES AUTOMÁTICAS PARA INDICADORES
    console.log('🔍 [DEBUG] Verificando se status foi alterado...');
    console.log('🔍 [DEBUG] fields:', fields);
    console.log('🔍 [DEBUG] fields.includes("status"):', fields.includes('status'));
    
    if (fields.includes('status')) {
      console.log('💰 Status alterado! Verificando comissões do indicador...');
      
      // Buscar se o lead tem indicador
      const [leadIndicadorRows] = await pool.query(
        'SELECT indicador_id FROM leads WHERE id = ?',
        [id]
      );
      
      const leadComIndicador = (leadIndicadorRows as any[])[0];
      
      if (leadComIndicador?.indicador_id) {
        console.log('✅ Lead tem indicador:', leadComIndicador.indicador_id);
        
        // Buscar a indicação relacionada
        const [indicacaoRows] = await pool.query(
          'SELECT * FROM indicacoes WHERE lead_id = ?',
          [id]
        );
        
        const indicacao = (indicacaoRows as any[])[0];
        
        if (indicacao) {
          console.log('✅ Indicação encontrada:', indicacao.id, 'Status atual:', indicacao.status);
          
          const novoStatus = updates.status;
          const indicadorId = leadComIndicador.indicador_id;
          
          // Aplicar regras de comissão baseadas no status
          if (novoStatus === 'primeiro_contato' && indicacao.status === 'enviado_crm') {
            console.log('💰 Liberando R$ 2,00 bloqueados (primeiro contato)');
            
            // Liberar saldo bloqueado
            await pool.query(
              `UPDATE indicadores 
               SET saldo_disponivel = saldo_disponivel + 2.00,
                   saldo_bloqueado = saldo_bloqueado - 2.00,
                   indicacoes_respondidas = indicacoes_respondidas + 1
               WHERE id = ?`,
              [indicadorId]
            );
            
            // Atualizar indicação
            await pool.query(
              `UPDATE indicacoes 
               SET status = 'respondeu',
                   comissao_resposta = 2.00,
                   data_resposta = NOW()
               WHERE id = ?`,
              [indicacao.id]
            );
            
            // Registrar transação
            await pool.query(
              `INSERT INTO transacoes_indicador (
                indicador_id, indicacao_id, tipo, valor, saldo_anterior, saldo_novo, descricao
              ) SELECT 
                ?, ?, 'liberacao', 2.00, saldo_disponivel - 2.00, saldo_disponivel,
                'Comissão liberada - Lead respondeu'
               FROM indicadores WHERE id = ?`,
              [indicadorId, indicacao.id, indicadorId]
            );
            
            console.log('✅ Comissão de resposta liberada com sucesso!');
            
          } else if (novoStatus === 'convertido' && indicacao.status !== 'converteu') {
            console.log('💰 Adicionando R$ 15,00 de comissão de venda');
            
            // Adicionar comissão de venda
            await pool.query(
              `UPDATE indicadores 
               SET saldo_disponivel = saldo_disponivel + 15.00,
                   indicacoes_convertidas = indicacoes_convertidas + 1,
                   vendas_para_proxima_caixa = vendas_para_proxima_caixa + 1
               WHERE id = ?`,
              [indicadorId]
            );
            
            // Atualizar indicação
            await pool.query(
              `UPDATE indicacoes 
               SET status = 'converteu',
                   comissao_venda = 15.00,
                   data_conversao = NOW()
               WHERE id = ?`,
              [indicacao.id]
            );
            
            // Registrar transação
            await pool.query(
              `INSERT INTO transacoes_indicador (
                indicador_id, indicacao_id, tipo, valor, saldo_anterior, saldo_novo, descricao
              ) SELECT 
                ?, ?, 'comissao_venda', 15.00, saldo_disponivel - 15.00, saldo_disponivel,
                'Comissão de venda - Lead convertido'
               FROM indicadores WHERE id = ?`,
              [indicadorId, indicacao.id, indicadorId]
            );
            
            console.log('✅ Comissão de venda adicionada com sucesso!');
            
          } else if (novoStatus === 'perdido' && indicacao.status === 'enviado_crm') {
            console.log('❌ Movendo R$ 2,00 para saldo perdido');
            
            // Mover saldo bloqueado para perdido
            await pool.query(
              `UPDATE indicadores 
               SET saldo_bloqueado = saldo_bloqueado - 2.00,
                   saldo_perdido = saldo_perdido + 2.00
               WHERE id = ?`,
              [indicadorId]
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
                ?, ?, 'perda', 2.00, saldo_bloqueado + 2.00, saldo_bloqueado,
                'Comissão perdida - Lead marcado como perdido'
               FROM indicadores WHERE id = ?`,
              [indicadorId, indicacao.id, indicadorId]
            );
            
            console.log('✅ Saldo movido para perdido');
          }
          
          // Emitir Socket.IO para o indicador atualizar em tempo real
          const io = (req.app as any).get('io');
          if (io) {
            console.log('📡 Emitindo evento para indicador atualizar saldo');
            io.to(`indicador_${indicadorId}`).emit('saldo_atualizado', {
              indicadorId,
              leadId: id,
              status: novoStatus,
              timestamp: new Date().toISOString()
            });
          }
        }
      } else {
        console.log('ℹ️ Lead não tem indicador (lead manual)');
      }
    }

    // Se o status foi atualizado, emitir evento Socket.IO para admins
    if (fields.includes('status')) {
      const io = (req.app as any).get('io');
      console.log('🔍 DEBUG: Status foi atualizado! io existe?', !!io);
      if (io) {
        console.log('📡 Emitindo evento lead_status_atualizado para admins');
        console.log('� Dados do evento:', { leadId: id, consultorId, status: updates.status });
        io.to('admins').emit('lead_status_atualizado', {
          leadId: id,
          consultorId,
          status: updates.status,
          timestamp: new Date().toISOString()
        });
        console.log('✅ Evento emitido com sucesso!');
      } else {
        console.error('❌ Socket.IO não encontrado no app!');
      }
    }

    // Buscar lead atualizado
    const [updatedRows] = await pool.query(
      'SELECT * FROM leads WHERE id = ?',
      [id]
    );

    res.json(toCamelCase((updatedRows as any[])[0]));
  } catch (error) {
    console.error('❌ Erro ao atualizar lead:', error);
    console.error('❌ Detalhes do erro:', error);
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
    console.error('Erro ao deletar lead:', error);
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
    console.error('Erro ao adicionar tag:', error);
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
    console.error('Erro ao remover tag:', error);
    res.status(500).json({ error: 'Erro ao remover tag' });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const consultorId = req.user?.id;

    console.log('🔄 Atualizando status do lead:', id, 'para:', status);

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
      console.log('❌ Lead não encontrado');
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    await pool.query(
      `UPDATE leads 
       SET status = ?, data_atualizacao = NOW() 
       WHERE id = ?`,
      [status, id]
    );

    console.log('✅ Status atualizado com sucesso');

    // Emitir evento Socket.IO para admins atualizarem em tempo real
    const io = (req.app as any).get('io');
    console.log('🔍 DEBUG: io existe?', !!io);
    if (io) {
      console.log('📡 Emitindo evento lead_status_atualizado para admins');
      console.log('📊 Dados do evento:', { leadId: id, consultorId, status });
      io.to('admins').emit('lead_status_atualizado', {
        leadId: id,
        consultorId,
        status,
        timestamp: new Date().toISOString()
      });
      console.log('✅ Evento emitido com sucesso!');
    } else {
      console.error('❌ Socket.IO não encontrado no app!');
    }

    // Buscar lead atualizado
    const [statusUpdatedRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);
    res.json(toCamelCase((statusUpdatedRows as any[])[0]));
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
};
