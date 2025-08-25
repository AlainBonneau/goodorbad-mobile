export interface SessionCard {
  id: string;
  index: number;
  type: "GOOD" | "BAD";
  labelSnapshot: string;
  randomValue: number;
}

export interface Session {
  id: string;
  ownerKey: string;
  seed: string;
  startedAt: string;
  finalizedAt?: string;
  finalCardId?: string;
  finalType?: "GOOD" | "BAD";
  finalLabel?: string;
  finalPickIndex?: number;
  isOfficialDaily: boolean;
  cards: SessionCard[];
}
