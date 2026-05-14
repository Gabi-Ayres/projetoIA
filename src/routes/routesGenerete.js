import { Router } from "express";
import { testeControllerCalling } from "../controllers/genereteCallingController.js";

const router = Router();

router.post('/', testeControllerCalling);

export default router;