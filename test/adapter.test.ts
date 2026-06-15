import { afterEach, describe, expect, it, vi } from 'vitest';
import { createV2Context, g, getActiveCanvas, getActiveContext, restore, setup } from '../src/adapter';
import { setMiniappApi } from '../src/adapter/miniapp-api';

function createCanvas(nativeContext: Record<string, any> = {}) {
  return {
    getContext: () => nativeContext,
    requestAnimationFrame: (callback: FrameRequestCallback) => callback(12),
    cancelAnimationFrame: () => {},
  };
}

describe('Canvas v2 adapter', () => {
  afterEach(() => {
    restore();
    setMiniappApi(null);
    vi.useRealTimers();
  });

  it('provides empty DOM query shims for lottie-web auto discovery', () => {
    expect(g.document.getElementsByClassName('lottie')).toEqual([]);
    expect(g.document.getElementsByTagName('body')).toEqual([]);
    expect(g.document.querySelectorAll('script')).toEqual([]);
  });

  it('returns the native Canvas v2 context and preserves unknown native members', () => {
    const nativeContext: Record<string, any> = {
      customDraw: vi.fn(),
      customState: 'ready',
    };

    const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;

    expect(context).toBe(nativeContext);
    expect(context.customDraw).toBe(nativeContext.customDraw);
    expect(context.customState).toBe('ready');

    context.extraState = 'painted';

    expect(nativeContext.extraState).toBe('painted');
  });

  it('does not overwrite read-only native Canvas v1 compatibility methods', () => {
    const setGlobalAlpha = vi.fn();
    const nativeContext: Record<string, any> = {};
    Object.defineProperty(nativeContext, 'setGlobalAlpha', {
      configurable: false,
      writable: false,
      value: setGlobalAlpha,
    });

    const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;
    context.globalAlpha = 0.4;

    expect(nativeContext.globalAlpha).toBe(0.4);
    expect(context.setGlobalAlpha).toBe(setGlobalAlpha);
    expect(context.setFillStyle).toBeUndefined();
  });

  it('reuses native method references on hot canvas paths', () => {
    const nativeContext = {
      stroke: vi.fn(),
    };

    const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;

    expect(context.stroke).toBe(context.stroke);
    expect(context.stroke).toBe(nativeContext.stroke);
  });

  it('drops fill rule arguments before forwarding fill to the native context', () => {
    const nativeFill = vi.fn();
    const nativeContext = {
      fill: nativeFill,
    };

    const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;
    context.fill('evenodd');

    expect(nativeFill).toHaveBeenCalledOnce();
    expect(nativeFill).toHaveBeenCalledWith();
  });

  it('forwards argument-free fill calls to the native context', () => {
    const nativeFill = vi.fn();
    const nativeContext = {
      fill: nativeFill,
    };

    const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;
    context.fill();

    expect(nativeFill).toHaveBeenCalledOnce();
    expect(nativeFill).toHaveBeenCalledWith();
  });

  it('retries native method patching when a previous patch attempt failed', () => {
    const nativeFill = vi.fn();
    let allowFillPatch = false;
    let fillValue = nativeFill;
    const nativeContext: Record<string, any> = {};
    Object.defineProperty(nativeContext, 'fill', {
      configurable: true,
      get() {
        return fillValue;
      },
      set(nextValue) {
        if (!allowFillPatch) {
          throw new Error('host context is temporarily read-only');
        }
        fillValue = nextValue;
      },
    });

    createV2Context(nativeContext, createCanvas(nativeContext));
    allowFillPatch = true;
    const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;
    context.fill('evenodd');

    expect(nativeFill).toHaveBeenCalledOnce();
    expect(nativeFill).toHaveBeenCalledWith();
  });

  it('normalizes setLineDash segments before forwarding to the native context', () => {
    const nativeSetLineDash = vi.fn();
    const nativeContext = {
      setLineDash: nativeSetLineDash,
    };

    const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;
    context.setLineDash(new Set(['2', 3]));

    expect(nativeSetLineDash).toHaveBeenCalledOnce();
    expect(nativeSetLineDash).toHaveBeenCalledWith([2, 3]);
  });

  it('keeps an existing context.canvas without requiring reference equality', () => {
    const existingCanvasRef = { host: 'proxy-canvas' };
    const nativeContext: Record<string, any> = {
      canvas: existingCanvasRef,
    };
    const canvas = createCanvas(nativeContext);

    const context = createV2Context(nativeContext, canvas) as any;

    expect(context).toBe(nativeContext);
    expect(context.canvas).toBe(existingCanvasRef);
  });

  it('requires a Canvas v2 node during setup', () => {
    expect(() => setup({ getContext: () => ({}) })).toThrow('setup(canvas) requires a Canvas v2 node');
  });

  it('tracks and restores the active Canvas v2 node', () => {
    const nativeContext = {};
    const canvas = createCanvas(nativeContext);

    const context = setup(canvas);

    expect(getActiveCanvas()).toBe(canvas);
    expect(getActiveContext()).toBe(context);

    restore();

    expect(getActiveCanvas()).toBeNull();
    expect(getActiveContext()).toBeNull();
  });

  it('uses the injected miniapp api during setup', () => {
    const nativeContext = {};
    const canvas = createCanvas(nativeContext);
    const api = {
      getSystemInfoSync() {
        return { pixelRatio: 3 };
      },
    };

    setup(canvas, { api });

    expect(g.window.devicePixelRatio).toBe(3);

    restore();

    expect(g.window.devicePixelRatio).toBe(1);
  });

  it('defers Canvas RAF callbacks to avoid synchronous recursion from native events', () => {
    vi.useFakeTimers();
    const nativeContext = {};
    let nativeCallCount = 0;
    const canvas = {
      getContext: () => nativeContext,
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        nativeCallCount += 1;
        callback(24);
        return 100 + nativeCallCount;
      },
      cancelAnimationFrame: vi.fn(),
    };

    setup(canvas);

    const callback = vi.fn();
    const requestId = g.window.requestAnimationFrame(callback);

    expect(typeof requestId).toBe('number');
    expect(nativeCallCount).toBe(1);
    expect(callback).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(24);
  });

  it('does not add an extra timer hop for asynchronous Canvas RAF callbacks', () => {
    vi.useFakeTimers();
    const nativeContext = {};
    let nativeCallback: FrameRequestCallback | undefined;
    const canvas = {
      getContext: () => nativeContext,
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        nativeCallback = callback;
        return 7;
      },
      cancelAnimationFrame: vi.fn(),
    };

    setup(canvas);

    const callback = vi.fn();
    g.window.requestAnimationFrame(callback);
    nativeCallback?.(72);

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(72);
  });

  it('cancels deferred Canvas RAF callbacks', () => {
    vi.useFakeTimers();
    const nativeContext = {};
    const canvas = {
      getContext: () => nativeContext,
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        callback(48);
        return 7;
      },
      cancelAnimationFrame: vi.fn(),
    };

    setup(canvas);

    const callback = vi.fn();
    const requestId = g.window.requestAnimationFrame(callback);
    g.window.cancelAnimationFrame(requestId);
    vi.runOnlyPendingTimers();

    expect(callback).not.toHaveBeenCalled();
    expect(canvas.cancelAnimationFrame).toHaveBeenCalledWith(7);
  });
});
