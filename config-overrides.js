const { override, addWebpackPlugin } = require('customize-cra');
const WebpackBar = require('webpackbar');

module.exports = override(addWebpackPlugin(new WebpackBar()));
