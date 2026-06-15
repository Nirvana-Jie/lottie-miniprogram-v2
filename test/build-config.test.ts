import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = path.resolve(import.meta.dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const tsdownConfig = fs.readFileSync(path.join(rootDir, 'tsdown.config.mts'), 'utf8');

describe('build config', () => {
  it('builds directly with tsdown without generated entry scripts', () => {
    expect(pkg.scripts.prebuild).toBeUndefined();
    expect(fs.existsSync(path.join(rootDir, 'scripts/prepare-entry.cjs'))).toBe(false);
    expect(fs.existsSync(path.join(rootDir, 'src/index.template.cjs'))).toBe(false);
    expect(tsdownConfig).not.toContain('.generated');
    expect(tsdownConfig).not.toContain('prepare-entry');
  });

  it('still uses the full canvas renderer for shape trim-path compatibility', () => {
    expect(tsdownConfig).toContain('lottie_canvas.js');
    expect(tsdownConfig).not.toContain('lottie_light_canvas');
  });
});
