# Gaming Canvas &middot; ![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)

![Logo](https://app.tknight.dev/docs/gaming-canvas/img/logo.webp)

Supports `CommonJS` (`.cjs`) and `ESM` (`.mjs`)

## Why This Library?

See it in action with my game: [Life](https://app.tknight.dev/game/life/index.html?perf=true). Its a multithreaded Conway's Game of Life for Desktop and Mobile devices (supports Gamepad, Keyboard, Mouse, and Touch based inputs) [[GitHub](https://github.com/tknight-dev/life)]!

**GamingCanvas** takes care of all the low level stuff that gets in the way of you just coding a game! It provides the following:

- **DPI**: Supports high/low DPI screens ([devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio))
- **Fullscreen**: Quickly fullscreen your game
- **Inputs**: Quickly gives you access to **Gamepad**, **Keyboard**, **Mouse**, and **Touch** via a serialized (FIFO) input queue
    - Enable or disable any input type you want
    - Gamepad: supports any controller type. This library includes Xbox compatible controller detection by providing mapping for easy axes and buttons use
    - Mouse: supports left, right, and wheel based inputs
    - Touch: supports as many individual inputs as your screen can support
- **Layers**: Specify how many layers you want to optimize your game for. It can generate multiple canvases for background, foreground, overlay-1, etc, etc
    - Send each layer to a different [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) to dedicate a thread to each canvas element (massive performance gains)
- **Lightweight**: Compiled/minified library is **~25kb**
- **Mobile**: Mobile devices are fully supported
- **Orientation**: Auto rotate for maximum screen usage or lock it to a specific orientation (Portrait/Landscape)
    - [Screen Orientation](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock) locking isn't supported by all browsers
- **Resolution**: Use a fixed resolution to optimize your FPS (it still scales to fill the screen like a regular video game would)
    - Dimensions are always rounded down to the nearest pixel to improve performance
    - Scaling uses the css `transform: scale(x)` function which your browser (CPU) offloads to your GPU (best performance)
- **Vibration**: Set vibration (think mobile device vibration during an incoming phone call) for single use or repeating patterns
    - Not supported by all browsers ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API))
- **Visibility**: Quickly know if your game needs to be paused (browser minimized or switched to new tab)
- **Wake Lock**: Quickly prevent mobile devices from dimming the screen while you're playing

## Documentation

Link: [Documentation](https://app.tknight.dev/docs/gaming-canvas/)

- [Quick Start](https://app.tknight.dev/docs/gaming-canvas/)
- [Tips & Tricks](https://app.tknight.dev/docs/gaming-canvas/category/tips--tricks)
- [How To](https://app.tknight.dev/docs/gaming-canvas/category/how-to)
- [Multithreading](https://app.tknight.dev/docs/gaming-canvas/category/multithreading)
- [Model Definitions](https://app.tknight.dev/docs/gaming-canvas/category/models)
- [Troubleshooting](https://app.tknight.dev/docs/gaming-canvas/troubleshooting)
- [Future Releases](https://app.tknight.dev/docs/gaming-canvas/future-releases)

[![forthebadge](https://img.shields.io/badge/made%20with-%20typescript-C1282D.svg?logo=typescript&style=for-the-badge)](https://www.typescriptlang.org/) [![forthebadge](https://img.shields.io/badge/powered%20by-%20github-7116FB.svg?logo=github&style=for-the-badge)](https://www.github.com/)
