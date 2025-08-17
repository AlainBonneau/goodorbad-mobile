import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import crypto from "crypto";
import { CardType } from "@prisma/client";
import { pickWeighted, startOfUTCDay } from "../utils/function.js";

// Contrôleur de création de session
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

// Contrôleur de tirage de carte
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

// Contrôleur de finalisation de session
export async function finalizeSession(req: Request, res: Response) {
  try {
    const ownerKey = String(req.header("x-owner-key") || "").trim();
    if (!ownerKey) {
      return res.status(400).json({
        success: false,
        error: { code: "OWNER_KEY_REQUIRED", message: "x-owner-key header is required." },
      });
    }

    const sessionId = String(req.params.id);

    // Récupère la session + ses cartes tirées (ordre garanti)
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        cards: {
          orderBy: { index: "asc" },
          select: { id: true, index: true, type: true, labelSnapshot: true, cardTemplateId: true },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: "SESSION_NOT_FOUND", message: "Session not found." },
      });
    }
    if (session.ownerKey !== ownerKey) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "This session does not belong to you." },
      });
    }
    if (session.finalizedAt) {
      return res.status(400).json({
        success: false,
        error: { code: "SESSION_FINALIZED", message: "Session already finalized." },
      });
    }
    if (session.cards.length !== 5) {
      return res.status(400).json({
        success: false,
        error: { code: "NEED_5_CARDS", message: "You must draw exactly 5 cards before finalizing." },
      });
    }

    // Choix aléatoire uniforme parmi les 5 cartes tirées
    const pickIndex = Math.floor(Math.random() * 5);
    const chosen = session.cards[pickIndex];

    const todayUTC = startOfUTCDay();

    // Vérifie s'il y a déjà une carte officielle du jour
    const existingDaily = await prisma.dailyOutcome.findUnique({
      where: { ownerKey_date: { ownerKey, date: todayUTC } },
      select: { id: true },
    });

    if (!existingDaily) {
      // ✅ Première finalisation du jour → officielle
      const [updatedSession, daily] = await prisma.$transaction([
        prisma.session.update({
          where: { id: sessionId },
          data: {
            finalizedAt: new Date(),
            finalCardId: chosen.id,             // id de la SessionCard choisie
            finalType: chosen.type as CardType,
            finalLabel: chosen.labelSnapshot,
            finalPickIndex: chosen.index,
            isOfficialDaily: true,
          },
          select: {
            id: true, ownerKey: true, seed: true, startedAt: true, finalizedAt: true,
            finalCardId: true, finalType: true, finalLabel: true, finalPickIndex: true,
            isOfficialDaily: true,
          },
        }),
        prisma.dailyOutcome.create({
          data: {
            ownerKey,
            date: todayUTC,
            sessionId,
            finalCardId: chosen.id,
            finalType: chosen.type,
            finalLabel: chosen.labelSnapshot,
          },
          select: {
            id: true, ownerKey: true, date: true, sessionId: true,
            finalCardId: true, finalType: true, finalLabel: true, createdAt: true,
          },
        }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          official: true,
          final: {
            cardId: updatedSession.finalCardId,
            type: updatedSession.finalType,
            label: updatedSession.finalLabel,
            pickIndex: updatedSession.finalPickIndex,
          },
          session: updatedSession,
          dailyOutcome: daily,
        },
      });
    } else {
      // ▶️ Une carte officielle existe déjà aujourd’hui → partie “fun”
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          finalizedAt: new Date(),
          finalCardId: chosen.id,
          finalType: chosen.type as CardType,
          finalLabel: chosen.labelSnapshot,
          finalPickIndex: chosen.index,
          isOfficialDaily: false,
        },
        select: {
          id: true, ownerKey: true, seed: true, startedAt: true, finalizedAt: true,
          finalCardId: true, finalType: true, finalLabel: true, finalPickIndex: true,
          isOfficialDaily: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          official: false,
          final: {
            cardId: updatedSession.finalCardId,
            type: updatedSession.finalType,
            label: updatedSession.finalLabel,
            pickIndex: updatedSession.finalPickIndex,
          },
          session: updatedSession,
          dailyOutcome: null,
        },
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error." },
    });
  }
}

// Contrôleur pour récupérer une session
export async function getSession(req: Request, res: Response) {
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
      include: {
        cards: {
          orderBy: { index: "asc" },
          select: {
            id: true,
            index: true,
            type: true,
            labelSnapshot: true,
            cardTemplateId: true,
            createdAt: true,
          },
        },
      },
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
        error: { code: "FORBIDDEN", message: "Accès interdit." },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        session: {
          id: session.id,
          ownerKey: session.ownerKey,
          seed: session.seed,
          startedAt: session.startedAt,
          finalizedAt: session.finalizedAt,
          final: session.finalCardId
            ? {
                cardId: session.finalCardId,
                type: session.finalType,
                label: session.finalLabel,
                pickIndex: session.finalPickIndex,
              }
            : null,
          cards: session.cards,
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error." },
    });
  }
}

// Contrôleur pour récupérer un résultat quotidien
export async function getDailyOutcome(req: Request, res: Response) {
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

    const today = startOfUTCDay();

    const outcome = await prisma.dailyOutcome.findUnique({
      where: { ownerKey_date: { ownerKey, date: today } },
      select: {
        id: true,
        ownerKey: true,
        date: true,
        sessionId: true,
        finalCardId: true,
        finalType: true,
        finalLabel: true,
        createdAt: true,
      },
    });

    if (!outcome) {
      return res.status(404).json({
        success: false,
        error: {
          code: "DAILY_OUTCOME_NOT_FOUND",
          message: "Pas de résultat quotidien trouvé.",
        },
      });
    }

    return res
      .status(200)
      .json({ success: true, data: { dailyOutcome: outcome } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error." },
    });
  }
}
