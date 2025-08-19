import React from "react";
import { Pressable, Text, View } from "react-native";
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
    <View className="flex-row flex-wrap justify-center gap-4">
      {cards.map((c, i) => {
        const disabled = pickedIndex !== null && pickedIndex !== i;
        return (
          <Pressable
            key={c.id + i}
            onPress={() => onPick(i)}
            disabled={!!pickedIndex}
            className={`w-[68px] h-[90px] ${disabled ? "opacity-40" : ""}`}
          >
            <View className="flex-1 bg-white rounded-md items-center justify-center border-2.5 border-neutral-300 shadow">
              <Text className="text-2xl text-neutral-400 font-extrabold">
                ??
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
