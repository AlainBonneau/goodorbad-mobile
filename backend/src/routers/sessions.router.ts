import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createSession,
  drawCard,
  finalizeSession,
  getSession,
  getDailyOutcome,
  getSessionHistory,
} from "../controllers/sessions.controller.js";
import { asyncHandler } from "../middlewares/error.js";
import { validate } from "../middlewares/validate.js";
import {
  ownerKeyHeaderSchema,
  sessionIdParamsSchema,
  sessionsHistoryQuerySchema,
} from "../controllers/sessions.schemas.js";

const router = Router();

const actionsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many actions." },
  },
});

router.get("/:id", getSession);
router.get(
  "/:id/daily-outcome",
  validate({ headers: ownerKeyHeaderSchema, params: sessionIdParamsSchema }),
  asyncHandler(getDailyOutcome)
);
router.get(
  "/history/list",
  validate({
    headers: ownerKeyHeaderSchema,
    query: sessionsHistoryQuerySchema,
  }),
  asyncHandler(getSessionHistory)
);

router.post(
  "/",
  validate({ headers: ownerKeyHeaderSchema }),
  asyncHandler(createSession)
);
router.post(
  "/:id/draw",
  validate({ headers: ownerKeyHeaderSchema, params: sessionIdParamsSchema }),
  actionsLimiter,
  asyncHandler(drawCard)
);
router.post(
  "/:id/finalize",
  validate({ headers: ownerKeyHeaderSchema, params: sessionIdParamsSchema }),
  actionsLimiter,
  asyncHandler(finalizeSession)
);

export default router;
