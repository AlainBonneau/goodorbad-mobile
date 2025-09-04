import { Card } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session, SessionCard } from "../types/session";
import type { DailyOutcome } from "../types/daily";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

// Génère ou récupère l'ownerKey unique pour cet utilisateur
async function getOwnerKey(): Promise<string> {
  try {
    let ownerKey = await AsyncStorage.getItem("ownerKey");
    if (!ownerKey) {
      ownerKey =
        "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      await AsyncStorage.setItem("ownerKey", ownerKey);
    }
    return ownerKey;
  } catch (error) {
    return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }
}

async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const ownerKey = await getOwnerKey();

  const headers = {
    "Content-Type": "application/json",
    "x-owner-key": ownerKey,
    ...(options.headers || {}),
  };

  const fullUrl = `${BASE_URL}${path}`;

  try {
    const res = await fetch(fullUrl, {
      headers,
      ...options,
    });

    const text = await res.text();

    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const message =
        data?.error?.message ||
        data?.error ||
        res.statusText ||
        "Request failed";
      throw new Error(`${res.status} ${message}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const api = {
  async createSession(name: string): Promise<{ id: string }> {
    const response = await http<{ success: boolean; data: { id: string } }>(
      `/api/v1/sessions`,
      {
        method: "POST",
        body: JSON.stringify({ name }),
      }
    );
    return { id: response.data.id };
  },

  // Méthode pour récupérer une session par son ID
  async getSession(
    id: string
  ): Promise<{ draws: Card[]; finalPickIndex?: number }> {
    const response = await http<{ success: boolean; data: { session: any } }>(
      `/api/v1/sessions/${id}`
    );
    const session = response.data.session;
    return {
      draws: session.cards || [],
      finalPickIndex: session.final?.pickIndex,
    };
  },

  // Méthode pour piocher une carte
  async draw(id: string): Promise<{ card: Card }> {
    const response = await http<{ success: boolean; data: { card: any } }>(
      `/api/v1/sessions/${id}/draw`,
      {
        method: "POST",
      }
    );

    const backendCard = response.data.card;
    const adaptedCard = {
      id: backendCard.id,
      type: backendCard.type.toLowerCase(),
      label:
        backendCard.labelSnapshot || backendCard.label || "Carte sans texte",
    };

    return {
      card: adaptedCard,
    };
  },

  // Méthode pour finaliser le tirage
  async finalPick(
    id: string,
    index: number
  ): Promise<{ final: Card; pickedIndex: number }> {
    const response = await http<{ success: boolean; data: { final: any } }>(
      `/api/v1/sessions/${id}/finalize`,
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );

    const final = response.data.final;
    return {
      final: {
        id: final.cardId,
        type: final.type.toLowerCase(),
        label: final.label,
      },
      pickedIndex: final.pickIndex,
    };
  },

  // Méthode pour récupérer l'historique des sessions
  async getSessionHistory(
    page = 1,
    limit = 10,
    official?: boolean
  ): Promise<{
    items: any[];
    meta: { page: number; limit: number; total: number; hasNext: boolean };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (official !== undefined) {
      params.append("official", official.toString());
    }

    const response = await http<{
      success: boolean;
      data: { items: any[] };
      meta: { page: number; limit: number; total: number; hasNext: boolean };
    }>(`/api/v1/sessions/history/list?${params}`);

    return {
      items: response.data.items,
      meta: response.meta,
    };
  },

  // Méthode pour récupérer le résultat quotidien
  async getDailyOutcome(): Promise<{ dailyOutcome: DailyOutcome } | null> {
    try {
      const response = await http<{
        success: boolean;
        data: { dailyOutcome: DailyOutcome };
      }>(`/api/v1/sessions/daily-outcome`);

      return response.data;
    } catch (error) {
      return null;
    }
  },

  // Méthode pour récupérer les statistiques
  async getStatistics() {
    try {
      const response = await http<{
        success: boolean;
        data: any;
      }>(`/api/v1/stats/statistics`);

      return response.data;
    } catch (error) {
      console.error("❌ [STATS] Error in getStatistics:", error);
      throw error;
    }
  },

  // Récupérer ou créer la session daily du jour
  async getDailySession(): Promise<{
    session: Session;
    dailyOutcome?: DailyOutcome;
    canPlay: boolean;
    message?: string;
  }> {
    try {
      const response = await http<{
        success: boolean;
        data: {
          session: any;
          dailyOutcome?: DailyOutcome;
          canPlay: boolean;
          message?: string;
        };
      }>(`/api/v1/sessions/daily/session`);

      const sessionData = response.data.session;
      const adaptedSession: Session = {
        id: sessionData.id,
        ownerKey: sessionData.ownerKey || "",
        seed: sessionData.seed || "",
        startedAt: sessionData.startedAt,
        finalizedAt: sessionData.finalizedAt,
        finalCardId: sessionData.finalCardId,
        finalType: sessionData.finalType,
        finalLabel: sessionData.finalLabel,
        finalPickIndex: sessionData.finalPickIndex,
        isOfficialDaily: sessionData.isOfficialDaily || true,
        cards: (sessionData.cards || []).map((card: any, index: number) => ({
          id: card.id,
          index: card.index !== undefined ? card.index : index,
          type: card.type.toUpperCase() as "GOOD" | "BAD",
          labelSnapshot: card.labelSnapshot || card.label || "Carte sans texte",
          randomValue: card.randomValue || Math.random(),
        })),
      };

      return {
        session: adaptedSession,
        dailyOutcome: response.data.dailyOutcome,
        canPlay: response.data.canPlay,
        message: response.data.message,
      };
    } catch (error) {
      console.error("Erreur getDailySession:", error);
      throw error;
    }
  },
};
