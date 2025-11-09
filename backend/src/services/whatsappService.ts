import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WAMessage,
  proto
} from 'baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pool from '../config/database';
import pino from 'pino';

interface WhatsAppSession {
  sock: any;
  qrCode?: string;
  connected: boolean;
}

class WhatsAppService {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private io: any; // Socket.IO instance
  private reconnecting: Set<string> = new Set();
  
  // ✅ OPÇÃO 1: Reconexão agressiva com limitador de tentativas
  private reconnectAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_RESET_TIME = 5 * 60 * 1000; // 5 minutos
  
  // ✅ CORREÇÃO ERRO 2: Sistema de rotação de User-Agents
  // Armazena qual browser foi usado por cada consultor para rotação
  private consultorBrowserIndex: Map<string, number> = new Map();

  setSocketIO(io: any) {
    this.io = io;
  }

  /**
   * Normaliza número do WhatsApp removendo sufixos e prefixos especiais
   * - Remove @lid (Local Identifier Device - números não totalmente registrados)
   * - Remove @s.whatsapp.net
   * - Remove prefixo '10' de números LID
   * - Extrai apenas dígitos
   */
  private normalizarNumero(numero: string): string {
    if (!numero) return '';
    
    // Log para debug
    console.log('🔧 [NORMALIZAR] Número original:', numero);
    
    // Remover sufixos do WhatsApp
    let numeroLimpo = numero
      .replace('@lid', '')
      .replace('@s.whatsapp.net', '');
    
    // Remover prefixo '10' se for número LID (formato: 101692611760167)
    // Detecta se começa com '10' seguido de 11 ou mais dígitos (indicando LID)
    if (/^10\d{11,}/.test(numeroLimpo)) {
      numeroLimpo = numeroLimpo.substring(2);
      console.log('🔧 [NORMALIZAR] Removido prefixo LID "10":', numeroLimpo);
    }
    
    // Extrair apenas dígitos
    numeroLimpo = numeroLimpo.replace(/\D/g, '');
    
    console.log('🔧 [NORMALIZAR] Número normalizado:', numeroLimpo);
    return numeroLimpo;
  }

  /**
   * Formata número para exibição: (DDD) NUMERO
   */
  private formatarNumeroExibicao(numero: string): string {
    const numeroNormalizado = this.normalizarNumero(numero);
    
    // Remover código do país (55) se presente
    const numeroSem55 = numeroNormalizado.startsWith('55') 
      ? numeroNormalizado.substring(2) 
      : numeroNormalizado;
    
    // Extrair DDD (2 primeiros dígitos)
    const ddd = numeroSem55.substring(0, 2);
    const resto = numeroSem55.substring(2);
    
    return `(${ddd}) ${resto}`;
  }

