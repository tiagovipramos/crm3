'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface WhatsAppCloudConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WhatsAppCloudConfig) => void;
}

interface WhatsAppCloudConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
  webhookVerifyToken?: string;
}

export default function WhatsAppCloudConfig({ isOpen, onClose, onSave }: WhatsAppCloudConfigProps) {
  const [config, setConfig] = useState<WhatsAppCloudConfig>({
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    webhookVerifyToken: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!config.accessToken || !config.phoneNumberId) {
      setError('Access Token e Phone Number ID são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await onSave(config);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Configurar WhatsApp Cloud API
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure sua conta do WhatsApp Business usando a API oficial do Meta
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              📋 Como obter suas credenciais:
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Acesse <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline font-medium">Facebook Developers</a></li>
              <li>Crie ou selecione seu App</li>
              <li>Adicione o produto "WhatsApp" ao app</li>
              <li>Em "API Setup", copie:
                <ul className="ml-6 mt-1 list-disc list-inside">
                  <li><strong>Phone Number ID</strong> (ID do número de telefone)</li>
                  <li><strong>Access Token</strong> (Token de acesso temporário ou permanente)</li>
                </ul>
              </li>
            </ol>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Access Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Token <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.accessToken}
              onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
              placeholder="EAABsBCS1iHgBO..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Token gerado no Facebook Developers (pode ser temporário ou permanente)
            </p>
          </div>

          {/* Phone Number ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.phoneNumberId}
              onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
              placeholder="106540352242922"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              ID do número de telefone encontrado no Facebook Developers
            </p>
          </div>

          {/* Business Account ID (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Account ID <span className="text-gray-400">(Opcional)</span>
            </label>
            <input
              type="text"
              value={config.businessAccountId}
              onChange={(e) => setConfig({ ...config, businessAccountId: e.target.value })}
              placeholder="123456789012345"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              ID da conta business (WABA ID) - opcional mas recomendado
            </p>
          </div>

          {/* Webhook Verify Token (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Verify Token <span className="text-gray-400">(Opcional)</span>
            </label>
            <input
              type="text"
              value={config.webhookVerifyToken}
              onChange={(e) => setConfig({ ...config, webhookVerifyToken: e.target.value })}
              placeholder="meu_token_secreto_123"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Token para verificação do webhook (use o mesmo que configurar no Meta)
            </p>
          </div>

          {/* Informação sobre Webhook */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">
              🔗 URL do Webhook:
            </h3>
            <code className="block bg-white px-3 py-2 rounded border border-yellow-300 text-sm text-gray-800 break-all">
              {typeof window !== 'undefined' ? window.location.origin : 'https://seu-dominio.com'}/api/whatsapp-cloud/webhook
            </code>
            <p className="text-xs text-yellow-800 mt-2">
              Configure esta URL no Facebook Developers → WhatsApp → Configuration → Webhooks
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
          <p className="text-xs text-gray-600">
            <strong>Nota:</strong> Após salvar, você estará usando a API oficial do WhatsApp Business Cloud API.
            Mensagens enviadas e recebidas funcionarão normalmente sem necessidade de QR Code.
          </p>
        </div>
      </div>
    </div>
  );
}
