import "../../global.css";
import { SafeAreaView, StatusBar } from "react-native";
import HistoryScreen from "../screens/History";

export default function HistoryRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <HistoryScreen />
    </SafeAreaView>
  );
}
