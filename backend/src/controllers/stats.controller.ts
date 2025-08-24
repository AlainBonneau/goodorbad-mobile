import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { startOfUTCDay } from "../utils/function.js";

// Contrôleur pour récupérer les statistiques globales
export async function getStatistics(req: Request, res: Response) {
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

    // Récupérer toutes les sessions finalisées pour cet utilisateur
    const sessions = await prisma.session.findMany({
      where: {
        ownerKey,
        finalizedAt: { not: null },
      },
      orderBy: { finalizedAt: "desc" },
      select: {
        id: true,
        startedAt: true,
        finalizedAt: true,
        finalType: true,
        finalLabel: true,
        finalPickIndex: true,
        isOfficialDaily: true,
      },
    });

    const totalSessions = sessions.length;
    const officialSessions = sessions.filter((s) => s.isOfficialDaily).length;
    const goodSessions = sessions.filter((s) => s.finalType === "GOOD").length;
    const badSessions = sessions.filter((s) => s.finalType === "BAD").length;
    const officialSessionsByDate = sessions
      .filter((s) => s.isOfficialDaily)
      .sort(
        (a, b) =>
          new Date(b.finalizedAt!).getTime() -
          new Date(a.finalizedAt!).getTime()
      );

    const currentStreak = calculateCurrentStreak(officialSessionsByDate);
    const longestStreak = calculateLongestStreak(officialSessionsByDate);

    // Calcul des données mensuelles (6 derniers mois)
    const monthlyData = calculateMonthlyData(sessions);

    // Calcul de l'heure favorite
    const topHour = calculateTopHour(sessions);

    // Calcul des tags populaires (si vous avez des cartes avec templates)
    const topTags = await calculateTopTags(ownerKey);

    const statistics = {
      overview: {
        totalSessions,
        officialSessions,
        currentStreak,
        longestStreak,
        goodPercentage:
          totalSessions > 0
            ? Math.round((goodSessions / totalSessions) * 100)
            : 0,
        badPercentage:
          totalSessions > 0
            ? Math.round((badSessions / totalSessions) * 100)
            : 0,
      },
      monthlyData,
      recentSessions: sessions.slice(0, 10),
      topHour,
      averageCardsPerSession: 5,
      topTags,
    };

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (err) {
    console.error("Error getting statistics:", err);
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error." },
    });
  }
}

// Fonction utilitaire pour calculer la série actuelle
function calculateCurrentStreak(officialSessions: any[]): number {
  if (!officialSessions.length) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < officialSessions.length; i++) {
    const sessionDate = new Date(officialSessions[i].finalizedAt);
    sessionDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === streak) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Fonction utilitaire pour calculer la plus longue série
function calculateLongestStreak(officialSessions: any[]): number {
  if (!officialSessions.length) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < officialSessions.length; i++) {
    const currentDate = new Date(officialSessions[i].finalizedAt);
    const prevDate = new Date(officialSessions[i - 1].finalizedAt);

    currentDate.setHours(0, 0, 0, 0);
    prevDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

// Fonction utilitaire pour les données mensuelles
function calculateMonthlyData(sessions: any[]) {
  const monthsData: {
    [key: string]: { good: number; bad: number; total: number };
  } = {};

  sessions.forEach((session) => {
    const date = new Date(session.finalizedAt);
    const monthKey = date.toLocaleDateString("fr-FR", {
      month: "short",
      year: "2-digit",
    });

    if (!monthsData[monthKey]) {
      monthsData[monthKey] = { good: 0, bad: 0, total: 0 };
    }

    monthsData[monthKey].total++;
    if (session.finalType === "GOOD") {
      monthsData[monthKey].good++;
    } else {
      monthsData[monthKey].bad++;
    }
  });

  return Object.entries(monthsData)
    .map(([month, data]) => ({ month, ...data }))
    .slice(-6)
    .reverse();
}

// Fonction utilitaire pour l'heure favorite
function calculateTopHour(sessions: any[]): number {
  const hourCounts: { [key: number]: number } = {};

  sessions.forEach((session) => {
    const hour = new Date(session.finalizedAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  let maxCount = 0;
  let topHour = 12;

  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topHour = parseInt(hour);
    }
  });

  return topHour;
}

// Fonction utilitaire pour les tags populaires
async function calculateTopTags(ownerKey: string) {
  try {
    const tagsData = (await prisma.$queryRaw`
      SELECT 
        UNNEST(ct.tags) as tag,
        COUNT(*) as count
      FROM "CardTemplate" ct
      JOIN "SessionCard" sc ON ct.id = sc."cardTemplateId"
      JOIN "Session" s ON sc."sessionId" = s.id
      WHERE s."ownerKey" = ${ownerKey}
        AND s."finalizedAt" IS NOT NULL
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 10
    `) as Array<{ tag: string; count: bigint }>;

    return tagsData.map((item) => ({
      tag: item.tag,
      count: Number(item.count),
    }));
  } catch (error) {
    console.error("Error calculating top tags:", error);
    return [];
  }
}
