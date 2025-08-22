import React from "react";
import { View } from "react-native";

export default function ScreenCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View className="w-[90%] max-w-[680px] bg-white rounded-3xl px-5 py-6 shadow-xl">
      {children}
    </View>
  );
}
