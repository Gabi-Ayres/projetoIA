import { Router } from "express";
import { getItinerariosController, acaoController, apagarViagemController, apagarItemController } from "../controllers/acaoController.js";

const router = Router();

router.get('/', getItinerariosController);
router.post('/', acaoController);
router.delete('/:id', apagarViagemController)
router.delete('/dia/:id', apagarItemController)

export default router;
