import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View className="flex-1 items-center justify-center bg-gray-900">
      <Text className="text-white text-3xl font-bold mb-8">Good or Bad 🎴</Text>
      <Pressable
        onPress={() => navigation.navigate("Draw")}
        className="bg-blue-500 px-6 py-3 rounded-lg"
      >
        <Text className="text-white text-lg font-semibold">Commencer</Text>
      </Pressable>
    </View>
  );
}
