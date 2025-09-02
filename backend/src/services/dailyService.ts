import { prisma } from "../lib/prisma.js";
import { CardType } from "@prisma/client";
import { pickWeighted, startOfUTCDay } from "../utils/function.js";
import crypto from "crypto";

export class DailyService {
  async getUserStats(ownerKey: string) {
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

    const currentStreak = await this.calculateStreak(ownerKey, lastOutcome);

    return {
      totalDays,
      currentStreak,
      lastPlayDate: lastOutcome?.date || null,
    };
  }

  private async calculateStreak(ownerKey: string, lastOutcome: any) {
    if (!lastOutcome) return 0;

    const outcomes = await prisma.dailyOutcome.findMany({
      where: { ownerKey },
      orderBy: { date: "desc" },
      select: { date: true },
    });

    let currentStreak = 0;
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

    return currentStreak;
  }
}
