module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel", // si tu es en NativeWind v4
    ],
    plugins: [
      // remplace l'ancien plugin:
      "react-native-worklets/plugin",
      // "expo-router/babel" // décommente si tu utilises Expo Router
    ],
  };
};
