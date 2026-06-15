declare const tt: any;
declare const wx: any;

export interface MiniappApi {
  request?: (options: Record<string, unknown>) => unknown;
  getSystemInfoSync?: () => { pixelRatio?: number };
  getSystemInfo?: (options?: Record<string, unknown>) => unknown;
  createSelectorQuery?: (...args: unknown[]) => unknown;
}

let injectedApi: MiniappApi | null = null;

export function setMiniappApi(api?: MiniappApi | null) {
  injectedApi = api || null;
}

function getGlobalMiniappApi(): MiniappApi | null {
  if (typeof tt !== 'undefined') {
    return tt;
  }
  if (typeof wx !== 'undefined') {
    return wx;
  }
  return null;
}

export function getMiniappApi(): MiniappApi | null {
  return injectedApi || getGlobalMiniappApi();
}

export function getPixelRatio() {
  const api = getMiniappApi();
  try {
    return api?.getSystemInfoSync?.().pixelRatio || 1;
  } catch {
    return 1;
  }
}
