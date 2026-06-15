import * as adapter from './adapter/index';
import { createLottieEngine } from 'virtual:lottie-canvas';
import { createLottieApi } from './runtime';

const lottieEngine = createLottieEngine(adapter);
const api = createLottieApi(lottieEngine, adapter);

export default api;
export const setup = api.setup;
export const loadAnimation = api.loadAnimation;
export const freeze = api.freeze;
export const unfreeze = api.unfreeze;
