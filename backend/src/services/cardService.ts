import { prisma } from "../lib/prisma.js";
import { CardType } from "@prisma/client";
import { pickWeighted, startOfUTCDay } from "../utils/function.js";
import crypto from "crypto";

export class CardService {
  async drawCard(sessionId: string, ownerKey: string) {
    const session = await this.validateDrawSession(sessionId, ownerKey);

    const currentCount = await prisma.sessionCard.count({
      where: { sessionId },
    });

    if (currentCount >= 5) {
      throw new Error("DRAW_LIMIT_REACHED");
    }

    const { type, chosenTemplateId, labelSnapshot } = await this.selectCard();

    const newCard = await prisma.sessionCard.create({
      data: {
        sessionId,
        index: currentCount,
        type,
        cardTemplateId: chosenTemplateId,
        labelSnapshot,
        randomValue: Math.random(),
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

    return {
      card: { ...newCard, label: newCard.labelSnapshot },
      remaining: 5 - (currentCount + 1),
    };
  }

  private async validateDrawSession(sessionId: string, ownerKey: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        ownerKey: true,
        finalizedAt: true,
        isOfficialDaily: true,
      },
    });

    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.ownerKey !== ownerKey) throw new Error("FORBIDDEN");
    if (session.finalizedAt) throw new Error("SESSION_FINALIZED");

    return session;
  }

  private async selectCard() {
    const randomValue = Math.random();
    const type = randomValue < 0.5 ? CardType.GOOD : CardType.BAD;

    const candidates = await prisma.cardTemplate.findMany({
      where: { isActive: true, type },
      select: { id: true, label: true, weight: true },
    });

    let chosenTemplateId = null;
    let labelSnapshot =
      type === CardType.GOOD ? "Bonne carte" : "Mauvaise carte";

    if (candidates.length > 0) {
      const chosen = pickWeighted(candidates);
      chosenTemplateId = chosen.id;
      labelSnapshot = chosen.label;
    }

    return { type, chosenTemplateId, labelSnapshot };
  }
}
