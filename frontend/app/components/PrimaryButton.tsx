import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { Colors, Radii, Spacing, Fonts } from "../theme";

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
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.txt}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.blue,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Radii.md,
    alignItems: "center",
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  txt: { color: "#fff", fontWeight: "700", fontSize: Fonts.body },
});
