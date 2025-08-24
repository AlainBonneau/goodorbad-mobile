import { Router } from "express";
import {
  getStatistics,
} from "../controllers/stats.controller.js";

const router = Router();

router.get("/statistics", getStatistics);

export default router;
