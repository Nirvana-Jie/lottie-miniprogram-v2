import MiniappXMLHttpRequest from './XMLHttpRequest';
import { getPixelRatio, type MiniappApi, setMiniappApi } from './miniapp-api';

function noop() {}

function requestAnimationFrame(callback: FrameRequestCallback) {
  return setTimeout(() => {
    if (typeof callback === 'function') {
      callback(Date.now());
    }
  }, 16);
}

function cancelAnimationFrame(id: ReturnType<typeof setTimeout>) {
  clearTimeout(id);
}

function emptyElementList() {
  return [];
}

export const g: any = {
  requestAnimationFrame,
  cancelAnimationFrame,
};

g.window = {
  devicePixelRatio: getPixelRatio(),
  requestAnimationFrame,
  cancelAnimationFrame,
};
g.document = g.window.document = {
  readyState: 'complete',
  body: {},
  createElement,
  getElementsByClassName: emptyElementList,
  getElementsByTagName: emptyElementList,
  querySelectorAll: emptyElementList,
};
g.navigator = g.window.navigator = {
  userAgent: '',
};
g.XMLHttpRequest = MiniappXMLHttpRequest;

let activeCanvas: any = null;
let activeContext: any = null;
let activeNativeContext: any = null;
let previousState: any = null;
let rafRequestId = 0;

type RafTask = {
  callback: FrameRequestCallback;
  nativeId: unknown;
  resolved: boolean;
};

const rafTasks = new Map<number, RafTask>();

function notSupportImageOperation() {
  console.error('Miniapp Canvas v2 does not support dynamic offscreen canvas creation for lottie image preprocessing.');
}

function createImage(canvas: any) {
  if (!canvas || typeof canvas.createImage !== 'function') {
    return {};
  }

  const image = canvas.createImage();
  image.addEventListener =
    image.addEventListener ||
    function addEventListener(eventName: string, callback: (...args: unknown[]) => void) {
      if (eventName === 'load') {
        image.onload = function onload() {
          setTimeout(callback, 0);
        };
      } else if (eventName === 'error') {
        image.onerror = callback;
      }
    };
  return image;
}

export function createElement(tagName: string) {
  if (tagName === 'canvas') {
    return {
      getContext() {
        return {
          canvas: activeCanvas,
          fillRect: noop,
          createImage: notSupportImageOperation,
          drawImage: notSupportImageOperation,
        };
      },
    };
  }

  if (tagName === 'img') {
    return createImage(activeCanvas);
  }

  return {};
}

/**
 * Normalize lottie's dash segments to a plain `number[]`.
 *
 * lottie passes a `Float32Array` (createTypedArray('float32', ...)). Miniapp
 * bridges (e.g. Douyin's worker<->webview) only let a plain Array survive as an
 * iterable, so the strict native `setLineDash` throws on a typed/array-like
 * argument. We therefore always hand the native context a plain `number[]`.
 *
 * Contract: null/undefined -> []; plain array, typed array, and array-like are
 * converted element-wise to numbers; a hostile/throwing iterator falls back to [].
 */
export function normalizeLineDashSegments(segments: unknown): number[] {
  if (segments == null) {
    return [];
  }
  try {
    return Array.from(segments as Iterable<unknown>, (value) => Number(value));
  } catch {
    return [];
  }
}

export function createV2Context(nativeContext: any, canvas: any) {
  if (!nativeContext || typeof nativeContext !== 'object') {
    throw new Error('rendererSettings.context should be a Canvas v2 2d context.');
  }
  if (!canvas || typeof canvas.getContext !== 'function') {
    throw new Error('setup(canvas) requires a Canvas v2 node.');
  }

  // We never mutate the caller's native context. lottie-web is handed a facade we
  // own, so our setLineDash/fill sanitizers always run -- even when the host
  // context's methods are non-writable (e.g. Douyin's worker<->webview bridge,
  // where an in-place patch silently fails and the native methods get hit raw).
  // The facade has a null prototype so `in`/`has` never leak Object.prototype
  // members, and bound native methods are cached so hot paths cost one Map.get.
  const boundMethodCache = new Map<PropertyKey, Function>();

  const facade: any = Object.create(null);
  facade.canvas = nativeContext.canvas || canvas;
  // Forward the fill rule: lottie passes a valid 'nonzero'/'evenodd' string
  // (currentStyle.r), a bridge-safe primitive, so even-odd fills render correctly.
  // (Legacy iOS WeChat needed the rule dropped; the Douyin v2 target does not.)
  facade.fill = function fill(rule?: CanvasFillRule) {
    if (typeof nativeContext.fill !== 'function') {
      return undefined;
    }
    return rule ? nativeContext.fill(rule) : nativeContext.fill();
  };
  // Coerce dashes to a plain number array: lottie passes a Float32Array
  // (createTypedArray('float32', ...)) which does not survive the miniapp bridge
  // as an iterable, so the strict native setLineDash would throw.
  facade.setLineDash = function setLineDash(segments: unknown) {
    if (typeof nativeContext.setLineDash !== 'function') {
      return undefined;
    }
    return nativeContext.setLineDash(normalizeLineDashSegments(segments));
  };

  return new Proxy(facade, {
    get(target, property) {
      const cached = boundMethodCache.get(property);
      if (cached) {
        return cached;
      }
      if (property in target) {
        return target[property];
      }

      const value = nativeContext[property as keyof typeof nativeContext];
      if (typeof value === 'function') {
        const bound = (value as Function).bind(nativeContext);
        boundMethodCache.set(property, bound);
        return bound;
      }
      return value;
    },
    set(target, property, value) {
      if (property === 'canvas') {
        target[property] = value;
      } else {
        nativeContext[property as keyof typeof nativeContext] = value;
      }
      return true;
    },
    has(target, property) {
      return property in target || property in nativeContext;
    },
  });
}

