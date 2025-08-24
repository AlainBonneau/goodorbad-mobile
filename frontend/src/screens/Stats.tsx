import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Link } from "expo-router";
import { api } from "../services/api";
import BackgroundSplit from "../components/BackgroundSplit";
import ScreenCard from "../components/ScreenCard";
import type { HistorySession } from "../types/history";
import type { StatisticsData } from "../types/stats";

const { width } = Dimensions.get("window");

// Composant pour une carte de statistique
const StatCard = ({
  title,
  value,
  subtitle,
  colorClass = "text-blue-600",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  colorClass?: string;
}) => (
  <View className="bg-white rounded-xl p-4 flex-1 mx-1 shadow-sm">
    <Text className="text-sm text-gray-600 mb-2">{title}</Text>
    <Text className={`text-2xl font-extrabold ${colorClass}`}>{value}</Text>
    {subtitle && <Text className="text-xs text-gray-500 mt-1">{subtitle}</Text>}
  </View>
);

// Composant pour le graphique mensuel simple
const MonthlyChart = ({ data }: { data: StatisticsData["monthlyData"] }) => {
  if (!data.length) return null;

  const maxValue = Math.max(...data.map((d) => d.total));

  return (
    <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
      <Text className="text-lg font-bold mb-4 text-center">
        Évolution mensuelle
      </Text>
      <View
        className="flex-row justify-between items-end"
        style={{ height: 120 }}
      >
        {data.map((item, index) => (
          <View key={index} className="items-center flex-1">
            <View className="w-full flex-col justify-end items-center mb-2">
              {/* Barre pour les bonnes cartes */}
              <View
                className="bg-blue-500 w-6 rounded-t-sm"
                style={{
                  height: Math.max(2, (item.good / maxValue) * 80),
                }}
              />
              {/* Barre pour les mauvaises cartes */}
              <View
                className="bg-red-500 w-6 rounded-b-sm"
                style={{
                  height: Math.max(2, (item.bad / maxValue) * 80),
                }}
              />
            </View>
            <Text className="text-xs text-gray-600 text-center">
              {item.month}
            </Text>
            <Text className="text-xs font-bold text-gray-800">
              {item.total}
            </Text>
          </View>
        ))}
      </View>
      <View className="flex-row justify-center mt-2 space-x-4">
        <View className="flex-row items-center">
          <View className="w-3 h-3 bg-blue-500 rounded-sm mr-1" />
          <Text className="text-xs text-gray-600">Bonnes</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 bg-red-500 rounded-sm mr-1" />
          <Text className="text-xs text-gray-600">Mauvaises</Text>
        </View>
      </View>
    </View>
  );
};

