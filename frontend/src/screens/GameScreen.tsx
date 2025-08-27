import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import BackgroundSplit from "../components/BackgroundSplit";
import ScreenCard from "../components/ScreenCard";
import Counter from "../components/Counter";
import PrimaryButton from "../components/PrimaryButton";
import FlipCard from "../components/FlipCard";
import FinalCardsGrid from "../components/FinalCardsGrid";
import FinalResult from "../components/FinalResult";
import useGoodBadGame, { MAX_ATTEMPTS } from "../hooks/useGoodBadGame";
import { Link } from "expo-router/build/link/Link";

export default function GameScreen() {
  const g = useGoodBadGame();
  const showFlip =
    !!g.lastCard &&
    g.attempts <= MAX_ATTEMPTS &&
    !g.finalCard &&
    (!g.showFinalCards || g.attempts < MAX_ATTEMPTS);
  const canRevealButton =
    g.attempts === MAX_ATTEMPTS && !g.finalCard && !g.showFinalCards;

  return (
    <BackgroundSplit>
      <ScreenCard>
        <Text className="text-2xl font-extrabold text-center mb-2">
          Bonne ou Mauvaise chance ?
        </Text>
        <Text className="text-sm text-neutral-600 text-center mb-3">
          Tire 5 cartes et choisis-en une au hasard à la fin !
        </Text>

        <Link href="/history" asChild>
          <Pressable className="bg-gray-100 p-2 rounded-lg">
            <Text className="text-gray-700">📋 Historique</Text>
          </Pressable>
        </Link>

        <Link href="/stats" asChild>
          <Pressable className="bg-gray-100 p-2 rounded-lg">
            <Text className="text-gray-700">📊 Statistiques</Text>
          </Pressable>
        </Link>

        <TextInput
          value={g.name}
          onChangeText={g.setName}
          editable={g.canTypeName}
          placeholder="Entre ton prénom"
          onSubmitEditing={g.draw}
          className="border border-neutral-300 rounded-xl px-4 py-2 text-base mb-3"
        />

        <PrimaryButton
          title="Tenter ma chance"
          onPress={g.draw}
          disabled={!g.canDraw}
        />

        <Counter good={g.goodCount} bad={g.badCount} />

        {showFlip && (
          <View key={`flip-${g.flipKey}`} className="mt-4">
            <FlipCard
              isFlipped
              frontLabel="?"
              backText={g.lastCard?.label || ""}
              tint={g.lastCard?.type}
            />
          </View>
        )}

        {canRevealButton && (
          <View className="mt-4">
            <PrimaryButton
              title="Choisir votre carte finale"
              onPress={g.revealFinalChoices}
            />
          </View>
        )}

        {g.showFinalCards && g.attempts === MAX_ATTEMPTS && !g.finalCard && (
          <View className="mt-4">
            <Text className="text-base text-neutral-600 text-center mb-3 font-medium">
              Choisis ta carte finale :
            </Text>
            <FinalCardsGrid
              cards={g.shuffledCards}
              pickedIndex={g.pickedIndex}
              onPick={g.pickFinal}
            />
          </View>
        )}

        {g.finalCard && <FinalResult name={g.name} card={g.finalCard} />}

        {(g.finalCard || g.attempts >= MAX_ATTEMPTS) && (
          <View className="mt-6">
            <PrimaryButton title="Rejouer" onPress={g.reset} />
          </View>
        )}

        {g.error && (
          <Text className="text-red-600 mt-3 text-center">{g.error}</Text>
        )}
      </ScreenCard>
    </BackgroundSplit>
  );
}
