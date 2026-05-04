const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'frontend', 'dist');
const publicDir = path.join(root, 'backend', 'public');

if (!fs.existsSync(distDir)) {
  throw new Error(`Frontend build output not found: ${distDir}`);
}

fs.rmSync(publicDir, { recursive: true, force: true });
fs.cpSync(distDir, publicDir, { recursive: true });
console.log(`Copied frontend build to ${path.relative(root, publicDir)}`);
