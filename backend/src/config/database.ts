import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { logger } from './config/logger';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'protecar_crm',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 50,  // Aumentado de 10 para 50 - suporta 30-50 usuários simultâneos
  queueLimit: 20,       // Fila de espera para conexões
  maxIdle: 10,          // Máximo de conexões idle mantidas
  idleTimeout: 60000,   // Timeout de 60s para conexões idle
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

pool.getConnection()
  .then(() => {
    logger.info('✅ Conectado ao MySQL');
  })
  .catch((err) => {
    logger.error('❌ Erro no MySQL:', err.message);
  });

export default pool;
