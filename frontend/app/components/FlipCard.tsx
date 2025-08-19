import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Colors, Radii } from "../theme";
import type { CardType } from "../types";

interface Props {
  width?: number | string;
  height?: number;
  isFlipped: boolean; // when true -> animate to back side
  frontLabel?: string; // default "?"
  backText: string; // card message
  tint?: CardType | undefined; // controls border + text color
  onAnimationEnd?: () => void;
}

export default function FlipCard({
  width = "100%",
  height = 155,
  isFlipped,
  frontLabel = "?",
  backText,
  tint,
  onAnimationEnd,
}: Props) {
  const prog = useRef(new Animated.Value(0)).current; // 0: front, 1: back

  useEffect(() => {
    Animated.timing(prog, {
      toValue: isFlipped ? 1 : 0,
      duration: 800,
      useNativeDriver: true,
      easing: Easing.bezier(0.63, 0.04, 0.27, 1.28),
    }).start(({ finished }) => finished && onAnimationEnd?.());
  }, [isFlipped]);

  const rotateFront = prog.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const rotateBack = prog.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const borderColor =
    tint === "good" ? Colors.blue : tint === "bad" ? Colors.red : Colors.border;
  const textColor =
    tint === "good" ? Colors.blue : tint === "bad" ? Colors.red : Colors.text;

  return (
    <View style={[styles.container, { width, height }]}>
      <Animated.View
        style={[
          styles.card,
          styles.front,
          {
            borderColor,
            transform: [{ perspective: 1000 }, { rotateY: rotateFront }],
          },
        ]}
      >
        <Text style={[styles.frontMark, { color: "#BBB" }]}>{frontLabel}</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.card,
          styles.back,
          {
            borderColor,
            transform: [{ perspective: 1000 }, { rotateY: rotateBack }],
          },
        ]}
      >
        <Text style={[styles.backText, { color: textColor }]}>{backText}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative" },
  card: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderRadius: Radii.lg,
    borderWidth: 2.3,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
    backfaceVisibility: "hidden",
    paddingHorizontal: 16,
  },
  front: { backgroundColor: "#F5F6FA" },
  back: { transform: [{ rotateY: "180deg" }] },
  frontMark: { fontSize: 36, fontWeight: "800", letterSpacing: 2 },
  backText: { fontSize: 18, fontWeight: "700", textAlign: "center" },
});
