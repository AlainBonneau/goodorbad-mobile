import { prisma } from "../lib/prisma.js";
import { startOfUTCDay } from "../utils/function.js";
import { DailyService } from "./dailyService.js";

export class FinalizationService {
  constructor(private dailyService: DailyService) {}

  // Finalisation d'une session avec un choix de carte
  async finalizeWithPick(
    sessionId: string,
    ownerKey: string,
    pickIndex: number
  ) {
    this.validatePickIndex(pickIndex);

    const session = await this.getSessionForFinalization(sessionId, ownerKey);
    const chosenCard = this.getChosenCard(session.cards, pickIndex);

    return this.executeFinalization(session, chosenCard, ownerKey);
  }

  // Finalisation d'une session avec vérification quotidienne
  async finalizeWithDailyCheck(sessionId: string, ownerKey: string) {
    const session = await this.getSessionForFinalization(sessionId, ownerKey);
    const pickIndex = Math.floor(Math.random() * 5);
    const chosenCard = session.cards[pickIndex];

    const [updatedSession, dailyOutcome] = await prisma.$transaction([
      this.updateSession(sessionId, chosenCard, true),
      this.createDailyOutcome(ownerKey, chosenCard, sessionId),
    ]);

    return {
      official: true,
      final: {
        cardId: updatedSession.finalCardId,
        type: updatedSession.finalType,
        label: updatedSession.finalLabel,
        pickIndex: updatedSession.finalPickIndex,
      },
      session: updatedSession,
      dailyOutcome,
      message:
        "Carte du jour révélée ! Revenez demain pour une nouvelle carte.",
    };
  }

  // Validation de l'index de choix
  private validatePickIndex(pickIndex: number) {
    if (typeof pickIndex !== "number" || pickIndex < 0 || pickIndex > 4) {
      throw new Error("INVALID_PICK_INDEX");
    }
  }

  // Récupération de la session pour finalisation
  private async getSessionForFinalization(sessionId: string, ownerKey: string) {
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

    if (!session) throw new Error("SESSION_NOT_FOUND");
    if (session.ownerKey !== ownerKey) throw new Error("FORBIDDEN");
    if (session.finalizedAt) throw new Error("SESSION_FINALIZED");
    if (session.cards.length !== 5) throw new Error("NEED_5_CARDS");

    return session;
  }

  // Récupération de la carte choisie
  private getChosenCard(cards: any[], pickIndex: number) {
    const chosenCard = cards.find((card) => card.index === pickIndex);
    if (!chosenCard) throw new Error("INVALID_CARD_INDEX");
    return chosenCard;
  }

  // Exécution de la finalisation
  private async executeFinalization(
    session: any,
    chosenCard: any,
    ownerKey: string
  ) {
    const isDailySession = session.isOfficialDaily;
    const todayUTC = startOfUTCDay();

    if (isDailySession) {
      const [updatedSession, dailyOutcome] = await prisma.$transaction([
        this.updateSession(session.id, chosenCard, false),
        this.createDailyOutcome(ownerKey, chosenCard, session.id),
      ]);

      return {
        final: {
          id: chosenCard.id,
          type: chosenCard.type,
          label: chosenCard.labelSnapshot,
        },
        pickedIndex: chosenCard.index,
        session: updatedSession,
        dailyOutcome,
        message:
          "Carte du jour révélée ! Revenez demain pour une nouvelle carte.",
      };
    } else {
      const [updatedSession] = await prisma.$transaction([
        this.updateSession(session.id, chosenCard, false),
      ]);

      return {
        final: {
          id: chosenCard.id,
          type: chosenCard.type,
          label: chosenCard.labelSnapshot,
        },
        pickedIndex: chosenCard.index,
        session: updatedSession,
        dailyOutcome: null,
        message: "Session finalisée avec succès.",
      };
    }
  }

  // Mise à jour de la session
  private updateSession(
    sessionId: string,
    chosenCard: any,
    isOfficialDaily: boolean
  ) {
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        finalizedAt: new Date(),
        finalCardId: chosenCard.id,
        finalType: chosenCard.type,
        finalLabel: chosenCard.labelSnapshot,
        finalPickIndex: chosenCard.index,
        ...(isOfficialDaily && { isOfficialDaily: true }),
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
    });
  }

  // Création d'un résultat quotidien
  private createDailyOutcome(
    ownerKey: string,
    chosenCard: any,
    sessionId: string
  ) {
    return prisma.dailyOutcome.create({
      data: {
        ownerKey,
        date: startOfUTCDay(),
        sessionId,
        finalCardId: chosenCard.id,
        finalType: chosenCard.type,
        finalLabel: chosenCard.labelSnapshot,
      },
    });
  }
}
