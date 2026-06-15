# lottie-miniprogram-v2

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Canvas](https://img.shields.io/badge/canvas-v2-green.svg)](https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/component/canvas/canvas)

[English](README.md) | 简体中文

面向抖音小程序和兼容小程序运行时的 Canvas v2 only Lottie 播放包。

本项目来源于并参考了 [`wechat-miniprogram/lottie-miniprogram`](https://github.com/wechat-miniprogram/lottie-miniprogram)。本包只面向 Canvas v2 节点 API，不是继续兼容 Canvas v1 的 fork。

## 支持

- 抖音小程序 Canvas v2：`<canvas type="2d" />`。
- 兼容的小程序 Canvas v2 运行时。
- 通过 `createSelectorQuery().select(...).node(...)` 获取的 canvas 节点。
- 本地 `animationData`。
- 使用 `http` 或 `https` 的远程 `path`。
- 常见 canvas renderer 配置，例如 `loop`、`autoplay`、`clearCanvas` 和 `rendererSettings.context`。

## 不支持

- `tt.createCanvasContext` 或 `canvas-id` 等 Canvas v1 API。
- `wrapper` 或 `container` 等浏览器 DOM 参数。
- 非 http(s) 的 `path`。
- 小程序运行时里的 Lottie expression。
- 精确的 `evenodd` 填充规则渲染。为保持上游小程序兼容策略并规避老 iOS 微信崩溃，`fill(rule)` 的参数会被有意忽略。
- 不包含 `miniprogram_dist`；本包使用标准 `lib` 包产物。

## 安装

```sh
pnpm add lottie-miniprogram-v2
```

## 快速开始

### 抖音小程序

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

## 使用方式

获取 Canvas v2 节点后先调用 `setup(canvas)`，再把 Canvas v2 的 2d context 传给 `loadAnimation`。

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

当平台返回稳定的 context 对象时，`setup(canvas)` 也会返回同一个已准备好的原生 context；但推荐用法仍然是抖音 Canvas v2 官方的 `canvas.getContext('2d')`。

如果 `tt` 只挂在当前 page/component model 上，请显式传入：

```js
lottie.setup(canvas, { api: this.tt });
```

## License

MIT。详见 [LICENSE](LICENSE)。

## 致谢

- 本项目来源于并参考 [`wechat-miniprogram/lottie-miniprogram`](https://github.com/wechat-miniprogram/lottie-miniprogram)，原项目采用 MIT License，版权声明为 `Copyright (c) 2019 wechat-miniprogram`。
- 使用 `lottie-web` canvas renderer，`lottie-web` 采用 MIT License，版权声明为 `Copyright (c) 2015 Bodymovin`。
