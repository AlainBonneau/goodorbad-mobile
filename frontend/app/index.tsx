import { View, Text } from "react-native";
import { Link } from "expo-router";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text className="text-white text-3xl font-bold mb-6">Home</Text>
      <Link href="/debug" className="text-purple-400 underline">
        Aller à /debug
      </Link>
    </View>
  );
}
