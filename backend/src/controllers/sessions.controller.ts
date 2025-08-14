import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import crypto from "crypto";
import { CardType } from "@prisma/client";
import pickWeighted from "../utils/function.js";

export async function createSession(req: Request, res: Response) {
  try {
    const ownerKey = String(req.header("x-owner-key") || "").trim();

    if (!ownerKey) {
      return res.status(400).json({
        success: false,
        error: {
          code: "OWNER_KEY_REQUIRED",
          message: "L'en-tête x-owner-key est requis.",
        },
      });
    }

    const seed = crypto.randomUUID();

    const session = await prisma.session.create({
      data: {
        ownerKey,
        seed,
      },
      select: {
        id: true,
        ownerKey: true,
        seed: true,
        startedAt: true,
      },
    });

    return res.status(201).json({ success: true, data: session });
  } catch (err) {
    console.error("Error creating session:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function drawCard(req: Request, res: Response) {
  try {
    const ownerKey = String(req.header("x-owner-key") || "").trim();

    if (!ownerKey) {
      return res.status(400).json({
        success: false,
        error: {
          code: "OWNER_KEY_REQUIRED",
          message: "L'en-tête x-owner-key est requis.",
        },
      });
    }

    const sessionId = String(req.params.id);
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, ownerKey: true, finalizedAt: true },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: "SESSION_NOT_FOUND", message: "Session non trouvée." },
      });
    }

    if (session.ownerKey !== ownerKey) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Vous n'avez pas la permission d'accéder à cette session.",
        },
      });
    }

    if (session.finalizedAt) {
      return res.status(400).json({
        success: false,
        error: {
          code: "SESSION_FINALIZED",
          message: "Session déjà finalisée.",
        },
      });
    }

    const currentCount = await prisma.sessionCard.count({
      where: { sessionId },
    });
    if (currentCount >= 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: "DRAW_LIMIT_REACHED",
          message: "Limite de tirage atteinte.",
        },
      });
    }

    // 50/50 tirage du type
    const randomValue = Math.random();
    const type = randomValue < 0.5 ? CardType.GOOD : CardType.BAD;

    // candidats actifs du type
    const candidates = await prisma.cardTemplate.findMany({
      where: { isActive: true, type },
      select: { id: true, label: true, weight: true },
    });

    // si pas de template en DB, fallback minimal pour ne pas bloquer
    let chosenTemplateId: string | null = null;
    let labelSnapshot =
      type === CardType.GOOD ? "Bonne carte" : "Mauvaise carte";

    if (candidates.length > 0) {
      const chosen = pickWeighted(candidates);
      chosenTemplateId = chosen.id;
      labelSnapshot = chosen.label;
    }

    const newCard = await prisma.sessionCard.create({
      data: {
        sessionId,
        index: currentCount,
        type,
        cardTemplateId: chosenTemplateId,
        labelSnapshot,
        randomValue,
      },
      select: {
        id: true,
        sessionId: true,
        index: true,
        type: true,
        labelSnapshot: true,
        cardTemplateId: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: { card: newCard, remaining: 5 - (currentCount + 1) },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error." },
    });
  }
}