// Composant pour les sessions récentes
const RecentSessions = ({ sessions }: { sessions: HistorySession[] }) => {
  if (!sessions.length) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
      <Text className="text-lg font-bold mb-4">Derniers tirages</Text>
      {sessions.slice(0, 5).map((session) => (
        <View
          key={session.id}
          className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
        >
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-1">
              <Text className="text-lg mr-2">
                {session.finalType === "GOOD" ? "🍀" : "💔"}
              </Text>
              <Text
                className={`font-medium ${
                  session.finalType === "GOOD"
                    ? "text-blue-700"
                    : "text-red-700"
                }`}
              >
                {session.finalType === "GOOD" ? "Bonne" : "Mauvaise"}
              </Text>
              {session.isOfficialDaily && (
                <View className="ml-2 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Text className="text-amber-700 text-xs font-medium">
                    ⭐ Officielle
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-gray-600 text-sm" numberOfLines={1}>
              "{session.finalLabel}"
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              {formatDate(session.finalizedAt)}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-400 text-xs">Carte</Text>
            <Text className="font-bold text-gray-600">
              #{session.finalPickIndex + 1}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default function StatisticsScreen() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) setRefreshing(true);

      // Charger l'historique complet pour calculer les stats
      const historyResponse = await api.getSessionHistory(1, 100);
      const sessions = historyResponse.items;

      // Calculer les statistiques
      const totalSessions = sessions.length;
      const officialSessions = sessions.filter((s) => s.isOfficialDaily).length;
      const goodSessions = sessions.filter((s) => s.finalType === "GOOD");
      const badSessions = sessions.filter((s) => s.finalType === "BAD");

      // Calculer les streaks (séries de jours consécutifs)
      const officialSessionsByDate = sessions
        .filter((s) => s.isOfficialDaily)
        .sort(
          (a, b) =>
            new Date(b.finalizedAt).getTime() -
            new Date(a.finalizedAt).getTime()
        );

      const currentStreak = calculateCurrentStreak(officialSessionsByDate);
      const longestStreak = calculateLongestStreak(officialSessionsByDate);

      // Données mensuelles
      const monthlyData = calculateMonthlyData(sessions);

      // Heure favorite (approximative)
      const topHour = calculateTopHour(sessions);

      const statisticsData: StatisticsData = {
        overview: {
          totalSessions,
          officialSessions,
          currentStreak,
          longestStreak,
          goodPercentage:
            totalSessions > 0
              ? Math.round((goodSessions.length / totalSessions) * 100)
              : 0,
          badPercentage:
            totalSessions > 0
              ? Math.round((badSessions.length / totalSessions) * 100)
              : 0,
        },
        monthlyData,
        recentSessions: sessions.slice(0, 10),
        topHour,
        averageCardsPerSession: 5, // Toujours 5 cartes par session dans votre système
      };

      setStats(statisticsData);
    } catch (err: any) {
      setError(err.message || "Impossible de charger les statistiques");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fonctions utilitaires pour calculer les statistiques
  const calculateCurrentStreak = (
    officialSessions: HistorySession[]
  ): number => {
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
  };

  const calculateLongestStreak = (
    officialSessions: HistorySession[]
  ): number => {
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
  };

  const calculateMonthlyData = (sessions: HistorySession[]) => {
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
      .slice(-6); // 6 derniers mois
  };

  const calculateTopHour = (sessions: HistorySession[]): number => {
    const hourCounts: { [key: number]: number } = {};

    sessions.forEach((session) => {
      const hour = new Date(session.finalizedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    let maxCount = 0;
    let topHour = 12; // valeur par défaut

    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topHour = parseInt(hour);
      }
    });

    return topHour;
  };

  const onRefresh = () => {
    loadStatistics(true);
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  if (loading && !stats) {
    return (
      <BackgroundSplit>
        <ScreenCard>
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#246BFD" />
            <Text className="mt-4 text-gray-600">
              Chargement des statistiques...
            </Text>
          </View>
        </ScreenCard>
      </BackgroundSplit>
    );
  }

  return (
    <BackgroundSplit>
      <ScreenCard>
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-extrabold">Statistiques</Text>
          <Link href="/" asChild>
            <Pressable className="bg-gray-100 px-4 py-2 rounded-lg">
              <Text className="text-gray-700 font-medium">Retour</Text>
            </Pressable>
          </Link>
        </View>

        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View className="mb-4 p-4 bg-red-50 rounded-xl">
              <Text className="text-red-600 text-center mb-2">{error}</Text>
              <Pressable
                onPress={() => loadStatistics(true)}
                className="bg-red-100 px-4 py-2 rounded-lg self-center"
              >
                <Text className="text-red-600 font-medium">Réessayer</Text>
              </Pressable>
            </View>
          )}

          {stats && (
            <>
              {/* Vue d'ensemble - Grille 2x2 */}
              <View className="mb-6">
                <Text className="text-lg font-bold mb-4">Vue d'ensemble</Text>
                <View className="flex-row mb-3">
                  <StatCard
                    title="Total parties"
                    value={stats.overview.totalSessions}
                    subtitle="sessions jouées"
                    colorClass="text-blue-600"
                  />
                  <StatCard
                    title="Officielles"
                    value={stats.overview.officialSessions}
                    subtitle="cartes du jour"
                    colorClass="text-amber-600"
                  />
                </View>
                <View className="flex-row">
                  <StatCard
                    title="Série actuelle"
                    value={`${stats.overview.currentStreak} jours`}
                    subtitle="en cours"
                    colorClass="text-green-600"
                  />
                  <StatCard
                    title="Record"
                    value={`${stats.overview.longestStreak} jours`}
                    subtitle="meilleure série"
                    colorClass="text-purple-600"
                  />
                </View>
              </View>

              {/* Répartition des résultats */}
              <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                <Text className="text-lg font-bold mb-4 text-center">
                  Répartition des résultats
                </Text>

                {/* Barre de progression */}
                <View className="h-6 bg-red-100 rounded-full overflow-hidden mb-3">
                  <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${stats.overview.goodPercentage}%` }}
                  />
                </View>

                {/* Statistiques textuelles */}
                <View className="flex-row justify-around">
                  <View className="items-center">
                    <Text className="text-2xl font-extrabold text-blue-600">
                      {stats.overview.goodPercentage}%
                    </Text>
                    <Text className="text-sm text-gray-600">Bonnes cartes</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-extrabold text-red-600">
                      {stats.overview.badPercentage}%
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Mauvaises cartes
                    </Text>
                  </View>
                </View>
              </View>

              {/* Graphique mensuel */}
              <MonthlyChart data={stats.monthlyData} />

              {/* Sessions récentes */}
              <RecentSessions sessions={stats.recentSessions} />

              {/* Informations supplémentaires */}
              <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                <Text className="text-lg font-bold mb-4">Habitudes</Text>
                <View className="space-y-3">
                  <Text className="text-gray-700 text-base">
                    🎯 Moyenne de {stats.averageCardsPerSession} cartes par
                    session
                  </Text>
                  <Text className="text-gray-700 text-base">
                    ⏰ Heure favorite: {stats.topHour}h00
                  </Text>
                  {stats.overview.totalSessions > 0 && (
                    <Text className="text-gray-700 text-base">
                      📊 Ratio officiel:{" "}
                      {Math.round(
                        (stats.overview.officialSessions /
                          stats.overview.totalSessions) *
                          100
                      )}
                      %
                    </Text>
                  )}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </ScreenCard>
    </BackgroundSplit>
  );
}
