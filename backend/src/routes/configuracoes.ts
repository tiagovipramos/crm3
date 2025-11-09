import express from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware } from '../middleware/auth';
import {
  getComissoes,
  updateComissoes,
  getLootbox,
  updateLootbox,
  getMensagens,
  createMensagem,
  updateMensagem,
  deleteMensagem,
  getMensagensPredefinidas,
  createMensagemPredefinida,
  updateMensagemPredefinida,
  deleteMensagemPredefinida,
  uploadAudioPredefinido
} from '../controllers/configuracoesController';

// Configurar multer para upload de áudios
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-predefinido-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /audio\/(mpeg|mp3|wav|ogg|webm|m4a)/;
    const mimeType = allowedTypes.test(file.mimetype);
    if (mimeType) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de áudio são permitidos!'));
    }
  }
});

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

// =====================================================
// MENSAGENS E ÁUDIOS PRÉ-DEFINIDOS
// =====================================================
router.get('/mensagens-predefinidas', getMensagensPredefinidas);
router.post('/mensagens-predefinidas', createMensagemPredefinida);
router.put('/mensagens-predefinidas/:id', updateMensagemPredefinida);
router.delete('/mensagens-predefinidas/:id', deleteMensagemPredefinida);
router.post('/mensagens-predefinidas/upload-audio', upload.single('audio'), uploadAudioPredefinido);

export default router;
