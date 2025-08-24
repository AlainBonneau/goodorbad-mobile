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
      <View className="flex-row justify-between items-end h-32">
        {data.map((item, index) => (
          <View key={index} className="items-center flex-1">
            <View className="w-full flex-col justify-end items-center mb-2 h-20">
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
    console.log("🔍 [COMPONENT] loadStatistics called, isRefresh:", isRefresh);
    console.log("🔍 [COMPONENT] Current stats state:", stats);
    console.log("🔍 [COMPONENT] Loading state:", loading);

    try {
      setError(null);
      if (isRefresh) setRefreshing(true);

      console.log("🔍 [COMPONENT] About to call api.getStatistics()...");
      const statisticsData = await api.getStatistics();

      console.log("🔍 [COMPONENT] statisticsData received:", statisticsData);
      console.log("🔍 [COMPONENT] statisticsData type:", typeof statisticsData);
      console.log(
        "🔍 [COMPONENT] statisticsData keys:",
        Object.keys(statisticsData || {})
      );

      setStats(statisticsData);
      console.log("🔍 [COMPONENT] setStats called with:", statisticsData);
    } catch (err: any) {
      console.error("❌ [COMPONENT] Error in loadStatistics:", err);
      console.error("❌ [COMPONENT] Error message:", err.message);
      console.error("❌ [COMPONENT] Error stack:", err.stack);
      setError(err.message || "Impossible de charger les statistiques");
    } finally {
      console.log("🔍 [COMPONENT] Finally block - setting loading to false");
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

  // useEffects pour logger les changements d'état
  useEffect(() => {
    console.log("🔍 [STATE] stats changed:", stats);
  }, [stats]);

  useEffect(() => {
    console.log("🔍 [STATE] loading changed:", loading);
  }, [loading]);

  useEffect(() => {
    console.log("🔍 [STATE] error changed:", error);
  }, [error]);

  useEffect(() => {
    loadStatistics();
  }, []);

  // Log avant le render
  console.log(
    "🔍 [RENDER] About to render - stats:",
    !!stats,
    "loading:",
    loading,
    "error:",
    error
  );

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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {stats && (
            <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
              <Text className="text-lg font-bold mb-4">Vue d'ensemble</Text>

              {/* Première ligne de cartes */}
              <View className="flex-row mb-3">
                <View className="bg-white rounded-xl p-4 flex-1 mr-2 shadow-sm">
                  <Text className="text-sm text-gray-600 mb-2">
                    Total parties
                  </Text>
                  <Text className="text-2xl font-extrabold text-blue-600">
                    {stats.overview.totalSessions}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    sessions jouées
                  </Text>
                </View>

                <View className="bg-white rounded-xl p-4 flex-1 ml-2 shadow-sm">
                  <Text className="text-sm text-gray-600 mb-2">
                    Officielles
                  </Text>
                  <Text className="text-2xl font-extrabold text-amber-600">
                    {stats.overview.officialSessions}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    cartes du jour
                  </Text>
                </View>
              </View>

              {/* Deuxième ligne de cartes */}
              <View className="flex-row">
                <View className="bg-white rounded-xl p-4 flex-1 mr-2 shadow-sm">
                  <Text className="text-sm text-gray-600 mb-2">
                    Série actuelle
                  </Text>
                  <Text className="text-2xl font-extrabold text-green-600">
                    {stats.overview.currentStreak}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    jours en cours
                  </Text>
                </View>

                <View className="bg-white rounded-xl p-4 flex-1 ml-2 shadow-sm">
                  <Text className="text-sm text-gray-600 mb-2">Record</Text>
                  <Text className="text-2xl font-extrabold text-purple-600">
                    {stats.overview.longestStreak}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    meilleure série
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Répartition des résultats */}
          {stats && (
            <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
              <Text className="text-lg font-bold mb-4 text-center">
                Répartition des résultats
              </Text>

              {/* Barre de progression */}
              <View className="h-6 bg-red-200 rounded-xl overflow-hidden mb-3">
                <View
                  className="h-full bg-blue-500 rounded-xl"
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
          )}
        </ScrollView>
      </ScreenCard>
    </BackgroundSplit>
  );
}
