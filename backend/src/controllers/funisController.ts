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

// GET /api/funis/etapas - Listar todas as etapas
// Se usuário é ADMIN: retorna etapas globais
// Se usuário é CONSULTOR: retorna suas etapas personalizadas
export const getEtapas = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role; // 'admin' ou 'consultor'

    console.log('📥 Carregando etapas do funil - User:', userId, 'Role:', userRole);

    let query = '';
    let params: any[] = [];

    if (userRole === 'admin') {
      // ADMIN: Ver apenas etapas GLOBAIS (consultor_id = NULL)
      query = `SELECT 
        e.id,
        e.nome,
        e.cor,
        e.ordem,
        e.sistema,
        e.ativo,
        e.global,
        e.data_criacao as dataCriacao,
        e.data_atualizacao as dataAtualizacao,
        COUNT(DISTINCT l.id) as totalLeads
       FROM etapas_funil e
       LEFT JOIN leads l ON l.status = e.id
       WHERE e.consultor_id IS NULL AND e.ativo = TRUE AND e.global = TRUE
       GROUP BY e.id
       ORDER BY e.ordem ASC`;
      params = [];
    } else {
      // CONSULTOR: Ver apenas suas próprias etapas
      query = `SELECT 
        e.id,
        e.nome,
        e.cor,
        e.ordem,
        e.sistema,
        e.ativo,
        e.global,
        e.data_criacao as dataCriacao,
        e.data_atualizacao as dataAtualizacao,
        COUNT(l.id) as totalLeads
       FROM etapas_funil e
       LEFT JOIN leads l ON l.status = e.id AND l.consultor_id = e.consultor_id
       WHERE e.consultor_id = ? AND e.ativo = TRUE
       GROUP BY e.id
       ORDER BY e.ordem ASC`;
      params = [userId];
    }

    const [rows] = await pool.query(query, params);

    const etapas = rows as any[];
    console.log('📊 Total de etapas encontradas:', etapas.length, `(${userRole})`);

    res.json(etapas);
  } catch (error) {
    console.error('❌ Erro ao buscar etapas:', error);
    res.status(500).json({ error: 'Erro ao buscar etapas do funil' });
  }
};

