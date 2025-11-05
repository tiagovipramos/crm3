'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Eye, User, Phone, Calendar,
  DollarSign, TrendingUp, CheckCircle, XCircle, Clock,
  AlertCircle, RefreshCw, ChevronDown, ChevronUp, Activity
} from 'lucide-react';

interface Indicacao {
  id: string;
  nomeIndicado: string;
  telefoneIndicado: string;
  whatsappValidado: boolean;
  status: string;
  comissaoResposta: number;
  comissaoVenda: number;
  comissaoTotal: number;
  dataIndicacao: string;
  dataResposta?: string;
  dataConversao?: string;
  indicador: {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    ativo: boolean;
    saldoDisponivel: number;
    saldoBloqueado: number;
  };
  lead?: {
    id: string;
    nome: string;
    email: string;
    status: string;
    valorVenda: number;
  };
  consultor?: {
    id: string;
    nome: string;
    email: string;
  };
  transacoes: {
    total: number;
    totalCreditos: number;
    totalDebitos: number;
  };
  totalSaquesRealizados: number;
}

interface Estatisticas {
  totalIndicacoes: number;
  pendentes: number;
  enviadasCrm: number;
  respondidas: number;
  convertidas: number;
  enganos: number;
  totalComissaoResposta: number;
  totalComissaoVenda: number;
  totalComissaoGeral: number;
  totalIndicadoresAtivos: number;
  taxaResposta: number;
  taxaConversao: number;
}

