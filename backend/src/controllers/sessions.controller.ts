import { Request, Response } from "express";
import { SessionService } from "../services/sessionService.js";
import { CardService } from "../services/cardService.js";
import { DailyService } from "../services/dailyService.js";
import { FinalizationService } from "../services/finalizationService.js";
import { handleError } from "../utils/errorHandler.js";

const sessionService = new SessionService();
const cardService = new CardService();
const dailyService = new DailyService();
const finalizationService = new FinalizationService(dailyService);

export async function createSession(req: Request, res: Response) {
  try {
    const ownerKey = String(req.header("x-owner-key") || "").trim();
    if (!ownerKey) throw new Error("OWNER_KEY_REQUIRED");

    const session = await sessionService.createSession(ownerKey);
    return res.status(201).json({ success: true, data: session });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function drawCard(req: Request, res: Response) {
  try {
    const ownerKey = String(req.header("x-owner-key") || "").trim();
    if (!ownerKey) throw new Error("OWNER_KEY_REQUIRED");

    const sessionId = String(req.params.id);
    const result = await cardService.drawCard(sessionId, ownerKey);

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function finalPick(req: Request, res: Response) {
  try {
    const ownerKey = String(req.header("x-owner-key") || "").trim();
    if (!ownerKey) throw new Error("OWNER_KEY_REQUIRED");

    const sessionId = String(req.params.id);
    const { pickIndex } = req.body;

    const result = await finalizationService.finalizeWithPick(
      sessionId,
      ownerKey,
      pickIndex
    );
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function finalizeSessionWithDailyCheck(
  req: Request,
  res: Response
) {
  try {
    const ownerKey = String(req.header("x-owner-key") || "").trim();
    if (!ownerKey) throw new Error("OWNER_KEY_REQUIRED");

    const sessionId = String(req.params.id);
    const result = await finalizationService.finalizeWithDailyCheck(
      sessionId,
      ownerKey
    );

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const ownerKey = String(req.header("x-owner-key") || "").trim();
    if (!ownerKey) throw new Error("OWNER_KEY_REQUIRED");

    const sessionId = String(req.params.id);
    const session = await sessionService.getSession(sessionId, ownerKey);

    return res.status(200).json({ success: true, data: session });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getDailyStats(req: Request, res: Response) {
  try {
    const ownerKey = String(req.header("x-owner-key") || "").trim();
    if (!ownerKey) throw new Error("OWNER_KEY_REQUIRED");

    const stats = await dailyService.getUserStats(ownerKey);
    return res.status(200).json({ success: true, data: { stats } });
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getSessionHistory(req: Request, res: Response) {
  try {
    const ownerKey = String(req.header("x-owner-key") || "").trim();
    if (!ownerKey) throw new Error("OWNER_KEY_REQUIRED");

    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Number(req.query.limit ?? 10));
    const officialParam = req.query.official;
    const officialOnly =
      officialParam === undefined
        ? undefined
        : String(officialParam).toLowerCase() === "true";

    const result = await sessionService.getSessionHistory(
      ownerKey,
      page,
      limit,
      officialOnly
    );

    return res.status(200).json({
      success: true,
      data: { items: result.items },
      meta: result.meta,
    });
  } catch (error) {
    return handleError(error, res);
  }
}
