import { Request, Response } from 'express';
import pool from '../config/database';

// Função para converter snake_case para camelCase
const toCamelCase = (obj: any) => {
  const converted: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    converted[camelKey] = obj[key];
  }
  return converted;
};

// GET /api/funis/etapas - Listar todas as etapas do consultor
export const getEtapas = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;

    console.log('📥 Carregando etapas do funil do consultor:', consultorId);

    const [rows] = await pool.query(
      `SELECT 
        e.id,
        e.nome,
        e.cor,
        e.ordem,
        e.sistema,
        e.ativo,
        e.data_criacao as dataCriacao,
        e.data_atualizacao as dataAtualizacao,
        COUNT(l.id) as totalLeads
       FROM etapas_funil e
       LEFT JOIN leads l ON l.status = e.id AND l.consultor_id = e.consultor_id AND l.consultor_id = ?
       WHERE e.consultor_id = ? AND e.ativo = TRUE
       GROUP BY e.id
       ORDER BY e.ordem ASC`,
      [consultorId, consultorId]
    );

    const etapas = rows as any[];
    console.log('📊 Total de etapas encontradas:', etapas.length);

    res.json(etapas);
  } catch (error) {
    console.error('❌ Erro ao buscar etapas:', error);
    res.status(500).json({ error: 'Erro ao buscar etapas do funil' });
  }
};

// POST /api/funis/etapas - Criar nova etapa
export const createEtapa = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;
    const { nome, cor } = req.body;

    if (!nome || !cor) {
      return res.status(400).json({ error: 'Nome e cor são obrigatórios' });
    }

    console.log('➕ Criando nova etapa:', { nome, cor, consultorId });

    // Verificar se já existe uma etapa com o mesmo nome
    const [existingRows] = await pool.query(
      'SELECT id FROM etapas_funil WHERE consultor_id = ? AND nome = ? AND ativo = TRUE',
      [consultorId, nome]
    );

    if ((existingRows as any[]).length > 0) {
      return res.status(400).json({ error: 'Já existe uma etapa com este nome' });
    }

    // Buscar a maior ordem atual
    const [maxOrdemRows] = await pool.query(
      'SELECT COALESCE(MAX(ordem), 0) as maxOrdem FROM etapas_funil WHERE consultor_id = ?',
      [consultorId]
    );

    const maxOrdem = (maxOrdemRows as any[])[0].maxOrdem;
    const novaOrdem = maxOrdem + 1;

    // Gerar ID baseado no nome
    const id = nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    // Inserir nova etapa
    await pool.query(
      `INSERT INTO etapas_funil (id, consultor_id, nome, cor, ordem, sistema, ativo)
       VALUES (?, ?, ?, ?, ?, FALSE, TRUE)`,
      [id, consultorId, nome, cor, novaOrdem]
    );

    // Buscar a etapa criada com o contador de leads
    const [newEtapaRows] = await pool.query(
      `SELECT 
        e.id,
        e.nome,
        e.cor,
        e.ordem,
        e.sistema,
        e.ativo,
        e.data_criacao as dataCriacao,
        e.data_atualizacao as dataAtualizacao,
        COUNT(l.id) as totalLeads
       FROM etapas_funil e
       LEFT JOIN leads l ON l.status = e.id AND l.consultor_id = e.consultor_id
       WHERE e.id = ? AND e.consultor_id = ?
       GROUP BY e.id`,
      [id, consultorId]
    );

    console.log('✅ Etapa criada com sucesso:', id);
    
    const novaEtapa = (newEtapaRows as any[])[0];
    
    // Emitir evento Socket.IO para atualização em tempo real
    const io = (req as any).app.get('io');
    if (io) {
      io.to(`consultor_${consultorId}`).emit('funil_etapa_criada', novaEtapa);
      console.log('📡 Evento Socket.IO emitido: funil_etapa_criada');
    }
    
    res.status(201).json(novaEtapa);
  } catch (error) {
    console.error('❌ Erro ao criar etapa:', error);
    res.status(500).json({ error: 'Erro ao criar etapa' });
  }
};

