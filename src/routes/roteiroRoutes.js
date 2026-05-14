import { Router } from "express"; 
import { roteiroController, getItinerariosController, apagarViagemController, apagarItemController } from "../controllers/roteiroController.js";
import { testeControllerCalling } from "../controllers/testeControllerCalling.js";

const router = Router();

router.get('/',  getItinerariosController);
router.post('/', roteiroController);
router.delete('/dia/:id', apagarItemController);
router.delete('/:id', apagarViagemController);
 

export default router;


