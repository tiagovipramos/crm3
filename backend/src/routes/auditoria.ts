import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getTodasIndicacoes,
  getIndicacaoDetalhada,
  exportarAuditoria,
  getResumoIndicador
} from '../controllers/auditoriaController';

const router = Router();

// Todas as rotas requerem autenticação de admin
router.use(authMiddleware);

// GET /api/auditoria - Listar todas as indicações com filtros
router.get('/', getTodasIndicacoes);

// GET /api/auditoria/exportar - Exportar auditoria (JSON ou CSV)
router.get('/exportar', exportarAuditoria);

// GET /api/auditoria/indicador/:indicadorId - Resumo de um indicador específico
router.get('/indicador/:indicadorId', getResumoIndicador);

// GET /api/auditoria/:id - Detalhes de uma indicação específica
router.get('/:id', getIndicacaoDetalhada);

export default router;
