import { Router } from "express";
import { createSession, drawCard } from "../controllers/sessions.controller.js";

const router = Router();

router.post("/", createSession);
router.post("/:id/draw", drawCard);

export default router;