// POST /api/funis/etapas - Criar nova etapa
// Admin cria etapas GLOBAIS (consultor_id = NULL)
// Consultor cria etapas PERSONALIZADAS
export const createEtapa = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { nome, cor } = req.body;

    if (!nome || !cor) {
      return res.status(400).json({ error: 'Nome e cor são obrigatórios' });
    }

    const isAdmin = userRole === 'admin';
    const consultorId = isAdmin ? null : userId;

    console.log('➕ Criando nova etapa:', { nome, cor, userId, role: userRole, isGlobal: isAdmin });

    // Verificar se já existe uma etapa com o mesmo nome
    let checkQuery = '';
    let checkParams: any[] = [];
    
    if (isAdmin) {
      checkQuery = 'SELECT id FROM etapas_funil WHERE consultor_id IS NULL AND nome = ? AND ativo = TRUE';
      checkParams = [nome];
    } else {
      checkQuery = 'SELECT id FROM etapas_funil WHERE consultor_id = ? AND nome = ? AND ativo = TRUE';
      checkParams = [consultorId, nome];
    }

    const [existingRows] = await pool.query(checkQuery, checkParams);

    if ((existingRows as any[]).length > 0) {
      return res.status(400).json({ error: 'Já existe uma etapa com este nome' });
    }

    // Buscar a maior ordem atual
    let maxOrdemQuery = '';
    let maxOrdemParams: any[] = [];
    
    if (isAdmin) {
      maxOrdemQuery = 'SELECT COALESCE(MAX(ordem), 0) as maxOrdem FROM etapas_funil WHERE consultor_id IS NULL';
      maxOrdemParams = [];
    } else {
      maxOrdemQuery = 'SELECT COALESCE(MAX(ordem), 0) as maxOrdem FROM etapas_funil WHERE consultor_id = ?';
      maxOrdemParams = [consultorId];
    }

    const [maxOrdemRows] = await pool.query(maxOrdemQuery, maxOrdemParams);
    const maxOrdem = (maxOrdemRows as any[])[0].maxOrdem;
    const novaOrdem = maxOrdem + 1;

    // Gerar ID baseado no nome
    const baseId = nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const id = isAdmin ? `${baseId}_global` : baseId;

    // Inserir nova etapa
    await pool.query(
      `INSERT INTO etapas_funil (id, consultor_id, nome, cor, ordem, sistema, ativo, global)
       VALUES (?, ?, ?, ?, ?, FALSE, TRUE, ?)`,
      [id, consultorId, nome, cor, novaOrdem, isAdmin]
    );

    // Buscar a etapa criada com o contador de leads
    let selectQuery = '';
    let selectParams: any[] = [];
    
    if (isAdmin) {
      selectQuery = `SELECT 
        e.id,
        e.nome,
        e.cor,
        e.ordem,
        e.sistema,
        e.ativo,
        e.global,
        e.data_criacao as dataCriacao,
        e.data_atualizacao as dataAtualizacao,
        COUNT(DISTINCT l.id) as totalLeads
       FROM etapas_funil e
       LEFT JOIN leads l ON l.status = e.id
       WHERE e.id = ? AND e.consultor_id IS NULL
       GROUP BY e.id`;
      selectParams = [id];
    } else {
      selectQuery = `SELECT 
        e.id,
        e.nome,
        e.cor,
        e.ordem,
        e.sistema,
        e.ativo,
        e.global,
        e.data_criacao as dataCriacao,
        e.data_atualizacao as dataAtualizacao,
        COUNT(l.id) as totalLeads
       FROM etapas_funil e
       LEFT JOIN leads l ON l.status = e.id AND l.consultor_id = e.consultor_id
       WHERE e.id = ? AND e.consultor_id = ?
       GROUP BY e.id`;
      selectParams = [id, consultorId];
    }

    const [newEtapaRows] = await pool.query(selectQuery, selectParams);
    console.log('✅ Etapa criada com sucesso:', id);
    
    const novaEtapa = (newEtapaRows as any[])[0];
    
    // Emitir evento Socket.IO para atualização em tempo real
    const io = (req as any).app.get('io');
    if (io) {
      if (isAdmin) {
        io.to('admins').emit('funil_etapa_criada', novaEtapa);
      } else {
        io.to(`consultor_${userId}`).emit('funil_etapa_criada', novaEtapa);
      }
      console.log('📡 Evento Socket.IO emitido: funil_etapa_criada');
    }
    
    res.status(201).json(novaEtapa);
  } catch (error) {
    console.error('❌ Erro ao criar etapa:', error);
    res.status(500).json({ error: 'Erro ao criar etapa' });
  }
};

