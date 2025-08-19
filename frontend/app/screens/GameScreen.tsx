import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import BackgroundSplit from "../components/BackgroundSplit";
import ScreenCard from "../components/ScreenCard";
import Counter from "../components/Counter";
import PrimaryButton from "../components/PrimaryButton";
import FlipCard from "../components/FlipCard";
import FinalCardsGrid from "../components/FinalCardsGrid";
import FinalResult from "../components/FinalResult";
import useGoodBadGame, { MAX_ATTEMPTS } from "../hooks/useGoodBadGame";
import { Colors, Fonts, Spacing } from "../theme";

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
        <Text style={styles.title}>Bonne ou Mauvaise chance ?</Text>
        <Text style={styles.subtitle}>
          Tire 5 cartes et choisis-en une au hasard à la fin !
        </Text>

        <TextInput
          value={g.name}
          onChangeText={g.setName}
          editable={g.canTypeName}
          placeholder="Entre ton prénom"
          onSubmitEditing={g.draw}
          style={styles.input}
        />

        <PrimaryButton
          title="Tenter ma chance"
          onPress={g.draw}
          disabled={!g.canDraw}
        />

        <Counter good={g.goodCount} bad={g.badCount} />

        {showFlip && (
          <View key={`flip-${g.flipKey}`} style={{ marginTop: Spacing.lg }}>
            <FlipCard
              isFlipped
              frontLabel="?"
              backText={g.lastCard?.text || ""}
              tint={g.lastCard?.type}
            />
          </View>
        )}

        {canRevealButton && (
          <View style={{ marginTop: Spacing.lg }}>
            <PrimaryButton
              title="Choisir votre carte finale"
              onPress={g.revealFinalChoices}
            />
          </View>
        )}

        {g.showFinalCards && g.attempts === MAX_ATTEMPTS && !g.finalCard && (
          <View style={{ marginTop: Spacing.lg }}>
            <Text style={styles.finalChoice}>Choisis ta carte finale :</Text>
            <FinalCardsGrid
              cards={g.shuffledCards}
              pickedIndex={g.pickedIndex}
              onPick={g.pickFinal}
            />
          </View>
        )}

        {g.finalCard && <FinalResult name={g.name} card={g.finalCard} />}

        {(g.finalCard || g.attempts >= MAX_ATTEMPTS) && (
          <View style={{ marginTop: Spacing.xl }}>
            <PrimaryButton title="Rejouer" onPress={g.reset} />
          </View>
        )}

        {g.error && <Text style={styles.error}>{g.error}</Text>}
      </ScreenCard>
    </BackgroundSplit>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    textAlign: "center",
    fontWeight: "800",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Fonts.small,
    color: Colors.muted,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  finalChoice: {
    fontSize: 16,
    color: Colors.muted,
    marginBottom: Spacing.md,
    textAlign: "center",
    fontWeight: "500",
  },
  error: { color: Colors.red, marginTop: Spacing.md, textAlign: "center" },
});
