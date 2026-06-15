const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const rootDir = path.resolve(__dirname, '..');
const bundlePath = path.join(rootDir, 'lib/index.js');
const maxBytes = Number(process.env.LOTTIE_MAX_BUNDLE_BYTES || 240000);
const maxGzipBytes = Number(process.env.LOTTIE_MAX_BUNDLE_GZIP_BYTES || 65000);

const source = fs.readFileSync(bundlePath);
const gzipSize = zlib.gzipSync(source, { level: 9 }).byteLength;

if (source.byteLength > maxBytes) {
  throw new Error(`lib/index.js is ${source.byteLength} bytes, above the ${maxBytes} byte limit.`);
}

if (gzipSize > maxGzipBytes) {
  throw new Error(`lib/index.js gzip size is ${gzipSize} bytes, above the ${maxGzipBytes} byte limit.`);
}

process.stdout.write(`lib/index.js size: ${source.byteLength} bytes, gzip: ${gzipSize} bytes\n`);
