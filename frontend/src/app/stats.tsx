import "../../global.css";
import { SafeAreaView, StatusBar } from "react-native";
import StatisticsScreen from "../screens/Stats";

export default function StatsRoute() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <StatisticsScreen />
    </SafeAreaView>
  );
}
