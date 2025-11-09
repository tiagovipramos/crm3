import pino from 'pino';

// Configurar logger baseado no ambiente
export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    }
  }
});

// Helper para logs estruturados
export const logWithContext = (level: 'info' | 'error' | 'warn' | 'debug', message: string, context?: any) => {
  if (context) {
    logger[level]({ context }, message);
  } else {
    logger[level](message);
  }
};

export default logger;
