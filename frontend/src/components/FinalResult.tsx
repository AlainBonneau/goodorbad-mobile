import React from "react";
import { View, Text } from "react-native";
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
    <View className="mt-6 w-full items-center">
      <Text className="text-base text-neutral-600 mb-3 font-semibold">
        Voici ta carte finale !
      </Text>
      <View
        className={`bg-white rounded-xl px-4 py-4 shadow-xl max-w-[520px] border-2 ${
          isGood ? "border-blue-600" : "border-red-600"
        }`}
      >
        <Text
          className={`text-center text-lg font-extrabold ${
            isGood ? "text-blue-600" : "text-red-600"
          }`}
        >
          {name?.trim() ? `${name}, ` : ""}
          {card.label}
        </Text>
      </View>
    </View>
  );
}
