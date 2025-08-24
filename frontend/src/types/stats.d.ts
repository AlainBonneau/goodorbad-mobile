export interface StatisticsData {
  overview: {
    totalSessions: number;
    officialSessions: number;
    currentStreak: number;
    longestStreak: number;
    goodPercentage: number;
    badPercentage: number;
  };
  monthlyData: Array<{
    month: string;
    good: number;
    bad: number;
    total: number;
  }>;
  recentSessions: HistorySession[];
  topHour: number;
  averageCardsPerSession: number;
}
