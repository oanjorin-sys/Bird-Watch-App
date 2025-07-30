const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file types
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  'db',
  // Audio files
  'mp3',
  'wav',
  'aac',
  'm4a',
  // Video files
  'mp4',
  'mov',
  'avi'
);

module.exports = config;