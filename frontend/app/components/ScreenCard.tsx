import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors, Radii, Spacing } from "../theme";

export default function ScreenCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: "90%",
    maxWidth: 680,
    backgroundColor: Colors.panel,
    borderRadius: Radii.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
});
