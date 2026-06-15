import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { defineConfig } from 'tsdown';

const require = createRequire(import.meta.url);

const VIRTUAL_ID = 'virtual:lottie-canvas';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

function resolveLottieCanvasPath() {
  if (process.env.LOTTIE_CANVAS_PATH) {
    return process.env.LOTTIE_CANVAS_PATH;
  }

  const resolved = require.resolve('lottie-web/build/player/lottie_canvas.js');
  if (existsSync(resolved)) {
    return resolved;
  }
  throw new Error('Could not resolve lottie-web canvas player.');
}

function lottieCanvasPlugin() {
  return {
    name: 'inject-lottie-canvas',
    resolveId(id: string) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id: string) {
      if (id !== RESOLVED_ID) return null;
      const player = readFileSync(resolveLottieCanvasPath(), 'utf8').split('__[STANDALONE]__').join('');
      return [
        'export function createLottieEngine(adapter) {',
        '  var window = adapter.g.window;',
        '  var document = adapter.g.document;',
        '  var navigator = adapter.g.navigator;',
        '  var XMLHttpRequest = adapter.g.XMLHttpRequest;',
        '  var module = void 0, exports = void 0, define = void 0;',
        '  var self = window, globalThis = window;',
        player,
        '  return adapter.g.window.lottie;',
        '}',
      ].join('\n');
    },
  };
}

export default defineConfig({
  clean: true,
  copy: [
    {
      from: 'src/index.d.ts',
      to: 'lib',
    },
  ],
  dts: false,
  entry: {
    index: './src/index.ts',
  },
  exports: false,
  format: ['cjs'],
  hash: false,
  minify: true,
  outDir: 'lib',
  outExtensions() {
    return {
      js: '.js',
    };
  },
  outputOptions: {
    comments: {
      legal: false,
    },
    exports: 'named',
  },
  platform: 'neutral',
  plugins: [lottieCanvasPlugin()],
  sourcemap: false,
  target: 'es2018',
  treeshake: true,
});
