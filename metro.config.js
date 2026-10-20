const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Metro 0.82+ enables package exports by default (RN 0.77 did not). With it on,
    // `uint8array-tools` (via @qbtc/ecpair) resolves to its "browser" export
    // instead of "main", and that build runs `new TextDecoder()` at module scope,
    // which Hermes does not provide — the import throws before
    // AppRegistry.registerComponent runs. Keep the pre-0.81 resolution until a
    // TextEncoder/TextDecoder polyfill is added.
    unstable_enablePackageExports: false,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
