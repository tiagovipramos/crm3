'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ConfiguracoesComissao, 
  ConfiguracoesLootbox, 
  MensagemAutomatica 
} from '@/types/admin';
import { useAdminStore } from '@/store/useAdminStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ConfiguracoesAdminView() {
  // Pegar o token do store
  const token = useAdminStore((state) => state.token);
  
  // Debug: Ver o que está no token
  useEffect(() => {
    console.log('[ConfiguracoesAdminView] Token do store:', token);
    console.log('[ConfiguracoesAdminView] API_URL:', API_URL);
  }, [token]);
  
  // Estados
  const [comissoes, setComissoes] = useState<ConfiguracoesComissao>({
    comissaoResposta: 2.00,
    comissaoVenda: 15.00
  });
  
  const [lootbox, setLootbox] = useState<ConfiguracoesLootbox>({
    // Lootbox de Indicações
    indicacoesNecessarias: 10,
    premioMinimoIndicacoes: 5.00,
    premioMaximoIndicacoes: 20.00,
    probabilidadeBaixoIndicacoes: 60,
    probabilidadeMedioIndicacoes: 30,
    probabilidadeAltoIndicacoes: 10,
    // Lootbox de Vendas
    vendasNecessarias: 5,
    premioMinimoVendas: 10.00,
    premioMaximoVendas: 50.00,
    probabilidadeBaixoVendas: 60,
    probabilidadeMedioVendas: 30,
    probabilidadeAltoVendas: 10
  });
  
  const [mensagens, setMensagens] = useState<MensagemAutomatica[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Estados para modals
  const [showAddMensagem, setShowAddMensagem] = useState(false);
  const [showEditMensagem, setShowEditMensagem] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState<'boas_vindas' | 'proposta' | 'conversao' | 'lootbox'>('boas_vindas');
  const [novaMensagem, setNovaMensagem] = useState('');
  const [editandoMensagem, setEditandoMensagem] = useState<MensagemAutomatica | null>(null);

  // Carregar configurações
  useEffect(() => {
    // Só carrega se o token estiver disponível
    if (token) {
      fetchAllConfigs();
    }
  }, [token]); // Adiciona token como dependência

  const fetchAllConfigs = async () => {
    if (!token) {
      console.error('[ConfiguracoesAdminView] Token não disponível ainda');
      return;
    }
    
    setLoading(true);
    try {
      console.log('[ConfiguracoesAdminView] Fazendo requisições com token:', token?.substring(0, 20) + '...');
      const headers = { Authorization: `Bearer ${token}` };

      const [comissoesRes, lootboxRes, mensagensRes] = await Promise.all([
        axios.get(`${API_URL}/configuracoes/comissoes`, { headers }),
        axios.get(`${API_URL}/configuracoes/lootbox`, { headers }),
        axios.get(`${API_URL}/configuracoes/mensagens`, { headers })
      ]);

      setComissoes(comissoesRes.data);
      setLootbox(lootboxRes.data);
      setMensagens(mensagensRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComissoes = async () => {
    try {
      await axios.put(`${API_URL}/configuracoes/comissoes`, comissoes, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Comissões atualizadas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar comissões');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSaveLootbox = async () => {
    const somaIndicacoes = lootbox.probabilidadeBaixoIndicacoes + lootbox.probabilidadeMedioIndicacoes + lootbox.probabilidadeAltoIndicacoes;
    const somaVendas = lootbox.probabilidadeBaixoVendas + lootbox.probabilidadeMedioVendas + lootbox.probabilidadeAltoVendas;
    
    if (somaIndicacoes !== 100) {
      setError('A soma das probabilidades de indicações deve ser 100%');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (somaVendas !== 100) {
      setError('A soma das probabilidades de vendas deve ser 100%');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      await axios.put(`${API_URL}/configuracoes/lootbox`, lootbox, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Lootbox atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar lootbox');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAddMensagem = async () => {
    if (!novaMensagem.trim()) {
      setError('Mensagem não pode estar vazia');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      await axios.post(`${API_URL}/configuracoes/mensagens`, {
        tipo: tipoSelecionado,
        mensagem: novaMensagem,
        ativo: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Mensagem adicionada com sucesso!');
      setShowAddMensagem(false);
      setNovaMensagem('');
      fetchAllConfigs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao adicionar mensagem');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditMensagem = async () => {
    if (!editandoMensagem || !editandoMensagem.mensagem.trim()) {
      setError('Mensagem não pode estar vazia');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      await axios.put(`${API_URL}/configuracoes/mensagens/${editandoMensagem.id}`, {
        mensagem: editandoMensagem.mensagem
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Mensagem editada com sucesso!');
      setShowEditMensagem(false);
      setEditandoMensagem(null);
      fetchAllConfigs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao editar mensagem');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleToggleMensagem = async (mensagem: MensagemAutomatica) => {
    try {
      await axios.put(`${API_URL}/configuracoes/mensagens/${mensagem.id}`, {
        ativo: !mensagem.ativo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllConfigs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar mensagem');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteMensagem = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta mensagem?')) return;

    try {
      await axios.delete(`${API_URL}/configuracoes/mensagens/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Mensagem deletada com sucesso!');
      fetchAllConfigs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao deletar mensagem');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getMensagensPorTipo = (tipo: string) => {
    return mensagens.filter(m => m.tipo === tipo);
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'boas_vindas': '🎉 Boas-Vindas',
      'proposta': '💰 Proposta Enviada',
      'conversao': '🎊 Conversão',
      'lootbox': '🎁 Lootbox'
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">⚙️ Configurações do Sistema</h1>
        <p className="text-gray-600 mt-2">Gerencie comissões, lootbox e mensagens automáticas</p>
      </div>

      {/* Notificações */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-green-800">✅ {success}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}

      {/* CARD 1: COMISSÕES */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-3">💰</span>
          <h2 className="text-2xl font-bold text-gray-800">Comissões</h2>
        </div>
        <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded mb-6"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Comissão por Resposta
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={comissoes.comissaoResposta}
                onChange={(e) => setComissoes({ ...comissoes, comissaoResposta: parseFloat(e.target.value) || 0 })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Valor pago quando o lead responde</p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Comissão por Venda
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={comissoes.comissaoVenda}
                onChange={(e) => setComissoes({ ...comissoes, comissaoVenda: parseFloat(e.target.value) || 0 })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Valor pago quando o lead converte</p>
          </div>
        </div>
        
        <button
          onClick={handleSaveComissoes}
          className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-semibold shadow-md"
        >
          💾 Salvar Comissões
        </button>
      </div>

      {/* CARD 2: LOOTBOX */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-3">🎁</span>
          <h2 className="text-2xl font-bold text-gray-800">Lootbox / Caixa Misteriosa</h2>
        </div>
        <div className="h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded mb-6"></div>
        
        {/* CONTAINER GRID PARA AS DUAS LOOTBOXES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* LOOTBOX DE VENDAS */}
          <div className="border-2 border-yellow-200 rounded-lg p-5 bg-gradient-to-br from-yellow-50 to-orange-50">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>💰</span> Lootbox de Vendas (Conversões)
            </h3>
          
            <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vendas Necessárias
              </label>
              <input
                type="number"
                min="1"
                value={lootbox.vendasNecessarias}
                onChange={(e) => setLootbox({ ...lootbox, vendasNecessarias: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prêmio Mínimo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={lootbox.premioMinimoVendas}
                  onChange={(e) => setLootbox({ ...lootbox, premioMinimoVendas: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prêmio Máximo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={lootbox.premioMaximoVendas}
                  onChange={(e) => setLootbox({ ...lootbox, premioMaximoVendas: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Probabilidades (total deve ser 100%)</h4>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Baixo ({lootbox.probabilidadeBaixoVendas}%)</label>
                <span className="text-sm text-gray-500">R$ {lootbox.premioMinimoVendas.toFixed(2)} - R$ {((lootbox.premioMaximoVendas - lootbox.premioMinimoVendas) / 3 + lootbox.premioMinimoVendas).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={lootbox.probabilidadeBaixoVendas}
                  onChange={(e) => setLootbox({ ...lootbox, probabilidadeBaixoVendas: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${lootbox.probabilidadeBaixoVendas}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Médio ({lootbox.probabilidadeMedioVendas}%)</label>
                <span className="text-sm text-gray-500">R$ {((lootbox.premioMaximoVendas - lootbox.premioMinimoVendas) / 3 + lootbox.premioMinimoVendas).toFixed(2)} - R$ {((lootbox.premioMaximoVendas - lootbox.premioMinimoVendas) * 2/3 + lootbox.premioMinimoVendas).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={lootbox.probabilidadeMedioVendas}
                  onChange={(e) => setLootbox({ ...lootbox, probabilidadeMedioVendas: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-yellow-500 h-full transition-all"
                    style={{ width: `${lootbox.probabilidadeMedioVendas}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Alto ({lootbox.probabilidadeAltoVendas}%)</label>
                <span className="text-sm text-gray-500">R$ {((lootbox.premioMaximoVendas - lootbox.premioMinimoVendas) * 2/3 + lootbox.premioMinimoVendas).toFixed(2)} - R$ {lootbox.premioMaximoVendas.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={lootbox.probabilidadeAltoVendas}
                  onChange={(e) => setLootbox({ ...lootbox, probabilidadeAltoVendas: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-red-500 h-full transition-all"
                    style={{ width: `${lootbox.probabilidadeAltoVendas}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total:</span>
              <span className={`text-lg font-bold ${(lootbox.probabilidadeBaixoVendas + lootbox.probabilidadeMedioVendas + lootbox.probabilidadeAltoVendas) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                {lootbox.probabilidadeBaixoVendas + lootbox.probabilidadeMedioVendas + lootbox.probabilidadeAltoVendas}%
              </span>
            </div>
          </div>
          </div>

          {/* LOOTBOX DE INDICAÇÕES */}
          <div className="border-2 border-blue-200 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-indigo-50">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📱</span> Lootbox de Indicações (Respostas)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Indicações Necessárias
              </label>
              <input
                type="number"
                min="1"
                value={lootbox.indicacoesNecessarias}
                onChange={(e) => setLootbox({ ...lootbox, indicacoesNecessarias: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prêmio Mínimo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={lootbox.premioMinimoIndicacoes}
                  onChange={(e) => setLootbox({ ...lootbox, premioMinimoIndicacoes: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prêmio Máximo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={lootbox.premioMaximoIndicacoes}
                  onChange={(e) => setLootbox({ ...lootbox, premioMaximoIndicacoes: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Probabilidades (total deve ser 100%)</h4>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Baixo ({lootbox.probabilidadeBaixoIndicacoes}%)</label>
                <span className="text-sm text-gray-500">R$ {lootbox.premioMinimoIndicacoes.toFixed(2)} - R$ {((lootbox.premioMaximoIndicacoes - lootbox.premioMinimoIndicacoes) / 3 + lootbox.premioMinimoIndicacoes).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={lootbox.probabilidadeBaixoIndicacoes}
                  onChange={(e) => setLootbox({ ...lootbox, probabilidadeBaixoIndicacoes: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${lootbox.probabilidadeBaixoIndicacoes}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Médio ({lootbox.probabilidadeMedioIndicacoes}%)</label>
                <span className="text-sm text-gray-500">R$ {((lootbox.premioMaximoIndicacoes - lootbox.premioMinimoIndicacoes) / 3 + lootbox.premioMinimoIndicacoes).toFixed(2)} - R$ {((lootbox.premioMaximoIndicacoes - lootbox.premioMinimoIndicacoes) * 2/3 + lootbox.premioMinimoIndicacoes).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={lootbox.probabilidadeMedioIndicacoes}
                  onChange={(e) => setLootbox({ ...lootbox, probabilidadeMedioIndicacoes: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-yellow-500 h-full transition-all"
                    style={{ width: `${lootbox.probabilidadeMedioIndicacoes}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Alto ({lootbox.probabilidadeAltoIndicacoes}%)</label>
                <span className="text-sm text-gray-500">R$ {((lootbox.premioMaximoIndicacoes - lootbox.premioMinimoIndicacoes) * 2/3 + lootbox.premioMinimoIndicacoes).toFixed(2)} - R$ {lootbox.premioMaximoIndicacoes.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={lootbox.probabilidadeAltoIndicacoes}
                  onChange={(e) => setLootbox({ ...lootbox, probabilidadeAltoIndicacoes: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-red-500 h-full transition-all"
                    style={{ width: `${lootbox.probabilidadeAltoIndicacoes}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total:</span>
              <span className={`text-lg font-bold ${(lootbox.probabilidadeBaixoIndicacoes + lootbox.probabilidadeMedioIndicacoes + lootbox.probabilidadeAltoIndicacoes) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                {lootbox.probabilidadeBaixoIndicacoes + lootbox.probabilidadeMedioIndicacoes + lootbox.probabilidadeAltoIndicacoes}%
              </span>
            </div>
          </div>
          </div>
        </div>
        
        <button
          onClick={handleSaveLootbox}
          className="mt-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all font-semibold shadow-md"
        >
          💾 Salvar Lootbox
        </button>
      </div>

      {/* CARD 3: MENSAGENS AUTOMÁTICAS DE BOAS-VINDAS */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-3">📱</span>
          <h2 className="text-2xl font-bold text-gray-800">Mensagens Automáticas de Boas-Vindas</h2>
        </div>
        <div className="h-1 bg-gradient-to-r from-green-500 to-teal-500 rounded mb-6"></div>
        
        {/* Instruções de uso de variáveis */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <span>💡</span> Como usar variáveis nas mensagens:
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <code className="bg-blue-100 px-2 py-0.5 rounded">{'{nome_indicador}'}</code> - Nome do indicador</p>
            <p>• <code className="bg-blue-100 px-2 py-0.5 rounded">{'{nome_cliente}'}</code> - Nome do cliente/lead</p>
            <p>• <code className="bg-blue-100 px-2 py-0.5 rounded">{'{nome_vendedor}'}</code> - Nome do vendedor</p>
            <p>• <code className="bg-blue-100 px-2 py-0.5 rounded">{'{telefone_cliente}'}</code> - Telefone do cliente</p>
            <p className="text-xs text-blue-700 mt-2 italic">Exemplo: "Olá {'{nome_cliente}'}, você foi indicado por {'{nome_indicador}'}!"</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">🎉 Mensagens de Boas-Vindas</h3>
                <p className="text-sm text-gray-600">Crie múltiplas mensagens que serão alternadas aleatoriamente</p>
              </div>
              <button
                onClick={() => {
                  setTipoSelecionado('boas_vindas');
                  setShowAddMensagem(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <span>➕</span> Adicionar Mensagem
              </button>
            </div>
            
            <div className="space-y-2">
              {getMensagensPorTipo('boas_vindas').length === 0 ? (
                <p className="text-gray-500 text-sm italic">Nenhuma mensagem cadastrada</p>
              ) : (
                getMensagensPorTipo('boas_vindas').map((msg, index) => (
                  <div key={msg.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">#{index + 1}</span>
                      <button
                        onClick={() => handleToggleMensagem(msg)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${msg.ativo ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                        title={msg.ativo ? 'Mensagem ativa' : 'Mensagem inativa'}
                      >
                        {msg.ativo && <span className="text-white text-xs">✓</span>}
                      </button>
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.mensagem}</p>
                      {msg.ativo && (
                        <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          ✓ Ativa no rodízio
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditandoMensagem(msg);
                          setShowEditMensagem(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm p-2 hover:bg-blue-50 rounded transition-colors"
                        title="Editar mensagem"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteMensagem(msg.id)}
                        className="text-red-600 hover:text-red-800 text-sm p-2 hover:bg-red-50 rounded transition-colors"
                        title="Excluir mensagem"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {getMensagensPorTipo('boas_vindas').length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Total de mensagens ativas:</span>{' '}
                  {getMensagensPorTipo('boas_vindas').filter(m => m.ativo).length}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  As mensagens ativas serão alternadas aleatoriamente ao enviar para novos clientes
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Adicionar Mensagem */}
      {showAddMensagem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Adicionar Mensagem - {getTipoLabel(tipoSelecionado)}</h3>
            
            <textarea
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Digite a mensagem automática..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddMensagem}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                ✅ Adicionar
              </button>
              <button
                onClick={() => {
                  setShowAddMensagem(false);
                  setNovaMensagem('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Mensagem */}
      {showEditMensagem && editandoMensagem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Editar Mensagem de Boas-Vindas</h3>
            
            <textarea
              value={editandoMensagem.mensagem}
              onChange={(e) => setEditandoMensagem({ ...editandoMensagem, mensagem: e.target.value })}
              placeholder="Digite a mensagem automática..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleEditMensagem}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                ✅ Salvar
              </button>
              <button
                onClick={() => {
                  setShowEditMensagem(false);
                  setEditandoMensagem(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
