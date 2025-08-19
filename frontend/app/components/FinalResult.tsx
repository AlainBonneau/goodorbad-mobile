import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Radii, Spacing } from "../theme";
import type { Card } from "../types";

export default function FinalResult({
  name,
  card,
}: {
  name: string;
  card: Card;
}) {
  const isGood = card.type === "good";
  return (
    <View style={styles.block}>
      <Text style={styles.title}>Voici ta carte finale !</Text>
      <View
        style={[
          styles.bigCard,
          { borderColor: isGood ? Colors.blue : Colors.red },
        ]}
      >
        <Text
          style={[styles.text, { color: isGood ? Colors.blue : Colors.red }]}
        >
          {name?.trim() ? `${name}, ` : ""}
          {card.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: Spacing.xl, width: "100%", alignItems: "center" },
  title: {
    fontSize: 16,
    color: Colors.muted,
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  bigCard: {
    backgroundColor: "#fff",
    borderWidth: 3,
    borderRadius: Radii.lg,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
    maxWidth: 520,
  },
  text: { textAlign: "center", fontSize: 18, fontWeight: "700" },
});
