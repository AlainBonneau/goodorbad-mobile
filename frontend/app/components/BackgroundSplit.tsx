import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "../theme";

export default function BackgroundSplit({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.left} />
      <View style={styles.right} />
      <View style={styles.separator} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  left: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: "50%",
    backgroundColor: Colors.blue,
  },
  right: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    left: "50%",
    backgroundColor: Colors.red,
  },
  separator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.separator,
    left: "50%",
    transform: [{ translateX: -1.5 }],
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
});