function runCanvasFrame(requestId: number, timestamp: number) {
  const task = rafTasks.get(requestId);
  if (!task || task.resolved) {
    return;
  }

  task.resolved = true;
  rafTasks.delete(requestId);
  if (typeof task.callback === 'function') {
    task.callback(timestamp);
  }
}

function cancelCanvasFrame(requestId: number) {
  const task = rafTasks.get(requestId);
  if (!task) {
    return;
  }

  rafTasks.delete(requestId);
  if (activeCanvas && task.nativeId !== undefined && typeof activeCanvas.cancelAnimationFrame === 'function') {
    activeCanvas.cancelAnimationFrame(task.nativeId);
  }
}

function cancelAllCanvasFrames() {
  Array.from(rafTasks.keys()).forEach(cancelCanvasFrame);
}

export function setup(canvas: any, options: { api?: MiniappApi | null } | null = {}) {
  if (!canvas || typeof canvas.getContext !== 'function' || typeof canvas.requestAnimationFrame !== 'function') {
    throw new Error('setup(canvas) requires a Canvas v2 node.');
  }

  if (previousState) {
    restore();
  }

  setMiniappApi(options?.api);
  g.window.devicePixelRatio = getPixelRatio();

  const nativeContext = canvas.getContext('2d');
  activeCanvas = canvas;
  activeNativeContext = nativeContext;
  activeContext = createV2Context(nativeContext, canvas);

  previousState = {
    requestAnimationFrame: g.window.requestAnimationFrame,
    cancelAnimationFrame: g.window.cancelAnimationFrame,
    body: g.document.body,
    createElement: g.document.createElement,
  };

  g.window.requestAnimationFrame = function canvasRequestAnimationFrame(callback: FrameRequestCallback) {
    const requestId = ++rafRequestId;
    const task: RafTask = {
      callback,
      nativeId: undefined,
      resolved: false,
    };

    rafTasks.set(requestId, task);
    // Drive purely off the canvas frame clock -- NO setTimeout fallback. The host
    // throttles canvas.requestAnimationFrame when the canvas is offscreen; relying
    // on it alone means the animation correctly PAUSES while offscreen, rather than
    // a timer keeping lottie producing canvas orders that the offscreen webview
    // can't drain (which accumulate unbounded and overflow the bridge on return).
    task.nativeId = canvas.requestAnimationFrame((timestamp: number) => {
      runCanvasFrame(requestId, timestamp);
    });

    return requestId;
  };
  g.window.cancelAnimationFrame = cancelCanvasFrame;
  g.document.body = {};
  g.document.createElement = createElement;

  return activeContext;
}

export function restore() {
  cancelAllCanvasFrames();
  if (previousState) {
    g.window.requestAnimationFrame = previousState.requestAnimationFrame;
    g.window.cancelAnimationFrame = previousState.cancelAnimationFrame;
    g.document.body = previousState.body;
    g.document.createElement = previousState.createElement;
  }
  activeCanvas = null;
  activeContext = null;
  activeNativeContext = null;
  previousState = null;
  setMiniappApi(null);
  g.window.devicePixelRatio = getPixelRatio();
}

export function getActiveCanvas() {
  return activeCanvas;
}

export function getActiveContext() {
  return activeContext;
}

export function getActiveNativeContext() {
  return activeNativeContext;
}
