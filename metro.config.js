const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for TypeScript path aliases
config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname, '.'),
};

// Ensure Metro can resolve the @ alias
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/')) {
    const resolvedPath = path.resolve(__dirname, moduleName.substring(2));
    return context.resolveRequest(context, resolvedPath, platform);
  }
  
  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

