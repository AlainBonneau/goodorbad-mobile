import { useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";

type Phrase = {
  id: string;
  text: string;
  good: number;
  bad: number;
};

const initialData: Phrase[] = [
  { id: "1", text: "Toujours commenter son code", good: 12, bad: 2 },
  {
    id: "2",
    text: "Forcer le push sur main un vendredi soir",
    good: 1,
    bad: 23,
  },
];

export default function Home() {
  const [phrases, setPhrases] = useState<Phrase[]>(initialData);

  const vote = (id: string, kind: "good" | "bad") => {
    setPhrases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [kind]: p[kind] + 1 } : p))
    );
  };

  return (
    <View className="flex-1 bg-white px-4 py-6">
      <Text className="text-2xl font-bold mb-4">Good or Bad</Text>

      <FlatList
        data={phrases}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <View className="rounded-2xl border border-neutral-200 p-4 gap-3">
            <Text className="text-base">{item.text}</Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-row gap-3">
                <View className="px-3 py-1 rounded-full bg-green-100">
                  <Text className="font-medium">👍 {item.good}</Text>
                </View>
                <View className="px-3 py-1 rounded-full bg-red-100">
                  <Text className="font-medium">👎 {item.bad}</Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => vote(item.id, "good")}
                  className="px-3 py-2 rounded-xl bg-green-500"
                >
                  <Text className="text-white font-semibold">Good</Text>
                </Pressable>
                <Pressable
                  onPress={() => vote(item.id, "bad")}
                  className="px-3 py-2 rounded-xl bg-red-500"
                >
                  <Text className="text-white font-semibold">Bad</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}
