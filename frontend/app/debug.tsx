import { View, Text, Pressable } from "react-native";

export default function Debug() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <View className="w-64 rounded-2xl bg-white/10 p-6 border border-white/20">
        <Text className="text-white text-2xl font-bold mb-4">
          NativeWind ✅
        </Text>
        <Pressable className="rounded-lg px-4 py-3 bg-purple-500">
          <Text className="text-white font-semibold">Bouton</Text>
        </Pressable>
      </View>
    </View>
  );
}
