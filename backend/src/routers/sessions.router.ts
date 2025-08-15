import { Router } from "express";
import {
  createSession,
  drawCard,
  finalizeSession,
  getSession,
  getDailyOutcome,
} from "../controllers/sessions.controller.js";

const router = Router();

router.get("/:id", getSession);
router.get("/:id/daily-outcome", getDailyOutcome);

router.post("/", createSession);
router.post("/:id/draw", drawCard);
router.post("/:id/finalize", finalizeSession);

export default router;
