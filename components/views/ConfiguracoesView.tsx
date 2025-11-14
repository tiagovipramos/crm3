'use client';

import { useState } from 'react';
import { useProtecarStore } from '@/store/useProtecarStore';
import { Smartphone, LogOut, Cloud } from 'lucide-react';
import WhatsAppQRModal from '@/components/WhatsAppQRModal';
import WhatsAppCloudConfig from '@/components/WhatsAppCloudConfig';
import { whatsappAPI, whatsappCloudAPI } from '@/lib/api';

export default function ConfiguracoesView() {
  const { consultorAtual } = useProtecarStore();
  const [mostrarModalQR, setMostrarModalQR] = useState(false);
  const [mostrarCloudConfig, setMostrarCloudConfig] = useState(false);
  const [desconectando, setDesconectando] = useState(false);

  const handleDesconectar = async () => {
    if (!confirm('Tem certeza que deseja desconectar o WhatsApp?\n\nVocê precisará escanear o QR Code novamente para reconectar.\n\nObs: O histórico de mensagens será mantido por 90 dias.')) {
      return;
    }

    setDesconectando(true);
    try {
      // Tentar desconectar ambos os serviços
      try {
        await whatsappCloudAPI.removeConfig();
      } catch (e) {
        // Ignorar se não estiver usando Cloud API
      }
      
      try {
        await whatsappAPI.disconnect();
      } catch (e) {
        // Ignorar se não estiver usando Baileys
      }
      
      alert('✅ WhatsApp desconectado com sucesso!');
      // Atualizar estado será feito pelo Socket.IO
    } catch (error: any) {
      console.error('Erro ao desconectar WhatsApp:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Erro desconhecido';
      alert('❌ Erro ao desconectar: ' + errorMsg);
    } finally {
      setDesconectando(false);
    }
  };

  const handleSaveCloudConfig = async (config: any) => {
    try {
      await whatsappCloudAPI.saveConfig(config);
      alert('✅ WhatsApp Cloud API configurado com sucesso!');
      setMostrarCloudConfig(false);
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Erro desconhecido';
      throw new Error(errorMsg);
    }
  };

  return (
    <>
      <WhatsAppQRModal isOpen={mostrarModalQR} onClose={() => setMostrarModalQR(false)} />
      <WhatsAppCloudConfig 
        isOpen={mostrarCloudConfig} 
        onClose={() => setMostrarCloudConfig(false)}
        onSave={handleSaveCloudConfig}
      />
      
      <div className="h-full bg-gray-50 flex">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Conexão WhatsApp</h3>
                  <p className="text-sm text-gray-600">Conecte seu WhatsApp ao CRM</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  {consultorAtual?.statusConexao === 'online' ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium text-gray-900">Conectado</p>
                        <p className="text-sm text-gray-600">
                          WhatsApp ativo{consultorAtual.numeroWhatsapp ? ` 📱 ${consultorAtual.numeroWhatsapp}` : ''}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <div>
                        <p className="font-medium text-gray-900">Desconectado</p>
                        <p className="text-sm text-gray-600">Escolha uma opção abaixo para conectar</p>
                      </div>
                    </>
                  )}
                </div>
                {consultorAtual?.statusConexao === 'online' && (
                  <button
                    onClick={handleDesconectar}
                    disabled={desconectando}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center gap-2"
                  >
                    {desconectando ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Desconectando...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-5 h-5" />
                        Desconectar
                      </>
                    )}
                  </button>
                )}
              </div>

              {consultorAtual?.statusConexao !== 'online' && (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Cloud className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">API Oficial (Recomendado)</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Use a WhatsApp Business Cloud API oficial do Meta. Mais estável e profissional.
                          Não requer QR Code, basta configurar o token.
                        </p>
                        <button
                          onClick={() => setMostrarCloudConfig(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center gap-2"
                        >
                          <Cloud className="w-4 h-4" />
                          Configurar API Oficial
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Smartphone className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">API Não Oficial</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Conecte escaneando QR Code (método antigo). Pode ser instável e está sujeito a bloqueios.
                        </p>
                        <button
                          onClick={() => setMostrarModalQR(true)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition flex items-center gap-2"
                        >
                          <Smartphone className="w-4 h-4" />
                          Conectar com QR Code
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
