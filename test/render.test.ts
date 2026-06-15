import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

const shapeTrimAnimation = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 90,
  w: 128,
  h: 128,
  nm: 'shape_trim_smoke',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'stroke layer',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [64, 64, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          nm: 'line group',
          it: [
            {
              ty: 'sh',
              nm: 'line',
              ind: 0,
              ks: {
                a: 0,
                k: {
                  i: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                  ],
                  o: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                  ],
                  v: [
                    [-32, 0],
                    [0, 32],
                    [42, -24],
                  ],
                  c: false,
                },
              },
            },
            {
              ty: 'st',
              nm: 'stroke',
              c: { a: 0, k: [1, 1, 1, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 12 },
              lc: 2,
              lj: 2,
              ml: 4,
              bm: 0,
            },
            {
              ty: 'tm',
              nm: 'trim',
              s: { a: 0, k: 0 },
              e: { a: 0, k: 100 },
              o: { a: 0, k: 0 },
              m: 1,
            },
            {
              ty: 'tr',
              nm: 'transform',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
  ],
};

const dashedStrokeAnimation = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 90,
  w: 128,
  h: 128,
  nm: 'dashed_stroke_smoke',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'dashed stroke layer',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [64, 64, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          nm: 'line group',
          it: [
            {
              ty: 'sh',
              nm: 'line',
              ind: 0,
              ks: {
                a: 0,
                k: {
                  i: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                  ],
                  o: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                  ],
                  v: [
                    [-32, 0],
                    [0, 32],
                    [42, -24],
                  ],
                  c: false,
                },
              },
            },
            {
              ty: 'st',
              nm: 'dashed stroke',
              c: { a: 0, k: [1, 1, 1, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 12 },
              lc: 2,
              lj: 2,
              ml: 4,
              bm: 0,
              d: [
                { n: 'd', nm: 'dash', v: { a: 0, k: 8 } },
                { n: 'g', nm: 'gap', v: { a: 0, k: 4 } },
                { n: 'o', nm: 'offset', v: { a: 0, k: 0 } },
              ],
            },
            {
              ty: 'tr',
              nm: 'transform',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
  ],
};

const gradientAnimation = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 30,
  w: 128,
  h: 128,
  nm: 'gradient_smoke',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'gradient shape',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [64, 64, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          nm: 'gradient group',
          it: [
            {
              ty: 'sh',
              nm: 'rect path',
              ind: 0,
              ks: {
                a: 0,
                k: {
                  i: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                    [0, 0],
                  ],
                  o: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                    [0, 0],
                  ],
                  v: [
                    [-32, -32],
                    [32, -32],
                    [32, 32],
                    [-32, 32],
                  ],
                  c: true,
                },
              },
            },
            {
              ty: 'gf',
              nm: 'linear gradient',
              o: { a: 0, k: 100 },
              r: 1,
              bm: 0,
              g: {
                p: 2,
                k: { a: 0, k: [0, 1, 0, 0, 1, 0, 0, 1] },
              },
              s: { a: 0, k: [-32, 0] },
              e: { a: 0, k: [32, 0] },
              t: 1,
            },
            {
              ty: 'tr',
              nm: 'transform',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 0,
      op: 30,
      st: 0,
      bm: 0,
    },
  ],
};

const imageAnimation = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 30,
  w: 128,
  h: 128,
  nm: 'image_smoke',
  ddd: 0,
  assets: [
    {
      id: 'image_0',
      w: 1,
      h: 1,
      u: '',
      p: 'data:image/png;base64,iVBORw0KGgo=',
      e: 1,
    },
  ],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 2,
      nm: 'image layer',
      refId: 'image_0',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [64, 64, 0] },
        a: { a: 0, k: [0.5, 0.5, 0] },
        s: { a: 0, k: [6400, 6400, 100] },
      },
      ao: 0,
      w: 1,
      h: 1,
      ip: 0,
      op: 30,
      st: 0,
      bm: 0,
    },
  ],
};

const maskedAnimation = {
  ...gradientAnimation,
  nm: 'mask_smoke',
  layers: [
    {
      ...(gradientAnimation.layers[0] as any),
      hasMask: true,
      masksProperties: [
        {
          mode: 'a',
          inv: false,
          nm: 'alpha mask',
          pt: {
            a: 0,
            k: {
              i: [
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0],
              ],
              o: [
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0],
              ],
              v: [
                [32, 32],
                [96, 32],
                [96, 96],
                [32, 96],
              ],
              c: true,
            },
          },
          o: { a: 0, k: 100 },
          x: { a: 0, k: 0 },
        },
      ],
    },
  ],
};

