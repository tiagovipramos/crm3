import express from 'express';
import * as facebookDataDeletionController from '../controllers/facebookDataDeletionController';

const router = express.Router();

// Rota de callback para exclusão de dados (POST)
// O Facebook envia um signed_request quando o usuário solicita exclusão
router.post('/data-deletion', facebookDataDeletionController.handleDataDeletionRequest);

// Rota de status da exclusão de dados (GET)
// Retorna uma página HTML com informações sobre a solicitação
router.get('/data-deletion-status', facebookDataDeletionController.getDataDeletionStatus);

export default router;
