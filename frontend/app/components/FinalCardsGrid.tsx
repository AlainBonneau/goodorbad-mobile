import React from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { Colors, Radii, Spacing } from "../theme";
import type { Card } from "../types";

export default function FinalCardsGrid({
  cards,
  pickedIndex,
  onPick,
}: {
  cards: Card[];
  pickedIndex: number | null;
  onPick: (i: number) => void;
}) {
  return (
    <View style={styles.wrap}>
      {cards.map((c, i) => {
        const disabled = pickedIndex !== null && pickedIndex !== i;
        const picked = pickedIndex === i;
        return (
          <Pressable
            key={c.id + i}
            onPress={() => onPick(i)}
            disabled={!!pickedIndex}
            style={({ pressed }) => [
              styles.card,
              disabled && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.inner,
                picked && styles.picked,
                { borderColor: Colors.border },
              ]}
            >
              <Text style={styles.front}>??</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: Spacing.md,
    rowGap: Spacing.md,
  },
  card: { width: 68, height: 90 },
  inner: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: Radii.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.2,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  front: { fontSize: 24, color: "#BBB", fontWeight: "800" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  picked: { zIndex: 2 },
});
