'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  GripVertical, 
  Save, 
  X, 
  AlertCircle,
  ArrowRight,
  Lock,
  Unlock
} from 'lucide-react';

interface EtapaFunil {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  sistema: boolean; // Etapas do sistema não podem ser deletadas
  totalLeads?: number;
}

export default function FunisGestaoView() {
  // Estado inicial com etapas padrão
  const [etapas, setEtapas] = useState<EtapaFunil[]>([
    { id: 'novo', nome: 'Novo', cor: '#3B82F6', ordem: 1, sistema: true, totalLeads: 15 },
    { id: 'primeiro_contato', nome: 'Primeiro Contato', cor: '#10B981', ordem: 2, sistema: true, totalLeads: 8 },
    { id: 'aguardando_retorno', nome: 'Aguardando Retorno', cor: '#F59E0B', ordem: 3, sistema: false, totalLeads: 5 },
    { id: 'vistoria_agendada', nome: 'Vistoria Agendada', cor: '#8B5CF6', ordem: 4, sistema: false, totalLeads: 3 },
    { id: 'proposta_enviada', nome: 'Proposta Enviada', cor: '#EC4899', ordem: 5, sistema: false, totalLeads: 4 },
    { id: 'convertido', nome: 'Convertido', cor: '#059669', ordem: 6, sistema: true, totalLeads: 12 },
    { id: 'perdido', nome: 'Perdido', cor: '#EF4444', ordem: 7, sistema: true, totalLeads: 7 },
    { id: 'engano', nome: 'Engano', cor: '#6B7280', ordem: 8, sistema: true, totalLeads: 2 },
  ]);

  const [etapaEditando, setEtapaEditando] = useState<EtapaFunil | null>(null);
  const [etapaNova, setEtapaNova] = useState<Partial<EtapaFunil> | null>(null);
  const [modalAberto, setModalAberto] = useState<'criar' | 'editar' | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Cores predefinidas para escolha
  const coresPredefinidas = [
    { nome: 'Azul', valor: '#3B82F6' },
    { nome: 'Verde', valor: '#10B981' },
    { nome: 'Amarelo', valor: '#F59E0B' },
    { nome: 'Roxo', valor: '#8B5CF6' },
    { nome: 'Rosa', valor: '#EC4899' },
    { nome: 'Verde Escuro', valor: '#059669' },
    { nome: 'Vermelho', valor: '#EF4444' },
    { nome: 'Cinza', valor: '#6B7280' },
    { nome: 'Laranja', valor: '#F97316' },
    { nome: 'Indigo', valor: '#6366F1' },
  ];

  const mostrarSucesso = (mensagem: string) => {
    setSuccess(mensagem);
    setTimeout(() => setSuccess(''), 3000);
  };

  const mostrarErro = (mensagem: string) => {
    setError(mensagem);
    setTimeout(() => setError(''), 3000);
  };

  const handleCriarEtapa = () => {
    if (!etapaNova?.nome || !etapaNova?.cor) {
      mostrarErro('Nome e cor são obrigatórios');
      return;
    }

    // Validar nome duplicado
    if (etapas.some(e => e.nome.toLowerCase() === etapaNova.nome.toLowerCase())) {
      mostrarErro('Já existe uma etapa com este nome');
      return;
    }

    const novaEtapa: EtapaFunil = {
      id: (etapaNova.nome || '').toLowerCase().replace(/\s+/g, '_'),
      nome: etapaNova.nome || '',
      cor: etapaNova.cor || '#3B82F6',
      ordem: etapas.length + 1,
      sistema: false,
      totalLeads: 0,
    };

    setEtapas([...etapas, novaEtapa]);
    setEtapaNova(null);
    setModalAberto(null);
    mostrarSucesso('Etapa criada com sucesso!');
  };

  const handleEditarEtapa = () => {
    if (!etapaEditando?.nome || !etapaEditando?.cor) {
      mostrarErro('Nome e cor são obrigatórios');
      return;
    }

    // Validar nome duplicado (exceto a própria etapa)
    if (etapas.some(e => e.id !== etapaEditando.id && e.nome.toLowerCase() === etapaEditando.nome.toLowerCase())) {
      mostrarErro('Já existe uma etapa com este nome');
      return;
    }

    setEtapas(etapas.map(e => e.id === etapaEditando.id ? etapaEditando : e));
    setEtapaEditando(null);
    setModalAberto(null);
    mostrarSucesso('Etapa atualizada com sucesso!');
  };

  const handleDeletarEtapa = (etapa: EtapaFunil) => {
    if (etapa.sistema) {
      mostrarErro('Etapas do sistema não podem ser deletadas');
      return;
    }

    if (etapa.totalLeads && etapa.totalLeads > 0) {
      mostrarErro(`Esta etapa possui ${etapa.totalLeads} leads ativos. Mova-os antes de deletar.`);
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar a etapa "${etapa.nome}"?`)) {
      return;
    }

    setEtapas(etapas.filter(e => e.id !== etapa.id).map((e, index) => ({ ...e, ordem: index + 1 })));
    mostrarSucesso('Etapa deletada com sucesso!');
  };

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newEtapas = [...etapas];
    const draggedItem = newEtapas[draggedIndex];
    
    newEtapas.splice(draggedIndex, 1);
    newEtapas.splice(index, 0, draggedItem);
    
    // Atualizar ordem
    const reordered = newEtapas.map((etapa, idx) => ({
      ...etapa,
      ordem: idx + 1,
    }));
    
    setEtapas(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    mostrarSucesso('Ordem das etapas atualizada!');
  };

  const getTotalLeads = () => {
    return etapas.reduce((acc, etapa) => acc + (etapa.totalLeads || 0), 0);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-4xl">🔀</span>
              Gestão de Funis de Vendas
            </h1>
            <p className="text-gray-600 mt-2">
              Configure as etapas do processo de vendas e organize o fluxo de trabalho
            </p>
          </div>
          
          <button
            onClick={() => {
              setEtapaNova({ nome: '', cor: '#3B82F6' });
              setModalAberto('criar');
            }}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-semibold"
          >
            <Plus className="w-5 h-5" />
            Adicionar Etapa
          </button>
        </div>
      </div>

      {/* Notificações */}
      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg animate-in slide-in-from-top">
          <p className="text-green-800 flex items-center gap-2">
            <span className="text-xl">✅</span>
            {success}
          </p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-in slide-in-from-top">
          <p className="text-red-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </p>
        </div>
      )}

      {/* Preview do Funil */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">📊</span>
          <h2 className="text-xl font-bold text-gray-900">Preview do Funil</h2>
          <span className="ml-auto text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
            {getTotalLeads()} leads no total
          </span>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          {etapas.sort((a, b) => a.ordem - b.ordem).map((etapa, index) => (
            <div key={etapa.id} className="flex items-center">
              {/* Card da Etapa */}
              <div 
                className="relative min-w-[140px] bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border-2 shadow-md hover:shadow-lg transition-all"
                style={{ borderColor: etapa.cor }}
              >
                {/* Indicador de sistema */}
                {etapa.sistema && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full p-1">
                    <Lock className="w-3 h-3" />
                  </div>
                )}
                
                <div className="flex items-center justify-center w-10 h-10 rounded-full mb-2 mx-auto" style={{ backgroundColor: etapa.cor }}>
                  <span className="text-white font-bold text-lg">{etapa.totalLeads || 0}</span>
                </div>
                
                <h3 className="text-center font-semibold text-gray-900 text-sm">{etapa.nome}</h3>
                <p className="text-center text-xs text-gray-500 mt-1">Ordem {etapa.ordem}</p>
              </div>
              
              {/* Seta */}
              {index < etapas.length - 1 && (
                <ArrowRight className="w-6 h-6 text-gray-400 mx-1 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Etapas */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">📝</span>
          <h2 className="text-xl font-bold text-gray-900">Etapas Configuradas</h2>
          <span className="ml-auto text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
            {etapas.length} etapas
          </span>
        </div>

        <div className="space-y-3">
          {etapas.sort((a, b) => a.ordem - b.ordem).map((etapa, index) => (
            <div
              key={etapa.id}
              draggable={!etapa.sistema}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border-2 transition-all ${
                etapa.sistema 
                  ? 'border-gray-200' 
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-move'
              } ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
              style={{ borderLeftColor: etapa.cor, borderLeftWidth: '4px' }}
            >
              <div className="flex items-center gap-4">
                {/* Drag Handle */}
                {!etapa.sistema && (
                  <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    <GripVertical className="w-5 h-5" />
                  </div>
                )}
                
                {/* Ícone de bloqueio para etapas do sistema */}
                {etapa.sistema && (
                  <div className="text-yellow-500" title="Etapa do sistema">
                    <Lock className="w-5 h-5" />
                  </div>
                )}

                {/* Badge de Ordem */}
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold shadow-md"
                  style={{ backgroundColor: etapa.cor }}
                >
                  {etapa.ordem}
                </div>

                {/* Informações */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{etapa.nome}</h3>
                    {etapa.sistema && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                        Sistema
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {etapa.totalLeads || 0} leads nesta etapa
                  </p>
                </div>

                {/* Cor Preview */}
                <div className="flex items-center gap-2">
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
                    style={{ backgroundColor: etapa.cor }}
                    title={etapa.cor}
                  ></div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEtapaEditando(etapa);
                      setModalAberto('editar');
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar etapa"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  
                  {!etapa.sistema && (
                    <button
                      onClick={() => handleDeletarEtapa(etapa)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Deletar etapa"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Mensagem para etapas do sistema */}
              {etapa.sistema && (
                <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 px-3 py-1 rounded">
                  Esta é uma etapa essencial do sistema e não pode ser deletada
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Dica de uso */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 Dicas de uso:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Arraste as etapas para reordenar o fluxo do funil</li>
                <li>Etapas marcadas como "Sistema" não podem ser deletadas</li>
                <li>Só é possível deletar etapas sem leads ativos</li>
                <li>Cada etapa pode ter uma cor personalizada para facilitar identificação</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Criar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h3 className="text-xl font-bold text-white">
                {modalAberto === 'criar' ? '➕ Nova Etapa' : '✏️ Editar Etapa'}
              </h3>
              <button
                onClick={() => {
                  setModalAberto(null);
                  setEtapaNova(null);
                  setEtapaEditando(null);
                }}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome da Etapa *
                </label>
                <input
                  type="text"
                  value={modalAberto === 'criar' ? etapaNova?.nome || '' : etapaEditando?.nome || ''}
                  onChange={(e) => {
                    if (modalAberto === 'criar') {
                      setEtapaNova({ ...etapaNova, nome: e.target.value });
                    } else {
                      setEtapaEditando({ ...etapaEditando!, nome: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Negociação"
                />
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cor da Etapa *
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {coresPredefinidas.map((cor) => {
                    const corSelecionada = modalAberto === 'criar' ? etapaNova?.cor : etapaEditando?.cor;
                    const isSelected = cor.valor === corSelecionada;
                    
                    return (
                      <button
                        key={cor.valor}
                        onClick={() => {
                          if (modalAberto === 'criar') {
                            setEtapaNova({ ...etapaNova, cor: cor.valor });
                          } else {
                            setEtapaEditando({ ...etapaEditando!, cor: cor.valor });
                          }
                        }}
                        className={`w-full h-12 rounded-lg border-2 transition-all hover:scale-110 ${
                          isSelected ? 'border-gray-900 ring-2 ring-offset-2 ring-blue-500' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: cor.valor }}
                        title={cor.nome}
                      >
                        {isSelected && (
                          <span className="text-white font-bold text-lg">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Cor selecionada: {modalAberto === 'criar' ? etapaNova?.cor : etapaEditando?.cor}
                </p>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2">Preview:</p>
                <div 
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border-l-4"
                  style={{ 
                    borderLeftColor: modalAberto === 'criar' ? etapaNova?.cor || '#3B82F6' : etapaEditando?.cor || '#3B82F6' 
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ 
                      backgroundColor: modalAberto === 'criar' ? etapaNova?.cor || '#3B82F6' : etapaEditando?.cor || '#3B82F6' 
                    }}
                  >
                    {etapas.length + 1}
                  </div>
                  <span className="font-semibold text-gray-900">
                    {modalAberto === 'criar' ? etapaNova?.nome || 'Nome da Etapa' : etapaEditando?.nome || 'Nome da Etapa'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 rounded-b-xl">
              <button
                onClick={() => {
                  setModalAberto(null);
                  setEtapaNova(null);
                  setEtapaEditando(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={modalAberto === 'criar' ? handleCriarEtapa : handleEditarEtapa}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {modalAberto === 'criar' ? 'Criar Etapa' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
