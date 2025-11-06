import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useIndicadorStore } from '@/store/useIndicadorStore';

export function useSocketIndicador() {
  const indicador = useIndicadorStore(state => state.indicador);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!indicador) {
      // Desconectar socket se não houver indicador
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Conectar ao Socket.IO
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Join na sala do indicador
    socket.on('connect', () => {
      console.log('✅ Socket.IO conectado (Indicador) em:', new Date().toISOString());
      socket.emit('join_indicador', indicador.id);
      console.log(`👤 Indicador ${indicador.id} entrou na room`);
    });

    // Escutar atualização de saldo
    socket.on('saldo_atualizado', async (data: any) => {
      console.log('💰 Saldo atualizado via Socket.IO:', data);
      console.log('🔍 IndicadorId:', data.indicadorId, 'LeadId:', data.leadId, 'Status:', data.status);
      
      // Recarregar dashboard automaticamente
      const store = useIndicadorStore.getState();
      console.log('🔄 Recarregando dashboard do indicador...');
      await store.fetchDashboard();
      await store.fetchIndicacoes();
      await store.fetchTransacoes();
      await store.fetchLootBoxStatus();
      console.log('✅ Dashboard atualizado em tempo real!');
    });

    // 🔥 Escutar atualização de configurações de lootbox
    socket.on('configuracoes_lootbox_atualizadas', async (data: any) => {
      console.log('⚙️ Configurações de lootbox atualizadas via Socket.IO:', data);
      console.log('📊 Novas metas:', {
        indicacoes: data.indicacoesNecessarias,
        vendas: data.vendasNecessarias
      });
      
      // Recarregar status da lootbox para refletir as novas configurações
      const store = useIndicadorStore.getState();
      console.log('🔄 Recarregando status da lootbox com novas configurações...');
      await store.fetchLootBoxStatus();
      console.log('✅ Lootbox atualizada em tempo real com novas metas!');
    });

    // Tratar erros
    socket.on('error', (error: any) => {
      console.error('❌ Erro no Socket.IO (Indicador):', error);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket.IO desconectado (Indicador)');
    });

    // Cleanup
    return () => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [indicador?.id]);

  return socketRef.current;
}
