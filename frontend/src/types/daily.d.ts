export interface DailyOutcome {
  id: string;
  ownerKey: string;
  date: string;
  sessionId: string;
  finalCardId: string;
  finalType: "GOOD" | "BAD";
  finalLabel: string;
  createdAt: string;
}

export interface DailyStats {
  currentStreak: number;
  totalDays: number;
}

export interface DailySessionResponse {
  session: Session;
  dailyOutcome?: DailyOutcome;
  canPlay: boolean;
  message?: string;
}
