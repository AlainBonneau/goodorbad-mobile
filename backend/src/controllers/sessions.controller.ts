import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import crypto from "crypto";
import { CardType } from "@prisma/client";
import { pickWeighted, startOfUTCDay } from "../utils/function.js";

// Contrôleur de création de session
export async function createSession(req: Request, res: Response) {
  try {
    const ownerKey = String(req.header("x-owner-key") || "").trim();
    const { title } = req.body;

    if (!ownerKey) {
      return res.status(400).json({
        success: false,
        error: {
          code: "OWNER_KEY_REQUIRED",
          message: "L'en-tête x-owner-key est requis.",
        },
      });
    }

    // Pour les sessions daily, vérifier si l'utilisateur a déjà joué aujourd'hui
    if (title && title.includes("quotidienne")) {
      const todayUTC = startOfUTCDay();
      const existingDaily = await prisma.dailyOutcome.findUnique({
        where: { ownerKey_date: { ownerKey, date: todayUTC } },
      });

      if (existingDaily) {
        return res.status(400).json({
          success: false,
          error: {
            code: "ALREADY_PLAYED_TODAY",
            message:
              "Vous avez déjà tiré votre carte du jour. Revenez demain !",
          },
        });
      }
    }

    const seed = crypto.randomUUID();

    const session = await prisma.session.create({
      data: {
        ownerKey,
        seed,
        // title: title || undefined,
      },
      select: {
        id: true,
        ownerKey: true,
        seed: true,
        startedAt: true,
        // title: true,
      },
    });

    return res.status(201).json({ success: true, data: session });
  } catch (err) {
    console.error("Error creating session:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erreur interne du serveur." },
    });
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
      select: {
        id: true,
        ownerKey: true,
        finalizedAt: true,
        isOfficialDaily: true,
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
    let chosenTemplateId = null;
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
        // labelSnapshot: true, // Ajouté pour compatibilité avec le front-end
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        card: {
          ...newCard,
          label: newCard.labelSnapshot, // Alias pour compatibilité
        },
        remaining: 5 - (currentCount + 1),
      },
    });
  } catch (err) {
    console.error("Error drawing card:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erreur interne du serveur." },
    });
  }
}

// Contrôleur pour finaliser avec choix utilisateur (utilisé par le front-end)
export async function finalPick(req: Request, res: Response) {
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
    const { pickIndex } = req.body;

    if (typeof pickIndex !== "number" || pickIndex < 0 || pickIndex > 4) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PICK_INDEX",
          message: "L'index de sélection doit être entre 0 et 4.",
        },
      });
    }

    // Vérifier si c'est une session daily et si l'utilisateur a déjà joué
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
        error: { code: "SESSION_NOT_FOUND", message: "Session non trouvée." },
      });
    }

    if (session.ownerKey !== ownerKey) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Cette session ne vous appartient pas.",
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

    if (session.cards.length !== 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NEED_5_CARDS",
          message: "Vous devez tirer exactement 5 cartes avant de finaliser.",
        },
      });
    }

    const chosenCard = session.cards.find((card) => card.index === pickIndex);
    if (!chosenCard) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_CARD_INDEX",
          message: "Index de carte invalide.",
        },
      });
    }

    // Détermine si c'est une session daily
    const isDailySession = session.isOfficialDaily;

    // Transaction pour finaliser la session et créer le daily outcome si nécessaire
    let updatedSession;
    let dailyOutcome = null;

    if (isDailySession) {
      [updatedSession, dailyOutcome] = await prisma.$transaction([
        prisma.session.update({
          where: { id: sessionId },
          data: {
            finalizedAt: new Date(),
            finalCardId: chosenCard.id,
            finalType: chosenCard.type,
            finalLabel: chosenCard.labelSnapshot,
            finalPickIndex: chosenCard.index,
          },
          select: {
            isOfficialDaily: true,
            id: true,
            ownerKey: true,
            seed: true,
            startedAt: true,
            finalizedAt: true,
            finalCardId: true,
            finalType: true,
            finalLabel: true,
            finalPickIndex: true,
          },
        }),
        prisma.dailyOutcome.create({
          data: {
            ownerKey,
            date: todayUTC,
            sessionId,
            finalCardId: chosenCard.id,
            finalType: chosenCard.type,
            finalLabel: chosenCard.labelSnapshot,
          },
        }),
      ]);
    } else {
      [updatedSession] = await prisma.$transaction([
        prisma.session.update({
          where: { id: sessionId },
          data: {
            finalizedAt: new Date(),
            finalCardId: chosenCard.id,
            finalType: chosenCard.type,
            finalLabel: chosenCard.labelSnapshot,
            finalPickIndex: chosenCard.index,
          },
          select: {
            isOfficialDaily: true,
            id: true,
            ownerKey: true,
            seed: true,
            startedAt: true,
            finalizedAt: true,
            finalCardId: true,
            finalType: true,
            finalLabel: true,
            finalPickIndex: true,
          },
        }),
      ]);
    }

    return res.status(200).json({
      success: true,
      data: {
        final: {
          id: chosenCard.id,
          type: chosenCard.type,
          label: chosenCard.labelSnapshot,
        },
        pickedIndex: chosenCard.index,
        session: updatedSession,
        dailyOutcome: dailyOutcome || null,
        message: isDailySession
          ? "Carte du jour révélée ! Revenez demain pour une nouvelle carte."
          : "Session finalisée avec succès.",
      },
    });
  } catch (err) {
    console.error("Error in finalPick:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erreur interne du serveur." },
    });
  }
}

