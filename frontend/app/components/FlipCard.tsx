import React, { useEffect, useRef } from "react";
import { Animated, Easing, Text, View, DimensionValue } from "react-native";
import type { CardType } from "../types";

interface Props {
  width?: DimensionValue;
  height?: number;
  isFlipped: boolean;
  frontLabel?: string;
  backText: string;
  tint?: CardType | undefined;
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
  const prog = useRef(new Animated.Value(0)).current;

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
    tint === "good" ? "#246BFD" : tint === "bad" ? "#E63946" : "#BBBBBB";
  const textColor =
    tint === "good" ? "#246BFD" : tint === "bad" ? "#E63946" : "#111111";

  return (
    <View style={{ width, height }} className="relative">
      <Animated.View
        style={{
          transform: [{ perspective: 1000 }, { rotateY: rotateFront }],
          borderColor,
        }}
        className="absolute inset-0 bg-neutral-100 rounded-2xl border-2.5 items-center justify-center shadow-xl"
      >
        <Text className="text-4xl font-extrabold tracking-widest text-neutral-400">
          {frontLabel}
        </Text>
      </Animated.View>

      <Animated.View
        style={{
          transform: [{ perspective: 1000 }, { rotateY: rotateBack }],
          borderColor,
        }}
        className="absolute inset-0 bg-white rounded-2xl border-2.5 items-center justify-center shadow-xl"
      >
        <Text
          style={{ color: textColor }}
          className="text-lg font-extrabold text-center px-4"
        >
          {backText}
        </Text>
      </Animated.View>
    </View>
  );
}
