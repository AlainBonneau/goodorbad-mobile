import React from "react";
import { Text, View } from "react-native";

export default function Counter({ good, bad }: { good: number; bad: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2 mb-3">
      <Text className="text-blue-600 text-2xl font-extrabold">{good}</Text>
      <Text className="text-neutral-500 text-lg">|</Text>
      <Text className="text-red-600 text-2xl font-extrabold">{bad}</Text>
    </View>
  );
}
