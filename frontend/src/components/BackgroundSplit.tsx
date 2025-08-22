import React from "react";
import { View } from "react-native";

export default function BackgroundSplit({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View className="flex-1">
      <View className="absolute top-0 bottom-0 left-0 right-1/2 bg-blue-600" />
      <View className="absolute top-0 bottom-0 left-1/2 right-0 bg-red-600" />
      <View className="absolute top-0 bottom-0 w-[3px] left-1/2 -translate-x-[1.5px] bg-black shadow" />
      <View className="flex-1 items-center justify-center">{children}</View>
    </View>
  );
}
