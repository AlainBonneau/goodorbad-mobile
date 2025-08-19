import { Card, Session } from "../types";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3001";

async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data?.error || res.statusText || "Request failed";
    throw new Error(`${res.status} ${message}`);
  }
  return data as T;
}

export const api = {
  async createSession(name: string): Promise<{ id: string }> {
    return http<{ id: string }>(`/api/v1/sessions`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  async getSession(
    id: string
  ): Promise<{ draws: Card[]; finalPickIndex?: number }> {
    return http(`/api/v1/sessions/${id}`);
  },

  async draw(id: string): Promise<{ card: Card }> {
    return http(`/api/v1/sessions/${id}/draw`, { method: "POST" });
  },

  async finalPick(
    id: string,
    index: number
  ): Promise<{ final: Card; pickedIndex: number }> {
    return http(`/api/v1/sessions/${id}/final-pick`, {
      method: "POST",
      body: JSON.stringify({ index }),
    });
  },
};
