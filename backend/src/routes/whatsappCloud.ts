import express from 'express';
import * as whatsappCloudController from '../controllers/whatsappCloudController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Rotas autenticadas para configuração
router.post('/config', authMiddleware, whatsappCloudController.saveConfig);
router.delete('/config', authMiddleware, whatsappCloudController.removeConfig);
router.get('/status', authMiddleware, whatsappCloudController.getStatus);

// Rotas de webhook (SEM autenticação - são chamadas pelo Meta)
router.get('/webhook', whatsappCloudController.webhookVerify);
router.post('/webhook', whatsappCloudController.webhookReceive);

export default router;