const vectorTextAnimation = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 30,
  w: 128,
  h: 128,
  nm: 'text_smoke',
  ddd: 0,
  assets: [],
  fonts: {
    list: [{ fName: 'ProductSans-Regular', fFamily: 'Product Sans', fStyle: 'Regular', ascent: 71.5988159179688 }],
  },
  chars: [
    {
      ch: '0',
      size: 36,
      style: 'Regular',
      w: 63.8,
      fFamily: 'Product Sans',
      data: {
        shapes: [
          {
            ty: 'gr',
            nm: '0 glyph',
            it: [
              {
                ind: 0,
                ty: 'sh',
                ix: 1,
                ks: {
                  a: 0,
                  k: {
                    i: [
                      [-5.134, -6.866],
                      [-8.067, 0],
                      [-5.134, 6.734],
                      [0, 10.267],
                      [5.133, 6.734],
                      [8.066, 0],
                      [5.133, -6.733],
                      [0, -10.4],
                    ],
                    o: [
                      [5.133, 6.734],
                      [8.066, 0],
                      [5.133, -6.866],
                      [0, -10.333],
                      [-5.134, -6.8],
                      [-8.067, 0],
                      [-5.134, 6.734],
                      [0, 10.267],
                    ],
                    v: [
                      [12.1, -8.5],
                      [31.9, 1.6],
                      [51.7, -8.5],
                      [59.4, -34.2],
                      [51.7, -59.8],
                      [31.9, -70],
                      [12.1, -59.9],
                      [4.4, -34.2],
                    ],
                    c: true,
                  },
                  ix: 2,
                },
                nm: '0',
                mn: 'ADBE Vector Shape - Group',
                hd: false,
              },
              {
                ind: 1,
                ty: 'sh',
                ix: 2,
                ks: {
                  a: 0,
                  k: {
                    i: [
                      [3.333, -5.133],
                      [5.466, 0],
                      [3.266, 5],
                      [0, 7.867],
                      [-3.334, 5.067],
                      [-5.467, 0],
                      [-3.267, -5.066],
                      [0, -7.866],
                    ],
                    o: [
                      [-3.267, 5.067],
                      [-5.467, 0],
                      [-3.334, -5.133],
                      [0, -7.866],
                      [3.266, -5.066],
                      [5.466, 0],
                      [3.333, 5.067],
                      [0, 7.8],
                    ],
                    v: [
                      [45, -14.8],
                      [31.9, -7.2],
                      [18.8, -14.7],
                      [13.8, -34.2],
                      [18.8, -53.6],
                      [31.9, -61.2],
                      [45, -53.6],
                      [50, -34.2],
                    ],
                    c: true,
                  },
                  ix: 2,
                },
                nm: '0',
                mn: 'ADBE Vector Shape - Group',
                hd: false,
              },
            ],
            np: 5,
            cix: 2,
            bm: 0,
            ix: 1,
            mn: 'ADBE Vector Group',
            hd: false,
          },
        ],
      },
    },
  ],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 5,
      nm: 'text layer',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [64, 84, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      t: {
        d: {
          k: [
            {
              s: {
                s: 36,
                f: 'ProductSans-Regular',
                t: '0',
                j: 0,
                tr: 0,
                lh: 43.2,
                ls: 0,
                fc: [1, 0, 0],
              },
              t: 0,
            },
          ],
        },
        p: {},
        m: {
          g: 1,
          a: { a: 0, k: [0, 0], ix: 2 },
        },
        a: [],
      },
      ip: 0,
      op: 30,
      st: 0,
      bm: 0,
    },
  ],
};

