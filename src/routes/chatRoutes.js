import { Router } from 'express';
import { chatStreamController } from '../controllers/chatController.js';

const router = Router();

router.get('/chat', chatStreamController);

export default router;
