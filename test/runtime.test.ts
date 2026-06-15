import { describe, expect, it, vi } from 'vitest';
import { createLottieApi, validateOptions } from '../src/runtime';

describe('runtime API', () => {
  it('rejects browser and Canvas v1 style options', () => {
    expect(() => validateOptions({ wrapper: {} })).toThrow("Not support 'wrapper'");
    expect(() => validateOptions({ container: {} })).toThrow("Not support 'container'");
    expect(() =>
      validateOptions({
        path: '/local/data.json',
        rendererSettings: { context: {} },
      }),
    ).toThrow("The 'path' is only support http protocol");
  });

  it('requires rendererSettings.context', () => {
    expect(() => validateOptions({ animationData: {} })).toThrow("Parameter 'rendererSettings.context'");
  });

  it('requires setup before loadAnimation', () => {
    const api = createLottieApi(
      { loadAnimation: vi.fn() },
      {
        createV2Context: vi.fn(),
        getActiveCanvas: () => null,
        getActiveContext: () => null,
        getActiveNativeContext: () => null,
        restore: vi.fn(),
      },
    );

    expect(() =>
      api.loadAnimation({
        animationData: {},
        rendererSettings: { context: {} },
      }),
    ).toThrow('Call setup(canvas) with a Canvas v2 node before loadAnimation');
  });

  it('normalizes renderer settings and restores adapter on destroy', () => {
    const calls: string[] = [];
    const activeCanvas = {};
    const nativeContext = {};
    const wrappedContext = {};
    const restore = vi.fn(() => calls.push('restore'));
    const originalDestroy = vi.fn(() => calls.push('destroy'));
    const engine = {
      loadAnimation: vi.fn(() => ({
        destroy: originalDestroy,
        renderer: {
          destroyed: false,
          renderConfig: {
            clearCanvas: true,
          },
        },
      })),
    };

    const api = createLottieApi(engine, {
      setup: vi.fn(),
      createV2Context: vi.fn(() => wrappedContext),
      getActiveCanvas: () => activeCanvas,
      getActiveContext: () => null,
      getActiveNativeContext: () => null,
      restore,
    } as any);

    const animation = api.loadAnimation({
      loop: true,
      animationData: {},
      rendererSettings: { context: nativeContext },
    });

    expect(engine.loadAnimation).toHaveBeenCalledWith({
      loop: true,
      animationData: {},
      renderer: 'canvas',
      rendererSettings: { context: wrappedContext },
    });

    animation.destroy();
    animation.destroy();

    expect(restore).toHaveBeenCalledOnce();
    expect(calls).toEqual(['destroy', 'restore']);
    expect(animation.renderer.renderConfig.clearCanvas).toBe(false);
    expect(originalDestroy).toHaveBeenCalledOnce();
  });

  it('reuses the setup context instead of preparing it twice', () => {
    const activeCanvas = {};
    const activeContext = {};
    const engine = {
      loadAnimation: vi.fn(() => ({
        destroy: vi.fn(),
        renderer: {
          destroyed: false,
          renderConfig: {
            clearCanvas: true,
          },
        },
      })),
    };
    const createV2Context = vi.fn();

    const api = createLottieApi(engine, {
      setup: vi.fn(),
      createV2Context,
      getActiveCanvas: () => activeCanvas,
      getActiveContext: () => activeContext,
      getActiveNativeContext: () => null,
      restore: vi.fn(),
    } as any);

    api.loadAnimation({
      animationData: {},
      rendererSettings: { context: activeContext },
    });

    expect(createV2Context).not.toHaveBeenCalled();
    expect(engine.loadAnimation).toHaveBeenCalledWith({
      animationData: {},
      renderer: 'canvas',
      rendererSettings: { context: activeContext },
    });
  });

  it('reuses the setup facade when the caller passes the active native context', () => {
    const activeCanvas = {};
    const activeNativeContext = {};
    const activeContext = {};
    const engine = {
      loadAnimation: vi.fn(() => ({
        destroy: vi.fn(),
        renderer: {
          destroyed: false,
          renderConfig: {
            clearCanvas: true,
          },
        },
      })),
    };
    const createV2Context = vi.fn();

    const api = createLottieApi(engine, {
      setup: vi.fn(),
      createV2Context,
      getActiveCanvas: () => activeCanvas,
      getActiveContext: () => activeContext,
      getActiveNativeContext: () => activeNativeContext,
      restore: vi.fn(),
    } as any);

    api.loadAnimation({
      animationData: {},
      rendererSettings: { context: activeNativeContext },
    });

    expect(createV2Context).not.toHaveBeenCalled();
    expect(engine.loadAnimation).toHaveBeenCalledWith({
      animationData: {},
      renderer: 'canvas',
      rendererSettings: { context: activeContext },
    });
  });
});