const AuditoriaView: React.FC = () => {
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [indicacaoSelecionada, setIndicacaoSelecionada] = useState<string | null>(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    status: 'todos',
    pesquisa: '',
    dataInicio: '',
    dataFim: '',
    valorMinimo: '',
    valorMaximo: '',
    whatsappValidado: '',
    temComissao: false,
    ordenacao: 'data_desc'
  });

  // Paginação
  const [paginacao, setPaginacao] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    totalPaginas: 0
  });

  useEffect(() => {
    carregarDados();
  }, [filtros, paginacao.offset]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      console.log('[AUDITORIA] Token:', token ? `${token.substring(0, 20)}...` : 'NULL');
      console.log('[AUDITORIA] API_URL:', API_URL);
      
      // Construir query string
      const params = new URLSearchParams({
        limit: paginacao.limit.toString(),
        offset: paginacao.offset.toString(),
        ordenacao: filtros.ordenacao
      });

      if (filtros.status !== 'todos') params.append('status', filtros.status);
      if (filtros.pesquisa) params.append('pesquisa', filtros.pesquisa);
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);
      if (filtros.valorMinimo) params.append('valorMinimo', filtros.valorMinimo);
      if (filtros.valorMaximo) params.append('valorMaximo', filtros.valorMaximo);
      if (filtros.whatsappValidado) params.append('whatsappValidado', filtros.whatsappValidado);
      if (filtros.temComissao) params.append('temComissao', 'true');

      const response = await fetch(`${API_URL}/auditoria?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erro ao carregar dados');

      const data = await response.json();
      setIndicacoes(data.indicacoes);
      setEstatisticas(data.estatisticas);
      setPaginacao(prev => ({
        ...prev,
        total: data.paginacao.total,
        totalPaginas: data.paginacao.totalPaginas
      }));
    } catch (error) {
      console.error('Erro ao carregar auditoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/auditoria/exportar?formato=csv`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erro ao exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria-indicacoes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; text: string }> = {
      pendente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pendente' },
      enviado_crm: { color: 'bg-blue-100 text-blue-800', icon: Activity, text: 'Enviado CRM' },
      respondeu: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Respondeu' },
      converteu: { color: 'bg-emerald-100 text-emerald-800', icon: TrendingUp, text: 'Converteu' },
      engano: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Engano' }
    };

    const badge = badges[status] || badges.pendente;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.text}
      </span>
    );
  };

  const formatarData = (data: string) => {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Auditoria de Indicações</h1>
            <p className="text-sm text-gray-500 mt-1">
              Acompanhe todas as indicações do sistema em tempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={exportarCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            <button
              onClick={carregarDados}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-6 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1">Total de Indicações</p>
              <p className="text-2xl font-bold text-blue-700">{estatisticas.totalIndicacoes}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
              <p className="text-xs text-yellow-600 font-medium mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-700">{estatisticas.pendentes}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <p className="text-xs text-green-600 font-medium mb-1">Respondidas</p>
              <p className="text-2xl font-bold text-green-700">{estatisticas.respondidas}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
              <p className="text-xs text-emerald-600 font-medium mb-1">Convertidas</p>
              <p className="text-2xl font-bold text-emerald-700">{estatisticas.convertidas}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <p className="text-xs text-purple-600 font-medium mb-1">Comissões Totais</p>
              <p className="text-xl font-bold text-purple-700">{formatarMoeda(estatisticas.totalComissaoGeral)}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
              <p className="text-xs text-indigo-600 font-medium mb-1">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-indigo-700">{estatisticas.taxaConversao}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Filtros Expansíveis */}
      {mostrarFiltros && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            {/* Pesquisa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pesquisar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nome, telefone, indicador..."
                  value={filtros.pesquisa}
                  onChange={(e) => setFiltros({ ...filtros, pesquisa: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="todos">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="enviado_crm">Enviado CRM</option>
                <option value="respondeu">Respondeu</option>
                <option value="converteu">Converteu</option>
                <option value="engano">Engano</option>
              </select>
            </div>

            {/* Data Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Valor Mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Mínimo (R$)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={filtros.valorMinimo}
                onChange={(e) => setFiltros({ ...filtros, valorMinimo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Valor Máximo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Máximo (R$)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={filtros.valorMaximo}
                onChange={(e) => setFiltros({ ...filtros, valorMaximo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* WhatsApp Validado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              <select
                value={filtros.whatsappValidado}
                onChange={(e) => setFiltros({ ...filtros, whatsappValidado: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Todos</option>
                <option value="true">Validado</option>
                <option value="false">Não Validado</option>
              </select>
            </div>

            {/* Ordenação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <select
                value={filtros.ordenacao}
                onChange={(e) => setFiltros({ ...filtros, ordenacao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="data_desc">Data (mais recente)</option>
                <option value="data_asc">Data (mais antiga)</option>
                <option value="valor_desc">Valor (maior)</option>
                <option value="valor_asc">Valor (menor)</option>
                <option value="nome_asc">Nome (A-Z)</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={filtros.temComissao}
                onChange={(e) => setFiltros({ ...filtros, temComissao: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Apenas com comissão
            </label>
            <button
              onClick={() => setFiltros({
                status: 'todos',
                pesquisa: '',
                dataInicio: '',
                dataFim: '',
                valorMinimo: '',
                valorMaximo: '',
                whatsappValidado: '',
                temComissao: false,
                ordenacao: 'data_desc'
              })}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : indicacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-3" />
            <p className="text-lg font-medium">Nenhuma indicação encontrada</p>
            <p className="text-sm">Tente ajustar os filtros</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Indicado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Indicador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comissão
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {indicacoes.map((indicacao) => (
                  <tr key={indicacao.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatarData(indicacao.dataIndicacao)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {indicacao.nomeIndicado}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {indicacao.telefoneIndicado}
                          {indicacao.whatsappValidado && (
                            <span className="ml-1 text-green-600">✓</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {indicacao.indicador.nome}
                        </span>
                        <span className="text-xs text-gray-500">
                          {indicacao.indicador.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(indicacao.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-green-600">
                          {formatarMoeda(indicacao.comissaoTotal)}
                        </span>
                        {indicacao.comissaoResposta > 0 && (
                          <span className="text-xs text-gray-500">
                            Resposta: {formatarMoeda(indicacao.comissaoResposta)}
                          </span>
                        )}
                        {indicacao.comissaoVenda > 0 && (
                          <span className="text-xs text-gray-500">
                            Venda: {formatarMoeda(indicacao.comissaoVenda)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {indicacao.consultor ? (
                        <span className="text-sm text-gray-900">
                          {indicacao.consultor.nome}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setIndicacaoSelecionada(indicacao.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {paginacao.totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white rounded-lg shadow">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{paginacao.offset + 1}</span> até{' '}
              <span className="font-medium">
                {Math.min(paginacao.offset + paginacao.limit, paginacao.total)}
              </span>{' '}
              de <span className="font-medium">{paginacao.total}</span> resultados
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPaginacao(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                disabled={paginacao.offset === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPaginacao(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={paginacao.offset + paginacao.limit >= paginacao.total}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditoriaView;
