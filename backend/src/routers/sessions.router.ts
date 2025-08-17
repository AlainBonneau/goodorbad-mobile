import { Router } from "express";
import {
  createSession,
  drawCard,
  finalizeSession,
  getSession,
  getDailyOutcome,
  getSessionHistory,
} from "../controllers/sessions.controller.js";

const router = Router();

router.get("/:id", getSession);
router.get("/:id/daily-outcome", getDailyOutcome);
router.get("/history/list", getSessionHistory);

router.post("/", createSession);
router.post("/:id/draw", drawCard);
router.post("/:id/finalize", finalizeSession);

export default router;
