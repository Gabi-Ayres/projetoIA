import { Router } from 'express';
import { chatStreamController } from '../controllers/taskController.js';

const router = Router();

router.get('/chat', chatStreamController);

export default router;
