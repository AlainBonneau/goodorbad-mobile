import { Router } from "express";
import {
  createSession,
  drawCard,
  finalizeSession,
  getSession,
} from "../controllers/sessions.controller.js";

const router = Router();

router.get("/:id", getSession);

router.post("/", createSession);
router.post("/:id/draw", drawCard);
router.post("/:id/finalize", finalizeSession);

export default router;
