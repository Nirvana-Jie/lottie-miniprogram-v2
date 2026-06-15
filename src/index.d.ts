type BaseRendererConfig = {
  imagePreserveAspectRatio?: string;
  className?: string;
};

type CanvasRendererConfig = BaseRendererConfig & {
  clearCanvas?: boolean;
  context: CanvasRenderingContext2D;
  progressiveLoad?: boolean;
  preserveAspectRatio?: string;
};

export interface LoadAnimationParameter {
  renderer?: 'canvas';
  loop?: boolean | number;
  autoplay?: boolean;
  name?: string;
  rendererSettings: CanvasRendererConfig;
  animationData?: any;
  path?: string;
}

type AnimationDirection = 1 | -1;
type AnimationSegment = [number, number];
type AnimationEventName = 'enterFrame' | 'loopComplete' | 'complete' | 'segmentStart' | 'destroy';
type AnimationEventCallback<T = any> = (args: T) => void;

export interface LoadAnimationReturnType {
  play(): void;
  stop(): void;
  pause(): void;
  setSpeed(speed: number): void;
  goToAndPlay(value: number, isFrame?: boolean): void;
  goToAndStop(value: number, isFrame?: boolean): void;
  setDirection(direction: AnimationDirection): void;
  playSegments(segments: AnimationSegment | AnimationSegment[], forceFlag?: boolean): void;
  setSubframe(useSubFrames: boolean): void;
  destroy(): void;
  getDuration(inFrames?: boolean): number;
  triggerEvent<T = any>(name: AnimationEventName, args: T): void;
  addEventListener<T = any>(name: AnimationEventName, callback: AnimationEventCallback<T>): void;
  removeEventListener<T = any>(name: AnimationEventName, callback: AnimationEventCallback<T>): void;
}

export interface MiniappApi {
  request?: (options: Record<string, unknown>) => unknown;
  getSystemInfoSync?: () => { pixelRatio?: number };
  getSystemInfo?: (options?: Record<string, unknown>) => unknown;
  createSelectorQuery?: (...args: unknown[]) => unknown;
}

export interface SetupOptions {
  api?: MiniappApi | null;
}

declare const lottie: {
  setup(canvas: any, options?: SetupOptions | null): CanvasRenderingContext2D;
  loadAnimation(options: LoadAnimationParameter): LoadAnimationReturnType;
  freeze(): void;
  unfreeze(): void;
};

export default lottie;
