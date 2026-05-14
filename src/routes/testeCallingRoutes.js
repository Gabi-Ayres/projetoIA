import { Router } from "express";
import { testeControllerCalling } from "../controllers/testeControllerCalling.js";

const router = Router();

router.post('/', testeControllerCalling);

export default router;