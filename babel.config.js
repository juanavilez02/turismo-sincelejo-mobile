module.exports = function(api) {
  api.assertVersion(7);
  return {
    presets: ['babel-preset-expo'],
  };
};
