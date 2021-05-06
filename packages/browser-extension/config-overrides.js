const path = require('path');
const { override, adjustStyleLoaders } = require('customize-cra');

module.exports = override(
  adjustStyleLoaders(({ use }) => {
    if (typeof use[0] === 'object') {
      // Disable minicss extraction.
      if (use[0].loader) {
        use[0] = require.resolve('style-loader');
      }
    }
    // Add prefix to css modules.
    if (use[1].options.modules) {
      use[1].options.modules.localIdentName = '__gdocwiki__[local]--[hash:base64:5]';
    }
  }),
  (config) => {
    config.entry['contentScript.oauth2'] = path.resolve('./src/contentScript.oauth2');
    return config;
  }
);
