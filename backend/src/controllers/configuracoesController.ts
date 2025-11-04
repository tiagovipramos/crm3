import { Request, Response } from 'express';
import pool from '../config/database';

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
    console.error('Erro ao buscar comissões:', error);
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
    console.error('Erro ao atualizar comissões:', error);
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
      vendasNecessarias: lootbox.vendas_necessarias,
      premioMinimo: parseFloat(lootbox.premio_minimo),
      premioMaximo: parseFloat(lootbox.premio_maximo),
      probabilidadeBaixo: lootbox.probabilidade_baixo,
      probabilidadeMedio: lootbox.probabilidade_medio,
      probabilidadeAlto: lootbox.probabilidade_alto
    });
  } catch (error) {
    console.error('Erro ao buscar lootbox:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações de lootbox' });
  }
};

export const updateLootbox = async (req: Request, res: Response) => {
  try {
    const { 
      vendasNecessarias, 
      premioMinimo, 
      premioMaximo, 
      probabilidadeBaixo, 
      probabilidadeMedio, 
      probabilidadeAlto 
    } = req.body;
    
    // Validações
    if (!vendasNecessarias || !premioMinimo || !premioMaximo || 
        probabilidadeBaixo === undefined || probabilidadeMedio === undefined || probabilidadeAlto === undefined) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    if (vendasNecessarias < 1) {
      return res.status(400).json({ error: 'Vendas necessárias deve ser no mínimo 1' });
    }
    
    if (premioMinimo < 0 || premioMaximo < 0) {
      return res.status(400).json({ error: 'Prêmios não podem ser negativos' });
    }
    
    if (premioMinimo >= premioMaximo) {
      return res.status(400).json({ error: 'Prêmio mínimo deve ser menor que o máximo' });
    }
    
    const somaProbabilidades = probabilidadeBaixo + probabilidadeMedio + probabilidadeAlto;
    if (somaProbabilidades !== 100) {
      return res.status(400).json({ error: 'Soma das probabilidades deve ser 100%' });
    }
    
    await pool.query(
      `UPDATE configuracoes_lootbox 
       SET vendas_necessarias = ?, premio_minimo = ?, premio_maximo = ?,
           probabilidade_baixo = ?, probabilidade_medio = ?, probabilidade_alto = ?
       WHERE id = 1`,
      [vendasNecessarias, premioMinimo, premioMaximo, probabilidadeBaixo, probabilidadeMedio, probabilidadeAlto]
    );
    
    res.json({ 
      message: 'Configurações de lootbox atualizadas com sucesso',
      vendasNecessarias,
      premioMinimo: parseFloat(premioMinimo),
      premioMaximo: parseFloat(premioMaximo),
      probabilidadeBaixo,
      probabilidadeMedio,
      probabilidadeAlto
    });
  } catch (error) {
    console.error('Erro ao atualizar lootbox:', error);
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
    console.error('Erro ao buscar mensagens:', error);
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
    console.error('Erro ao criar mensagem:', error);
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
    console.error('Erro ao atualizar mensagem:', error);
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
    console.error('Erro ao deletar mensagem:', error);
    res.status(500).json({ error: 'Erro ao deletar mensagem automática' });
  }
};
