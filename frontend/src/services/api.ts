import { Card } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  console.log("🔍 API Request Debug:");
  console.log("- URL:", fullUrl);
  console.log("- Method:", options.method || "GET");
  console.log("- Headers:", headers);
  console.log("- Body:", options.body);
  console.log("- BASE_URL from env:", process.env.EXPO_PUBLIC_API_BASE_URL);

  try {
    const res = await fetch(fullUrl, {
      headers,
      ...options,
    });

    console.log("🔍 Response status:", res.status);
    console.log("🔍 Response ok:", res.ok);

    const text = await res.text();
    console.log("🔍 Response text:", text);

    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const message =
        data?.error?.message ||
        data?.error ||
        res.statusText ||
        "Request failed";
      console.log("❌ Request failed:", message);
      throw new Error(`${res.status} ${message}`);
    }

    console.log("✅ Request successful:", data);
    return data;
  } catch (error) {
    console.log("❌ Network error:", error);
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

  async draw(id: string): Promise<{ card: Card }> {
    const response = await http<{ success: boolean; data: { card: any } }>(
      `/api/v1/sessions/${id}/draw`,
      {
        method: "POST",
      }
    );

    console.log("🔍 Raw backend card response:", response.data.card);

    // Adapte la réponse backend au format attendu par le frontend
    const backendCard = response.data.card;
    const adaptedCard = {
      id: backendCard.id,
      type: backendCard.type.toLowerCase(), // "GOOD" -> "good"
      label:
        backendCard.labelSnapshot || backendCard.label || "Carte sans texte",
    };

    console.log("🔍 Adapted card for frontend:", adaptedCard);

    return {
      card: adaptedCard,
    };
  },

  async finalPick(
    id: string,
    index: number
  ): Promise<{ final: Card; pickedIndex: number }> {
    const response = await http<{ success: boolean; data: { final: any } }>(
      `/api/v1/sessions/${id}/finalize`,
      {
        method: "POST",
        body: JSON.stringify({}), // N'envoie pas l'index, laisse le backend choisir
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

  async getDailyOutcome(): Promise<{ dailyOutcome: any } | null> {
    try {
      // Utiliser l'endpoint correct selon votre route
      const response = await http<{
        success: boolean;
        data: any;
      }>(`/api/v1/sessions/daily-outcome`); // ou `/api/v1/sessions/daily/daily-outcome` selon votre route

      return response.data;
    } catch (error) {
      console.log("Pas de daily outcome trouvé:", error);
      return null;
    }
  },

  // Méthode pour récupérer les statistiques
  async getStatistics() {
    console.log("📊 [STATS] Starting getStatistics...");

    try {
      const response = await http<{
        success: boolean;
        data: any;
      }>(`/api/v1/stats/statistics`);

      console.log(
        "📊 [STATS] Response received:",
        JSON.stringify(response, null, 2)
      );
      return response.data;
    } catch (error) {
      console.error("❌ [STATS] Error in getStatistics:", error);
      throw error;
    }
  },

  // Méthode pour récupérer la carte du jour
  async getDailyCard(): Promise<Card | null> {
    try {
      const response = await http<{
        success: boolean;
        data: { card: Card };
      }>(`/api/v1/sessions/:id/daily-outcome`);

      return response.data.card;
    } catch (error) {
      return null;
    }
  },

  async getDailySession(): Promise<{
    session: Session;
    dailyOutcome?: DailyOutcome;
    canPlay: boolean;
  }> {
    try {
      const todayOutcome = await this.getDailyOutcome();

      if (todayOutcome?.dailyOutcome) {
        const sessionData = await this.getSession(
          todayOutcome.dailyOutcome.sessionId
        );

        const session = {
          id: todayOutcome.dailyOutcome.sessionId,
          ownerKey: "",
          seed: "",
          startedAt: todayOutcome.dailyOutcome.createdAt,
          finalizedAt: todayOutcome.dailyOutcome.createdAt,
          finalCardId: todayOutcome.dailyOutcome.finalCardId,
          finalType: todayOutcome.dailyOutcome.finalType,
          finalLabel: todayOutcome.dailyOutcome.finalLabel,
          finalPickIndex: sessionData.finalPickIndex,
          isOfficialDaily: true,
          cards: sessionData.draws.map((card: any, index: number) => ({
            id: card.id,
            index,
            type: card.type.toUpperCase(),
            labelSnapshot: card.label,
            randomValue: Math.random(),
          })),
        };

        return {
          session,
          dailyOutcome: todayOutcome.dailyOutcome,
          canPlay: false,
        };
      }

      const newSession = await this.createSession(
        "Session quotidienne du " + new Date().toLocaleDateString()
      );

      // Tirer les 5 cartes
      const cards = [];
      for (let i = 0; i < 5; i++) {
        const drawResult = await this.draw(newSession.id);
        cards.push({
          id: drawResult.card.id,
          index: i,
          type: drawResult.card.type.toUpperCase(),
          labelSnapshot: drawResult.card.label,
          randomValue: Math.random(),
        });
      }

      const session = {
        id: newSession.id,
        ownerKey: "",
        seed: "",
        startedAt: new Date().toISOString(),
        finalizedAt: null,
        finalCardId: null,
        finalType: null,
        finalLabel: null,
        finalPickIndex: null,
        isOfficialDaily: true,
        cards,
      };

      return {
        session,
        canPlay: true,
      };
    } catch (error) {
      console.error("Erreur getDailySession:", error);
      throw error;
    }
  },
};

// Finir plus tard
