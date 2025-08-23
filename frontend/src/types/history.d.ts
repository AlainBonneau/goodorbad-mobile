export interface HistorySession {
  id: string;
  startedAt: string;
  finalizedAt: string;
  isOfficialDaily: boolean;
  finalType: "GOOD" | "BAD";
  finalLabel: string;
  finalPickIndex: number;
}

export interface HistoryStats {
  total: number;
  good: number;
  bad: number;
  official: number;
}