// PUT /api/funis/etapas/:id - Atualizar etapa existente
export const updateEtapa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const consultorId = req.user?.id;
    const { nome, cor } = req.body;

    console.log('✏️ Atualizando etapa:', { id, nome, cor });

    // Verificar se a etapa pertence ao consultor
    const [etapaRows] = await pool.query(
      'SELECT sistema FROM etapas_funil WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    const etapas = etapaRows as any[];
    if (etapas.length === 0) {
      return res.status(404).json({ error: 'Etapa não encontrada' });
    }

    // Não permitir edição do nome de etapas do sistema
    if (etapas[0].sistema && nome) {
      return res.status(400).json({ error: 'Não é permitido alterar o nome de etapas do sistema' });
    }

    // Verificar nome duplicado (se está alterando o nome)
    if (nome) {
      const [duplicateRows] = await pool.query(
        'SELECT id FROM etapas_funil WHERE consultor_id = ? AND nome = ? AND id != ? AND ativo = TRUE',
        [consultorId, nome, id]
      );

      if ((duplicateRows as any[]).length > 0) {
        return res.status(400).json({ error: 'Já existe uma etapa com este nome' });
      }
    }

    // Construir query de atualização dinamicamente
    const updates: string[] = [];
    const values: any[] = [];

    if (nome) {
      updates.push('nome = ?');
      values.push(nome);
    }
    if (cor) {
      updates.push('cor = ?');
      values.push(cor);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updates.push('data_atualizacao = NOW()');
    values.push(id, consultorId);

    await pool.query(
      `UPDATE etapas_funil SET ${updates.join(', ')} WHERE id = ? AND consultor_id = ?`,
      values
    );

    // Buscar etapa atualizada
    const [updatedRows] = await pool.query(
      `SELECT 
        e.id,
        e.nome,
        e.cor,
        e.ordem,
        e.sistema,
        e.ativo,
        e.data_criacao as dataCriacao,
        e.data_atualizacao as dataAtualizacao,
        COUNT(l.id) as totalLeads
       FROM etapas_funil e
       LEFT JOIN leads l ON l.status = e.id AND l.consultor_id = e.consultor_id
       WHERE e.id = ? AND e.consultor_id = ?
       GROUP BY e.id`,
      [id, consultorId]
    );

    console.log('✅ Etapa atualizada com sucesso');
    
    const etapaAtualizada = (updatedRows as any[])[0];
    
    // Emitir evento Socket.IO para atualização em tempo real
    const io = (req as any).app.get('io');
    if (io) {
      io.to(`consultor_${consultorId}`).emit('funil_etapa_atualizada', etapaAtualizada);
      console.log('📡 Evento Socket.IO emitido: funil_etapa_atualizada');
    }
    
    res.json(etapaAtualizada);
  } catch (error) {
    console.error('❌ Erro ao atualizar etapa:', error);
    res.status(500).json({ error: 'Erro ao atualizar etapa' });
  }
};

// DELETE /api/funis/etapas/:id - Deletar etapa
export const deleteEtapa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const consultorId = req.user?.id;

    console.log('🗑️ Deletando etapa:', id);

    // Verificar se a etapa pertence ao consultor e se é do sistema
    const [etapaRows] = await pool.query(
      'SELECT sistema FROM etapas_funil WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    const etapas = etapaRows as any[];
    if (etapas.length === 0) {
      return res.status(404).json({ error: 'Etapa não encontrada' });
    }

    if (etapas[0].sistema) {
      return res.status(400).json({ error: 'Não é permitido deletar etapas do sistema' });
    }

    // Verificar se existem leads nesta etapa
    const [leadsRows] = await pool.query(
      'SELECT COUNT(*) as total FROM leads WHERE status = ? AND consultor_id = ?',
      [id, consultorId]
    );

    const totalLeads = (leadsRows as any[])[0].total;
    if (totalLeads > 0) {
      return res.status(400).json({ 
        error: `Esta etapa possui ${totalLeads} leads ativos. Mova-os antes de deletar.`,
        totalLeads
      });
    }

    // Marcar como inativa em vez de deletar (soft delete)
    await pool.query(
      'UPDATE etapas_funil SET ativo = FALSE, data_atualizacao = NOW() WHERE id = ? AND consultor_id = ?',
      [id, consultorId]
    );

    console.log('✅ Etapa deletada com sucesso');
    
    // Emitir evento Socket.IO para atualização em tempo real
    const io = (req as any).app.get('io');
    if (io) {
      io.to(`consultor_${consultorId}`).emit('funil_etapa_deletada', { id });
      console.log('📡 Evento Socket.IO emitido: funil_etapa_deletada');
    }
    
    res.json({ message: 'Etapa deletada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar etapa:', error);
    res.status(500).json({ error: 'Erro ao deletar etapa' });
  }
};

// PUT /api/funis/etapas/reordenar - Reordenar etapas
export const reordenarEtapas = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;
    const { etapas } = req.body; // Array de { id, ordem }

    if (!Array.isArray(etapas) || etapas.length === 0) {
      return res.status(400).json({ error: 'Lista de etapas inválida' });
    }

    console.log('🔄 Reordenando etapas:', etapas.length);

    // Atualizar ordem de cada etapa
    for (const etapa of etapas) {
      await pool.query(
        'UPDATE etapas_funil SET ordem = ?, data_atualizacao = NOW() WHERE id = ? AND consultor_id = ?',
        [etapa.ordem, etapa.id, consultorId]
      );
    }

    // Buscar todas as etapas atualizadas
    const [updatedRows] = await pool.query(
      `SELECT 
        e.id,
        e.nome,
        e.cor,
        e.ordem,
        e.sistema,
        e.ativo,
        e.data_criacao as dataCriacao,
        e.data_atualizacao as dataAtualizacao,
        COUNT(l.id) as totalLeads
       FROM etapas_funil e
       LEFT JOIN leads l ON l.status = e.id AND l.consultor_id = e.consultor_id
       WHERE e.consultor_id = ? AND e.ativo = TRUE
       GROUP BY e.id
       ORDER BY e.ordem ASC`,
      [consultorId]
    );

    console.log('✅ Etapas reordenadas com sucesso');
    
    // Emitir evento Socket.IO para atualização em tempo real
    const io = (req as any).app.get('io');
    if (io) {
      io.to(`consultor_${consultorId}`).emit('funil_etapas_reordenadas', updatedRows);
      console.log('📡 Evento Socket.IO emitido: funil_etapas_reordenadas');
    }
    
    res.json(updatedRows);
  } catch (error) {
    console.error('❌ Erro ao reordenar etapas:', error);
    res.status(500).json({ error: 'Erro ao reordenar etapas' });
  }
};
