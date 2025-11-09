'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface MensagemPredefinida {
  id: string;
  tipo: 'mensagem' | 'audio';
  titulo: string;
  conteudo?: string;
  arquivo_url?: string;
  duracao_audio?: number;
  ordem: number;
  ativo: boolean;
}

interface Props {
  token: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function MensagensPredefinidasPanel({ token, onSuccess, onError }: Props) {
  const [mensagens, setMensagens] = useState<MensagemPredefinida[]>([]);
  const [audios, setAudios] = useState<MensagemPredefinida[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'mensagens' | 'audios'>('mensagens');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<MensagemPredefinida | null>(null);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregarMensagens();
  }, []);

  const carregarMensagens = async () => {
    try {
      const response = await axios.get(`${API_URL}/configuracoes/mensagens-predefinidas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const dados = response.data;
      setMensagens(dados.filter((m: MensagemPredefinida) => m.tipo === 'mensagem'));
      setAudios(dados.filter((m: MensagemPredefinida) => m.tipo === 'audio'));
    } catch (error: any) {
      onError(error.response?.data?.error || 'Erro ao carregar mensagens');
    }
  };

  const handleSalvar = async () => {
    if (!titulo.trim()) {
      onError('Título é obrigatório');
      return;
    }

    if (abaAtiva === 'mensagens' && !conteudo.trim()) {
      onError('Conteúdo é obrigatório');
      return;
    }

    try {
      if (editando) {
        await axios.put(
          `${API_URL}/configuracoes/mensagens-predefinidas/${editando.id}`,
          { titulo, conteudo, ativo: true },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onSuccess('Mensagem atualizada com sucesso!');
      } else {
        await axios.post(
          `${API_URL}/configuracoes/mensagens-predefinidas`,
          { tipo: abaAtiva === 'mensagens' ? 'mensagem' : 'audio', titulo, conteudo },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onSuccess('Mensagem criada com sucesso!');
      }
      
      setShowModal(false);
      setEditando(null);
      setTitulo('');
      setConteudo('');
      carregarMensagens();
    } catch (error: any) {
      onError(error.response?.data?.error || 'Erro ao salvar mensagem');
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;

    try {
      await axios.delete(`${API_URL}/configuracoes/mensagens-predefinidas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess('Mensagem excluída com sucesso!');
      carregarMensagens();
    } catch (error: any) {
      onError(error.response?.data?.error || 'Erro ao excluir mensagem');
    }
  };

  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAudio(true);
    const formData = new FormData();
    formData.append('audio', file);

    try {
      const uploadRes = await axios.post(
        `${API_URL}/configuracoes/mensagens-predefinidas/upload-audio`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      await axios.post(
        `${API_URL}/configuracoes/mensagens-predefinidas`,
        {
          tipo: 'audio',
          titulo: titulo || file.name.replace(/\.[^/.]+$/, ''),
          arquivoUrl: uploadRes.data.arquivoUrl,
          duracaoAudio: 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSuccess('Áudio enviado com sucesso!');
      setShowModal(false);
      setTitulo('');
      carregarMensagens();
    } catch (error: any) {
      onError(error.response?.data?.error || 'Erro ao enviar áudio');
    } finally {
      setUploadingAudio(false);
    }
  };

  const lista = abaAtiva === 'mensagens' ? mensagens : audios;

  return (
    <div>
      {/* Tabs 3D */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setAbaAtiva('mensagens')}
          className={`flex-1 py-3 px-6 font-semibold rounded-t-lg transition-all transform ${
            abaAtiva === 'mensagens'
              ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg scale-105 -translate-y-1'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          💬 Mensagens ({mensagens.length})
        </button>
        <button
          onClick={() => setAbaAtiva('audios')}
          className={`flex-1 py-3 px-6 font-semibold rounded-t-lg transition-all transform ${
            abaAtiva === 'audios'
              ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg scale-105 -translate-y-1'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          🎤 Áudios ({audios.length})
        </button>
      </div>

      {/* Botão Adicionar */}
      <button
        onClick={() => {
          setEditando(null);
          setTitulo('');
          setConteudo('');
          setShowModal(true);
        }}
        className="mb-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all flex items-center gap-2"
      >
        <span>➕</span>
        {abaAtiva === 'mensagens' ? 'Adicionar Mensagem' : 'Adicionar Áudio'}
      </button>

      {/* Lista */}
      <div className="space-y-3">
        {lista.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Nenhum{abaAtiva === 'mensagens' ? 'a mensagem' : ' áudio'} cadastrado</p>
            <p className="text-sm mt-2">Clique em "Adicionar" para criar o primeiro</p>
          </div>
        ) : (
          lista.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-all"
            >
              <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full">
                #{index + 1}
              </span>
              
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.titulo}</h4>
                {item.tipo === 'mensagem' && item.conteudo && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.conteudo}</p>
                )}
                {item.tipo === 'audio' && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">🎵 Áudio</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditando(item);
                    setTitulo(item.titulo);
                    setConteudo(item.conteudo || '');
                    setShowModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleExcluir(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                  title="Excluir"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">
              {editando ? 'Editar' : 'Adicionar'} {abaAtiva === 'mensagens' ? 'Mensagem' : 'Áudio'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Agendamento, Boas-vindas..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {abaAtiva === 'mensagens' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo</label>
                  <textarea
                    value={conteudo}
                    onChange={(e) => setConteudo(e.target.value)}
                    placeholder="Digite a mensagem..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Áudio</label>
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleUploadAudio}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Formatos: MP3, OGG, WAV, M4A (máx 10MB)</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {abaAtiva === 'mensagens' && (
                <button
                  onClick={handleSalvar}
                  disabled={uploadingAudio}
                  className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium"
                >
                  ✅ Salvar
                </button>
              )}
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditando(null);
                  setTitulo('');
                  setConteudo('');
                }}
                disabled={uploadingAudio}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 font-medium"
              >
                ❌ Cancelar
              </button>
            </div>

            {uploadingAudio && (
              <div className="mt-4 text-center text-teal-600 font-medium">
                Enviando áudio...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
