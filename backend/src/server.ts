import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { pool } from './config/database';
import { whatsappCloudService } from './services/whatsappCloudService';
import { cleanupService } from './services/cleanupService';
import { logger } from './config/logger';

// Rotas
import authRoutes from './routes/auth';
import leadsRoutes from './routes/leads';
import mensagensRoutes from './routes/mensagens';
import whatsappCloudRoutes from './routes/whatsappCloud';
import relatoriosRoutes from './routes/relatorios';
import tarefasRoutes from './routes/tarefas';
import storageRoutes from './routes/storage';
import followupRoutes from './routes/followup';
import indicadorRoutes from './routes/indicador';
import adminRoutes from './routes/admin';
import configuracoesRoutes from './routes/configuracoes';
import auditoriaRoutes from './routes/auditoria';
import facebookRoutes from './routes/facebook';

dotenv.config();

const PORT = process.env.PORT || 3001;

// CORS - permitir todos os subdomínios
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://boraindicar.com.br',
  'https://admin.boraindicar.com.br',
  'https://crm.boraindicar.com.br',
  'https://indicador.boraindicar.com.br',
  'http://localhost:3000'
];

const app = express();
const httpServer = createServer(app);

// ✅ Confiar no proxy reverso (nginx) para obter IP real dos usuários
// Necessário para rate limiting funcionar corretamente
app.set('trust proxy', 1);

// ✅ CORREÇÃO ERRO 10: Randomizar pingTimeout e pingInterval do Socket.IO
// Valores constantes = heartbeat mecânico detectável pela Meta
// Variação simula comportamento mais natural
const pingTimeout = 55000 + Math.floor(Math.random() * 15000); // 55-70s (não sempre 60s)
const pingInterval = 20000 + Math.floor(Math.random() * 10000); // 20-30s (não sempre 25s)

logger.info(`🔌 Socket.IO: pingTimeout=${Math.round(pingTimeout/1000)}s, pingInterval=${Math.round(pingInterval/1000)}s`);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['*']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: pingTimeout, // ✅ Randomizado: 55-70s
  pingInterval: pingInterval // ✅ Randomizado: 20-30s
});

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ✅ MIDDLEWARE: Request ID para rastreamento de requisições
// Adiciona ID único a cada requisição para facilitar debug em produção
import crypto from 'crypto';

app.use((req, res, next) => {
  // Gerar ID único para esta requisição
  const requestId = crypto.randomUUID();
  (req as any).requestId = requestId;
  
  // Adicionar no header de resposta
  res.setHeader('X-Request-ID', requestId);
  
  // Log estruturado da requisição (apenas para rotas da API, ignorar assets)
  if (req.url.startsWith('/api/')) {
    logger.info({
      msg: '📨 Nova requisição',
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent']?.substring(0, 100)
    });
    
    // Log ao finalizar resposta
    const startTime = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 400 ? 'warn' : 'info';
      logger[level]({
        msg: res.statusCode >= 400 ? '⚠️ Requisição com erro' : '✅ Requisição finalizada',
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    });
  }
  
  next();
});

