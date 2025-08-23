import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Link } from "expo-router";
import { api } from "../services/api";
import BackgroundSplit from "../components/BackgroundSplit";
import ScreenCard from "../components/ScreenCard";
import type { HistorySession, HistoryStats } from "../types/history";

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    total: 0,
    good: 0,
    bad: 0,
    official: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadHistory = async (pageNum = 1, refresh = false) => {
    try {
      setError(null);
      if (refresh) setRefreshing(true);

      const response = await api.getSessionHistory(pageNum, 20);

      if (refresh || pageNum === 1) {
        setSessions(response.items);
      } else {
        setSessions((prev) => [...prev, ...response.items]);
      }

      setHasMore(response.meta.hasNext);

      // Calcul des stats
      const allSessions =
        pageNum === 1 ? response.items : sessions.concat(response.items);
      const newStats = {
        total: response.meta.total,
        good: allSessions.filter((s) => s.finalType === "GOOD").length,
        bad: allSessions.filter((s) => s.finalType === "BAD").length,
        official: allSessions.filter((s) => s.isOfficialDaily).length,
      };
      setStats(newStats);
    } catch (err: any) {
      setError(err.message || "Impossible de charger l'historique");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
      loadHistory(page + 1);
    }
  };

  const onRefresh = () => {
    setPage(1);
    loadHistory(1, true);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCardStyle = (type: "GOOD" | "BAD", isOfficial: boolean) => {
    const baseStyle =
      "flex-row items-center justify-between p-4 rounded-xl mb-3";
    const typeStyle =
      type === "GOOD"
        ? "bg-blue-50 border-l-4 border-blue-500"
        : "bg-red-50 border-l-4 border-red-500";
    const officialStyle = isOfficial ? "shadow-md" : "";

    return `${baseStyle} ${typeStyle} ${officialStyle}`;
  };

  const getCardTextColor = (type: "GOOD" | "BAD") => {
    return type === "GOOD" ? "text-blue-700" : "text-red-700";
  };

  if (loading && sessions.length === 0) {
    return (
      <BackgroundSplit>
        <ScreenCard>
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#246BFD" />
            <Text className="mt-4 text-gray-600">
              Chargement de l'historique...
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
          <Text className="text-2xl font-extrabold">Historique</Text>
          <Link href="/" asChild>
            <Pressable className="bg-gray-100 px-4 py-2 rounded-lg">
              <Text className="text-gray-700 font-medium">Retour</Text>
            </Pressable>
          </Link>
        </View>

        {/* Statistiques */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <Text className="text-lg font-bold mb-3 text-center">
            Vos statistiques
          </Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-extrabold text-gray-800">
                {stats.total}
              </Text>
              <Text className="text-sm text-gray-600">Parties</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-extrabold text-blue-600">
                {stats.good}
              </Text>
              <Text className="text-sm text-gray-600">Bonnes</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-extrabold text-red-600">
                {stats.bad}
              </Text>
              <Text className="text-sm text-gray-600">Mauvaises</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-extrabold text-amber-600">
                {stats.official}
              </Text>
              <Text className="text-sm text-gray-600">Officielles</Text>
            </View>
          </View>

          {stats.total > 0 && (
            <View className="mt-4 pt-4 border-t border-gray-200">
              <Text className="text-center text-gray-600">
                Taux de bonnes cartes :{" "}
                {((stats.good / stats.total) * 100).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        {/* Liste des sessions */}
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } =
              nativeEvent;
            if (
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 20
            ) {
              loadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {sessions.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-gray-500 text-center">
                Aucune partie terminée trouvée.{"\n"}
                Commencez votre première partie !
              </Text>
              <Link href="/" asChild>
                <Pressable className="mt-4 bg-blue-500 px-6 py-3 rounded-lg">
                  <Text className="text-white font-bold">Nouvelle partie</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <>
              {sessions.map((session, index) => (
                <View
                  key={session.id}
                  className={getCardStyle(
                    session.finalType,
                    session.isOfficialDaily
                  )}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Text
                        className={`font-bold text-lg ${getCardTextColor(
                          session.finalType
                        )}`}
                      >
                        {session.finalType === "GOOD" ? "🍀" : "💔"}
                        {session.finalType === "GOOD"
                          ? " Bonne carte"
                          : " Mauvaise carte"}
                      </Text>
                      {session.isOfficialDaily && (
                        <View className="ml-2 bg-amber-100 px-2 py-1 rounded-full">
                          <Text className="text-amber-700 text-xs font-medium">
                            ⭐ Officielle
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      className="text-gray-800 font-medium mb-2"
                      numberOfLines={2}
                    >
                      "{session.finalLabel}"
                    </Text>

                    <Text className="text-gray-500 text-sm">
                      {formatDate(session.finalizedAt)}
                    </Text>
                  </View>

                  <View className="ml-4 items-center">
                    <Text className="text-gray-400 text-sm">Carte</Text>
                    <Text className="text-lg font-bold text-gray-600">
                      #{session.finalPickIndex + 1}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Indicateur de chargement pour plus de contenu */}
              {loading && sessions.length > 0 && (
                <View className="py-4 items-center">
                  <ActivityIndicator color="#246BFD" />
                  <Text className="mt-2 text-gray-500">Chargement...</Text>
                </View>
              )}

              {!hasMore && sessions.length > 0 && (
                <View className="py-4">
                  <Text className="text-center text-gray-500">
                    🏁 Vous avez vu toutes vos parties
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {error && (
          <View className="mt-4 p-4 bg-red-50 rounded-lg">
            <Text className="text-red-600 text-center">{error}</Text>
            <Pressable
              onPress={() => loadHistory(1, true)}
              className="mt-2 bg-red-100 px-4 py-2 rounded-lg self-center"
            >
              <Text className="text-red-600 font-medium">Réessayer</Text>
            </Pressable>
          </View>
        )}
      </ScreenCard>
    </BackgroundSplit>
  );
}
