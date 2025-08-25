import "../../global.css";
import { SafeAreaView, StatusBar } from "react-native";
import DailyCardScreen from "../screens/DailyCardScreen";

export default function DailyRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <DailyCardScreen />
    </SafeAreaView>
  );
}
