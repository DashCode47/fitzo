const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Files co-located with source (e.g. app/(tabs)/stats.test.ts) are picked up by
// Expo Router's file-based routing unless explicitly excluded here — it treats
// every .ts/.tsx under app/ as a route. This only affects Metro (dev server /
// builds); Jest has its own resolver and keeps finding *.test.ts files fine.
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : [config.resolver.blockList]),
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
];

module.exports = config;
