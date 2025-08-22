import "../../global.css";
import { SafeAreaView, StatusBar } from "react-native";
import GameScreen from "../screens/GameScreen";

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <GameScreen />
    </SafeAreaView>
  );
}
