import { Router } from 'express';
import { 
  getEtapas, 
  createEtapa, 
  updateEtapa, 
  deleteEtapa,
  reordenarEtapas 
} from '../controllers/funisController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// GET /api/funis/etapas - Listar todas as etapas do consultor
router.get('/etapas', getEtapas);

// POST /api/funis/etapas - Criar nova etapa
router.post('/etapas', createEtapa);

// PUT /api/funis/etapas/reordenar - Reordenar etapas
router.put('/etapas/reordenar', reordenarEtapas);

// PUT /api/funis/etapas/:id - Atualizar etapa existente
router.put('/etapas/:id', updateEtapa);

// DELETE /api/funis/etapas/:id - Deletar etapa
router.delete('/etapas/:id', deleteEtapa);

export default router;