// 🛡️ RATE LIMITING - DESATIVADO TEMPORARIAMENTE
// ⚠️ ATENÇÃO: Rate limiting está com limite INFINITO para testes
// Para reativar, ajustar os valores de 'max' conforme necessário
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 99999, // ⚠️ INFINITO - praticamente sem limite
  message: { error: 'Muitas requisições, tente novamente mais tarde' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit excedido para IP: ${req.ip}`);
    res.status(429).json({ error: 'Muitas requisições, tente novamente mais tarde' });
  }
});

// Limiter para rotas de autenticação (login) - também desativado
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 99999, // ⚠️ INFINITO - praticamente sem limite
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(`Tentativas de login excedidas para IP: ${req.ip}`);
    res.status(429).json({ 
      error: 'Muitas tentativas de login. Tente novamente em 15 minutos',
      retryAfter: 900
    });
  }
});

// Aplicar rate limiting (desativado temporariamente)
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/indicador/login', authLimiter);

logger.info('⚠️  Rate limiting DESATIVADO (limite infinito):');
logger.info('   • API geral: 99999 req/15min (infinito)');
logger.info('   • Login: 99999 tentativas/15min (infinito)');

// Servir arquivos estáticos da pasta uploads com headers CORS personalizados
// process.cwd() já aponta para a pasta backend quando o servidor está rodando
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', (req, res, next) => {
  // Permitir CORS de qualquer origem permitida
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Sem origin (requisições diretas), permitir qualquer um
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Definir tipo MIME correto para arquivos de áudio
  if (req.url.endsWith('.ogg')) {
    res.setHeader('Content-Type', 'audio/ogg');
  } else if (req.url.endsWith('.mp3')) {
    res.setHeader('Content-Type', 'audio/mpeg');
  } else if (req.url.endsWith('.wav')) {
    res.setHeader('Content-Type', 'audio/wav');
  } else if (req.url.endsWith('.webm')) {
    res.setHeader('Content-Type', 'audio/webm');
  } else if (req.url.endsWith('.m4a')) {
    res.setHeader('Content-Type', 'audio/mp4');
  }
  
  next();
}, express.static(uploadsPath));
logger.info('📁 Pasta uploads disponível em /uploads com CORS');
logger.info('📂 Caminho absoluto dos uploads:', uploadsPath);

// Disponibilizar Socket.IO para os controllers
app.set('io', io);

// Configurar Socket.IO no WhatsApp Cloud Service
whatsappCloudService.setSocketIO(io);

// Map para rastrear consultores por socket
const consultorSockets = new Map<string, string>(); // socketId -> consultorId

// Socket.IO - Conexões em tempo real
io.on('connection', (socket) => {
  logger.info('🔌 Cliente conectado:', socket.id);

  // Consultor se junta a uma room específica
  socket.on('join_consultor', (consultorId: string) => {
    socket.join(`consultor_${consultorId}`);
    consultorSockets.set(socket.id, consultorId);
    logger.info(`👤 Consultor ${consultorId} entrou na room (socket: ${socket.id})`);
  });

  // Admin se junta a uma room de admins
  socket.on('join_admin', (adminId: string) => {
    socket.join('admins');
    logger.info(`👔 Admin ${adminId} entrou na room de admins`);
  });

  // Indicador se junta a uma room específica
  socket.on('join_indicador', (indicadorId: string) => {
    socket.join(`indicador_${indicadorId}`);
    logger.info(`💰 Indicador ${indicadorId} entrou na room (socket: ${socket.id})`);
  });

  // Consultor marca como online no sistema
  socket.on('consultor_online', async (consultorId: string) => {
    try {
      await pool.query('UPDATE consultores SET sistema_online = TRUE WHERE id = ?', [consultorId]);
      logger.info(`✅ Consultor ${consultorId} marcado como online no sistema`);
      // Notificar admins sobre mudança de status
      io.to('admins').emit('consultor_status_mudou', { consultorId, online: true });
    } catch (error) {
      logger.error('Erro ao marcar consultor como online:', error);
    }
  });

  // Heartbeat para manter status online
  socket.on('consultor_heartbeat', async (consultorId: string) => {
    try {
      await pool.query('UPDATE consultores SET sistema_online = TRUE, ultimo_acesso = NOW() WHERE id = ?', [consultorId]);
    } catch (error) {
      logger.error('Erro no heartbeat do consultor:', error);
    }
  });

  // Consultor marca como offline
  socket.on('consultor_offline', async (consultorId: string) => {
    try {
      await pool.query('UPDATE consultores SET sistema_online = FALSE WHERE id = ?', [consultorId]);
      logger.info(`📴 Consultor ${consultorId} marcado como offline no sistema`);
      // Notificar admins sobre mudança de status
      io.to('admins').emit('consultor_status_mudou', { consultorId, online: false });
    } catch (error) {
      logger.error('Erro ao marcar consultor como offline:', error);
    }
  });

  socket.on('disconnect', async () => {
    logger.info('🔌 Cliente desconectado:', socket.id);
    
    // Verificar se era um consultor e marcar como offline
    const consultorId = consultorSockets.get(socket.id);
    if (consultorId) {
      try {
        await pool.query('UPDATE consultores SET sistema_online = FALSE WHERE id = ?', [consultorId]);
        logger.info(`📴 Consultor ${consultorId} marcado como offline (fechou aba/navegador)`);
        io.to('admins').emit('consultor_status_mudou', { consultorId, online: false });
        consultorSockets.delete(socket.id);
      } catch (error) {
        logger.error('Erro ao marcar consultor como offline na desconexão:', error);
      }
    }
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/mensagens', mensagensRoutes);
app.use('/api/whatsapp-cloud', whatsappCloudRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/tarefas', tarefasRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/followup', followupRoutes);
app.use('/api/indicador', indicadorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/configuracoes', configuracoesRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/facebook', facebookRoutes);

// Disponibilizar Socket.IO globalmente para os services
(global as any).io = io;

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'VIP CRM Backend funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
const start = async () => {
  try {
    // Testar conexão com banco
    await pool.query('SELECT NOW()');
    logger.info('✅ Banco de dados conectado');

    httpServer.listen(PORT, () => {
      logger.info('');
      logger.info('🚀 ============================================');
      logger.info('🚀  VIP CRM Backend');
      logger.info('🚀 ============================================');
      logger.info(`🚀  Servidor rodando em: http://localhost:${PORT}`);
      logger.info(`🚀  API disponível em: http://localhost:${PORT}/api`);
      logger.info(`🚀  Socket.IO ativo`);
      logger.info('🚀 ============================================');
      logger.info('');

      // Iniciar limpeza automática de arquivos
      cleanupService.iniciarLimpezaAutomatica();
      
      logger.info('✅ Sistema iniciado - Usando WhatsApp Cloud API oficial');
    });
  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

start();
