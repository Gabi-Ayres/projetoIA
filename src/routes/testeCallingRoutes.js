import { Router } from "express";
import { getItinerariosController, testeControllerCalling } from "../controllers/testeControllerCalling.js";

const router = Router();

router.get('/', getItinerariosController);
router.post('/', testeControllerCalling);

export default router;