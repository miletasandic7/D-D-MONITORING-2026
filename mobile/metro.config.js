const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  alias: {
    ...config.resolver.alias,
    '^@/(.*)$': './src/$1',
  },
};

module.exports = config;
