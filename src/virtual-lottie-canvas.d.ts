declare module 'virtual:lottie-canvas' {
  import type { Adapter, LottieEngine } from './runtime';

  export function createLottieEngine(adapter: Adapter & { g: any }): LottieEngine;
}
