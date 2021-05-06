const { override, addWebpackPlugin } = require('customize-cra');
const WebpackBar = require('webpackbar');
const multipleEntry = require('react-app-rewire-multiple-entry')([
  {
    entry: 'src/api',
    outPath: '/api/index.html',
  },
]);

module.exports = override(addWebpackPlugin(new WebpackBar()), multipleEntry.addMultiEntry);
