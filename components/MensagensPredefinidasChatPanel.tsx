'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Send } from 'lucide-react';

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
  onClose: () => void;
  onSelectMensagem: (conteudo: string) => void;
  onSelectAudio: (audioUrl: string, duracao: number) => void;
  token: string;
}

export default function MensagensPredefinidasChatPanel({ onClose, onSelectMensagem, onSelectAudio, token }: Props) {
  const [mensagens, setMensagens] = useState<MensagemPredefinida[]>([]);
  const [audios, setAudios] = useState<MensagemPredefinida[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'mensagens' | 'audios'>('mensagens');
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const lista = abaAtiva === 'mensagens' ? mensagens : audios;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-teal-500 to-cyan-600">
        <h3 className="font-semibold text-white">Mensagens Rápidas</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Tabs 3D */}
      <div className="flex gap-2 p-3 bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => setAbaAtiva('mensagens')}
          className={`flex-1 py-2.5 px-4 font-semibold rounded-lg transition-all transform ${
            abaAtiva === 'mensagens'
              ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg scale-105 -translate-y-0.5'
              : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
          }`}
        >
          💬 Mensagens
          {mensagens.length > 0 && (
            <span className={`ml-2 text-xs ${abaAtiva === 'mensagens' ? 'text-white/80' : 'text-gray-500'}`}>
              ({mensagens.length})
            </span>
          )}
        </button>
        <button
          onClick={() => setAbaAtiva('audios')}
          className={`flex-1 py-2.5 px-4 font-semibold rounded-lg transition-all transform ${
            abaAtiva === 'audios'
              ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg scale-105 -translate-y-0.5'
              : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
          }`}
        >
          🎤 Áudios
          {audios.length > 0 && (
            <span className={`ml-2 text-xs ${abaAtiva === 'audios' ? 'text-white/80' : 'text-gray-500'}`}>
              ({audios.length})
            </span>
          )}
        </button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : lista.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">Nenhum{abaAtiva === 'mensagens' ? 'a mensagem' : ' áudio'} disponível</p>
            <p className="text-xs mt-1">Configure no painel admin</p>
          </div>
        ) : (
          lista.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.tipo === 'mensagem' && item.conteudo) {
                  onSelectMensagem(item.conteudo);
                  onClose();
                } else if (item.tipo === 'audio' && item.arquivo_url) {
                  onSelectAudio(item.arquivo_url, item.duracao_audio || 0);
                  onClose();
                }
              }}
              className="w-full text-left p-3 bg-white hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 border border-gray-200 rounded-lg transition-all hover:shadow-md hover:scale-[1.02] group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  item.tipo === 'mensagem' 
                    ? 'bg-teal-100 text-teal-600 group-hover:bg-teal-500 group-hover:text-white'
                    : 'bg-purple-100 text-purple-600 group-hover:bg-purple-500 group-hover:text-white'
                } transition-colors`}>
                  {item.tipo === 'mensagem' ? '💬' : '🎤'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.titulo}</h4>
                  {item.tipo === 'mensagem' && item.conteudo && (
                    <p className="text-xs text-gray-600 line-clamp-2">{item.conteudo}</p>
                  )}
                  {item.tipo === 'audio' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      Áudio
                    </span>
                  )}
                </div>

                <Send className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition-colors flex-shrink-0 mt-1" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-center text-gray-600">
          Clique em uma mensagem para enviar rapidamente
        </p>
      </div>
    </div>
  );
}
