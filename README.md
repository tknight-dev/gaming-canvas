# Gaming Canvas &middot; ![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)

![Logo](https://gaming-canvas.org/img/logo.webp)

Supports `CommonJS` (`.cjs`) and `ESM` (`.mjs`)

## Why This Library?

**GamingCanvas** is for the game developer that wants to write their own game or engine, their own way, rather than usings solutions like [PixiJs](https://pixijs.com/) and [Phaser](https://phaser.io/). It provides the following to get you up and running:

- **Audio**: The built in audio system provides buffers which allow you play multiple audio files at the same time (even the same audio file)
    - Quickly update the pan and volume of the effect or music depending on your game's environment!
    - Use faders to automatically evolve your pan and volume values to your desired settings over a duration of milliseconds
        - Use fader callback chaining to perfectly time more complicated pan and volume changes over a series of actions
- **DPI**: Supports high/low DPI screens ([devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio))
- **Fullscreen**: Quickly fullscreen your game
- **Inputs**: Quickly gives you access to **Gamepad**, **Keyboard**, **Mouse**, and **Touch** via a serialized (FIFO) input queues
    - Enable or disable any input type you want
    - Gamepad: Support currently excludes triggers due to different browser bugs/implementations of the [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API)
    - Mouse: Supports left, right, and wheel based inputs
    - Touch: Supports as many individual inputs as your screen can support
- **Layers**: Specify how many layers you want to optimize your game for. It can generate multiple canvases for background, foreground, overlay-1, etc, etc
    - Send each layer to a different [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) to dedicate a thread to each canvas element (massive performance gains)
- **Lists**: Provides `List` implementions where `Array` performance faulters
    - Double-Linked-List
    - FIFO Queue (Single-Linked-List without `popEnd()` or `pushStart()`)
- **Lightweight**: Core library is **~40kb**
- **Modules**
    - **Grids**: Includes _Grid_, _Camera_, and _Viewport_ implementations (including _Raycasting_!). See [How-To > Module: Grids](https://gaming-canvas.org/how-to/module-grids) for all the features and details
- **Mobile**: Mobile devices are fully supported
- **Orientation**: Auto rotate for maximum screen usage or lock it to a specific orientation (Portrait/Landscape)
    - [Screen Orientation](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock) locking isn't supported by all browsers
- **Resolution**: Use a fixed resolution to optimize your FPS (it still scales to fill the screen like a regular video game would)
    - Dimensions are always rounded down to the nearest pixel to improve performance
    - Scaling uses the css `transform: scale(x)` function which your browser (CPU) offloads to your GPU (best performance)
    - Use the `aspectRatio` option to fix your display to something like `1 / 1 `, `4 / 3`, and `16 / 9` (the default)
- **Vibration**: Set vibration (think mobile device vibration during an incoming phone call) for single use or repeating patterns
    - Not supported by all browsers ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API))
- **Visibility**: Quickly know if your game needs to be paused (browser minimized or switched to new tab)
- **Wake Lock**: Quickly prevent mobile devices from dimming the screen while you're playing

See it in action with my game: [Life](https://app.tknight.dev/game/life/index.html?perf=true). Its a multithreaded Conway's Game of Life for Desktop and Mobile devices (supports Gamepad, Keyboard, Mouse, and Touch based inputs) [[GitHub](https://github.com/tknight-dev/life)]!

## Documentation

Link: [Documentation](https://gaming-canvas.org/)

- [Quick Start](https://gaming-canvas.org/)
- [How-To](https://gaming-canvas.org/category/how-to)
- [Model Definitions](https://gaming-canvas.org/category/model-definitions)
- [Tips & Tricks](https://gaming-canvas.org/category/tips--tricks)
- [Troubleshooting](https://gaming-canvas.org/troubleshooting)

[![forthebadge](https://img.shields.io/badge/made%20with-%20typescript-C1282D.svg?logo=typescript&style=for-the-badge)](https://www.typescriptlang.org/) [![forthebadge](https://img.shields.io/badge/powered%20by-%20github-7116FB.svg?logo=github&style=for-the-badge)](https://www.github.com/)
