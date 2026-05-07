import { Router } from 'express';
import { create, refine, summarize, suggestTagsController,meetingSummariesController, triageBugController} from '../controllers/taskController.js';

const router = Router();

router.post('/create', create);
router.post('/refine', refine);
router.post('/summarize', summarize);
router.post('/suggest-tags', suggestTagsController);
router.post('/meetings/summaries', meetingSummariesController)
router.post('/bugs/triage', triageBugController);
//router.post('/chatMessage', chatMessageController );


export default router;
