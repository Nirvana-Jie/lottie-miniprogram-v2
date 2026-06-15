import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createV2Context,
  g,
  getActiveCanvas,
  getActiveContext,
  getActiveNativeContext,
  restore,
  setup,
} from '../src/adapter';
import { setMiniappApi } from '../src/adapter/miniapp-api';

function createCanvas(nativeContext: Record<string, any> = {}) {
  return {
    getContext: (_type?: string) => nativeContext,
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

  it('wraps the native context in a facade that forwards unknown native members', () => {
    const customDraw = vi.fn();
    const nativeContext: Record<string, any> = {
      customDraw,
      customState: 'ready',
    };

    const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;

    expect(context).not.toBe(nativeContext);
    expect(context.customState).toBe('ready');

    context.customDraw(1);
    expect(customDraw).toHaveBeenCalledWith(1);

    context.extraState = 'painted';
    expect(nativeContext.extraState).toBe('painted');
  });

  it('forwards native methods and property writes without overriding the native context', () => {
    const setGlobalAlpha = vi.fn();
    const nativeContext: Record<string, any> = {};
    Object.defineProperty(nativeContext, 'setGlobalAlpha', {
      configurable: false,
      writable: false,
      value: setGlobalAlpha,
    });

    const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;
    context.globalAlpha = 0.4;
    context.setGlobalAlpha(0.5);

    expect(nativeContext.globalAlpha).toBe(0.4);
    expect(setGlobalAlpha).toHaveBeenCalledWith(0.5);
    expect(context.setFillStyle).toBeUndefined();
  });

  it('returns a stable bound reference for native methods on hot canvas paths', () => {
    const stroke = vi.fn();
    const nativeContext = { stroke };

    const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;

    expect(context.stroke).toBe(context.stroke);
    context.stroke();
    expect(stroke).toHaveBeenCalledOnce();
  });

  it('forwards the fill rule to the native context', () => {
    const nativeFill = vi.fn();
    const nativeContext = {
      fill: nativeFill,
    };

    const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;
    context.fill('evenodd');

    expect(nativeFill).toHaveBeenCalledOnce();
    expect(nativeFill).toHaveBeenCalledWith('evenodd');
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

  it('does not expose Object.prototype members as native context members', () => {
    const nativeContext = Object.create(null) as Record<string, any>;
    nativeContext.stroke = vi.fn();

    const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;

    expect(context.stroke).toBeTypeOf('function');
    expect(context.hasOwnProperty).toBeUndefined();
    expect(context.toString).toBeUndefined();
  });

  it('forwards a sanitized plain array to a strict native setLineDash (Douyin worker bridge)', () => {
    // Douyin's Canvas v2 context methods are non-writable (an in-place patch cannot stick),
    // and after the worker->webview bridge only a plain Array survives as an iterable.
    let received: unknown;
    const nativeContext: Record<string, any> = {};
    Object.defineProperty(nativeContext, 'setLineDash', {
      configurable: false,
      writable: false,
      value(segments: unknown) {
        if (arguments.length < 1) {
          throw new Error("Failed to execute 'setLineDash': 1 argument required, but only 0 present.");
        }
        if (!Array.isArray(segments)) {
          throw new Error("Failed to execute 'setLineDash': The object must have a callable @@iterator property.");
        }
        received = segments;
      },
    });

    const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;

    // lottie-web passes a Float32Array dash array (createTypedArray('float32', ...)).
    expect(() => context.setLineDash(new Float32Array([4, 2]))).not.toThrow();
    expect(Array.isArray(received)).toBe(true);
    expect(received).toEqual([4, 2]);
  });

  it('does not mutate the caller native context (the facade owns the overrides)', () => {
    const nativeFill = vi.fn();
    const nativeSetLineDash = vi.fn();
    const nativeContext: Record<string, any> = {
      fill: nativeFill,
      setLineDash: nativeSetLineDash,
    };
    const canvas = createCanvas(nativeContext);

    const context = createV2Context(nativeContext, canvas) as any;

    expect(context).not.toBe(nativeContext);
    expect(nativeContext.fill).toBe(nativeFill);
    expect(nativeContext.setLineDash).toBe(nativeSetLineDash);
    expect(Object.prototype.hasOwnProperty.call(nativeContext, 'canvas')).toBe(false);
    expect(context.canvas).toBe(canvas);
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

  it('normalizes every dash segment shape to a plain number array before the native bridge', () => {
    const cases: Array<[unknown, number[]]> = [
      [null, []],
      [undefined, []],
      [[4, 2], [4, 2]],
      [new Float32Array([4, 2]), [4, 2]],
      [{ 0: 4, 1: 2, length: 2 }, [4, 2]],
      [['4', '2'], [4, 2]],
    ];

    for (const [input, expected] of cases) {
      const nativeSetLineDash = vi.fn();
      const nativeContext = { setLineDash: nativeSetLineDash };
      const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;

      context.setLineDash(input);

      const received = nativeSetLineDash.mock.calls[0][0];
      expect(Array.isArray(received)).toBe(true);
      expect(received instanceof Float32Array).toBe(false);
      expect(received).toEqual(expected);
    }
  });

  it('falls back to an empty dash array when the segments iterator throws', () => {
    const nativeSetLineDash = vi.fn();
    const nativeContext = { setLineDash: nativeSetLineDash };
    const context = createV2Context(nativeContext, createCanvas(nativeContext)) as any;
    const hostileSegments = {
      [Symbol.iterator]() {
        throw new Error('hostile iterator');
      },
    };

    expect(() => context.setLineDash(hostileSegments)).not.toThrow();
    expect(nativeSetLineDash).toHaveBeenCalledWith([]);
  });

  it('exposes the existing context.canvas through the facade', () => {
    const existingCanvasRef = { host: 'proxy-canvas' };
    const nativeContext: Record<string, any> = {
      canvas: existingCanvasRef,
    };
    const canvas = createCanvas(nativeContext);

    const context = createV2Context(nativeContext, canvas) as any;

    expect(context).not.toBe(nativeContext);
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

  it('tracks and clears the active native context across setup and restore', () => {
    const nativeContext = {};
    const canvas = createCanvas(nativeContext);

    expect(getActiveNativeContext()).toBeNull();

    setup(canvas);

    expect(getActiveNativeContext()).toBe(canvas.getContext('2d'));
    expect(getActiveNativeContext()).not.toBe(getActiveContext());

    restore();

    expect(getActiveNativeContext()).toBeNull();
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

  it('dispatches the callback when the native frame fires', () => {
    vi.useFakeTimers();
    const nativeContext = {};
    const canvas = {
      getContext: () => nativeContext,
      // Native rAF fires its callback (Douyin confirmed: always async, but the
      // adapter treats sync/async uniformly).
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        callback(24);
        return 1;
      },
      cancelAnimationFrame: vi.fn(),
    };

    setup(canvas);

    const callback = vi.fn();
    const requestId = g.window.requestAnimationFrame(callback);

    expect(typeof requestId).toBe('number');
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(24);
  });

  it('cancels the pending native frame when the 100ms fallback wins', () => {
    vi.useFakeTimers();
    const nativeContext = {};
    const canvas = {
      getContext: () => nativeContext,
      // Native frame never fires (e.g. backgrounded / janky webview).
      requestAnimationFrame: () => 7,
      cancelAnimationFrame: vi.fn(),
    };

    setup(canvas);

    const callback = vi.fn();
    g.window.requestAnimationFrame(callback);
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledOnce();
    expect(canvas.cancelAnimationFrame).toHaveBeenCalledWith(7);
  });

  it('does not dispatch twice when the native frame fires after the fallback', () => {
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
    vi.advanceTimersByTime(100); // fallback wins
    nativeCallback?.(72); // late native frame must be ignored

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('cancels a pending frame and its native handle', () => {
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
    const requestId = g.window.requestAnimationFrame(callback);
    g.window.cancelAnimationFrame(requestId);
    vi.advanceTimersByTime(100);
    nativeCallback?.(48);

    expect(callback).not.toHaveBeenCalled();
    expect(canvas.cancelAnimationFrame).toHaveBeenCalledWith(7);
  });
});