  // Tentar reconectar sessões existentes ao iniciar
  async tryReconnectExistingSessions(consultorId: string): Promise<boolean> {
    // Evitar múltiplas tentativas simultâneas
    if (this.reconnecting.has(consultorId)) {
      console.log('⏳ Já existe uma tentativa de reconexão em andamento');
      return false;
    }

    // Verificar se já está conectado
    const session = this.sessions.get(consultorId);
    if (session?.connected) {
      console.log('✅ Sessão já está conectada');
      return true;
    }

    // Verificar se existe pasta de autenticação
    const fs = require('fs');
    const authPath = `./auth_sessions/auth_${consultorId}`;
    
    if (!fs.existsSync(authPath)) {
      console.log('📁 Nenhuma sessão salva encontrada');
      return false;
    }

    console.log('🔄 Tentando reconectar sessão existente...');
    this.reconnecting.add(consultorId);

    try {
      // Tentar conectar usando sessão salva
      await this.conectar(consultorId);
      this.reconnecting.delete(consultorId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao reconectar:', error);
      this.reconnecting.delete(consultorId);
      return false;
    }
  }

  async conectar(consultorId: string): Promise<string | null> {
    try {
      // Verificar se já está conectando/conectado
      const existingSession = this.sessions.get(consultorId);
      if (existingSession && existingSession.connected) {
        console.log('✅ WhatsApp já está conectado');
        return null;
      }

      const { state, saveCreds } = await useMultiFileAuthState(`./auth_sessions/auth_${consultorId}`);

      // ✅ CORREÇÃO CRÍTICA #1 e #2: Browser identifier realista com rotação de User-Agents
      // Lista expandida de browsers reais com versões atualizadas (Nov 2025)
      const browsersReais: [string, string, string][] = [
        // Windows + Chrome (versões recentes)
        ['Windows', 'Chrome', '130.0.6723.116'],
        ['Windows', 'Chrome', '130.0.6723.92'],
        ['Windows', 'Chrome', '129.0.6668.100'],
        ['Windows', 'Chrome', '128.0.6613.120'],
        // macOS + Chrome
        ['Macintosh', 'Chrome', '130.0.6723.116'],
        ['Macintosh', 'Chrome', '130.0.6723.92'],
        ['Macintosh', 'Chrome', '129.0.6668.100'],
        // Linux + Chrome
        ['X11', 'Chrome', '130.0.6723.91'],
        ['X11', 'Chrome', '129.0.6668.89'],
        ['X11', 'Chrome', '128.0.6613.84'],
        // Edge (baseado em Chromium) - algumas versões
        ['Windows', 'Edge', '130.0.2849.52'],
        ['Windows', 'Edge', '129.0.2792.89'],
        ['Macintosh', 'Edge', '130.0.2849.52'],
      ];
      
      // ✅ CORREÇÃO ERRO 2: Implementar rotação de User-Agents
      // Cada reconexão usa um browser diferente (sequencial com wrap-around)
      let currentIndex = this.consultorBrowserIndex.get(consultorId) || 0;
      
      // Se for a primeira conexão, randomizar o índice inicial
      if (!this.consultorBrowserIndex.has(consultorId)) {
        currentIndex = Math.floor(Math.random() * browsersReais.length);
        console.log(`🎲 Primeira conexão: índice inicial aleatório = ${currentIndex}`);
      } else {
        // Em reconexões subsequentes, incrementar para variar o User-Agent
        currentIndex = (currentIndex + 1) % browsersReais.length;
        console.log(`🔄 Reconexão detectada: rotacionando para índice = ${currentIndex}`);
      }
      
      // Armazenar o próximo índice para a próxima conexão
      this.consultorBrowserIndex.set(consultorId, currentIndex);
      
      // Selecionar browser baseado no índice rotativo
      const browserAleatorio = browsersReais[currentIndex] as [string, string, string];
      
      // ✅ CORREÇÃO ERRO 9: Randomizar timeouts para evitar fingerprinting
      // Valores constantes = padrão de bot. Variação simula comportamento humano.
      const connectTimeout = 50000 + Math.floor(Math.random() * 20000); // 50-70s
      const queryTimeout = 50000 + Math.floor(Math.random() * 20000); // 50-70s
      const keepAliveInterval = 25000 + Math.floor(Math.random() * 10000); // 25-35s
      
      console.log(`⏱️ Timeouts randomizados: connect=${Math.round(connectTimeout/1000)}s, query=${Math.round(queryTimeout/1000)}s, keepAlive=${Math.round(keepAliveInterval/1000)}s`);
      
      // ✅ CORREÇÃO ERRO 11: Reduzir retries e randomizar delay
      // 5 retries = bot comercial. 2 retries = comportamento humano mais realista.
      const retryDelay = 200 + Math.floor(Math.random() * 200); // 200-400ms (não sempre 250ms)
      const maxRetries = 2; // Humanos raramente tentam mais que 2 vezes
      
      console.log(`🔄 Retry config: delay=${retryDelay}ms, maxRetries=${maxRetries}`);
      
      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }) as any, // Reduz logs no console
        browser: browserAleatorio, // ✅ Browser realista e randomizado
        connectTimeoutMs: connectTimeout, // ✅ Randomizado: 50-70s
        defaultQueryTimeoutMs: queryTimeout, // ✅ Randomizado: 50-70s
        keepAliveIntervalMs: keepAliveInterval, // ✅ Randomizado: 25-35s
        // ✅ CORREÇÃO ERRO 11: Retry mais humano
        retryRequestDelayMs: retryDelay, // ✅ Randomizado: 200-400ms
        maxMsgRetryCount: maxRetries, // ✅ Reduzido: 2 (mais realista que 5)
        // ✅ CORREÇÃO ERRO 8: NÃO marcar como online automaticamente
        // Humanos não ficam online instantaneamente ao conectar
        markOnlineOnConnect: false,
      });
      
      console.log('✅ Usando browser identifier realista:', browserAleatorio.join(' / '));

      sock.ev.on('creds.update', saveCreds);

      return new Promise((resolve) => {
        sock.ev.on('connection.update', async (update) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr) {
            // Gerar QR Code em base64
            const qrCodeDataUrl = await QRCode.toDataURL(qr);
            
            // Emitir QR Code via Socket.IO
            if (this.io) {
              this.io.to(`consultor_${consultorId}`).emit('qr_code', {
                qrCode: qrCodeDataUrl,
                consultorId
              });
            }

            // Atualizar no banco
            const [rows] = await pool.query(
              'UPDATE consultores SET status_conexao = ? WHERE id = ?',
              ['connecting', consultorId]
            );

            resolve(qrCodeDataUrl);
          }

          if (connection === 'close') {
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const errorMsg = (lastDisconnect?.error as any)?.message || 'Desconhecido';

            console.log(`❌ WhatsApp desconectado. Motivo: ${errorMsg} (Code: ${statusCode})`);
            console.log(`� Status Code: ${statusCode}, Logout Code: ${DisconnectReason.loggedOut}`);
            
            // Remover sessão do map SEMPRE
            this.sessions.delete(consultorId);
            
            // ✅ OPÇÃO 1: Reconexão agressiva com limitador de tentativas
            // Apenas NÃO reconectar quando for logout EXPLÍCITO
            const isManualLogout = statusCode === DisconnectReason.loggedOut || statusCode === 401;
            
            if (!isManualLogout) {
              // ✅ Verificar tentativas de reconexão
              const attempts = this.reconnectAttempts.get(consultorId) || { count: 0, lastAttempt: 0 };
              const now = Date.now();
              
              // Resetar contador se passaram mais de 5 minutos desde a última tentativa
              if (now - attempts.lastAttempt > this.RECONNECT_RESET_TIME) {
                console.log('� Resetando contador de tentativas (passou 5 minutos)');
                attempts.count = 0;
              }
              
              if (attempts.count >= this.MAX_RECONNECT_ATTEMPTS) {
                console.log(`⚠️ Máximo de ${this.MAX_RECONNECT_ATTEMPTS} tentativas atingido. Limpando sessão...`);
                console.log(`📊 Tentativas realizadas: ${attempts.count} | Última tentativa: ${new Date(attempts.lastAttempt).toLocaleString()}`);
                
                // Limpar contador e prosseguir para limpeza de sessão
                this.reconnectAttempts.delete(consultorId);
              } else {
                // ✅ Tentar reconectar (dentro do limite)
                attempts.count++;
                attempts.lastAttempt = now;
                this.reconnectAttempts.set(consultorId, attempts);
                
                console.log(`🔄 Erro de conexão detectado (${errorMsg}). Tentativa ${attempts.count}/${this.MAX_RECONNECT_ATTEMPTS}`);
                console.log(`📋 Status Code: ${statusCode} | Motivo: ${errorMsg}`);
                
                // Atualizar status no banco
                await pool.query(
                  'UPDATE consultores SET status_conexao = ? WHERE id = ?',
                  ['connecting', consultorId]
                );
                
                // Emitir evento de reconexão
                if (this.io) {
                  this.io.to(`consultor_${consultorId}`).emit('whatsapp_reconnecting', {
                    consultorId,
                    reason: errorMsg,
                    attempt: attempts.count,
                    maxAttempts: this.MAX_RECONNECT_ATTEMPTS
                  });
                }
                
                // ✅ CORREÇÃO ERRO 4: Backoff exponencial com jitter (randomização)
                // Simular comportamento humano - não robótico
                const baseDelay = 30000; // 30 segundos (base)
                const jitter = Math.random() * 15000; // 0-15 segundos de variação aleatória
                const exponentialDelay = baseDelay * Math.pow(2, attempts.count - 1); // 2^(tentativa-1)
                const totalDelay = Math.min(exponentialDelay + jitter, 300000); // Máximo 5 minutos
                
                console.log(`⏱️ Aguardando ${Math.round(totalDelay / 1000)}s antes de reconectar (base: ${baseDelay/1000}s, exponencial: ${Math.round(exponentialDelay/1000)}s, jitter: ${Math.round(jitter/1000)}s)`);
                
                setTimeout(() => {
                  this.conectar(consultorId).catch(err => {
                    console.error('❌ Erro ao reconectar:', err);
                  });
                }, totalDelay);
                
                resolve(null);
                return; // Importante: sair aqui para não executar limpeza de sessão
              }
            }
            
            // Se chegou aqui, é logout manual OU atingiu máximo de tentativas - LIMPAR TUDO
            if (isManualLogout) {
              console.log('🗑️ LOGOUT MANUAL DETECTADO - Limpando sessão automaticamente...');
            } else {
              console.log('🗑️ MÁXIMO DE TENTATIVAS ATINGIDO - Limpando sessão automaticamente...');
            }
            
            this.sessions.delete(consultorId);
              
              const fs = require('fs');
              const path = require('path');
              const authPath = path.join(process.cwd(), 'auth_sessions', `auth_${consultorId}`);
              
              console.log(`📂 Verificando pasta: ${authPath}`);
              
              // Deletar pasta de autenticação de forma mais robusta
              try {
                if (fs.existsSync(authPath)) {
                  console.log('🗑️ Deletando arquivos de autenticação...');
                  
                  // Usar rmSync com opções mais agressivas
                  fs.rmSync(authPath, { 
                    recursive: true, 
                    force: true,
                    maxRetries: 3,
                    retryDelay: 100
                  });
                  
                  // Verificar se foi realmente deletado
                  if (!fs.existsSync(authPath)) {
                    console.log('✅ Arquivos de autenticação removidos com sucesso!');
                  } else {
                    console.warn('⚠️ Pasta ainda existe após tentativa de remoção');
                  }
                } else {
                  console.log('ℹ️ Pasta de autenticação não encontrada (já foi removida?)');
                }
              } catch (deleteError) {
                console.error('❌ Erro ao deletar pasta de autenticação:', deleteError);
                // Tentar método alternativo
                try {
                  console.log('🔄 Tentando método alternativo de remoção...');
                  const { execSync } = require('child_process');
                  if (process.platform === 'win32') {
                    execSync(`rmdir /s /q "${authPath}"`, { stdio: 'ignore' });
                  } else {
                    execSync(`rm -rf "${authPath}"`, { stdio: 'ignore' });
                  }
                  console.log('✅ Pasta removida com comando do sistema');
                } catch (cmdError) {
                  console.error('❌ Falha no método alternativo:', cmdError);
                }
              }
              
              // Atualizar banco de dados
              const [rows] = await pool.query(
                'UPDATE consultores SET status_conexao = ?, sessao_whatsapp = NULL WHERE id = ?',
                ['offline', consultorId]
              );
              console.log('✅ Status atualizado no banco: offline');

              // Emitir evento de desconexão para o frontend
              if (this.io) {
                // Para o consultor
                this.io.to(`consultor_${consultorId}`).emit('whatsapp_disconnected', {
                  consultorId,
                  reason: 'logged_out',
                  message: 'WhatsApp desconectado. Sessão limpa automaticamente.'
                });
                
                // Para admins (tempo real)
                this.io.to('admins').emit('whatsapp_disconnected', {
                  consultorId,
                  reason: 'logged_out',
                  message: 'WhatsApp desconectado. Sessão limpa automaticamente.'
                });
                
                console.log('📡 Evento de desconexão emitido para o frontend e admins');
              }

            resolve(null);
          } else if (connection === 'open') {
            console.log('✅ WhatsApp conectado para consultor:', consultorId);
            
            // ✅ Resetar contador de tentativas de reconexão ao conectar com sucesso
            const attempts = this.reconnectAttempts.get(consultorId);
            if (attempts && attempts.count > 0) {
              console.log(`🎉 Reconexão bem-sucedida após ${attempts.count} tentativa(s)!`);
              this.reconnectAttempts.delete(consultorId);
            }

            // Capturar número do WhatsApp conectado
            let numeroWhatsapp: string | undefined;
            try {
              const user = sock.user;
              if (user?.id) {
                // Número vem no formato: 5511999999999:XX@s.whatsapp.net
                numeroWhatsapp = user.id.split(':')[0].replace('@s.whatsapp.net', '');
                console.log('📱 Número WhatsApp capturado:', numeroWhatsapp);
              }
            } catch (error) {
              console.log('⚠️ Não foi possível capturar número do WhatsApp');
            }

            const session: WhatsAppSession = {
              sock,
              connected: true
            };

            this.sessions.set(consultorId, session);

            // Atualizar status no banco COM O NÚMERO DO WHATSAPP
            const [rows] = await pool.query(
              'UPDATE consultores SET status_conexao = ?, sessao_whatsapp = ?, numero_whatsapp = ? WHERE id = ?',
              ['online', `session_${Date.now()}`, numeroWhatsapp || null, consultorId]
            );

            // Emitir evento de conexão bem-sucedida
            if (this.io) {
              // Para o consultor
              this.io.to(`consultor_${consultorId}`).emit('whatsapp_connected', {
                consultorId,
                status: 'online',
                numeroWhatsapp
              });
              
              // Para admins (tempo real)
              this.io.to('admins').emit('whatsapp_connected', {
                consultorId,
                status: 'online',
                numeroWhatsapp
              });
            }

            resolve(null);
          }
        });

        // Timeout de 60 segundos para gerar QR Code
        setTimeout(() => {
          if (!this.sessions.get(consultorId)?.connected) {
            console.log('⏰ Timeout ao gerar QR Code');
            sock.end(undefined);
            resolve(null);
          }
        }, 60000);

        // Receber mensagens
        console.log('🔧 [DEBUG] Registrando listener messages.upsert para consultor:', consultorId);
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
          console.log('📨 [DEBUG] Evento messages.upsert recebido:', {
            type,
            quantidade: messages.length,
            consultorId
          });
          
          // ✅ IMPORTANTE: Apenas processar mensagens com type='notify'
          // 'append' é usado quando VOCÊ envia mensagens (fromMe: true)
          // 'notify' é usado quando RECEBE mensagens de outros (fromMe: false)
          if (type === 'notify') {
            for (const message of messages) {
              console.log('🔍 [DEBUG] Mensagem recebida:', {
                messageId: message.key.id,
                fromMe: message.key.fromMe,
                remoteJid: message.key.remoteJid,
                hasContent: !!message.message
              });
              
              // ✅ Apenas processar mensagens RECEBIDAS (não enviadas por mim)
              if (!message.key.fromMe && message.message) {
                await this.processarMensagemRecebida(consultorId, message);
              } else if (message.key.fromMe) {
                console.log('⏩ [IGNORANDO] Mensagem fromMe (enviada por mim), já foi salva no método enviarMensagem');
              }
            }
          } else {
            console.log(`⏩ [IGNORANDO] Evento tipo '${type}' (não é 'notify'). Mensagens enviadas são salvas no método enviarMensagem.`);
          }
        });

        // Escutar atualizações de status das mensagens
        sock.ev.on('messages.update', async (updates) => {
          for (const update of updates) {
            if (update.update.status) {
              await this.atualizarStatusMensagem(consultorId, update);
            }
          }
        });
      });
    } catch (error) {
      console.error('Erro ao conectar WhatsApp:', error);
      throw error;
    }
  }

  async desconectar(consultorId: string) {
    const session = this.sessions.get(consultorId);
    
    console.log('🔌 Iniciando desconexão do WhatsApp para consultor:', consultorId);
    
    if (session?.sock) {
      try {
        // 1. Fazer logout do WhatsApp
        console.log('📤 Fazendo logout do WhatsApp...');
        await session.sock.logout();
        console.log('✅ Logout realizado');
      } catch (error) {
        console.error('⚠️ Erro ao fazer logout (continuando mesmo assim):', error);
      }
      
      // 2. Fechar o socket
      try {
        console.log('🔌 Fechando socket...');
        await session.sock.end(undefined);
        console.log('✅ Socket fechado');
      } catch (error) {
        console.error('⚠️ Erro ao fechar socket:', error);
      }
    }
    
    // 3. Remover sessão do Map (sempre, mesmo se não tinha socket)
    this.sessions.delete(consultorId);
    console.log('✅ Sessão removida do Map');
    
    // 4. Deletar pasta de autenticação
    const fs = require('fs');
    const path = require('path');
    const authPath = path.join(process.cwd(), 'auth_sessions', `auth_${consultorId}`);
    
    console.log(`📂 Verificando pasta de autenticação: ${authPath}`);
    
    try {
      if (fs.existsSync(authPath)) {
        console.log('🗑️ Deletando arquivos de autenticação...');
        
        // Usar rmSync com opções robustas
        fs.rmSync(authPath, { 
          recursive: true, 
          force: true,
          maxRetries: 3,
          retryDelay: 100
        });
        
        // Verificar se foi realmente deletado
        if (!fs.existsSync(authPath)) {
          console.log('✅ Arquivos de autenticação removidos com sucesso!');
        } else {
          console.warn('⚠️ Pasta ainda existe após tentativa de remoção');
          
          // Tentar método alternativo
          try {
            const { execSync } = require('child_process');
            if (process.platform === 'win32') {
              execSync(`rmdir /s /q "${authPath}"`, { stdio: 'ignore' });
            } else {
              execSync(`rm -rf "${authPath}"`, { stdio: 'ignore' });
            }
            console.log('✅ Pasta removida com comando do sistema');
          } catch (cmdError) {
            console.error('❌ Falha no método alternativo:', cmdError);
          }
        }
      } else {
        console.log('ℹ️ Pasta de autenticação não encontrada (já foi removida?)');
      }
    } catch (deleteError) {
      console.error('❌ Erro ao deletar pasta de autenticação:', deleteError);
    }
    
    // 5. Atualizar banco de dados
    try {
      console.log('💾 Atualizando status no banco de dados...');
      await pool.query(
        'UPDATE consultores SET status_conexao = ?, sessao_whatsapp = NULL, numero_whatsapp = NULL WHERE id = ?',
        ['offline', consultorId]
      );
      console.log('✅ Status atualizado no banco: offline');
    } catch (dbError) {
      console.error('❌ Erro ao atualizar banco de dados:', dbError);
    }
    
    // 6. Emitir eventos Socket.IO
    if (this.io) {
      console.log('📡 Emitindo eventos de desconexão...');
      
      // Para o consultor
      this.io.to(`consultor_${consultorId}`).emit('whatsapp_disconnected', {
        consultorId,
        reason: 'manual_disconnect',
        message: 'WhatsApp desconectado com sucesso. Sessão limpa.'
      });
      
      // Para admins
      this.io.to('admins').emit('whatsapp_disconnected', {
        consultorId,
        reason: 'manual_disconnect',
        message: 'WhatsApp desconectado com sucesso. Sessão limpa.'
      });
      
      console.log('✅ Eventos Socket.IO emitidos');
    }
    
    console.log('🎉 Desconexão concluída com sucesso!');
  }

  async enviarMensagem(consultorId: string, numero: string, conteudo: string, leadIdEspecifico?: string) {
    const session = this.sessions.get(consultorId);
    
    if (!session || !session.connected) {
      throw new Error('WhatsApp não conectado. Por favor, leia o QR Code primeiro.');
    }

    try {
      // ✅ NORMALIZAR NÚMERO antes de enviar (remove @lid, prefixos especiais)
      const numeroNormalizado = this.normalizarNumero(numero);
      console.log('📤 [ENVIAR] Número original:', numero, '→ Normalizado:', numeroNormalizado);
      
      // Formatar número corretamente para JID do WhatsApp
      const jid = `${numeroNormalizado}@s.whatsapp.net`;
      
      // ✅ CORREÇÃO ERRO 6 e 7: Simular comportamento humano com delays e typing
      // FASE 1: Simular tempo de leitura (2-5 segundos)
      const tempoLeitura = 2000 + Math.random() * 3000;
      console.log(`⏱️ Simulando leitura: ${Math.round(tempoLeitura / 1000)}s`);
      await new Promise(resolve => setTimeout(resolve, tempoLeitura));
      
      // FASE 2: Enviar presença "digitando..." (CRÍTICO para evitar detecção)
      console.log('⌨️ Enviando presença "composing" (digitando...)');
      await session.sock.sendPresenceUpdate('composing', jid);
      
      // FASE 3: Simular tempo de digitação baseado no tamanho da mensagem
      // ~50ms por caractere (velocidade de digitação humana média)
      const caracteresPorSegundo = 20; // 20 caracteres por segundo (humano médio)
      const msSegundo = 1000 / caracteresPorSegundo; // ~50ms por caractere
      const tempoDigitacaoBase = Math.min(conteudo.length * msSegundo, 8000); // Máx 8s
      const variacaoDigitacao = Math.random() * 2000; // +0-2s de variação
      const tempoDigitacao = tempoDigitacaoBase + variacaoDigitacao;
      
      console.log(`⌨️ Simulando digitação: ${Math.round(tempoDigitacao / 1000)}s (${conteudo.length} caracteres)`);
      await new Promise(resolve => setTimeout(resolve, tempoDigitacao));
      
      // FASE 4: Parar de "digitar" e marcar como disponível
      console.log('✋ Parando de digitar (paused)');
      await session.sock.sendPresenceUpdate('paused', jid);
      
      // FASE 5: Pequeno delay final antes de enviar (100-500ms)
      const delayFinal = 100 + Math.random() * 400;
      await new Promise(resolve => setTimeout(resolve, delayFinal));
      
      // FASE 6: Finalmente enviar a mensagem
      console.log('📤 Enviando mensagem agora...');
      // ✅ CORREÇÃO ERRO 3: Adicionar contextInfo para evitar detecção de bot
      // WhatsApp Web SEMPRE envia contextInfo - mensagens sem isso são suspeitas
      const sentMsg = await session.sock.sendMessage(jid, { 
        text: conteudo,
        contextInfo: {
          isForwarded: false,
          mentionedJid: [],
          forwardingScore: 0
        }
      });
      const whatsappMessageId = sentMsg?.key?.id || null;
      
      console.log('📤 Mensagem enviada com WhatsApp ID:', whatsappMessageId);

      // ✅ USAR lead_id específico se fornecido, senão buscar pelo telefone
      let leadId: string;
      
      if (leadIdEspecifico) {
        console.log('✅ Usando lead_id específico fornecido:', leadIdEspecifico);
        leadId = leadIdEspecifico;
      } else {
        // Buscar lead_id pelo telefone normalizado (comportamento antigo)
        const [leadRows] = await pool.query(
          'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ? ORDER BY data_criacao DESC LIMIT 1',
          [numeroNormalizado, consultorId]
        );

        if ((leadRows as any[]).length === 0) {
          throw new Error(`Lead não encontrado para telefone: ${numeroNormalizado}`);
        }

        leadId = (leadRows as any[])[0].id;
        console.log('📋 Lead encontrado pelo telefone normalizado:', leadId);
      }

      // Salvar no banco COM O ID DO WHATSAPP
      const insertResult = await pool.query(
        `INSERT INTO mensagens (lead_id, consultor_id, conteudo, tipo, remetente, status, whatsapp_message_id, timestamp)
         VALUES (?, ?, ?, 'texto', 'consultor', 'enviada', ?, NOW())`,
        [leadId, consultorId, conteudo, whatsappMessageId]
      );

      // Buscar o ID da mensagem recém-criada
      let mensagemId = null;
      if ((insertResult as any).affectedRows && (insertResult as any).affectedRows > 0) {
        const [selectRows] = await pool.query(
          `SELECT id FROM mensagens 
           WHERE lead_id = ? AND consultor_id = ? AND conteudo = ? AND remetente = 'consultor'
           ORDER BY timestamp DESC LIMIT 1`,
          [leadId, consultorId, conteudo]
        );
        
        if ((selectRows as any[]).length > 0) {
          mensagemId = (selectRows as any[])[0].id;
          console.log('✅ ID da mensagem recuperado:', mensagemId);
        }
      }

      // Atualizar última mensagem do lead usando número normalizado
      await pool.query(
        `UPDATE leads SET ultima_mensagem = ?, data_atualizacao = NOW() 
         WHERE telefone = ?`,
        [conteudo.substring(0, 50), numeroNormalizado]
      );

      // Nota: O evento Socket.IO é emitido pelo mensagensController.ts após salvar no banco
      // para evitar duplicação de mensagens no frontend

      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async enviarArquivo(consultorId: string, numero: string, caminhoArquivo: string, tipo: 'image' | 'video' | 'document' | 'audio', caption?: string) {
    const session = this.sessions.get(consultorId);
    
    if (!session || !session.connected) {
      throw new Error('WhatsApp não conectado. Por favor, leia o QR Code primeiro.');
    }

    try {
      const fs = require('fs');
      const path = require('path');
      const jid = numero.includes('@') ? numero : `${numero.replace(/\D/g, '')}@s.whatsapp.net`;
      
      // Ler arquivo
      const fileBuffer = fs.readFileSync(caminhoArquivo);
      
      // Extrair nome do arquivo do caminho completo
      const fileName = path.basename(caminhoArquivo);
      
      // Determinar o media_url baseado no tipo e localização do arquivo
      let mediaUrl: string;
      if (caminhoArquivo.includes('\\audios\\') || caminhoArquivo.includes('/audios/')) {
        // Áudio gravado pelo AudioRecorder está em /uploads/audios/
        mediaUrl = `/uploads/audios/${fileName}`;
      } else {
        // Arquivos do uploadController estão em /uploads/
        mediaUrl = `/uploads/${fileName}`;
      }
      
      console.log('📁 [DEBUG] Media URL calculada:', mediaUrl);
      
      // ✅ BUSCAR LEAD_ID PRIMEIRO (evitar falha silenciosa do SUBSELECT)
      const [leadRows2] = await pool.query(
        'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ? LIMIT 1',
        [numero.replace(/\D/g, ''), consultorId]
      );
      
      if ((leadRows2 as any[]).length === 0) {
        throw new Error(`Lead não encontrado para telefone: ${numero}`);
      }
      
      const leadId = (leadRows2 as any[])[0].id;
      console.log('📋 [DEBUG] Lead encontrado:', leadId);
      
      // ✅ SALVAR NO BANCO PRIMEIRO (antes de tentar enviar pelo WhatsApp)
      // Mapear tipo do WhatsApp para tipo do frontend
      const tipoMapeado = tipo === 'image' ? 'imagem' :
                          tipo === 'video' ? 'video' :
                          tipo === 'audio' ? 'audio' :
                          'documento';  // document -> documento
      
      // Para imagens e vídeos, nunca incluir caption (nome do arquivo)
      const tipoTexto = tipo === 'image' ? '📷 Imagem' :
                        tipo === 'video' ? '🎥 Vídeo' :
                        tipo === 'audio' ? '🎤 Áudio' :
                        '📄 Documento';
      const conteudo = (tipo === 'image' || tipo === 'video') ? tipoTexto : (caption ? `${tipoTexto}: ${caption}` : tipoTexto);
      
      // ✅ CRÍTICO: Salvar no banco com tratamento de erro explícito
      let mensagemId = null;
      try {
        console.log('💾 [PRE-INSERT] Tentando inserir no banco:', { leadId, consultorId, conteudo: conteudo.substring(0, 30), tipoMapeado, mediaUrl, fileName });
        
        const insertResult2 = await pool.query(
          `INSERT INTO mensagens (lead_id, consultor_id, conteudo, tipo, remetente, status, media_url, media_name, timestamp)
           VALUES (?, ?, ?, ?, 'consultor', 'enviada', ?, ?, NOW())`,
          [leadId, consultorId, conteudo, tipoMapeado, mediaUrl, fileName]
        );
        
        console.log('💾 [POST-INSERT] Resultado do INSERT:', JSON.stringify(insertResult2, null, 2));
        console.log('💾 [POST-INSERT] insertResult.affectedRows:', (insertResult2 as any).affectedRows);
        
        // ✅ CORREÇÃO: UUID não retorna insertId válido, precisamos fazer SELECT
        if ((insertResult2 as any).affectedRows && (insertResult2 as any).affectedRows > 0) {
          console.log('✅ INSERT bem-sucedido, buscando UUID gerado...');
          const [selectRows2] = await pool.query(
            `SELECT id FROM mensagens 
             WHERE lead_id = ? AND consultor_id = ? AND media_url = ? AND remetente = 'consultor'
             ORDER BY timestamp DESC LIMIT 1`,
            [leadId, consultorId, mediaUrl]
          );
          
          if ((selectRows2 as any[]).length > 0) {
            mensagemId = (selectRows2 as any[])[0].id;
            console.log('✅ UUID recuperado com sucesso:', mensagemId);
          } else {
            console.error('❌ Não foi possível recuperar UUID após INSERT');
          }
        }
        
        console.log('💾 [DEBUG] Mensagem salva no banco! ID final:', mensagemId, 'mediaUrl:', mediaUrl, 'fileName:', fileName);
      } catch (dbError) {
        console.error('❌ [ERRO CRÍTICO] Falha ao salvar mensagem no banco de dados:', dbError);
        console.error('Detalhes:', { leadId, consultorId, conteudo, tipoMapeado, mediaUrl, fileName });
        throw new Error('Falha ao salvar mensagem no banco de dados: ' + (dbError as Error).message);
      }
      
      // Agora tentar enviar pelo WhatsApp (se falhar, a mensagem já está salva)
      let whatsappMessageId: string | null = null;
      try {
        // Preparar mensagem baseada no tipo
        let messageContent: any = {};
        
        switch (tipo) {
          case 'image':
            messageContent = {
              image: fileBuffer,
              caption: ''  // Não enviar caption com nome do arquivo
            };
            break;
          case 'video':
            messageContent = {
              video: fileBuffer,
              caption: ''  // Não enviar caption com nome do arquivo
            };
            break;
          case 'audio':
            messageContent = {
              audio: fileBuffer,
              mimetype: 'audio/mp4'
            };
            break;
          case 'document':
          default:
            messageContent = {
              document: fileBuffer,
              fileName: caption || 'documento',
              mimetype: 'application/pdf'
            };
            break;
        }
        
        // Enviar arquivo e capturar ID
        const sentMsg = await session.sock.sendMessage(jid, messageContent);
        whatsappMessageId = sentMsg?.key?.id || null;
        
        console.log('📤 Arquivo enviado com WhatsApp ID:', whatsappMessageId);
        
        // Atualizar mensagem com whatsapp_message_id
        if (whatsappMessageId) {
          await pool.query(
            `UPDATE mensagens 
             SET whatsapp_message_id = ? 
             WHERE lead_id = (SELECT id FROM leads WHERE telefone = ? LIMIT 1) 
             AND consultor_id = ? 
             AND media_url = ?
             AND whatsapp_message_id IS NULL
             ORDER BY timestamp DESC 
             LIMIT 1`,
            [whatsappMessageId, numero.replace(/\D/g, ''), consultorId, mediaUrl]
          );
          console.log('✅ WhatsApp Message ID atualizado no banco');
        }
      } catch (whatsappError) {
        console.error('⚠️ Erro ao enviar pelo WhatsApp, mas mensagem JÁ FOI SALVA no banco:', whatsappError);
        // Não lançar erro - a mensagem está salva e será exibida no frontend
      }

      // Atualizar última mensagem do lead
      await pool.query(
        `UPDATE leads SET ultima_mensagem = ?, data_atualizacao = NOW() 
         WHERE telefone = ?`,
        [conteudo.substring(0, 50), numero.replace(/\D/g, '')]
      );

      console.log(`✅ ${tipoTexto} enviado com sucesso para ${numero}`);
      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      throw error;
    }
  }

  private async atualizarStatusMensagem(consultorId: string, update: any) {
    try {
      const { key, update: messageUpdate } = update;
      const status = messageUpdate.status;
      
      // Mapear status do WhatsApp para nosso sistema
      let novoStatus: 'enviada' | 'entregue' | 'lida' = 'enviada';
      
      if (status === 2) { // Entregue (delivered)
        novoStatus = 'entregue';
      } else if (status === 3 || status === 4) { // Lida (read ou played)
        novoStatus = 'lida';
      }
      
      // Extrair número do destinatário
      const numero = key.remoteJid?.replace('@s.whatsapp.net', '') || '';
      
      if (!numero) return;
      
      console.log(`✅ Atualizando status da mensagem para ${numero}: ${novoStatus}`);
      
      // Buscar lead pelo telefone
      const [leadRows3] = await pool.query(
        'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ?',
        [numero, consultorId]
      );
      
      if ((leadRows3 as any[]).length === 0) {
        console.log('⚠️ Lead não encontrado para atualização de status');
        return;
      }
      
      const leadId = (leadRows3 as any[])[0].id;
      
      // Atualizar status da última mensagem enviada para este lead
      await pool.query(
        `UPDATE mensagens 
         SET status = ? 
         WHERE lead_id = ? 
         AND remetente = 'consultor' 
         AND status != 'lida'
         ORDER BY timestamp DESC 
         LIMIT 1`,
        [novoStatus, leadId]
      );
      
      // Emitir evento via Socket.IO para atualizar frontend
      if (this.io) {
        this.io.to(`consultor_${consultorId}`).emit('status_mensagem_atualizado', {
          leadId,
          status: novoStatus,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ Status atualizado para: ${novoStatus}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar status da mensagem:', error);
    }
  }

  private async processarMensagemRecebida(consultorId: string, message: WAMessage) {
    try {
      // ✅ VERIFICAR SE MENSAGEM JÁ EXISTE NO BANCO (evita duplicação no re-sync)
      const whatsappMessageId = message.key.id;
      console.log('🔍 [DEBUG] Processando mensagem - WhatsApp ID:', whatsappMessageId);
      
      if (whatsappMessageId) {
        const [msgRows] = await pool.query(
          'SELECT id FROM mensagens WHERE whatsapp_message_id = ?',
          [whatsappMessageId]
        );
        
        console.log('🔍 [DEBUG] Verificação de duplicidade:', {
          whatsappMessageId,
          existeNoBanco: (msgRows as any[]).length > 0,
          resultado: (msgRows as any[]).length > 0 ? 'IGNORAR' : 'PROCESSAR'
        });
        
        if ((msgRows as any[]).length > 0) {
          console.log(`⏩ [DUPLICIDADE DETECTADA] Mensagem já existe no banco (WhatsApp ID: ${whatsappMessageId}), ignorando re-sincronização`);
          return;
        }
      }
      
      // ✅ NORMALIZAR NÚMERO - remover @lid, @s.whatsapp.net e prefixo LID
      const numeroOriginal = message.key.remoteJid || '';
      const numero = this.normalizarNumero(numeroOriginal);
      
      // Extrair conteúdo da mensagem
      let conteudo = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text || 
                     '';
      let tipo = 'texto';
      let mediaUrl: string | null = null;
      let mediaName: string | null = null;

      // Processar mensagem de áudio
      if (message.message?.audioMessage) {
        const audioMessage = message.message.audioMessage;
        console.log(`🎤 Áudio recebido de ${numero}`);
        console.log('📋 Detalhes do áudio:', JSON.stringify(audioMessage, null, 2));
        
        try {
          const fs = require('fs');
          const path = require('path');
          
          // Criar diretório de uploads se não existir
          // process.cwd() já aponta para a pasta backend quando o servidor está rodando
          const uploadsDir = path.join(process.cwd(), 'uploads', 'audios');
          if (!fs.existsSync(uploadsDir)) {
            console.log('📁 Criando diretório de uploads...');
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log('✅ Diretório criado:', uploadsDir);
          } else {
            console.log('📁 Diretório já existe:', uploadsDir);
          }
          
          // Baixar áudio - passar consultorId para pegar socket correto
          console.log('📥 Tentando baixar áudio...');
          const buffer = await this.downloadMedia(message, consultorId);
          
          if (buffer && buffer.length > 0) {
            // Salvar arquivo
            const fileName = `audio_${Date.now()}_${numero}.ogg`;
            const filePath = path.join(uploadsDir, fileName);
            
            console.log(`💾 Salvando arquivo em: ${filePath}`);
            fs.writeFileSync(filePath, buffer);
            
            // Verificar se foi salvo
            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath);
              console.log(`✅ Arquivo salvo com sucesso! Tamanho: ${stats.size} bytes`);
              
              tipo = 'audio';
              const duracao = audioMessage.seconds || 0;
              conteudo = `🎤 Áudio (${Math.floor(duracao / 60)}:${(duracao % 60).toString().padStart(2, '0')})`;
              mediaUrl = `/uploads/audios/${fileName}`;
              mediaName = fileName;
            } else {
              console.error('❌ Arquivo não foi salvo!');
              conteudo = '🎤 Áudio (erro ao salvar)';
            }
          } else {
            console.error('❌ Buffer vazio ou nulo! Tamanho:', buffer?.length || 0);
            conteudo = '🎤 Áudio (erro no download)';
          }
        } catch (error) {
          console.error('❌ Erro ao processar áudio:', error);
          console.error('Stack:', (error as Error).stack);
          conteudo = '🎤 Áudio (erro ao baixar)';
        }
      }
      
      // Processar mensagem de imagem
      else if (message.message?.imageMessage) {
        const imageMessage = message.message.imageMessage;
        console.log(`📷 Imagem recebida de ${numero}`);
        
        try {
          const fs = require('fs');
          const path = require('path');
          
          // Criar diretório de uploads se não existir
          const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          // Baixar imagem
          const buffer = await this.downloadMedia(message, consultorId);
          
          if (buffer && buffer.length > 0) {
            // Determinar extensão baseada no mimetype
            const mimetype = imageMessage.mimetype || 'image/jpeg';
            const ext = mimetype.split('/')[1] || 'jpg';
            const fileName = `image_${Date.now()}_${numero}.${ext}`;
            const filePath = path.join(uploadsDir, fileName);
            
            fs.writeFileSync(filePath, buffer);
            
            if (fs.existsSync(filePath)) {
              console.log(`✅ Imagem salva com sucesso! Tamanho: ${buffer.length} bytes`);
              tipo = 'imagem';
              mediaUrl = `/uploads/images/${fileName}`;
              mediaName = fileName;
              conteudo = '📷 Imagem';
              const caption = imageMessage.caption;
              if (caption) conteudo += `: ${caption}`;
            } else {
              console.error('❌ Arquivo de imagem não foi salvo!');
              conteudo = '📷 Imagem (erro ao salvar)';
            }
          } else {
            console.error('❌ Buffer de imagem vazio!');
            conteudo = '📷 Imagem (erro no download)';
          }
        } catch (error) {
          console.error('❌ Erro ao processar imagem:', error);
          conteudo = '📷 Imagem (erro ao baixar)';
        }
      }
      
      // Processar mensagem de vídeo
      else if (message.message?.videoMessage) {
        const videoMessage = message.message.videoMessage;
        console.log(`🎥 Vídeo recebido de ${numero}`);
        
        try {
          const fs = require('fs');
          const path = require('path');
          
          // Criar diretório de uploads se não existir
          const uploadsDir = path.join(process.cwd(), 'uploads', 'videos');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          // Baixar vídeo
          const buffer = await this.downloadMedia(message, consultorId);
          
          if (buffer && buffer.length > 0) {
            // Determinar extensão baseada no mimetype
            const mimetype = videoMessage.mimetype || 'video/mp4';
            const ext = mimetype.split('/')[1] || 'mp4';
            const fileName = `video_${Date.now()}_${numero}.${ext}`;
            const filePath = path.join(uploadsDir, fileName);
            
            fs.writeFileSync(filePath, buffer);
            
            if (fs.existsSync(filePath)) {
              console.log(`✅ Vídeo salvo com sucesso! Tamanho: ${buffer.length} bytes`);
              tipo = 'video';
              mediaUrl = `/uploads/videos/${fileName}`;
              mediaName = fileName;
              conteudo = '🎥 Vídeo';
              const caption = videoMessage.caption;
              if (caption) conteudo += `: ${caption}`;
            } else {
              console.error('❌ Arquivo de vídeo não foi salvo!');
              conteudo = '🎥 Vídeo (erro ao salvar)';
            }
          } else {
            console.error('❌ Buffer de vídeo vazio!');
            conteudo = '🎥 Vídeo (erro no download)';
          }
        } catch (error) {
          console.error('❌ Erro ao processar vídeo:', error);
          conteudo = '🎥 Vídeo (erro ao baixar)';
        }
      }
      
      // Processar documento
      else if (message.message?.documentMessage) {
        const documentMessage = message.message.documentMessage;
        console.log(`📄 Documento recebido de ${numero}`);
        
        try {
          const fs = require('fs');
          const path = require('path');
          
          // Criar diretório de uploads se não existir
          const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          // Baixar documento
          const buffer = await this.downloadMedia(message, consultorId);
          
          if (buffer && buffer.length > 0) {
            const originalName = documentMessage.fileName || 'documento';
            const fileName = `doc_${Date.now()}_${numero}_${originalName}`;
            const filePath = path.join(uploadsDir, fileName);
            
            fs.writeFileSync(filePath, buffer);
            
            if (fs.existsSync(filePath)) {
              console.log(`✅ Documento salvo com sucesso! Tamanho: ${buffer.length} bytes`);
              tipo = 'documento';
              mediaUrl = `/uploads/documents/${fileName}`;
              mediaName = originalName;
              conteudo = `📄 ${originalName}`;
            } else {
              console.error('❌ Arquivo de documento não foi salvo!');
              conteudo = `📄 ${originalName} (erro ao salvar)`;
            }
          } else {
            console.error('❌ Buffer de documento vazio!');
            conteudo = `📄 ${documentMessage.fileName || 'documento'} (erro no download)`;
          }
        } catch (error) {
          console.error('❌ Erro ao processar documento:', error);
          conteudo = `📄 ${documentMessage.fileName || 'documento'} (erro ao baixar)`;
        }
      }

      if (!conteudo) return;

      console.log(`📱 Mensagem recebida de ${numero}: ${conteudo}`);

      // Verificar se o lead já existe
      const [leadRows4] = await pool.query(
        'SELECT id, nome FROM leads WHERE telefone = ? AND consultor_id = ?',
        [numero, consultorId]
      );

      let leadId: string;
      let isNovoLead = false;

      if ((leadRows4 as any[]).length === 0) {
        // Criar novo lead
        console.log('👤 Criando novo lead para:', numero);
        // ✅ Usar função para formatar nome de exibição
        const nomeFormatado = this.formatarNumeroExibicao(numero);
        
        const novoLeadResult = await pool.query(
          `INSERT INTO leads (nome, telefone, origem, status, consultor_id, mensagens_nao_lidas, data_criacao, data_atualizacao)
           VALUES (?, ?, 'WhatsApp', 'novo', ?, 1, NOW(), NOW())`,
          [nomeFormatado, numero, consultorId]
        );
        
        // Para MySQL, o insertId vem em result.insertId
        if ((novoLeadResult as any).insertId) {
          leadId = String((novoLeadResult as any).insertId);
        } else {
          // Fallback: buscar o lead recém-criado
          const [leadCriadoRows] = await pool.query(
            'SELECT id FROM leads WHERE telefone = ? AND consultor_id = ? ORDER BY data_criacao DESC LIMIT 1',
            [numero, consultorId]
          );
          leadId = (leadCriadoRows as any[])[0]?.id;
        }
        
        console.log('✅ Novo lead criado com ID:', leadId);
        isNovoLead = true;
      } else {
        leadId = (leadRows4 as any[])[0].id;
        console.log('📋 Lead existente encontrado:', leadId);

        // Incrementar mensagens não lidas
        await pool.query(
          'UPDATE leads SET mensagens_nao_lidas = mensagens_nao_lidas + 1, data_atualizacao = NOW() WHERE id = ?',
          [leadId]
        );
      }

      // ✅ Salvar mensagem no banco COM O ID ÚNICO DO WHATSAPP
      console.log('💾 [DEBUG] Salvando mensagem no banco:', {
        leadId,
        consultorId,
        conteudo: conteudo.substring(0, 50),
        tipo,
        whatsappMessageId
      });
      
      await pool.query(
        `INSERT INTO mensagens (lead_id, consultor_id, conteudo, tipo, remetente, status, media_url, media_name, whatsapp_message_id, timestamp)
         VALUES (?, ?, ?, ?, 'lead', 'lida', ?, ?, ?, NOW())`,
        [leadId, consultorId, conteudo, tipo, mediaUrl, mediaName, whatsappMessageId]
      );
      console.log('✅ [DEBUG] Mensagem salva com sucesso! WhatsApp ID:', whatsappMessageId);

      // Atualizar última mensagem do lead
      await pool.query(
        'UPDATE leads SET ultima_mensagem = ? WHERE id = ?',
        [conteudo.substring(0, 50), leadId]
      );

      // Buscar informações completas do lead para enviar ao frontend
      const [leadCompletoRows] = await pool.query(
        'SELECT * FROM leads WHERE id = ?',
        [leadId]
      );

      const lead = (leadCompletoRows as any[])[0];

      // Emitir evento de nova mensagem via Socket.IO
      if (this.io) {
        console.log('📡 Emitindo evento nova_mensagem via Socket.IO');
        
        // Emitir para o consultor
        this.io.to(`consultor_${consultorId}`).emit('nova_mensagem', {
          leadId,
          lead: {
            id: lead.id,
            nome: lead.nome,
            telefone: lead.telefone,
            origem: lead.origem,
            status: lead.status,
            mensagensNaoLidas: lead.mensagens_nao_lidas
          },
          numero,
          conteudo,
          tipo,
          remetente: 'lead', // IMPORTANTE: Identificar como mensagem do lead
          mediaUrl,
          mediaName,
          timestamp: new Date().toISOString(),
          isNovoLead
        });
        console.log('✅ Evento nova_mensagem emitido com mediaUrl:', mediaUrl);
        
        // Emitir também para admins
        this.io.to('admins').emit('nova_mensagem', {
          leadId,
          lead: {
            id: lead.id,
            nome: lead.nome,
            telefone: lead.telefone,
            origem: lead.origem,
            status: lead.status,
            mensagensNaoLidas: lead.mensagens_nao_lidas
          },
          numero,
          conteudo,
          tipo,
          remetente: 'lead',
          mediaUrl,
          mediaName,
          timestamp: new Date().toISOString(),
          isNovoLead
        });
        console.log('✅ Evento nova_mensagem emitido para admins também');

        // Se for novo lead, emitir evento adicional
        if (isNovoLead) {
          console.log('📡 Emitindo evento novo_lead via Socket.IO');
          
          // Emitir para o consultor
          this.io.to(`consultor_${consultorId}`).emit('novo_lead', {
            lead: {
              id: lead.id,
              nome: lead.nome,
              telefone: lead.telefone,
              origem: lead.origem,
              status: lead.status,
              mensagensNaoLidas: lead.mensagens_nao_lidas,
              dataCriacao: lead.data_criacao,
              dataAtualizacao: lead.data_atualizacao
            }
          });
          console.log('✅ Evento novo_lead emitido para consultor');
          
          // Emitir também para admins
          this.io.to('admins').emit('novo_lead', {
            lead: {
              id: lead.id,
              nome: lead.nome,
              telefone: lead.telefone,
              origem: lead.origem,
              status: lead.status,
              mensagensNaoLidas: lead.mensagens_nao_lidas,
              dataCriacao: lead.data_criacao,
              dataAtualizacao: lead.data_atualizacao
            }
          });
          console.log('✅ Evento novo_lead emitido para admins também');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem recebida:', error);
    }
  }

  getStatus(consultorId: string): { connected: boolean; hasSession: boolean } {
    const session = this.sessions.get(consultorId);
    return {
      connected: session?.connected || false,
      hasSession: !!session
    };
  }

  // Método para verificar se está conectado
  isConnected(consultorId: string): boolean {
    const session = this.sessions.get(consultorId);
    return session?.connected || false;
  }

  // Método para obter o socket de uma sessão específica
  getSocket(consultorId: string): any | null {
    const session = this.sessions.get(consultorId);
    if (session?.connected && session.sock) {
      return session.sock;
    }
    return null;
  }

  // Método para obter qualquer socket ativo (para validações)
  getAnyActiveSocket(): any | null {
    for (const [consultorId, session] of this.sessions.entries()) {
      if (session.connected && session.sock) {
        console.log(`✅ Usando socket ativo do consultor: ${consultorId}`);
        return session.sock;
      }
    }
    console.log('⚠️ Nenhum socket ativo encontrado');
    return null;
  }

  // Método auxiliar para baixar mídia
  private async downloadMedia(message: WAMessage, consultorId: string): Promise<Buffer | null> {
    try {
      console.log('📥 Iniciando download de mídia...');
      
      // Obter o socket da sessão do consultor específico
      const session = this.sessions.get(consultorId);
      if (!session || !session.sock) {
        console.error('❌ Socket não encontrado para o consultor:', consultorId);
        return null;
      }

      const sock = session.sock;

      // Usar downloadMediaMessage do Baileys diretamente
      const { downloadMediaMessage } = await import('baileys');
      
      console.log('🔄 Baixando buffer da mensagem...');
      const buffer = await downloadMediaMessage(
        message,
        'buffer',
        {},
        {
          logger: require('pino')({ level: 'silent' }),
          reuploadRequest: sock.updateMediaMessage
        }
      );

      if (buffer) {
        console.log(`✅ Mídia baixada com sucesso! Tamanho: ${buffer.length} bytes`);
        return buffer as Buffer;
      }

      console.error('❌ Buffer vazio retornado');
      return null;
    } catch (error) {
      console.error('❌ Erro ao baixar mídia:', error);
      console.error('Stack completo:', (error as Error).stack);
      return null;
    }
  }
}

export const whatsappService = new WhatsAppService();
