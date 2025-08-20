# Gaming Canvas &middot; ![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)

Supports `CommonJS` (`.cjs`) and `ESM` (`.mjs`)

## Why This Library?

See it in action with my game: [Life](https://app.tknight.dev/game/life/index.html?perf=true). Its a multithreaded Conway's Game of Life for Desktop and Mobile devices (supports Gamepad, Keyboard, Mouse, and Touch based inputs) [[GitHub](https://github.com/tknight-dev/life)]!

**GamingCanvas** takes care of all the low level stuff that gets in the way of you just coding a game! It provides the following:

- **DPI**: Supports high/low DPI screens ([devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio))
- **Fullscreen**: Quickly fullscreen your game
- **Inputs**: Quickly gives you access to **Gamepad**, **Keyboard**, **Mouse**, and **Touch** via a serialized (FIFO) input queue
    - Enable or disable any input type you want
    - Gamepad: supports any controller type. This library includes XBox compatible controller detection providing mapping for axes and buttons
    - Mouse: supports left, right, and wheel based inputs
    - Touch: supports as many individual inputs as your screen can support
- **Layers**: Specify how many layers you want to optimize your game for. It can generate multiple canvases for background, foreground, overlay-1, etc, etc
    - Send each layer to a different [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) to dedicate a thread to each canvas element (massive performance gains)
- **Lightweight**: Compiled/minified library is less than **20kb**
- **Mobile**: Mobile devices are fully supported
- **Orientation**: Auto rotate for maximum screen usage or lock it to a specific orientation (Portrait/Landscape)
    - Device level orientation locking isn't supported by all browsers
- **Resolution**: Use a fixed resolution to optimize your FPS (it still scales to fill the screen like a regular video game would)
    - Dimensions are always rounded down to the nearest pixel to improve performance
    - Scaling uses the css `transform: scale(x)` function which your browser (CPU) offloads to your GPU (best performance)
- **Visibility**: Quickly know if your game needs to be paused (browser minimized or switched to new tab)
- **Wake Lock**: Quickly prevent mobile devices from dimming the screen while you're playing

## Installation

- NPM: `npm i @tknight-dev/gaming-canvas`
- Yarn: `yarn add @tknight-dev/gaming-canvas`

## Getting Started

```html
<div class="title"><h1>My Game Title</h1></div>
<div class="game" id="hook-for-fullscreen">
    <div class="container" id="hook-for-gaming-canvas"></div>
    <div class="overlay-1"><!-- ... --></div>
</div>
```

```typescript
import { GamingCanvas, GamingCanvasSetSize } from '@tknight-dev/gaming-canvas';

// The HTML element containing your game
const container: HTMLElement = document.getElementById('hook-for-gaming-canvas') as HTMLElement;

// The GamingCanvas returns the newly generated canvas element(s)
const canvases: HTMLCanvasElement[] = GamingCanvas.initialize(container);

// Select the canvas you want to draw on
const canvas: HTMLCanvasElement = canvases[0]; // There will always be atleast 1 canvas generated
const canvasContext: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

// You have to set the dimensions of the canvas as modifying the height/width also clears the canvas
GamingCanvasSetSize(canvas);

// Draw
canvasContext.font = '48px serif';
canvasContext.fillText('Hello world', canvas.width / 3, canvas.height / 2);
```

## Models: GamingCanvasDirection (enum)

| Key      | Description                   |
| -------- | ----------------------------- |
| NORMAL   | Left-To-Right & Top-To-Bottom |
| INVERTED | Right-To-Left & Bottom-To-Top |

## Models: GamingCanvasInputGamepad (interface)

Describes `.propriatary` object. Note: Repeating events (button held down, stick pushed in a direction) are filtered out

| Key       | type                                   | Description                                                                                                           |
| --------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| axes?     | number[]                               | Array following the following pattern: [x1, y1, x2, y2, ... ]. Only populated if changes detected to reduce bloat.    |
| buttons?  | { [key: number]: boolean }             | Array following the following pattern: { buttonNumber: pressed }. Only populated if changes detected to reduce bloat. |
| connected | boolean                                | Is the gamepad connected?                                                                                             |
| id        | string                                 | Id provided by the gamepad hardware. EG: '0000-0000-Xbox Wireless Controller'                                         |
| idCustom  | number                                 | Simple number for id instead of string. As strings are just arrays of ASCII numbers which is slower to compare.       |
| type      | GamingCanvasInputGamepadControllerType | Can detect: Xbox                                                                                                      |

## Models: GamingCanvasInputGamepadControllerTypeXboxAxes (interface)

| Key          | type   | range   | Description                                         |
| ------------ | ------ | ------- | --------------------------------------------------- |
| stickLeftX   | number | -1 to 1 | Resting: 0, Left: -1, Right: 1                      |
| stickLeftY   | number | -1 to 1 | Resting: 0, Away from player: 1, Towards player: -1 |
| stickRightX  | number | -1 to 1 | Resting: 0, Left: -1, Right: 1                      |
| stickRightY  | number | -1 to 1 | Resting: 0, Away from player: 1, Towards player: -1 |
| triggerLeft  | number | 0 to 1  | Resting: 0, Pressed Down: 1                         |
| triggerRight | number | 0 to 1  | Resting: 0, Pressed Down: 1                         |

## Models: GamingCanvasInputKeyboard (interface)

Describes `.propriatary` object

| Key    | type                            | Description                                               |
| ------ | ------------------------------- | --------------------------------------------------------- |
| action | GamingCanvasInputKeyboardAction | See `Models: GamingCanvasInputKeyboardAction (interface)` |
| down   | boolean                         | Is the key pressed down?                                  |

## Models: GamingCanvasInputKeyboardAction (interface)

See: [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent). Note: Repeating events (button held down) are filtered out

| Key      | Description                                                                                  |
| -------- | -------------------------------------------------------------------------------------------- |
| code     | Based `KeyboardEvent.code`                                                                   |
| key      | Based on `KeyboardEvent.key`                                                                 |
| keyCtrl  | Based `KeyboardEvent.ctrlKey`                                                                |
| keyShift | Based on `KeyboardEvent.shiftKey`                                                            |
| location | Uses `GamingCanvasInputKeyboardActionLocation` enum and is based on `KeyboardEvent.location` |

## Models: GamingCanvasInputMouse (interface)

Describes `.propriatary` object

| Key      | type                         | Description                                            |
| -------- | ---------------------------- | ------------------------------------------------------ |
| action   | GamingCanvasInputMouseAction | See `Models: GamingCanvasInputMouseAction (interface)` |
| down?    | boolean                      | Is the key pressed down?                               |
| position | GamingCanvasInputPosition    | Describes where the mouse was relative to the canvas   |

## Models: GamingCanvasInputMouseAction (enum)

| Key         | Description                   |
| ----------- | ----------------------------- |
| LEFT        | Based `mousedown` & `mouseup` |
| LEFT_CLICK  | Based on `click`              |
| RIGHT       | Based `mousedown` & `mouseup` |
| RIGHT_CLICK | Based on `click`              |
| MOVE        | Based on `mousemove`          |
| SCROLL      | Based on `wheel`              |
| WHEEL       | Based `mousedown` & `mouseup` |
| WHEEL_CLICK | Based on `click`              |

## Models: GamingCanvasInputPosition (interface)

| Key       | Type    | Description                                                                                                               |
| --------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| out       | boolean | true if the position is on the absolute edge or outside of the canvas (`elementInteractive` should be larger than canvas) |
| x         | number  | x coordinate                                                                                                              |
| xRelative | number  | x coordinate relative to the width                                                                                        |
| y         | number  | y coordinate                                                                                                              |
| yRelative | number  | y coordinate relative to the height                                                                                       |

## Models: GamingCanvasInputTouch (interface)

Describes `.propriatary` object

| Key      | type                         | Description                                             |
| -------- | ---------------------------- | ------------------------------------------------------- |
| action   | GamingCanvasInputTouchAction | See `Models: GamingCanvasInputTouchAction (interface)`  |
| down?    | boolean                      | Is the key pressed down?                                |
| position | GamingCanvasInputPosition[]  | Describes where the touches were relative to the canvas |

## Models: GamingCanvasInputTouchAction (enum)

| Key    | Description                                        |
| ------ | -------------------------------------------------- |
| ACTIVE | Based on `touchcancel` & `touchend` & `touchstart` |
| MOVE   | Based on `touchmove`                               |

## Models: GamingCanvasOptions (interface)

| Key                                 | Type                    | Default  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------- | ----------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| aspectRatio?                        | number                  | 16 / 9   | 1920x1080 (1080p) is a 16/9 aspect ratio                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| callbackDisplayLimitPerMs?          | number                  | 8ms      | Limits how often the callbackDisplay() can be called in milliseconds (0 is unlimited)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| canvasCount?                        | number                  | 1        | How many canvas elements (layers) to be generated (canvas1: id=`gaming-canvas-canvas1`, zIndex=2; canvas2: id=`gaming-canvas-canvas2`, zIndex=3, ... )                                                                                                                                                                                                                                                                                                                                                                                                               |
| debug?                              | boolean                 | false    | Enables colors for HTML elements involved in the rotation process (see it in action [Life](https://app.tknight.dev/game/life/index.html?debug=true&drawDead=false&seedRandom=false)                                                                                                                                                                                                                                                                                                                                                                                  |
| direction?                          | GamingCanvasDirection   | `NORMAL` | `INVERTED` rotates the canvas to left instead of the right in `PORTRAIT` mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| directionPreventLandscapeInversion? | boolean                 | true     | Prevent `LANDSCAPE` from becoming upside-down, but allow `PORTRAIT` to invert-rotate                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| elementInject?                      | HTMLElement[]           | []       | Elements are injected into the canvas container element (id=`gaming-canvas-container`). Use CSS position `absolute` to fit your overlay relative to the canvas's dynamic position and size                                                                                                                                                                                                                                                                                                                                                                           |
| elementInteractive?                 | HTMLElement             | canvas   | The input listeners are bound to this element, but `GamingCanvasInputPosition` is always relative to the canvas. This element should be equal to or larger then the canvas in all dimensions. EG the canvas is zIndex=2, an overlay(s) is zIndex=3, so the interactive elment should be a super overlay at zIndex=4 as the overlay(s) at zIndex=3 would intercept input liseners at zIndex=2 unless `pointer-events` and `touch-events` are set to `none` on the CSS for the overlay(s). Note: the canvas with the highest zIndex is the default elementInteractive. |
| inputGamepadEnable                  | boolean                 | false    | Enables the serialization of Gamepad based inputs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| inputGamepadDeadbandStick?          | number                  | 0.08     | Stick inputs in the deadband are set to 0. IE if x > -deadband and x < deadband then x is 0 where x is any number between -1 and 1. Note: Deadband is not applied to non-xbox identified controllers                                                                                                                                                                                                                                                                                                                                                                 |
| inputGamepadDeadbandTrigger?        | number                  | 0.01     | Trigger inputs in the deadband are set to 0. IE if x < deadband then x is 0 where x is any number between -1 and 1. Note: Deadband is not applied to non-xbox identified controllers                                                                                                                                                                                                                                                                                                                                                                                 |
| inputKeyboardEnable?                | boolean                 | false    | Enables the serialization of Keyboard based inputs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| inputMouseEnable?                   | boolean                 | false    | Enables the serialization of Mouse based inputs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| inputMousePreventContextMenu?       | boolean                 | false    | Prevents the right-click context menu from appearing inputs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| inputTouchEnable?                   | boolean                 | false    | Enables the serialization of Touch based inputs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| inputLimitPerMs?                    | number                  | 8ms      | Limits how often anolog controls (gamepad-joystick and touch) are accepted (0 is unlimited)                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| orientation?                        | GamingCanvasOrientation | `AUTO`   | `AUTO` will dynamically rotate the canvas to optimize screen usage                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| resolutionByHeightPx?               | number or `null`        | `null`   | `null` sets the canvas dimensions, and not `null` scales the canvas dimensions to fit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| resolutionScaleToFit?               | boolean                 | true     | Enables the scalling feature of `resolutionByHeightPx` when using a non-null value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Models: GamingCanvasOrientation (enum)

| Key       | Description         |
| --------- | ------------------- |
| AUTO      | Rotate for best fit |
| LANDSCAPE | Wide                |
| PORTRAIT  | Tall                |

## Models: GamingCanvasReport (interface)

| Key                | type                    | Description                                             |
| ------------------ | ----------------------- | ------------------------------------------------------- |
| canvasHeight       | number                  | Dimension of the canvas                                 |
| canvasHeightScaled | number                  | Dimension of the canvas after scaling                   |
| canvasWidth        | number                  | Dimension of the canvas                                 |
| canvasWidthScaled  | number                  | Dimension of the canvas after scaling                   |
| devicePixelRatio   | number                  | DPI ratio of the screen                                 |
| orientation        | GamingCanvasOrientation | Current orientation                                     |
| scaler             | number                  | Factor used to grow/shrink height/width to scaled value |

## How To: Canvas with Dynamic Resolution (no set resolution)

```typescript
import { GamingCanvas, GamingCanvasReport, GamingCanvasSetSize } from '@tknight-dev/gaming-canvas';

// The HTML element containing your game
const container: HTMLElement = document.getElementById('hook-for-gaming-canvas') as HTMLElement;

// The GamingCanvas returns the newly generated canvas element(s)
const canvases: HTMLCanvasElement[] = GamingCanvas.initialize(container);

// Select the canvas you want to draw on
const canvas: HTMLCanvasElement = canvases[0];
const canvasContext: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

// Define what you want to draw
const draw = () => {
    canvasContext.font = '48px serif';
    canvasContext.fillText('Hello world', canvas.width / 3, canvas.height / 2);
};

// Updates on display changes (orientation, resize, and rotation)
GamingCanvas.setCallbackReport((report: GamingCanvasReport) => {
    // Report contains all the necessary information to adjust the dimensions of a canvas
    // If multithreading, you'll need to pass the report to the WebWorker, using the OffscreenCanvas, to set the canvas dimensions and draw from there
    GamingCanvasSetSize(canvas, report);
    draw(); // Remember, changing the canvas size clears it as well
});

// Set the initial canvas size and draw
GamingCanvasSetSize(canvas);
draw();
```

## How To: Fullscreen

Here is some example code to use in your main thread (not a [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers))

```typescript
import { GamingCanvas } from '@tknight-dev/gaming-canvas';

GamingCanvas.setCallbackFullscreen((state: boolean) => {
    // state is true when in fullscreen mode (is triggered when ESC key is used to exit fullscreen instead of a function call)
});

// This sets the canvas as the fullscreen element
await GamingCanvas.setFullscreen(true);

// This sets whatever you want as the fullscreen element
await GamingCanvas.setFullscreen(true, document.getElementById('hook-for-fullscreen'));

setTimeout(() => {
    // This will close the fullscreen no matter what the original element was
    GamingCanvas.setFullscreen(false);
}, 1000);
```

## How To: Inputs

Here is some example code to use in your main thread (not a [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers))

```typescript
import {
    GamingCanvas,
    GamingCanvasFIFOQueue,
    GamingCanvasInput,
    GamingCanvasInputGamepad,
    GamingCanvasInputGamepadControllerType,
    GamingCanvasInputGamepadControllerTypeXboxAxes,
    GamingCanvasInputGamepadControllerTypeXboxButtons,
    GamingCanvasInputGamepadControllerTypeXboxToAxes,
    GamingCanvasInputKeyboard,
    GamingCanvasInputMouse,
    GamingCanvasInputPosition,
    GamingCanvasInputPositionDistance,
    GamingCanvasInputTouch,
    GamingCanvasInputType,
} from '@tknight-dev/gaming-canvas';

let gamepadAxes: GamingCanvasInputGamepadControllerTypeXboxAxes,
    gamepadZoom: number = 0,
    queue: GamingCanvasFIFOQueue<GamingCanvasInput> = GamingCanvas.getInputQueue(),
    queueInput: GamingCanvasInput | undefined,
    queueQuit: boolean = false,
    queueRequest: number;

const processor = (timestampNow: number) => {
    // Start the request for the next frame before processing the data (faster)
    queueRequest = requestAnimationFrame(processor);

    while (!queueQuit && (queueInput = queue.pop())) {
        // This function automatically adjusts the (x,y) coordinates based on the current rotational state of the canvas
        GamingCanvas.relativizeInput(queueInput);

        switch (queueInput.type) {
            case GamingCanvasInputType.GAMEPAD:
                processorGamepad(queueInput, timestampNow);
                break;
            case GamingCanvasInputType.KEYBOARD:
                processorKeyboard(queueInput, timestampNow);
                break;
            case GamingCanvasInputType.MOUSE:
                processorMouse(queueInput, timestampNow);
                break;
            case GamingCanvasInputType.TOUCH:
                processorTouch(queueInput, timestampNow);
                break;
        }
    }
};

setInterval(() => {
    gamepadZoom !== 0 && myGameLogic.applyZoom(gamepadZoom);
}, 40); // How often you want non-zero gamepad values to repeat their effects in your game
const processorGamepad = (input: GamingCanvasInputGamepad, timestampNow: number) => {
    console.log('Input-Gamepad', input, timestampNow);

    // Check the connection state
    if (input.propriatary.connected) {
        if (input.propriatary.axes || input.propriatary.buttons) {
            // New inputs
            if (input.propriatary.type === GamingCanvasInputGamepadControllerType.XBOX) {
                if (input.propriatary.axes) {
                    gamepadAxes = GamingCanvasInputGamepadControllerTypeXboxToAxes(input);

                    /*
                     * Holding the stick or trigger down to the max will only yield -1 or 1 for one input event (doesn't repeat). If you
                     *  want the input to continue applying that value then you'll need to do something like this. See `setInterval()` above
                     */
                    gamepadZoom = Math.max(-1, Math.min(1, gamepadAxes.stickRightY + gamepadAxes.triggerRight - gamepadAxes.triggerLeft));
                }

                if (input.propriatary.buttons) {
                    for (const [buttonNumber, pressed] of Object.entries(input.propriatary.buttons)) {
                        switch (Number(buttonNumber)) {
                            case GamingCanvasInputGamepadControllerTypeXboxButtons.DPAD_UP:
                                if (pressed) {
                                    // Move player up
                                }
                                break;
                        }
                    }
                }
            } else {
                // Parse axes and buttons yourself
            }
        } else {
            // Controller connected
        }
    } else {
        // Controller disconnected
    }
};

const processorKeyboard = (input: GamingCanvasInputKeyboard, timestampNow: number) => {
    console.log('Input-Keyboard', input, timestampNow);

    if (input.propriatary.down) {
        switch (input.propriatary.action.code) {
            case 'KeyF':
                // Pay respect
                break;
        }
    }

    // or track the state
    // state[input.propriatary.action.code] = input.propriatary.down;
};

const processorMouse = (input: GamingCanvasInputMouse, timestampNow: number) => {
    console.log('Input-Mouse', input, timestampNow);

    if (input.propriatary.action === GamingCanvasInputMouseAction.LEFT_CLICK) {
        // Fire!
    }
};

const processorTouch = (input: GamingCanvasInputTouch, timestampNow: number) => {
    console.log('Input-Touch', input, timestampNow);

    // Not all touch events, like other input types, have positions associated with them
    const positions: GamingCanvasInputPosition | undefined = input.propriatary.positions;

    if (positions && positions.length > 1) {
        console.log(' >> distance between touches', GamingCanvasInputPositionDistance(positions[0], positions[1]));
        console.log(' >> distance between touches relative', GamingCanvasInputPositionDistanceRelative(positions[0], positions[1]));
    }
};

// Start processing inputs
queueRequest = requestAnimationFrame(processor);

// Stop processing inputs
setTimeout(() => {
    /*
     *  Warning: not processing the inputs will eventually hit a queue size soft limit, and give a buffer overflow console error. Make sure to suspend further inputs.
     */
    cancelAnimationFrame(queueRequest);
    queueQuit = true;

    setInputActive(false); // Stop accepting inputs
    clearInputQueue(); // Clear any inputs still in the queue to be processed. Watch out for keyboard/mouse/touch inputs that never registered a buttonUp event.
}, 1000);
```

## How To: Screenshot

The screenshot function returns a `PNG` of every canvas layer in one image. Below is some example code on how to download it.

```typescript
import { GamingCanvas } from '@tknight-dev/gaming-canvas';

// ...
GamingCanvas.initialize(MyElement, {
    canvasCount: 5, // 5 different canvas element layers
});
// ...

// Get all 5 layers into one image
const blob: Blob | null = await GamingCanvas.screenshot();

if (blob) {
    const a: HTMLAnchorElement = document.createElement('a'),
        objectURL: string = URL.createObjectURL(blob);

    // Set anchor
    a.download = 'screenshot.png';
    a.href = objectURL;

    // Download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
        URL.revokeObjectURL(objectURL);
    }, 1000); // Wait some time to revoke or the browser may get fussy
}
```

## How To: Visibility

Here is some example code to use in your main thread (not a [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers))

```typescript
import { GamingCanvas } from '@tknight-dev/gaming-canvas';

GamingCanvas.setCallbackVisibility((state: boolean) => {
    // state is false for things like the browser being minimized or switched to a new tab

    if (!state) {
        // You may want to pause your game here
    }
});
console.log('Visible?', GamingCanvas.isVisible());
```

## How To: Wake Lock

> As per MDN: This feature is available only in secure contexts (HTTPS)

A 3rd party library (like [NoSleep.js](https://github.com/richtr/NoSleep.js)) is required when attempting to lock without HTTPs

```typescript
import { GamingCanvas } from '@tknight-dev/gaming-canvas';

// GamingCanvas will automatically toggle the lock if the visibility (See `How To: Visibility`) is ever false
if (GamingCanvas.isWakeLockSupported()) {
    GamingCanvas.wakeLock(true); // Enable it
}
```

## Troubleshooting

- `GamingCanvas > GamingCanvasFIFOQueue: input overflow [limit=*]`
    - Make sure you are processing the inputs by removing them from the queue, or disable the inputs. See section `How To: Inputs`

## Future Releases

- Add feature to replace need for `NoSleep.js` (see `How To: Screen Dimming (Power Saving Mode)`)
- Add `GamingCanvasFIFOQueue` binary encoder/decorder for sending input chunks between [WebWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) via [TransferableObjects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)

[![forthebadge](https://img.shields.io/badge/made%20with-%20typescript-C1282D.svg?logo=typescript&style=for-the-badge)](https://www.typescriptlang.org/) [![forthebadge](https://img.shields.io/badge/powered%20by-%20github-7116FB.svg?logo=github&style=for-the-badge)](https://www.github.com/)
