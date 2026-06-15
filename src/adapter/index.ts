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
let previousState: any = null;
let rafRequestId = 0;

type RafTask = {
  callback: FrameRequestCallback;
  fallbackId: ReturnType<typeof setTimeout> | null;
  dispatchId: ReturnType<typeof setTimeout> | null;
  nativeId: unknown;
  resolved: boolean;
};

const rafTasks = new Map<number, RafTask>();
const patchedNativeContexts = new WeakSet<object>();

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

export function createV2Context(nativeContext: any, canvas: any) {
  if (!nativeContext || typeof nativeContext !== 'object') {
    throw new Error('rendererSettings.context should be a Canvas v2 2d context.');
  }
  if (!canvas || typeof canvas.getContext !== 'function') {
    throw new Error('setup(canvas) requires a Canvas v2 node.');
  }

  if (!nativeContext.canvas) {
    try {
      nativeContext.canvas = canvas;
    } catch {}
  }

  if (!nativeContext.canvas) {
    throw new Error('Canvas v2 context must expose context.canvas for lottie-web canvas renderer.');
  }

  patchNativeContextMethods(nativeContext);

  return nativeContext;
}

function patchNativeContextMethods(nativeContext: any) {
  if (patchedNativeContexts.has(nativeContext)) {
    return;
  }

  let patched = true;
  const nativeFill = nativeContext.fill;
  if (typeof nativeFill === 'function') {
    try {
      // Match upstream mini program behavior: ignore fill-rule arguments to avoid legacy iOS WeChat crashes.
      nativeContext.fill = function fill() {
        return nativeFill.call(nativeContext);
      };
    } catch {
      patched = false;
    }
  }

  const nativeSetLineDash = nativeContext.setLineDash;
  if (typeof nativeSetLineDash === 'function') {
    try {
      nativeContext.setLineDash = function setLineDash(segments: Iterable<unknown>) {
        return nativeSetLineDash.call(nativeContext, Array.from(segments || []).map(Number));
      };
    } catch {
      patched = false;
    }
  }

  if (patched) {
    patchedNativeContexts.add(nativeContext);
  }
}

function runCanvasFrame(requestId: number, timestamp: number) {
  const task = rafTasks.get(requestId);
  if (!task || task.resolved) {
    return;
  }

  task.resolved = true;
  if (task.fallbackId) {
    clearTimeout(task.fallbackId);
    task.fallbackId = null;
  }

  rafTasks.delete(requestId);
  if (typeof task.callback === 'function') {
    task.callback(timestamp);
  }
}

function deferCanvasFrame(requestId: number, timestamp: number) {
  const task = rafTasks.get(requestId);
  if (!task || task.resolved) {
    return;
  }

  task.resolved = true;
  if (task.fallbackId) {
    clearTimeout(task.fallbackId);
    task.fallbackId = null;
  }

  task.dispatchId = setTimeout(() => {
    if (!rafTasks.has(requestId)) {
      return;
    }
    rafTasks.delete(requestId);
    if (typeof task.callback === 'function') {
      task.callback(timestamp);
    }
  }, 0);
}

function dispatchCanvasFrame(requestId: number, timestamp: number, defer: boolean) {
  if (defer) {
    deferCanvasFrame(requestId, timestamp);
  } else {
    runCanvasFrame(requestId, timestamp);
  }
}

function cancelCanvasFrame(requestId: number) {
  const task = rafTasks.get(requestId);
  if (!task) {
    return;
  }

  rafTasks.delete(requestId);
  if (task.fallbackId) {
    clearTimeout(task.fallbackId);
  }
  if (task.dispatchId) {
    clearTimeout(task.dispatchId);
  }
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
      fallbackId: null,
      dispatchId: null,
      nativeId: undefined,
      resolved: false,
    };

    rafTasks.set(requestId, task);
    task.fallbackId = setTimeout(() => {
      dispatchCanvasFrame(requestId, Date.now(), false);
    }, 100);

    let requestingNativeFrame = true;
    task.nativeId = canvas.requestAnimationFrame((timestamp: number) => {
      dispatchCanvasFrame(requestId, timestamp, requestingNativeFrame);
    });
    requestingNativeFrame = false;

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
