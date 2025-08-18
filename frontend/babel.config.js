module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [], // <- rien ici, on évite "nativewind/babel"
  };
};
