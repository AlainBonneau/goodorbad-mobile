import { Router } from "express";
import {
  createSession,
  drawCard,
  finalizeSession,
} from "../controllers/sessions.controller.js";

const router = Router();

router.post("/", createSession);
router.post("/:id/draw", drawCard);
router.post("/:id/finalize", finalizeSession);

export default router;
