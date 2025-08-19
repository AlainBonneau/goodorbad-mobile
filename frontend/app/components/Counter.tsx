import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Fonts, Spacing } from "../theme";

export default function Counter({ good, bad }: { good: number; bad: number }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.count, { color: Colors.blue }]}>{good}</Text>
      <Text style={styles.sep}>|</Text>
      <Text style={[styles.count, { color: Colors.red }]}>{bad}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.md,
    justifyContent: "center",
  },
  count: { fontSize: 22, fontWeight: "700" },
  sep: { color: Colors.muted, fontSize: 18, marginHorizontal: 4 },
});
