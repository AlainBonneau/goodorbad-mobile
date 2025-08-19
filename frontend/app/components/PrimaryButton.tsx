import React from "react";
import { Pressable, Text } from "react-native";

export default function PrimaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`rounded-xl items-center px-4 py-3 ${
        disabled ? "bg-blue-400" : "bg-blue-600 active:bg-blue-700"
      }`}
    >
      <Text className="text-white font-bold text-base">{title}</Text>
    </Pressable>
  );
}
