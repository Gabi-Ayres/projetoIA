import { Router } from 'express';
import { chatStreamController, getHistoricoController } from '../controllers/chatController.js';

const router = Router();

router.get('/chat', chatStreamController);
router.get('/historico', getHistoricoController);

export default router;