function createCanvasHarness(overrides: { setLineDash?: (segments: unknown) => void } = {}) {
  const calls: string[] = [];
  let imageIndex = 0;
  const nativeContext = new Proxy(
    {
      canvas: null as any,
      setLineDash: overrides.setLineDash ?? function setLineDash() {},
      measureText() {
        return { width: 0 };
      },
      createLinearGradient() {
        calls.push('createLinearGradient');
        return { addColorStop: () => calls.push('gradient.addColorStop') };
      },
      createRadialGradient() {
        calls.push('createRadialGradient');
        return { addColorStop: () => calls.push('gradient.addColorStop') };
      },
    },
    {
      get(target, property) {
        if (property in target) {
          return target[property as keyof typeof target];
        }
        if (typeof property === 'string') {
          return () => {
            calls.push(property);
          };
        }
      },
      set(target, property, value) {
        (target as any)[property] = value;
        return true;
      },
    },
  );

  const canvas = {
    width: 128,
    height: 128,
    getContext(_type?: string) {
      return nativeContext;
    },
    requestAnimationFrame() {
      return 1;
    },
    cancelAnimationFrame() {},
    createImage() {
      let loadCallback: (() => void) | null = null;
      const image = {
        id: `image-${++imageIndex}`,
        crossOrigin: '',
        width: 1,
        height: 1,
        addEventListener(eventName: string, callback: () => void) {
          if (eventName === 'load') {
            loadCallback = callback;
          }
        },
      };
      Object.defineProperty(image, 'src', {
        set() {
          calls.push('image.src');
          setTimeout(() => loadCallback?.(), 0);
        },
      });
      return image;
    },
  };
  nativeContext.canvas = canvas;

  return { calls, canvas, nativeContext };
}

async function render(animationData: Record<string, unknown>) {
  const lottie = require('../lib');
  const harness = createCanvasHarness();

  lottie.setup(harness.canvas);
  const animation = lottie.loadAnimation({
    loop: false,
    autoplay: false,
    animationData,
    rendererSettings: {
      context: harness.nativeContext,
      clearCanvas: true,
    },
  });

  await new Promise((resolve) => {
    animation.addEventListener('DOMLoaded', resolve);
    setTimeout(resolve, 30);
  });
  animation.goToAndStop(10, true);
  animation.destroy();

  return harness.calls;
}

describe('built renderer', () => {
  it('renders shape trim-path animations through the canvas context', async () => {
    const calls = await render(shapeTrimAnimation);

    expect(calls).toContain('stroke');
  });

  it('renders gradient fills through the canvas context', async () => {
    const calls = await render(gradientAnimation);

    expect(calls).toContain('createLinearGradient');
    expect(calls).toContain('gradient.addColorStop');
    expect(calls).toContain('fill');
  });

  it('renders image layers through the canvas context', async () => {
    const calls = await render(imageAnimation);

    expect(calls).toContain('image.src');
    expect(calls).toContain('drawImage');
  });

  it('renders masked layers through the canvas context', async () => {
    const calls = await render(maskedAnimation);

    expect(calls).toContain('clip');
    expect(calls).toContain('fill');
  });

  it('renders vector text layers through the canvas context', async () => {
    const calls = await render(vectorTextAnimation);

    expect(calls).toContain('fill');
    expect(calls).toContain('moveTo');
  });

  it('passes a plain number array to a strict native setLineDash for a built dashed stroke', async () => {
    const lottie = require('../lib');
    const dashCalls: unknown[] = [];
    const harness = createCanvasHarness({
      setLineDash(segments: unknown) {
        dashCalls.push(segments);
        // Model the Douyin/TMA bridge: only a plain Array survives as an iterable,
        // and the strict native setLineDash rejects a typed/array-like argument.
        if (segments == null || typeof (segments as any)[Symbol.iterator] !== 'function') {
          throw new TypeError(
            "Failed to execute 'setLineDash' on 'CanvasRenderingContext2D': The object must have a callable @@iterator property.",
          );
        }
        if (!Array.isArray(segments)) {
          throw new TypeError(
            "Failed to execute 'setLineDash' on 'CanvasRenderingContext2D': a non-plain dash array was rejected by the bridge.",
          );
        }
      },
    });

    lottie.setup(harness.canvas);
    // Public usage: pass the raw 2d context exactly like the README example.
    const animation = lottie.loadAnimation({
      loop: false,
      autoplay: false,
      animationData: dashedStrokeAnimation,
      rendererSettings: {
        context: harness.canvas.getContext('2d'),
        clearCanvas: true,
      },
    });

    await new Promise((resolve) => {
      animation.addEventListener('DOMLoaded', resolve);
      setTimeout(resolve, 30);
    });

    expect(() => animation.goToAndStop(10, true)).not.toThrow();
    expect(dashCalls.length).toBeGreaterThan(0);
    for (const received of dashCalls) {
      expect(Array.isArray(received)).toBe(true);
      expect(received instanceof Float32Array).toBe(false);
      expect((received as unknown[]).every((value) => typeof value === 'number' && Number.isFinite(value))).toBe(true);
    }

    animation.destroy();
  });
});
