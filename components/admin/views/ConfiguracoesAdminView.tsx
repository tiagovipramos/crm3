'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ConfiguracoesComissao, 
  ConfiguracoesLootbox, 
  MensagemAutomatica 
} from '@/types/admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ConfiguracoesAdminView() {
  // Estados
  const [comissoes, setComissoes] = useState<ConfiguracoesComissao>({
    comissaoResposta: 2.00,
    comissaoVenda: 15.00
  });
  
  const [lootbox, setLootbox] = useState<ConfiguracoesLootbox>({
    vendasNecessarias: 10,
    premioMinimo: 5.00,
    premioMaximo: 50.00,
    probabilidadeBaixo: 60,
    probabilidadeMedio: 30,
    probabilidadeAlto: 10
  });
  
  const [mensagens, setMensagens] = useState<MensagemAutomatica[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Estados para modals
  const [showAddMensagem, setShowAddMensagem] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState<'boas_vindas' | 'proposta' | 'conversao' | 'lootbox'>('boas_vindas');
  const [novaMensagem, setNovaMensagem] = useState('');
  const [editandoMensagem, setEditandoMensagem] = useState<MensagemAutomatica | null>(null);

  // Carregar configurações
  useEffect(() => {
    fetchAllConfigs();
  }, []);

  const fetchAllConfigs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [comissoesRes, lootboxRes, mensagensRes] = await Promise.all([
        axios.get(`${API_URL}/api/configuracoes/comissoes`, { headers }),
        axios.get(`${API_URL}/api/configuracoes/lootbox`, { headers }),
        axios.get(`${API_URL}/api/configuracoes/mensagens`, { headers })
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
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/configuracoes/comissoes`, comissoes, {
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
    const soma = lootbox.probabilidadeBaixo + lootbox.probabilidadeMedio + lootbox.probabilidadeAlto;
    if (soma !== 100) {
      setError('A soma das probabilidades deve ser 100%');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/configuracoes/lootbox`, lootbox, {
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
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/configuracoes/mensagens`, {
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

  const handleToggleMensagem = async (mensagem: MensagemAutomatica) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/configuracoes/mensagens/${mensagem.id}`, {
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
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/configuracoes/mensagens/${id}`, {
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                value={lootbox.premioMinimo}
                onChange={(e) => setLootbox({ ...lootbox, premioMinimo: parseFloat(e.target.value) || 0 })}
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
                value={lootbox.premioMaximo}
                onChange={(e) => setLootbox({ ...lootbox, premioMaximo: parseFloat(e.target.value) || 0 })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">Probabilidades (total deve ser 100%)</h3>
          
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Baixo ({lootbox.probabilidadeBaixo}%)</label>
              <span className="text-sm text-gray-500">R$ {lootbox.premioMinimo.toFixed(2)} - R$ {((lootbox.premioMaximo - lootbox.premioMinimo) / 3 + lootbox.premioMinimo).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={lootbox.probabilidadeBaixo}
                onChange={(e) => setLootbox({ ...lootbox, probabilidadeBaixo: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all"
                  style={{ width: `${lootbox.probabilidadeBaixo}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Médio ({lootbox.probabilidadeMedio}%)</label>
              <span className="text-sm text-gray-500">R$ {((lootbox.premioMaximo - lootbox.premioMinimo) / 3 + lootbox.premioMinimo).toFixed(2)} - R$ {((lootbox.premioMaximo - lootbox.premioMinimo) * 2/3 + lootbox.premioMinimo).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={lootbox.probabilidadeMedio}
                onChange={(e) => setLootbox({ ...lootbox, probabilidadeMedio: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-yellow-500 h-full transition-all"
                  style={{ width: `${lootbox.probabilidadeMedio}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Alto ({lootbox.probabilidadeAlto}%)</label>
              <span className="text-sm text-gray-500">R$ {((lootbox.premioMaximo - lootbox.premioMinimo) * 2/3 + lootbox.premioMinimo).toFixed(2)} - R$ {lootbox.premioMaximo.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={lootbox.probabilidadeAlto}
                onChange={(e) => setLootbox({ ...lootbox, probabilidadeAlto: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-red-500 h-full transition-all"
                  style={{ width: `${lootbox.probabilidadeAlto}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Total:</span>
            <span className={`text-lg font-bold ${(lootbox.probabilidadeBaixo + lootbox.probabilidadeMedio + lootbox.probabilidadeAlto) === 100 ? 'text-green-600' : 'text-red-600'}`}>
              {lootbox.probabilidadeBaixo + lootbox.probabilidadeMedio + lootbox.probabilidadeAlto}%
            </span>
          </div>
        </div>
        
        <button
          onClick={handleSaveLootbox}
          className="mt-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all font-semibold shadow-md"
        >
          💾 Salvar Lootbox
        </button>
      </div>

      {/* CARD 3: MENSAGENS AUTOMÁTICAS */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-3">📱</span>
          <h2 className="text-2xl font-bold text-gray-800">Mensagens Automáticas</h2>
        </div>
        <div className="h-1 bg-gradient-to-r from-green-500 to-teal-500 rounded mb-6"></div>
        
        <div className="space-y-6">
          {['boas_vindas', 'proposta', 'conversao', 'lootbox'].map((tipo) => (
            <div key={tipo} className="border-l-4 border-blue-500 pl-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg text-gray-800">{getTipoLabel(tipo)}</h3>
                <button
                  onClick={() => {
                    setTipoSelecionado(tipo as any);
                    setShowAddMensagem(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <span>➕</span> Adicionar
                </button>
              </div>
              
              <div className="space-y-2">
                {getMensagensPorTipo(tipo).length === 0 ? (
                  <p className="text-gray-500 text-sm italic">Nenhuma mensagem cadastrada</p>
                ) : (
                  getMensagensPorTipo(tipo).map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <button
                        onClick={() => handleToggleMensagem(msg)}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${msg.ativo ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                      >
                        {msg.ativo && <span className="text-white text-xs">✓</span>}
                      </button>
                      
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{msg.mensagem}</p>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteMensagem(msg.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
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
    </div>
  );
}
