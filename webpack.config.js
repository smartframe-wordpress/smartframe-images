const defaultConfig = require('@wordpress/scripts/config/webpack.config');

const otherEntryPoints = {
  'classic_editor': './src/sfimages_modal_classic_editor.js',
  'featured-image': './src/featured-image.js',
  'classic-featured-image': './src/classic-featured-image.js',
};

module.exports = {
  ...defaultConfig,
  entry: {
    ...defaultConfig.entry(),
    ...otherEntryPoints,
  },
};