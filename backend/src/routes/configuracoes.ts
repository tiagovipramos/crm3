import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getComissoes,
  updateComissoes,
  getLootbox,
  updateLootbox,
  getMensagens,
  createMensagem,
  updateMensagem,
  deleteMensagem
} from '../controllers/configuracoesController';

const router = express.Router();

// Todas as rotas requerem autenticação de admin
router.use(authMiddleware);

// =====================================================
// COMISSÕES
// =====================================================
router.get('/comissoes', getComissoes);
router.put('/comissoes', updateComissoes);

// =====================================================
// LOOTBOX
// =====================================================
router.get('/lootbox', getLootbox);
router.put('/lootbox', updateLootbox);

// =====================================================
// MENSAGENS AUTOMÁTICAS
// =====================================================
router.get('/mensagens', getMensagens);
router.post('/mensagens', createMensagem);
router.put('/mensagens/:id', updateMensagem);
router.delete('/mensagens/:id', deleteMensagem);

export default router;
