// FIX: expo-router babel plugin missing - updated to remove deprecated plugin
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [],
  };
};