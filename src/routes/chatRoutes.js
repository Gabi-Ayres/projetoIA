import { Router } from 'express';
import { chatStreamController, getHistoricoController, limparHistoricoController } from '../controllers/chatController.js';

const router = Router();

router.get('/chat', chatStreamController);
router.get('/historico', getHistoricoController);
router.delete('/chat/limpar', limparHistoricoController);

export default router;
