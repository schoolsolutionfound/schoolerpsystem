const fs = require('fs');
const path = require('path');

// Patch: @react-native/babel-plugin-codegen — wrap codegen in try-catch
const pluginPath = path.join(__dirname, '..', 'node_modules', '@react-native', 'babel-plugin-codegen', 'index.js');
if (fs.existsSync(pluginPath)) {
  let code = fs.readFileSync(pluginPath, 'utf8');
  if (!code.includes('Skip codegen for files with unsupported Flow types')) {
    code = code.replace(
      /if \(this\.defaultExport\) \{\s*const viewConfig = generateViewConfig\(this\.filename, this\.code\);/,
      `if (this.defaultExport) {\n            try {\n              const viewConfig = generateViewConfig(this.filename, this.code);`
    );
    // Find the codeInserted = true and add catch after the closing brace
    code = code.replace(
      /this\.codeInserted = true;\s*\}\s*\},\s*\},\s*\},/,
      `this.codeInserted = true;\n            } catch (e) {\n              // Skip codegen for files with unsupported Flow types (RN 0.86 bug)\n            }\n          }\n        },\n      },\n    },`
    );
    fs.writeFileSync(pluginPath, code, 'utf8');
    console.log('[patch] Patched @react-native/babel-plugin-codegen (try-catch)');
  } else {
    console.log('[patch] @react-native/babel-plugin-codegen already patched');
  }
} else {
  console.log('[patch] @react-native/babel-plugin-codegen not found');
}

// Patch 2: VirtualView files
const rnDir = path.join(__dirname, '..', 'node_modules', 'react-native', 'src', 'private', 'components', 'virtualview');
const stubCode = `const React = require('react');
const {View} = require('react-native');
const Component = React.forwardRef(function Stub(props, ref) {
  return React.createElement(View, Object.assign({}, props, {ref: ref}));
});
module.exports = Component;
module.exports.default = Component;
`;
['VirtualViewNativeComponent.js', 'VirtualViewExperimentalNativeComponent.js'].forEach((file) => {
  const filePath = path.join(rnDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('codegenNativeComponent')) {
      fs.writeFileSync(filePath, stubCode, 'utf8');
      console.log('[patch] Patched ' + file);
    }
  }
});

// Patch 3: DebuggingOverlay — force disable native component (not in Expo Go)
const debuggingOverlayPath = path.join(__dirname, '..', 'node_modules', 'react-native', 'Libraries', 'Debugging', 'DebuggingOverlay.js');
if (fs.existsSync(debuggingOverlayPath)) {
  let code = fs.readFileSync(debuggingOverlayPath, 'utf8');
  if (!code.includes('const isNativeComponentReady = false;')) {
    code = code.replace(
      /const isNativeComponentReady =\s*UIManager\.hasViewManagerConfig\('DebuggingOverlay'\);/,
      'const isNativeComponentReady = false;'
    );
    fs.writeFileSync(debuggingOverlayPath, code, 'utf8');
    console.log('[patch] Patched DebuggingOverlay.js');
  }
}