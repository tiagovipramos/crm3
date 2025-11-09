import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { logger } from '../config/logger';

// ============================================
// AUDITORIA DE INDICAÇÕES
// ============================================

export const getTodasIndicacoes = async (req: Request, res: Response) => {
  try {
    const {
      status,
      indicadorId,
      consultorId,
      dataInicio,
      dataFim,
      temComissao,
      valorMinimo,
      valorMaximo,
      whatsappValidado,
      pesquisa,
      limit = 100,
      offset = 0,
      ordenacao = 'data_desc'
    } = req.query;

    let whereConditions: string[] = [];
    let params: any[] = [];

    // Filtro por status
    if (status && status !== 'todos') {
      whereConditions.push('ind.status = ?');
      params.push(status);
    }

    // Filtro por indicador específico
    if (indicadorId) {
      whereConditions.push('ind.indicador_id = ?');
      params.push(indicadorId);
    }

    // Filtro por consultor
    if (consultorId) {
      whereConditions.push('l.consultor_id = ?');
      params.push(consultorId);
    }

    // Filtro por período
    if (dataInicio) {
      whereConditions.push('ind.data_indicacao >= ?');
      params.push(dataInicio);
    }
    if (dataFim) {
      whereConditions.push('ind.data_indicacao <= ?');
      params.push(dataFim);
    }

    // Filtro por comissão ganha
    if (temComissao === 'true') {
      whereConditions.push('(ind.comissao_resposta > 0 OR ind.comissao_venda > 0)');
    }

    // Filtro por valor de comissão
    if (valorMinimo) {
      whereConditions.push('(ind.comissao_resposta + ind.comissao_venda) >= ?');
      params.push(parseFloat(valorMinimo as string));
    }
    if (valorMaximo) {
      whereConditions.push('(ind.comissao_resposta + ind.comissao_venda) <= ?');
      params.push(parseFloat(valorMaximo as string));
    }

    // Filtro por WhatsApp validado
    if (whatsappValidado !== undefined) {
      whereConditions.push('ind.whatsapp_validado = ?');
      params.push(whatsappValidado === 'true' ? 1 : 0);
    }

    // Pesquisa por nome ou telefone
    if (pesquisa) {
      whereConditions.push('(ind.nome_indicado LIKE ? OR ind.telefone_indicado LIKE ? OR indic.nome LIKE ?)');
      const searchTerm = `%${pesquisa}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Ordenação
    let orderByClause = 'ORDER BY ind.data_indicacao DESC';
    switch (ordenacao) {
      case 'data_asc':
        orderByClause = 'ORDER BY ind.data_indicacao ASC';
        break;
      case 'valor_desc':
        orderByClause = 'ORDER BY (ind.comissao_resposta + ind.comissao_venda) DESC';
        break;
      case 'valor_asc':
        orderByClause = 'ORDER BY (ind.comissao_resposta + ind.comissao_venda) ASC';
        break;
      case 'nome_asc':
        orderByClause = 'ORDER BY ind.nome_indicado ASC';
        break;
      case 'status':
        orderByClause = 'ORDER BY ind.status, ind.data_indicacao DESC';
        break;
    }

    // Buscar indicações com todas as informações
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ind.*,
        indic.id as indicador_id,
        indic.nome as indicador_nome,
        indic.email as indicador_email,
        indic.telefone as indicador_telefone,
        indic.ativo as indicador_ativo,
        indic.saldo_disponivel as indicador_saldo_disponivel,
        indic.saldo_bloqueado as indicador_saldo_bloqueado,
        l.id as lead_id,
        l.nome as lead_nome,
        l.email as lead_email,
        l.status as lead_status,
        l.valor_estimado as lead_valor_venda,
        c.id as consultor_id,
        c.nome as consultor_nome,
        c.email as consultor_email,
        (SELECT COUNT(*) FROM transacoes_indicador WHERE indicacao_id = ind.id) as total_transacoes,
        (SELECT SUM(valor) FROM transacoes_indicador WHERE indicacao_id = ind.id AND tipo = 'credito') as total_creditos,
        (SELECT SUM(valor) FROM transacoes_indicador WHERE indicacao_id = ind.id AND tipo = 'debito') as total_debitos,
        (SELECT COUNT(*) FROM saques_indicador s WHERE s.indicador_id = ind.indicador_id AND s.status = 'pago') as total_saques_realizados
       FROM indicacoes ind
       INNER JOIN indicadores indic ON ind.indicador_id = indic.id
       LEFT JOIN leads l ON ind.lead_id = l.id
       LEFT JOIN consultores c ON l.consultor_id = c.id
       ${whereClause}
       ${orderByClause}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit as string), parseInt(offset as string)]
    );

    // Contar total de registros (para paginação)
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM indicacoes ind
       INNER JOIN indicadores indic ON ind.indicador_id = indic.id
       LEFT JOIN leads l ON ind.lead_id = l.id
       LEFT JOIN consultores c ON l.consultor_id = c.id
       ${whereClause}`,
      params
    );

    const total = countRows[0].total;

    // Formatar dados
    const indicacoes = rows.map((ind: any) => ({
      // Dados da indicação
      id: ind.id,
      nomeIndicado: ind.nome_indicado,
      telefoneIndicado: ind.telefone_indicado,
      whatsappValidado: ind.whatsapp_validado,
      status: ind.status,
      comissaoResposta: parseFloat(ind.comissao_resposta || 0),
      comissaoVenda: parseFloat(ind.comissao_venda || 0),
      comissaoTotal: parseFloat(ind.comissao_resposta || 0) + parseFloat(ind.comissao_venda || 0),
      dataIndicacao: ind.data_indicacao,
      dataResposta: ind.data_resposta,
      dataConversao: ind.data_conversao,
      dataValidacaoWhatsapp: ind.data_validacao_whatsapp,
      
      // Dados do indicador
      indicador: {
        id: ind.indicador_id,
        nome: ind.indicador_nome,
        email: ind.indicador_email,
        telefone: ind.indicador_telefone,
        ativo: ind.indicador_ativo,
        saldoDisponivel: parseFloat(ind.indicador_saldo_disponivel || 0),
        saldoBloqueado: parseFloat(ind.indicador_saldo_bloqueado || 0)
      },
      
      // Dados do lead/cliente
      lead: ind.lead_id ? {
        id: ind.lead_id,
        nome: ind.lead_nome,
        email: ind.lead_email,
        status: ind.lead_status,
        valorVenda: parseFloat(ind.lead_valor_venda || 0)
      } : null,
      
      // Dados do consultor
      consultor: ind.consultor_id ? {
        id: ind.consultor_id,
        nome: ind.consultor_nome,
        email: ind.consultor_email
      } : null,
      
      // Estatísticas de transações
      transacoes: {
        total: ind.total_transacoes || 0,
        totalCreditos: parseFloat(ind.total_creditos || 0),
        totalDebitos: parseFloat(ind.total_debitos || 0)
      },
      
      // Saques realizados pelo indicador
      totalSaquesRealizados: ind.total_saques_realizados || 0
    }));

    // Buscar estatísticas gerais (respeitando os filtros)
    const [statsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_indicacoes,
        SUM(CASE WHEN ind.status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN ind.status = 'enviado_crm' THEN 1 ELSE 0 END) as enviadas_crm,
        SUM(CASE WHEN ind.status = 'respondeu' THEN 1 ELSE 0 END) as respondidas,
        SUM(CASE WHEN ind.status = 'converteu' THEN 1 ELSE 0 END) as convertidas,
        SUM(CASE WHEN ind.status = 'engano' THEN 1 ELSE 0 END) as enganos,
        SUM(ind.comissao_resposta) as total_comissao_resposta,
        SUM(ind.comissao_venda) as total_comissao_venda,
        SUM(ind.comissao_resposta + ind.comissao_venda) as total_comissao_geral,
        COUNT(DISTINCT ind.indicador_id) as total_indicadores_ativos
       FROM indicacoes ind
       INNER JOIN indicadores indic ON ind.indicador_id = indic.id
       LEFT JOIN leads l ON ind.lead_id = l.id
       LEFT JOIN consultores c ON l.consultor_id = c.id
       ${whereClause}`,
      params
    );

    const stats = statsRows[0];

    res.json({
      indicacoes,
      paginacao: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        totalPaginas: Math.ceil(total / parseInt(limit as string))
      },
      estatisticas: {
        totalIndicacoes: parseInt(stats.total_indicacoes) || 0,
        pendentes: parseInt(stats.pendentes) || 0,
        enviadasCrm: parseInt(stats.enviadas_crm) || 0,
        respondidas: parseInt(stats.respondidas) || 0,
        convertidas: parseInt(stats.convertidas) || 0,
        enganos: parseInt(stats.enganos) || 0,
        totalComissaoResposta: parseFloat(stats.total_comissao_resposta || 0),
        totalComissaoVenda: parseFloat(stats.total_comissao_venda || 0),
        totalComissaoGeral: parseFloat(stats.total_comissao_geral || 0),
        totalIndicadoresAtivos: parseInt(stats.total_indicadores_ativos) || 0,
        taxaResposta: parseInt(stats.total_indicacoes) > 0 
          ? ((parseInt(stats.respondidas) / parseInt(stats.total_indicacoes)) * 100).toFixed(2)
          : 0,
        taxaConversao: parseInt(stats.respondidas) > 0 
          ? ((parseInt(stats.convertidas) / parseInt(stats.respondidas)) * 100).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar auditoria de indicações:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar auditoria',
      message: 'Erro interno do servidor'
    });
  }
};

export const getIndicacaoDetalhada = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Buscar indicação com todos os detalhes
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ind.*,
        indic.nome as indicador_nome,
        indic.email as indicador_email,
        indic.telefone as indicador_telefone,
        indic.cpf as indicador_cpf,
        indic.ativo as indicador_ativo,
        indic.saldo_disponivel as indicador_saldo_disponivel,
        indic.saldo_bloqueado as indicador_saldo_bloqueado,
        indic.saldo_perdido as indicador_saldo_perdido,
        l.nome as lead_nome,
        l.email as lead_email,
        l.telefone as lead_telefone,
        l.status as lead_status,
        l.valor_estimado as lead_valor_venda,
        l.origem as lead_origem,
        c.nome as consultor_nome,
        c.email as consultor_email,
        c.telefone as consultor_telefone
       FROM indicacoes ind
       INNER JOIN indicadores indic ON ind.indicador_id = indic.id
       LEFT JOIN leads l ON ind.lead_id = l.id
       LEFT JOIN consultores c ON l.consultor_id = c.id
       WHERE ind.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Indicação não encontrada'
      });
    }

    const ind = rows[0];

    // Buscar histórico de transações desta indicação
    const [transacoesRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM transacoes_indicador
       WHERE indicacao_id = ?
       ORDER BY data_transacao DESC`,
      [id]
    );

    // Buscar todas as mensagens relacionadas ao lead (se existir)
    let mensagens: any[] = [];
    if (ind.lead_id) {
      const [mensagensRows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM mensagens
         WHERE lead_id = ?
         ORDER BY data_envio ASC`,
        [ind.lead_id]
      );
      mensagens = mensagensRows;
    }

    res.json({
      // Dados da indicação
      id: ind.id,
      nomeIndicado: ind.nome_indicado,
      telefoneIndicado: ind.telefone_indicado,
      whatsappValidado: ind.whatsapp_validado,
      status: ind.status,
      comissaoResposta: parseFloat(ind.comissao_resposta || 0),
      comissaoVenda: parseFloat(ind.comissao_venda || 0),
      comissaoTotal: parseFloat(ind.comissao_resposta || 0) + parseFloat(ind.comissao_venda || 0),
      dataIndicacao: ind.data_indicacao,
      dataResposta: ind.data_resposta,
      dataConversao: ind.data_conversao,
      dataValidacaoWhatsapp: ind.data_validacao_whatsapp,
      
      // Dados completos do indicador
      indicador: {
        id: ind.indicador_id,
        nome: ind.indicador_nome,
        email: ind.indicador_email,
        telefone: ind.indicador_telefone,
        cpf: ind.indicador_cpf,
        ativo: ind.indicador_ativo,
        saldoDisponivel: parseFloat(ind.indicador_saldo_disponivel || 0),
        saldoBloqueado: parseFloat(ind.indicador_saldo_bloqueado || 0),
        saldoPerdido: parseFloat(ind.indicador_saldo_perdido || 0)
      },
      
      // Dados completos do lead
      lead: ind.lead_id ? {
        id: ind.lead_id,
        nome: ind.lead_nome,
        email: ind.lead_email,
        telefone: ind.lead_telefone,
        status: ind.lead_status,
        valorVenda: parseFloat(ind.lead_valor_venda || 0),
        origem: ind.lead_origem
      } : null,
      
      // Dados completos do consultor
      consultor: ind.consultor_id ? {
        id: ind.consultor_id,
        nome: ind.consultor_nome,
        email: ind.consultor_email,
        telefone: ind.consultor_telefone
      } : null,
      
      // Histórico de transações
      transacoes: transacoesRows.map((trans: any) => ({
        id: trans.id,
        tipo: trans.tipo,
        valor: parseFloat(trans.valor || 0),
        saldoAnterior: parseFloat(trans.saldo_anterior || 0),
        saldoNovo: parseFloat(trans.saldo_novo || 0),
        descricao: trans.descricao,
        dataTransacao: trans.data_transacao
      })),
      
      // Mensagens trocadas
      mensagens: mensagens.map((msg: any) => ({
        id: msg.id,
        conteudo: msg.conteudo,
        tipo: msg.tipo,
        direcao: msg.direcao,
        status: msg.status,
        dataEnvio: msg.data_envio
      }))
    });
  } catch (error) {
    logger.error('Erro ao buscar indicação detalhada:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar indicação',
      message: 'Erro interno do servidor'
    });
  }
};

export const exportarAuditoria = async (req: Request, res: Response) => {
  try {
    const { formato = 'json' } = req.query;

    // Buscar todas as indicações sem limite
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ind.*,
        indic.nome as indicador_nome,
        indic.email as indicador_email,
        indic.telefone as indicador_telefone,
        l.nome as lead_nome,
        l.status as lead_status,
        l.valor_estimado as lead_valor_venda,
        c.nome as consultor_nome
       FROM indicacoes ind
       INNER JOIN indicadores indic ON ind.indicador_id = indic.id
       LEFT JOIN leads l ON ind.lead_id = l.id
       LEFT JOIN consultores c ON l.consultor_id = c.id
       ORDER BY ind.data_indicacao DESC`
    );

    if (formato === 'csv') {
      // Gerar CSV
      const csv = [
        'ID,Data Indicação,Indicador,Email Indicador,Nome Indicado,Telefone,Status,Comissão Resposta,Comissão Venda,Lead,Consultor,Valor Venda',
        ...rows.map((ind: any) => 
          `${ind.id},${ind.data_indicacao},${ind.indicador_nome},${ind.indicador_email},${ind.nome_indicado},${ind.telefone_indicado},${ind.status},${ind.comissao_resposta || 0},${ind.comissao_venda || 0},${ind.lead_nome || ''},${ind.consultor_nome || ''},${ind.lead_valor_venda || 0}`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=auditoria-indicacoes.csv');
      res.send(csv);
    } else {
      // Retornar JSON
      res.json({
        total: rows.length,
        dataExportacao: new Date().toISOString(),
        indicacoes: rows
      });
    }
  } catch (error) {
    logger.error('Erro ao exportar auditoria:', error);
    res.status(500).json({ 
      error: 'Erro ao exportar',
      message: 'Erro interno do servidor'
    });
  }
};

export const getResumoIndicador = async (req: Request, res: Response) => {
  try {
    const { indicadorId } = req.params;

    // Buscar dados do indicador
    const [indicadorRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM indicadores WHERE id = ?`,
      [indicadorId]
    );

    if (indicadorRows.length === 0) {
      return res.status(404).json({ 
        error: 'Indicador não encontrado'
      });
    }

    const indicador = indicadorRows[0];

    // Buscar estatísticas de indicações
    const [statsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN status = 'enviado_crm' THEN 1 ELSE 0 END) as enviadas,
        SUM(CASE WHEN status = 'respondeu' THEN 1 ELSE 0 END) as respondidas,
        SUM(CASE WHEN status = 'converteu' THEN 1 ELSE 0 END) as convertidas,
        SUM(CASE WHEN status = 'engano' THEN 1 ELSE 0 END) as enganos,
        SUM(comissao_resposta) as total_comissao_resposta,
        SUM(comissao_venda) as total_comissao_venda
       FROM indicacoes 
       WHERE indicador_id = ?`,
      [indicadorId]
    );

    const stats = statsRows[0];

    // Buscar saques
    const [saquesRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_saques,
        SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END) as total_sacado,
        SUM(CASE WHEN status = 'solicitado' THEN valor ELSE 0 END) as total_pendente
       FROM saques_indicador
       WHERE indicador_id = ?`,
      [indicadorId]
    );

    const saques = saquesRows[0];

    res.json({
      indicador: {
        id: indicador.id,
        nome: indicador.nome,
        email: indicador.email,
        telefone: indicador.telefone,
        cpf: indicador.cpf,
        ativo: indicador.ativo,
        saldoDisponivel: parseFloat(indicador.saldo_disponivel || 0),
        saldoBloqueado: parseFloat(indicador.saldo_bloqueado || 0),
        saldoPerdido: parseFloat(indicador.saldo_perdido || 0),
        dataCriacao: indicador.data_criacao,
        ultimoAcesso: indicador.ultimo_acesso
      },
      estatisticas: {
        totalIndicacoes: parseInt(stats.total) || 0,
        pendentes: parseInt(stats.pendentes) || 0,
        enviadas: parseInt(stats.enviadas) || 0,
        respondidas: parseInt(stats.respondidas) || 0,
        convertidas: parseInt(stats.convertidas) || 0,
        enganos: parseInt(stats.enganos) || 0,
        totalComissaoResposta: parseFloat(stats.total_comissao_resposta || 0),
        totalComissaoVenda: parseFloat(stats.total_comissao_venda || 0),
        totalComissaoGeral: parseFloat(stats.total_comissao_resposta || 0) + parseFloat(stats.total_comissao_venda || 0)
      },
      saques: {
        totalSaques: parseInt(saques.total_saques) || 0,
        totalSacado: parseFloat(saques.total_sacado || 0),
        totalPendente: parseFloat(saques.total_pendente || 0)
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar resumo do indicador:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar resumo',
      message: 'Erro interno do servidor'
    });
  }
};
