export interface Adapter {
  createV2Context(nativeContext: unknown, canvas: unknown): unknown;
  getActiveCanvas(): unknown;
  getActiveContext(): unknown;
  restore(): void;
}

export interface LottieEngine {
  loadAnimation(options: Record<string, unknown>): any;
  freeze?: () => void;
  unfreeze?: () => void;
}

export function validateOptions(options: Record<string, any>): void {
  ['wrapper', 'container'].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      throw new Error(`Not support '${key}' parameter in miniprogram version of lottie.`);
    }
  });

  if (typeof options.path === 'string' && !/^https?:\/\//.test(options.path)) {
    throw new Error("The 'path' is only support http protocol.");
  }

  if (!options.rendererSettings || !options.rendererSettings.context) {
    throw new Error("Parameter 'rendererSettings.context' should be a CanvasRenderingContext2D.");
  }
}

export function createLottieApi(engine: LottieEngine, adapter: Adapter) {
  function loadAnimation(options: Record<string, any> = {}) {
    if (!adapter.getActiveCanvas()) {
      throw new Error('Call setup(canvas) with a Canvas v2 node before loadAnimation().');
    }

    validateOptions(options);

    const activeCanvas = adapter.getActiveCanvas();
    const activeContext = adapter.getActiveContext();
    const context =
      options.rendererSettings.context === activeContext
        ? activeContext
        : adapter.createV2Context(options.rendererSettings.context, activeCanvas);
    const rendererSettings = {
      ...options.rendererSettings,
      context,
    };
    const normalizedOptions = {
      ...options,
      renderer: 'canvas',
      rendererSettings,
    };

    const animation = engine.loadAnimation(normalizedOptions);
    const originalDestroy = animation.destroy.bind(animation);
    let destroyed = false;
    animation.destroy = function destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      if (animation.renderer && !animation.renderer.destroyed) {
        animation.renderer.renderConfig.clearCanvas = false;
      }
      try {
        originalDestroy();
      } finally {
        adapter.restore();
      }
    };

    return animation;
  }

  return {
    setup: (adapter as any).setup,
    loadAnimation,
    freeze: engine.freeze ? engine.freeze.bind(engine) : function freeze() {},
    unfreeze: engine.unfreeze ? engine.unfreeze.bind(engine) : function unfreeze() {},
  };
}