// PUT /api/funis/etapas/:id - Atualizar etapa existente
// Admin pode editar etapas globais, Consultor edita suas próprias
export const updateEtapa = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { nome, cor } = req.body;

    const isAdmin = userRole === 'admin';

    console.log('✏️ Atualizando etapa:', { id, nome, cor, role: userRole });

    // Verificar se a etapa existe e pertence ao usuário correto
    let checkQuery = '';
    let checkParams: any[] = [];
    
    if (isAdmin) {
      checkQuery = 'SELECT sistema, global FROM etapas_funil WHERE id = ? AND consultor_id IS NULL';
      checkParams = [id];
    } else {
      checkQuery = 'SELECT sistema, global FROM etapas_funil WHERE id = ? AND consultor_id = ?';
      checkParams = [id, userId];
    }

    const [etapaRows] = await pool.query(checkQuery, checkParams);
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
      let dupQuery = '';
      let dupParams: any[] = [];
      
      if (isAdmin) {
        dupQuery = 'SELECT id FROM etapas_funil WHERE consultor_id IS NULL AND nome = ? AND id != ? AND ativo = TRUE';
        dupParams = [nome, id];
      } else {
        dupQuery = 'SELECT id FROM etapas_funil WHERE consultor_id = ? AND nome = ? AND id != ? AND ativo = TRUE';
        dupParams = [userId, nome, id];
      }

      const [duplicateRows] = await pool.query(dupQuery, dupParams);

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
    
    // Construir condição WHERE baseado no role
    let updateQuery = '';
    if (isAdmin) {
      values.push(id);
      updateQuery = `UPDATE etapas_funil SET ${updates.join(', ')} WHERE id = ? AND consultor_id IS NULL`;
    } else {
      values.push(id, userId);
      updateQuery = `UPDATE etapas_funil SET ${updates.join(', ')} WHERE id = ? AND consultor_id = ?`;
    }

    await pool.query(updateQuery, values);

    // Buscar etapa atualizada
    let selectQuery = '';
    let selectParams: any[] = [];
    
    if (isAdmin) {
      selectQuery = `SELECT 
        e.id,
        e.nome,
        e.cor,
        e.ordem,
        e.sistema,
        e.ativo,
        e.global,
        e.data_criacao as dataCriacao,
        e.data_atualizacao as dataAtualizacao,
        COUNT(DISTINCT l.id) as totalLeads
       FROM etapas_funil e
       LEFT JOIN leads l ON l.status = e.id
       WHERE e.id = ? AND e.consultor_id IS NULL
       GROUP BY e.id`;
      selectParams = [id];
    } else {
      selectQuery = `SELECT 
        e.id,
        e.nome,
        e.cor,
        e.ordem,
        e.sistema,
        e.ativo,
        e.global,
        e.data_criacao as dataCriacao,
        e.data_atualizacao as dataAtualizacao,
        COUNT(l.id) as totalLeads
       FROM etapas_funil e
       LEFT JOIN leads l ON l.status = e.id AND l.consultor_id = e.consultor_id
       WHERE e.id = ? AND e.consultor_id = ?
       GROUP BY e.id`;
      selectParams = [id, userId];
    }

    const [updatedRows] = await pool.query(selectQuery, selectParams);

    console.log('✅ Etapa atualizada com sucesso');
    
    const etapaAtualizada = (updatedRows as any[])[0];
    
    // Emitir evento Socket.IO para atualização em tempo real
    const io = (req as any).app.get('io');
    if (io) {
      if (isAdmin) {
        io.to('admins').emit('funil_etapa_atualizada', etapaAtualizada);
      } else {
        io.to(`consultor_${userId}`).emit('funil_etapa_atualizada', etapaAtualizada);
      }
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
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const isAdmin = userRole === 'admin';

    console.log('🗑️ Deletando etapa:', id, 'Role:', userRole);

    // Verificar se a etapa existe e pertence ao usuário correto
    let checkQuery = '';
    let checkParams: any[] = [];
    
    if (isAdmin) {
      checkQuery = 'SELECT sistema FROM etapas_funil WHERE id = ? AND consultor_id IS NULL';
      checkParams = [id];
    } else {
      checkQuery = 'SELECT sistema FROM etapas_funil WHERE id = ? AND consultor_id = ?';
      checkParams = [id, userId];
    }

    const [etapaRows] = await pool.query(checkQuery, checkParams);
    const etapas = etapaRows as any[];
    
    if (etapas.length === 0) {
      return res.status(404).json({ error: 'Etapa não encontrada' });
    }

    if (etapas[0].sistema) {
      return res.status(400).json({ error: 'Não é permitido deletar etapas do sistema' });
    }

    // Verificar se existem leads nesta etapa
    let leadsQuery = '';
    let leadsParams: any[] = [];
    
    if (isAdmin) {
      leadsQuery = 'SELECT COUNT(DISTINCT id) as total FROM leads WHERE status = ?';
      leadsParams = [id];
    } else {
      leadsQuery = 'SELECT COUNT(*) as total FROM leads WHERE status = ? AND consultor_id = ?';
      leadsParams = [id, userId];
    }

    const [leadsRows] = await pool.query(leadsQuery, leadsParams);
    const totalLeads = (leadsRows as any[])[0].total;
    
    if (totalLeads > 0) {
      return res.status(400).json({ 
        error: `Esta etapa possui ${totalLeads} leads ativos. Mova-os antes de deletar.`,
        totalLeads
      });
    }

    // Marcar como inativa em vez de deletar (soft delete)
    let deleteQuery = '';
    let deleteParams: any[] = [];
    
    if (isAdmin) {
      deleteQuery = 'UPDATE etapas_funil SET ativo = FALSE, data_atualizacao = NOW() WHERE id = ? AND consultor_id IS NULL';
      deleteParams = [id];
    } else {
      deleteQuery = 'UPDATE etapas_funil SET ativo = FALSE, data_atualizacao = NOW() WHERE id = ? AND consultor_id = ?';
      deleteParams = [id, userId];
    }

    await pool.query(deleteQuery, deleteParams);

    console.log('✅ Etapa deletada com sucesso');
    
    // Emitir evento Socket.IO para atualização em tempo real
    const io = (req as any).app.get('io');
    if (io) {
      if (isAdmin) {
        io.to('admins').emit('funil_etapa_deletada', { id });
      } else {
        io.to(`consultor_${userId}`).emit('funil_etapa_deletada', { id });
      }
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
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { etapas } = req.body; // Array de { id, ordem }
    const isAdmin = userRole === 'admin';

    if (!Array.isArray(etapas) || etapas.length === 0) {
      return res.status(400).json({ error: 'Lista de etapas inválida' });
    }

    console.log('🔄 Reordenando etapas:', etapas.length, 'Role:', userRole);

    // Atualizar ordem de cada etapa
    for (const etapa of etapas) {
      let updateQuery = '';
      let updateParams: any[] = [];
      
      if (isAdmin) {
        updateQuery = 'UPDATE etapas_funil SET ordem = ?, data_atualizacao = NOW() WHERE id = ? AND consultor_id IS NULL';
        updateParams = [etapa.ordem, etapa.id];
      } else {
        updateQuery = 'UPDATE etapas_funil SET ordem = ?, data_atualizacao = NOW() WHERE id = ? AND consultor_id = ?';
        updateParams = [etapa.ordem, etapa.id, userId];
      }
      
      await pool.query(updateQuery, updateParams);
    }

    // Buscar todas as etapas atualizadas
    let selectQuery = '';
    let selectParams: any[] = [];
    
    if (isAdmin) {
      selectQuery = `SELECT 
        e.id,
        e.nome,
        e.cor,
        e.ordem,
        e.sistema,
        e.ativo,
        e.global,
        e.data_criacao as dataCriacao,
        e.data_atualizacao as dataAtualizacao,
        COUNT(DISTINCT l.id) as totalLeads
       FROM etapas_funil e
       LEFT JOIN leads l ON l.status = e.id
       WHERE e.consultor_id IS NULL AND e.ativo = TRUE
       GROUP BY e.id
       ORDER BY e.ordem ASC`;
      selectParams = [];
    } else {
      selectQuery = `SELECT 
        e.id,
        e.nome,
        e.cor,
        e.ordem,
        e.sistema,
        e.ativo,
        e.global,
        e.data_criacao as dataCriacao,
        e.data_atualizacao as dataAtualizacao,
        COUNT(l.id) as totalLeads
       FROM etapas_funil e
       LEFT JOIN leads l ON l.status = e.id AND l.consultor_id = e.consultor_id
       WHERE e.consultor_id = ? AND e.ativo = TRUE
       GROUP BY e.id
       ORDER BY e.ordem ASC`;
      selectParams = [userId];
    }

    const [updatedRows] = await pool.query(selectQuery, selectParams);

    console.log('✅ Etapas reordenadas com sucesso');
    
    // Emitir evento Socket.IO para atualização em tempo real
    const io = (req as any).app.get('io');
    if (io) {
      if (isAdmin) {
        io.to('admins').emit('funil_etapas_reordenadas', updatedRows);
      } else {
        io.to(`consultor_${userId}`).emit('funil_etapas_reordenadas', updatedRows);
      }
      console.log('📡 Evento Socket.IO emitido: funil_etapas_reordenadas');
    }
    
    res.json(updatedRows);
  } catch (error) {
    console.error('❌ Erro ao reordenar etapas:', error);
    res.status(500).json({ error: 'Erro ao reordenar etapas' });
  }
};
