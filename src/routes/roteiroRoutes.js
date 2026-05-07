import { Router } from "express"; 
import { getItinerariosController, criarRoteiroController, apagarItemController } from "../controllers/roteiroController.js";

const router = Router();

router.get('/',  getItinerariosController);
router.post('/', criarRoteiroController);
router.delete('/:id', apagarItemController);   
 

export default router;


