import { Router } from "express";
import { createSession } from "../controllers/sessions.controller.js";

const router = Router();

router.post("/", createSession);

export default router;
