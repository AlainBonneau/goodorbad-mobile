import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../services/api";
import BackgroundSplit from "../components/BackgroundSplit";
import ScreenCard from "../components/ScreenCard";
import type { Session, SessionCard } from "../types/session";
import type { DailyOutcome, DailyStats } from "../types/daily";

const { width } = Dimensions.get("window");

// Composant pour afficher la carte du jour sélectionnée
const SelectedDailyCard = ({
  card,
  date,
}: {
  card: SessionCard;
  date: string;
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  return (
    <Animated.View
      style={{ transform: [{ scale: pulseAnim }] }}
      className="mb-6"
    >
      <View
        className={`rounded-2xl p-6 shadow-xl border-3 ${
          card.type === "GOOD"
            ? "bg-gradient-to-br from-green-50 to-emerald-100 border-green-400"
            : "bg-gradient-to-br from-red-50 to-rose-100 border-red-400"
        }`}
      >
        {/* Header de la carte */}
        <View className="items-center mb-4">
          <Text className="text-lg font-bold text-gray-700 mb-1">
            🎴 Votre carte du jour
          </Text>
          <Text className="text-sm text-gray-600">
            {new Date(date).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>

        {/* Icône et titre principal */}
        <View className="items-center mb-4">
          <Text className="text-6xl mb-3">
            {card.type === "GOOD" ? "🍀" : "💔"}
          </Text>
          <Text
            className={`text-2xl font-bold text-center ${
              card.type === "GOOD" ? "text-green-700" : "text-red-700"
            }`}
          >
            {card.labelSnapshot}
          </Text>
        </View>

        {/* Message inspirant */}
        <View
          className={`rounded-xl p-4 ${
            card.type === "GOOD"
              ? "bg-green-100 border border-green-200"
              : "bg-red-100 border border-red-200"
          }`}
        >
          <Text
            className={`text-center text-base leading-6 ${
              card.type === "GOOD" ? "text-green-800" : "text-red-800"
            }`}
          >
            {card.type === "GOOD"
              ? "✨ Une belle énergie vous accompagne aujourd'hui ! Profitez de cette guidance positive pour illuminer votre journée."
              : "🛡️ Restez vigilant et gardez confiance. Les défis vous rendent plus fort et vous préparent à de meilleurs jours."}
          </Text>
        </View>

        {/* Badge de type */}
        <View className="items-center mt-4">
          <View
            className={`px-4 py-2 rounded-full ${
              card.type === "GOOD" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            <Text className="text-white font-bold text-sm">
              {card.type === "GOOD"
                ? "🌟 ÉNERGIE POSITIVE"
                : "⚠️ VIGILANCE REQUISE"}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// Composant pour une carte à sélectionner
const SelectableCard = ({
  card,
  index,
  isSelected,
  onSelect,
  isRevealed,
  isDisabled,
}: {
  card: SessionCard;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  isRevealed: boolean;
  isDisabled: boolean;
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    if (!isDisabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!isDisabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const getCardStyle = () => {
    let baseStyle = "bg-white rounded-xl p-6 mb-4 shadow-lg border-2 ";

    if (isDisabled && !isSelected) {
      baseStyle += "opacity-50 border-gray-200";
    } else if (isSelected && isRevealed) {
      baseStyle +=
        card.type === "GOOD"
          ? "border-green-500 bg-green-50"
          : "border-red-500 bg-red-50";
    } else if (isSelected) {
      baseStyle += "border-blue-500 bg-blue-50";
    } else {
      baseStyle += "border-gray-200";
    }

    return baseStyle;
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        className={getCardStyle()}
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-gray-800">
            Carte #{index + 1}
          </Text>
          {isSelected && (
            <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
              <Text className="text-white text-sm font-bold">✓</Text>
            </View>
          )}
        </View>

        {isRevealed ? (
          <View>
            <View className="flex-row items-center mb-3">
              <Text className="text-2xl mr-3">
                {card.type === "GOOD" ? "🍀" : "💔"}
              </Text>
              <Text
                className={`text-xl font-bold ${
                  card.type === "GOOD" ? "text-green-700" : "text-red-700"
                }`}
              >
                {card.labelSnapshot}
              </Text>
            </View>
            <Text className="text-gray-600 leading-6">
              {card.type === "GOOD"
                ? "Une belle énergie vous accompagne aujourd'hui !"
                : "Restez vigilant et gardez confiance, les défis vous rendent plus fort."}
            </Text>
          </View>
        ) : (
          <View className="items-center py-8">
            <Text className="text-6xl mb-4">🎴</Text>
            <Text className="text-gray-500 text-center">Carte mystère</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// Composant pour les statistiques quotidiennes
const DailyStatsComponent = ({
  streak,
  totalDays,
}: {
  streak: number;
  totalDays: number;
}) => (
  <View className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 mb-6">
    <Text className="text-white text-lg font-bold mb-3 text-center">
      Vos statistiques quotidiennes
    </Text>
    <View className="flex-row justify-around">
      <View className="items-center">
        <Text className="text-white text-2xl font-extrabold">{streak}</Text>
        <Text className="text-blue-100 text-sm">Série actuelle</Text>
      </View>
      <View className="w-px bg-blue-300 mx-4" />
      <View className="items-center">
        <Text className="text-white text-2xl font-extrabold">{totalDays}</Text>
        <Text className="text-blue-100 text-sm">Total de jours</Text>
      </View>
    </View>
  </View>
);

export default function DailyCardScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [dailyOutcome, setDailyOutcome] = useState<DailyOutcome | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null
  );
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState<DailyStats>({
    currentStreak: 0,
    totalDays: 0,
  });
  const [canPlayToday, setCanPlayToday] = useState(true);
  const [timeUntilNext, setTimeUntilNext] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  // Calculer le temps restant jusqu'à demain
  const calculateTimeUntilNext = (lastPlayTime: string): string => {
    const now = new Date();

    // Prochaine minuit (début du jour suivant)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow.getTime() - now.getTime();

    if (diff <= 0) return "";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}min`;
  };

  // Fonction pour charger la session daily
  const loadDailySession = async () => {
    try {
      setLoading(true);

      try {
        const todayOutcome = await api.getDailyOutcome();
        if (todayOutcome && todayOutcome.dailyOutcome) {
          setDailyOutcome(todayOutcome.dailyOutcome);
          setCanPlayToday(false);
          setIsRevealed(true);

          // Récupérer la session complète
          const sessionData = await api.getSession(
            todayOutcome.dailyOutcome.sessionId
          );

          // Adapter les données de session
          const adaptedSession: Session = {
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
              type: card.type.toUpperCase() as "GOOD" | "BAD",
              labelSnapshot: card.labelSnapshot || card.label,
              randomValue: Math.random(),
            })),
          };

          setSession(adaptedSession);

          if (sessionData.finalPickIndex !== undefined) {
            setSelectedCardIndex(sessionData.finalPickIndex);
          }

          // Calculer le temps jusqu'à demain
          const nextTime = calculateTimeUntilNext(
            todayOutcome.dailyOutcome.createdAt
          );
          setTimeUntilNext(nextTime);
          setMessage("Vous avez déjà tiré votre carte aujourd'hui !");

          return;
        }
      } catch (error) {
        console.log(
          "Pas de résultat pour aujourd'hui, création d'une nouvelle session"
        );
      }

      // Créer une nouvelle session pour aujourd'hui
      const newSession = await api.createSession(
        "Session quotidienne du " + new Date().toLocaleDateString()
      );

      // Tirer 5 cartes
      const cards: SessionCard[] = [];
      for (let i = 0; i < 5; i++) {
        const drawResult = await api.draw(newSession.id);
        cards.push({
          id: drawResult.card.id,
          index: i,
          type: drawResult.card.type.toUpperCase() as "GOOD" | "BAD",
          labelSnapshot: drawResult.card.label,
          randomValue: Math.random(),
        });
      }

      // Créer l'objet session adapté
      const adaptedSession: Session = {
        id: newSession.id,
        ownerKey: "",
        seed: "",
        startedAt: new Date().toISOString(),
        finalizedAt: undefined,
        finalCardId: undefined,
        finalType: undefined,
        finalLabel: undefined,
        finalPickIndex: undefined,
        isOfficialDaily: true,
        cards,
      };

      setSession(adaptedSession);
      setCanPlayToday(true);
      setMessage(
        "Choisissez votre carte du jour parmi les 5 tirées pour vous !"
      );
    } catch (error) {
      console.error(
        "Erreur lors du chargement de la session quotidienne:",
        error
      );

      if (
        error instanceof Error &&
        error.message.includes("ALREADY_PLAYED_TODAY")
      ) {
        Alert.alert(
          "Déjà joué !",
          "Vous avez déjà tiré votre carte du jour. Revenez demain pour une nouvelle guidance !",
          [{ text: "OK", onPress: () => router.push("/") }]
        );
      } else {
        Alert.alert("Erreur", "Impossible de charger votre carte du jour");
      }
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const statsData = await api.getStatistics();
      if (statsData && statsData.overview) {
        setStats({
          currentStreak: statsData.overview.currentStreak || 0,
          totalDays: statsData.overview.officialSessions || 0,
        });
      }
    } catch (error) {
      console.error("Erreur stats:", error);
      try {
        const history = await api.getSessionHistory(1, 100, true);
        const totalDays = history.items.length;
        setStats({ currentStreak: 0, totalDays });
      } catch (historyError) {
        console.error("Erreur historique:", historyError);
      }
    }
  };

  // Sélectionner une carte
  const handleCardSelect = (index: number) => {
    if (isRevealed || !canPlayToday) return;
    setSelectedCardIndex(index);
  };

  // Finaliser la session avec la carte choisie
  const handleRevealCard = async () => {
    if (selectedCardIndex === null || !session || !canPlayToday) return;

    setIsSubmitting(true);
    try {
      const result = await api.finalPick(session.id, selectedCardIndex);

      const updatedSession: Session = {
        ...session,
        finalizedAt: new Date().toISOString(),
        finalCardId: result.final.id,
        finalType: result.final.type.toUpperCase() as "GOOD" | "BAD",
        finalLabel: result.final.label,
        finalPickIndex: result.pickedIndex,
      };

      setSession(updatedSession);
      setSelectedCardIndex(result.pickedIndex);
      setIsRevealed(true);
      setCanPlayToday(false);
      setMessage(
        "Votre carte du jour a été révélée ! Revenez demain pour une nouvelle guidance ✨"
      );

      // Recharger les stats
      await loadStats();

      // Calculer le temps jusqu'à demain
      const nextTime = calculateTimeUntilNext(new Date().toISOString());
      setTimeUntilNext(nextTime);

      // Afficher un message de succès
      Alert.alert(
        "🎴 Carte révélée !",
        `Votre guidance du jour : "${result.final.label}"\n\nRevenez demain pour une nouvelle carte !`,
        [{ text: "Parfait !" }]
      );
    } catch (error) {
      console.error("Erreur lors de la finalisation:", error);

      if (
        error instanceof Error &&
        error.message.includes("ALREADY_PLAYED_TODAY")
      ) {
        Alert.alert(
          "Déjà joué !",
          "Vous avez déjà tiré votre carte du jour. La page va se recharger.",
          [{ text: "OK", onPress: () => loadDailySession() }]
        );
      } else {
        Alert.alert("Erreur", "Impossible de finaliser votre choix");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Partager le résultat
  const handleShare = () => {
    if (!session || selectedCardIndex === null) return;

    const selectedCard = session.cards[selectedCardIndex];
    Alert.alert(
      "Partager",
      `J'ai tiré "${selectedCard.labelSnapshot}" pour ma carte du jour ! 🎴`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Partager",
          onPress: () => {
            console.log("Partage du résultat");
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadDailySession();
    loadStats();

    // Mettre à jour le compteur toutes les minutes
    const interval = setInterval(() => {
      if (!canPlayToday && dailyOutcome) {
        const newTime = calculateTimeUntilNext(dailyOutcome.createdAt);
        setTimeUntilNext(newTime);

        if (!newTime) {
          loadDailySession();
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <BackgroundSplit>
        <ScreenCard>
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#246BFD" />
            <Text className="mt-4 text-gray-600">
              Préparation de votre carte du jour...
            </Text>
          </View>
        </ScreenCard>
      </BackgroundSplit>
    );
  }

  if (!session) {
    return (
      <BackgroundSplit>
        <ScreenCard>
          <View className="flex-1 justify-center items-center">
            <Text className="text-xl text-gray-600 text-center">
              Impossible de créer votre session quotidienne
            </Text>
            <Pressable
              className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
              onPress={() => router.push("/")}
            >
              <Text className="text-white font-medium">Retour</Text>
            </Pressable>
          </View>
        </ScreenCard>
      </BackgroundSplit>
    );
  }

  return (
    <BackgroundSplit>
      <ScreenCard>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1">
            <Text className="text-2xl font-extrabold text-gray-800">
              Carte du Jour
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              {getCurrentDate()}
            </Text>
          </View>
          <Pressable
            className="bg-gray-100 px-4 py-2 rounded-lg"
            onPress={() => router.push("/")}
          >
            <Text className="text-gray-700 font-medium">Retour</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Statistiques */}
          <DailyStatsComponent
            streak={stats.currentStreak}
            totalDays={stats.totalDays}
          />

          {/* Carte du jour sélectionnée - affichée en grand si déjà révélée */}
          {isRevealed && selectedCardIndex !== null && session && (
            <SelectedDailyCard
              card={session.cards[selectedCardIndex]}
              date={session.startedAt}
            />
          )}

          {/* Question du jour - cachée si carte déjà révélée */}
          {!isRevealed && (
            <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
              <Text className="text-lg font-bold text-center text-gray-800 mb-2">
                Votre guidance du jour
              </Text>
              <Text className="text-base text-gray-600 text-center leading-6">
                Quelle énergie vous accompagnera aujourd'hui ? Choisissez une
                carte et découvrez votre message.
              </Text>
            </View>
          )}

          {/* Message dynamique */}
          {message && (
            <View
              className={`rounded-xl p-4 mb-6 border ${
                canPlayToday
                  ? "bg-blue-50 border-blue-200"
                  : "bg-orange-50 border-orange-200"
              }`}
            >
              <Text
                className={`font-medium text-center ${
                  canPlayToday ? "text-blue-800" : "text-orange-800"
                }`}
              >
                {canPlayToday ? "🎴" : "✨"} {message}
              </Text>
            </View>
          )}

          {/* Affichage du temps restant */}
          {!canPlayToday && timeUntilNext && (
            <View className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl p-4 mb-6 border border-orange-200">
              <Text className="text-orange-800 font-bold text-center mb-2">
                ⏳ Prochaine carte disponible dans :
              </Text>
              <Text className="text-orange-700 text-xl font-bold text-center">
                {timeUntilNext}
              </Text>
            </View>
          )}

          {/* Section "Autres cartes" si carte déjà révélée */}
          {isRevealed && (
            <View className="mb-4">
              <Text className="text-lg font-bold text-gray-700 mb-3 text-center">
                Les autres cartes de cette session
              </Text>
              <Text className="text-sm text-gray-500 text-center mb-4">
                Voici ce que contenaient les autres cartes aujourd'hui
              </Text>
            </View>
          )}

          {/* Cartes */}
          <View className="mb-6">
            {session.cards.map((card, index) => (
              <SelectableCard
                key={card.id}
                card={card}
                index={index}
                isSelected={selectedCardIndex === index}
                onSelect={() => handleCardSelect(index)}
                isRevealed={isRevealed}
                isDisabled={
                  (!canPlayToday && selectedCardIndex !== index) ||
                  (isRevealed && selectedCardIndex !== index)
                }
              />
            ))}
          </View>

          {/* Boutons d'action */}
          <View className="pb-6">
            {!isRevealed && canPlayToday ? (
              <Pressable
                className={`rounded-xl py-4 px-6 ${
                  selectedCardIndex !== null ? "bg-blue-500" : "bg-gray-300"
                }`}
                onPress={handleRevealCard}
                disabled={selectedCardIndex === null || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-lg font-bold text-center">
                    Révéler ma carte du jour ✨
                  </Text>
                )}
              </Pressable>
            ) : !canPlayToday ? (
              <View className="space-y-3">
                <View className="bg-gray-100 rounded-xl py-4 px-6 mb-3">
                  <Text className="text-gray-600 text-lg font-bold text-center">
                    Revenez demain pour une nouvelle carte 🌅
                  </Text>
                </View>
                <Pressable
                  className="bg-blue-500 rounded-xl py-4 px-6"
                  onPress={() => router.push("/")}
                >
                  <Text className="text-white text-lg font-bold text-center">
                    Retour à l'accueil
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="space-y-3">
                <Pressable
                  className="bg-purple-500 rounded-xl py-4 px-6 mb-3"
                  onPress={handleShare}
                >
                  <Text className="text-white text-lg font-bold text-center">
                    Partager mon résultat 📤
                  </Text>
                </Pressable>

                <Pressable
                  className="bg-gray-500 rounded-xl py-4 px-6"
                  onPress={() => router.push("/statistics")}
                >
                  <Text className="text-white text-lg font-bold text-center">
                    Voir mes statistiques 📊
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </ScreenCard>
    </BackgroundSplit>
  );
}
