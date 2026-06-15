# lottie-miniprogram-v2

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Canvas](https://img.shields.io/badge/canvas-v2-green.svg)](https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/component/canvas/canvas)

English | [简体中文](README-CN.md)

Canvas v2 only Lottie player for Douyin Mini App and compatible mini program runtimes.

This project originates from and references [`wechat-miniprogram/lottie-miniprogram`](https://github.com/wechat-miniprogram/lottie-miniprogram). It targets the Canvas v2 node API and is not a Canvas v1 compatible fork.

## Support

- Douyin Mini App Canvas v2: `<canvas type="2d" />`.
- Compatible mini program Canvas v2 runtimes.
- Canvas nodes from `createSelectorQuery().select(...).node(...)`.
- Local `animationData`.
- Remote `path` values that use `http` or `https`.
- Common canvas renderer options such as `loop`, `autoplay`, `clearCanvas`, and `rendererSettings.context`.
- Canvas fill-rule arguments, including `evenodd`, forwarded to the native context.

## Not Supported

- Canvas v1 APIs such as `tt.createCanvasContext` or `canvas-id`.
- Browser DOM options such as `wrapper` or `container`.
- Non-http(s) `path` values.
- Lottie expressions in mini program runtime.
- `miniprogram_dist`; this package uses standard `lib` package output.

## Installation

```sh
pnpm add lottie-miniprogram-v2
```

## Quick Start

### Douyin Mini App

```xml
<canvas id="lottie" type="2d" style="width: 320px; height: 320px;" />
```

```js
const lottie = require('lottie-miniprogram-v2');
const animationData = require('../../assets/lottie.json');

Page({
  onReady() {
    tt.createSelectorQuery()
      .select('#lottie')
      .node((res) => {
        const canvas = res.node;
        const context = canvas.getContext('2d');

        lottie.setup(canvas);
        this.animation = lottie.loadAnimation({
          loop: true,
          autoplay: true,
          animationData,
          rendererSettings: {
            context,
          },
        });
      })
      .exec();
  },

  onUnload() {
    if (this.animation) {
      this.animation.destroy();
    }
  },
});
```

### Taro

```jsx
import Taro from '@tarojs/taro';
import { Canvas } from '@tarojs/components';
import lottie from 'lottie-miniprogram-v2';
import animationData from '../../assets/lottie.json';

export default function Index() {
  Taro.useReady(() => {
    Taro.createSelectorQuery()
      .select('#lottie')
      .node((res) => {
        const canvas = res.node;
        const context = canvas.getContext('2d');

        lottie.setup(canvas, { api: Taro });
        lottie.loadAnimation({
          loop: true,
          autoplay: true,
          animationData,
          rendererSettings: {
            context,
          },
        });
      })
      .exec();
  });

  return <Canvas id="lottie" type="2d" style={{ width: '320px', height: '320px' }} />;
}
```

## Usage

Call `setup(canvas)` once after you obtain the Canvas v2 node, then pass the Canvas v2 2d context to `loadAnimation`.

```js
const context = canvas.getContext('2d');
lottie.setup(canvas);

const animation = lottie.loadAnimation({
  loop: true,
  autoplay: true,
  animationData,
  rendererSettings: {
    context,
  },
});

animation.destroy();
```

`setup(canvas)` also returns the same prepared native context when the platform exposes a stable context object, but using `canvas.getContext('2d')` remains the recommended Canvas v2 usage.

If `tt` is scoped to the current page/component model, pass it explicitly:

```js
lottie.setup(canvas, { api: this.tt });
```

## License

MIT. See [LICENSE](LICENSE).

## Acknowledgements

- Originates from and references [`wechat-miniprogram/lottie-miniprogram`](https://github.com/wechat-miniprogram/lottie-miniprogram), licensed under MIT with `Copyright (c) 2019 wechat-miniprogram`.
- Uses the `lottie-web` canvas renderer, licensed under MIT with `Copyright (c) 2015 Bodymovin`.
