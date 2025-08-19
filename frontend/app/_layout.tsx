import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import GameScreen from "./screens/GameScreen";
import "nativewind/tailwind.css";

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <GameScreen />
    </SafeAreaView>
  );
}
