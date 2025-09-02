import { prisma } from "../lib/prisma.js";
import { CardType } from "@prisma/client";
import { pickWeighted, startOfUTCDay } from "../utils/function.js";
import crypto from "crypto";

export class SessionService {
  async createSession(ownerKey: string) {
    const seed = crypto.randomUUID();

    return prisma.session.create({
      data: { ownerKey, seed },
      select: {
        id: true,
        ownerKey: true,
        seed: true,
        startedAt: true,
      },
    });
  }

  async getSession(sessionId: string, ownerKey: string) {
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

    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.ownerKey !== ownerKey) throw new Error("FORBIDDEN");

    return this.formatSession(session);
  }

  async getSessionHistory(
    ownerKey: string,
    page: number = 1,
    limit: number = 10,
    officialOnly?: boolean
  ) {
    const normalizedLimit = Math.min(50, Math.max(1, limit));
    const normalizedPage = Math.max(1, page);

    const where = {
      ownerKey,
      finalizedAt: { not: null },
      ...(officialOnly !== undefined ? { isOfficialDaily: officialOnly } : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.session.count({ where }),
      prisma.session.findMany({
        where,
        orderBy: { finalizedAt: "desc" },
        skip: (normalizedPage - 1) * normalizedLimit,
        take: normalizedLimit,
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

    return {
      items,
      meta: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        hasNext: normalizedPage * normalizedLimit < total,
      },
    };
  }

  private formatSession(session: any) {
    return {
      id: session.id,
      ownerKey: session.ownerKey,
      seed: session.seed,
      startedAt: session.startedAt,
      finalizedAt: session.finalizedAt,
      finalPickIndex: session.finalPickIndex,
      isOfficialDaily: session.isOfficialDaily,
      draws: session.cards.map((card: any) => ({
        id: card.id,
        index: card.index,
        type: card.type.toLowerCase(),
        labelSnapshot: card.labelSnapshot,
        label: card.labelSnapshot,
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
      cards: session.cards,
    };
  }
}
