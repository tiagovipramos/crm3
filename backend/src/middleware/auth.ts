import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: string;
  email: string;
  role?: string;
}

// Extender o tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('[AUTH] Authorization Header:', authHeader ? `Bearer ${authHeader.substring(7, 27)}...` : 'MISSING');
    
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.log('[AUTH] Token não fornecido');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const secret = process.env.JWT_SECRET || 'secret';
    console.log('[AUTH] JWT_SECRET:', secret ? `${secret.substring(0, 10)}...` : 'DEFAULT');
    
    const decoded = jwt.verify(token, secret) as JWTPayload;
    console.log('[AUTH] Token decodificado com sucesso. User ID:', decoded.id);
    req.user = decoded;
    
    next();
  } catch (error) {
    console.log('[AUTH] Erro ao verificar token:', (error as Error).message);
    return res.status(401).json({ error: 'Token inválido' });
  }
};
