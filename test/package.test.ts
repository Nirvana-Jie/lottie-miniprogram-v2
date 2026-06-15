import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = path.resolve(import.meta.dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const readmeCn = fs.readFileSync(path.join(rootDir, 'README-CN.md'), 'utf8');
const license = fs.readFileSync(path.join(rootDir, 'LICENSE'), 'utf8');
const releasingGuide = fs.readFileSync(path.join(rootDir, 'docs/releasing.md'), 'utf8');
const tsdownConfig = fs.readFileSync(path.join(rootDir, 'tsdown.config.mts'), 'utf8');
const gitignore = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
const ciWorkflow = fs.readFileSync(path.join(rootDir, '.github/workflows/ci.yml'), 'utf8');
const publishWorkflow = fs.readFileSync(path.join(rootDir, '.github/workflows/publish.yml'), 'utf8');

describe('package contract', () => {
  it('publishes the standard lib output only', () => {
    expect(pkg.main).toBe('lib/index.js');
    expect(pkg.types).toBe('lib/index.d.ts');
    expect(pkg.miniprogram).toBeUndefined();
    expect(pkg.files).toEqual(['lib']);
    expect(pkg.author).toBe('Nirvana-Jie <1357711537@qq.com>');
    expect(pkg.repository).toEqual({
      type: 'git',
      url: 'git+https://github.com/Nirvana-Jie/lottie-miniprogram-v2.git',
    });
    expect(pkg.bugs.url).toBe('https://github.com/Nirvana-Jie/lottie-miniprogram-v2/issues');
    expect(pkg.homepage).toBe('https://github.com/Nirvana-Jie/lottie-miniprogram-v2#readme');
    expect(pkg.publishConfig).toEqual({
      access: 'public',
      registry: 'https://registry.npmjs.org/',
    });
    expect(gitignore).toContain('lib/');
    expect(JSON.stringify(pkg.exports)).not.toContain('miniprogram_dist');
    expect(JSON.stringify(pkg.scripts)).not.toContain('prepare-entry');
  });

  it('uses modern build and test tooling', () => {
    expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
    expect(pkg.scripts.build).toBe('tsdown');
    expect(pkg.scripts.postbuild).toBeUndefined();
    expect(pkg.scripts.test).toBe('vitest run');
    expect(pkg.scripts.verify).toBe('pnpm run typecheck && pnpm run build && pnpm test && pnpm run size');
    expect(pkg.devDependencies.tsdown).toBeTruthy();
    expect(pkg.devDependencies.vitest).toBeTruthy();
    expect(pkg.devDependencies['@types/node']).toBeTruthy();
    expect(fs.existsSync(path.join(rootDir, 'tsdown.config.mts'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'vitest.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'scripts/copy-types.cjs'))).toBe(false);
    expect(fs.existsSync(path.join(rootDir, 'scripts/prepare-entry.cjs'))).toBe(false);
  });

  it('constrains pnpm through package metadata and lockfile', () => {
    expect(pkg.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
    expect(pkg.scripts.preinstall).toBeUndefined();
    expect(fs.existsSync(path.join(rootDir, 'scripts/ensure-pnpm.cjs'))).toBe(false);
    expect(fs.existsSync(path.join(rootDir, 'pnpm-lock.yaml'))).toBe(true);
  });

  it('configures tsdown for smaller production output', () => {
    expect(tsdownConfig).toContain('minify: true');
    expect(tsdownConfig).toContain('treeshake: true');
    expect(tsdownConfig).toContain('copy:');
    expect(tsdownConfig).toContain('plugins: [lottieCanvasPlugin()]');
    expect(tsdownConfig).toContain('comments:');
    expect(tsdownConfig).toContain('legal: false');
    expect(tsdownConfig).toContain("exports: 'named'");
    expect(pkg.scripts.size).toBe('node scripts/check-size.cjs');
    expect(fs.existsSync(path.join(rootDir, 'scripts/check-size.cjs'))).toBe(true);
  });

  it('keeps lottie-web as a build-time dependency', () => {
    expect(pkg.dependencies?.['lottie-web']).toBeUndefined();
    expect(pkg.devDependencies['lottie-web']).toBe('5.7.4');
  });

  it('defines GitHub Actions verification and npm publish workflows', () => {
    expect(ciWorkflow).toContain('pnpm run verify');
    expect(ciWorkflow).toContain('npm pack --dry-run');
    expect(ciWorkflow).toContain('corepack prepare pnpm@10.33.2 --activate');
    expect(publishWorkflow).toContain('id-token: write');
    expect(publishWorkflow).toContain('registry-url: https://registry.npmjs.org');
    expect(publishWorkflow).toContain('pnpm run verify');
    expect(publishWorkflow).toContain('npm view "${package_name}@${package_version}" version');
    expect(publishWorkflow).toContain('npm publish --access public');
    expect(publishWorkflow).toContain('NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}');
  });

  it('documents Canvas v2 only support and the removed Canvas v1 path', () => {
    expect(readme).toContain('Canvas v2 only');
    expect(readme).toContain('## Support');
    expect(readme).toContain('## Not Supported');
    expect(readme).toContain('`tt.createCanvasContext`');
    expect(readme).toContain('`miniprogram_dist`');
    expect(readme).toContain('[简体中文](README-CN.md)');
    expect(readme).not.toContain('## Build');
    expect(readme).not.toContain('pnpm install');
    expect(readme).not.toContain('pnpm run build');
    expect(readme).not.toContain('packageManager:');
    expect(readme).not.toContain('## 中文');
    expect(readmeCn).toContain('面向抖音小程序和兼容小程序运行时的 Canvas v2 only Lottie 播放包');
    expect(readmeCn).toContain('## 支持');
    expect(readmeCn).toContain('## 不支持');
    expect(readmeCn).toContain('`tt.createCanvasContext`');
    expect(readmeCn).toContain('不包含 `miniprogram_dist`');
    expect(readmeCn).toContain('[English](README.md)');
    expect(readmeCn).not.toContain('## 构建');
    expect(readmeCn).not.toContain('pnpm install');
    expect(readmeCn).not.toContain('pnpm run build');
    expect(readmeCn).not.toContain('packageManager:');
    expect(readmeCn).not.toContain('## English');
    expect(releasingGuide).toContain('Trusted Publishing');
    expect(releasingGuide).toContain('NPM_TOKEN');
    expect(releasingGuide).toContain('git+https://github.com/Nirvana-Jie/lottie-miniprogram-v2.git');
  });

  it('documents upstream origin and license notices', () => {
    expect(readme).toContain('wechat-miniprogram/lottie-miniprogram');
    expect(readme).toContain('Copyright (c) 2019 wechat-miniprogram');
    expect(readme).toContain('Copyright (c) 2015 Bodymovin');
    expect(readmeCn).toContain('wechat-miniprogram/lottie-miniprogram');
    expect(readmeCn).toContain('Copyright (c) 2019 wechat-miniprogram');
    expect(readmeCn).toContain('Copyright (c) 2015 Bodymovin');
    expect(license).toContain('Copyright (c) 2026 lottie-miniprogram-v2 contributors');
    expect(license).toContain('Copyright (c) 2019 wechat-miniprogram');
    expect(license).toContain('Copyright (c) 2015 Bodymovin');
  });
});
