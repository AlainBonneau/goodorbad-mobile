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
export async function finalizeSessionWithDailyCheck(
  req: Request,
  res: Response
) {
  try {
    const ownerKey = String(req.header("x-owner-key") || "").trim();
    if (!ownerKey) {
      return res.status(400).json({
        success: false,
        error: {
          code: "OWNER_KEY_REQUIRED",
          message: "x-owner-key header is required.",
        },
      });
    }

    const sessionId = String(req.params.id);
    const todayUTC = startOfUTCDay();

    const existingDaily = await prisma.dailyOutcome.findUnique({
      where: { ownerKey_date: { ownerKey, date: todayUTC } },
    });

    if (existingDaily) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ALREADY_PLAYED_TODAY",
          message: "Vous avez déjà tiré votre carte du jour. Revenez demain !",
        },
      });
    }

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
          },
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
        error: {
          code: "FORBIDDEN",
          message: "This session does not belong to you.",
        },
      });
    }

    if (session.finalizedAt) {
      return res.status(400).json({
        success: false,
        error: {
          code: "SESSION_FINALIZED",
          message: "Session already finalized.",
        },
      });
    }

    if (session.cards.length !== 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NEED_5_CARDS",
          message: "You must draw exactly 5 cards before finalizing.",
        },
      });
    }

    const pickIndex = Math.floor(Math.random() * 5);
    const chosen = session.cards[pickIndex];

    const [updatedSession, daily] = await prisma.$transaction([
      prisma.session.update({
        where: { id: sessionId },
        data: {
          finalizedAt: new Date(),
          finalCardId: chosen.id,
          finalType: chosen.type as CardType,
          finalLabel: chosen.labelSnapshot,
          finalPickIndex: chosen.index,
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
        message:
          "Carte du jour révélée ! Revenez demain pour une nouvelle carte.",
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

// Contrôleur pour récupérer l'historique des sessions
export async function getSessionHistory(req: Request, res: Response) {
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

    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Number(req.query.limit ?? 10));
    const officialParam = req.query.official;
    const whereOfficial =
      officialParam === undefined
        ? undefined
        : String(officialParam).toLowerCase() === "true";

    const where = {
      ownerKey,
      finalizedAt: { not: null as any },
      ...(whereOfficial === undefined
        ? {}
        : { isOfficialDaily: whereOfficial }),
    };

    const [total, items] = await prisma.$transaction([
      prisma.session.count({ where }),
      prisma.session.findMany({
        where,
        orderBy: { finalizedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          startedAt: true,
          finalizedAt: true,
          isOfficialDaily: true,
          finalType: true,
          finalLabel: true,
          finalPickIndex: true,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: { items },
      meta: {
        page,
        limit,
        total,
        hasNext: page * limit < total,
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

export async function getDailySession(req: Request, res: Response) {
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

    const todayUTC = startOfUTCDay();

    // Vérifier s'il existe déjà un outcome pour aujourd'hui
    const existingOutcome = await prisma.dailyOutcome.findUnique({
      where: { ownerKey_date: { ownerKey, date: todayUTC } },
      include: {
        session: {
          include: {
            cards: {
              orderBy: { index: "asc" },
            },
          },
        },
      },
    });

    if (existingOutcome) {
      // L'utilisateur a déjà joué aujourd'hui
      return res.status(200).json({
        success: true,
        data: {
          session: existingOutcome.session,
          dailyOutcome: existingOutcome,
          canPlay: false,
          message: "Vous avez déjà tiré votre carte du jour",
        },
      });
    }

    // Pas de résultat aujourd'hui, vérifier s'il y a une session en cours
    const pendingSession = await prisma.session.findFirst({
      where: {
        ownerKey,
        finalizedAt: null,
        // On peut ajouter un filtre sur la date de création pour éviter les sessions trop anciennes
        startedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24h
        },
      },
      include: {
        cards: {
          orderBy: { index: "asc" },
        },
      },
    });

    if (pendingSession && pendingSession.cards.length === 5) {
      // Il y a une session en cours avec 5 cartes
      return res.status(200).json({
        success: true,
        data: {
          session: pendingSession,
          dailyOutcome: null,
          canPlay: true,
          message: "Session en cours - vous pouvez finaliser votre choix",
        },
      });
    }

    // Créer une nouvelle session daily
    const seed = crypto.randomUUID();
    const session = await prisma.session.create({
      data: {
        ownerKey,
        seed,
      },
    });

    // Tirer automatiquement 5 cartes
    const cards = [];
    for (let i = 0; i < 5; i++) {
      const randomValue = Math.random();
      const type = randomValue < 0.5 ? CardType.GOOD : CardType.BAD;

      // Récupérer les templates disponibles
      const candidates = await prisma.cardTemplate.findMany({
        where: { isActive: true, type },
        select: { id: true, label: true, weight: true },
      });

      let chosenTemplateId: string | null = null;
      let labelSnapshot =
        type === CardType.GOOD ? "Bonne carte" : "Mauvaise carte";

      if (candidates.length > 0) {
        const chosen = pickWeighted(candidates);
        chosenTemplateId = chosen.id;
        labelSnapshot = chosen.label;
      }

      const card = await prisma.sessionCard.create({
        data: {
          sessionId: session.id,
          index: i,
          type,
          cardTemplateId: chosenTemplateId,
          labelSnapshot,
          randomValue,
        },
      });

      cards.push(card);
    }

    // Récupérer la session complète avec les cartes
    const completeSession = await prisma.session.findUnique({
      where: { id: session.id },
      include: {
        cards: {
          orderBy: { index: "asc" },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        session: completeSession,
        dailyOutcome: null,
        canPlay: true,
        message: "Nouvelle session daily créée - choisissez votre carte",
      },
    });
  } catch (err) {
    console.error("Error in getDailySession:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error." },
    });
  }
}
