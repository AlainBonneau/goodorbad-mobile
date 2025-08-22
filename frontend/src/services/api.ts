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

    const backendCard = response.data.card;
    const adaptedCard = {
      id: backendCard.id,
      type: backendCard.type.toLowerCase(),
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
};