// Contrôleur de finalisation automatique (legacy - gardé pour compatibilité)
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
          message: "L'en-tête x-owner-key est requis.",
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
        error: { code: "SESSION_NOT_FOUND", message: "Session non trouvée." },
      });
    }

    if (session.ownerKey !== ownerKey) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Cette session ne vous appartient pas.",
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

    if (session.cards.length !== 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NEED_5_CARDS",
          message: "Vous devez tirer exactement 5 cartes avant de finaliser.",
        },
      });
    }

    // Choix automatique aléatoire
    const pickIndex = Math.floor(Math.random() * 5);
    const chosen = session.cards[pickIndex];

    const [updatedSession, daily] = await prisma.$transaction([
      prisma.session.update({
        where: { id: sessionId },
        data: {
          finalizedAt: new Date(),
          finalCardId: chosen.id,
          finalType: chosen.type,
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
    console.error("Error in finalizeSessionWithDailyCheck:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erreur interne du serveur." },
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

    // Formatage pour compatibilité avec le front-end
    const formattedSession = {
      id: session.id,
      ownerKey: session.ownerKey,
      seed: session.seed,
      startedAt: session.startedAt,
      finalizedAt: session.finalizedAt,
      finalPickIndex: session.finalPickIndex,
      isOfficialDaily: session.isOfficialDaily,
      draws: session.cards.map((card) => ({
        id: card.id,
        index: card.index,
        type: card.type.toLowerCase(),
        labelSnapshot: card.labelSnapshot,
        label: card.labelSnapshot, // Alias pour compatibilité
        cardTemplateId: card.cardTemplateId,
        createdAt: card.createdAt,
      })),
      final: session.finalCardId
        ? {
            cardId: session.finalCardId,
            type: session.finalType,
            label: session.finalLabel,
            pickIndex: session.finalPickIndex,
          }
        : null,
      cards: session.cards, // Format original aussi
    };

    return res.status(200).json({
      success: true,
      data: formattedSession,
    });
  } catch (err) {
    console.error("Error getting session:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erreur interne du serveur." },
    });
  }
}

// Fonctions utilitaires et autres endpoints (getDailyOutcome, etc.)
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
      where: {
        ownerKey_date: {
          ownerKey,
          date: today,
        },
      },
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

    return res.status(200).json({
      success: true,
      data: {
        dailyOutcome: outcome, // null si pas trouvé
      },
    });
  } catch (error) {
    console.error("[getDailyOutcome] Erreur:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          "Erreur interne du serveur lors de la récupération du résultat quotidien.",
      },
    });
  }
}

export async function checkIfUserPlayedToday(ownerKey: string) {
  try {
    if (!ownerKey) return false;

    const today = startOfUTCDay();
    const outcome = await prisma.dailyOutcome.findUnique({
      where: { ownerKey_date: { ownerKey, date: today } },
      select: { id: true },
    });

    return outcome !== null;
  } catch (error) {
    console.error("[checkIfUserPlayedToday] Erreur:", error);
    return false;
  }
}

export async function getUserDailyStats(ownerKey: string) {
  try {
    if (!ownerKey) {
      return { totalDays: 0, currentStreak: 0, lastPlayDate: null };
    }

    const totalDays = await prisma.dailyOutcome.count({
      where: { ownerKey },
    });

    const lastOutcome = await prisma.dailyOutcome.findFirst({
      where: { ownerKey },
      orderBy: { date: "desc" },
      select: { date: true },
    });

    let currentStreak = 0;
    if (lastOutcome) {
      const outcomes = await prisma.dailyOutcome.findMany({
        where: { ownerKey },
        orderBy: { date: "desc" },
        select: { date: true },
      });

      let currentDate = new Date(lastOutcome.date);
      for (const outcome of outcomes) {
        const outcomeDate = new Date(outcome.date);
        if (outcomeDate.getTime() === currentDate.getTime()) {
          currentStreak++;
          currentDate.setDate(currentDate.getDate() - 1);
          currentDate.setHours(0, 0, 0, 0);
        } else {
          break;
        }
      }
    }

    return {
      totalDays,
      currentStreak,
      lastPlayDate: lastOutcome?.date || null,
    };
  } catch (error) {
    console.error("[getUserDailyStats] Erreur:", error);
    return { totalDays: 0, currentStreak: 0, lastPlayDate: null };
  }
}

export async function getDailyStats(req: Request, res: Response) {
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

    const stats = await getUserDailyStats(ownerKey);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalDays: stats.totalDays,
          currentStreak: stats.currentStreak,
          lastPlayDate: stats.lastPlayDate,
          hasPlayedToday: await checkIfUserPlayedToday(ownerKey),
        },
      },
    });
  } catch (error) {
    console.error("[getDailyStats] Erreur:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          "Erreur interne du serveur lors de la récupération des statistiques.",
      },
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
      finalizedAt: { not: null },
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
      meta: { page, limit, total, hasNext: page * limit < total },
    });
  } catch (err) {
    console.error("Error getting session history:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Erreur interne du serveur." },
    });
  }
}
