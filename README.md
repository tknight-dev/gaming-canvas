# Gaming Canvas

Supports `CommonJS` (`.cjs`) and `ESM` (`.mjs`)

### Why This Library?

See it in action with my game [Life](https://app.tknight.dev/game/life/index.html?perf=true) (a multithreaded Conway's Game of Life for Desktop and Mobile) [[GitHub](https://github.com/tknight-dev/life)]!

**GamingCanvas** provides the following:

- **Inputs**: Quickly gives you access to Keyboard, Mouse, and Touch (multi-touch as well) serialized (FIFO) inputs.
    - Mouse supports: left, right, and wheel based inputs
    - Use `options.inputLimitPerMs` to optimize your CPU usage by dialing your input intake speed to only what you need
    - You can also use `options.inputEnable* = false` to disable any or all input types
- **Fullscreen**: Quickly fullscreen your game
- **Orientation**: Auto rotate for maximum screen usage (Mobile!) or lock it to a specific orientation
    - Device level orientation locking isn't supported by all browsers
- **Resolution**: Use a fixed resolution to optimize your FPS (scales to fill screen like a regular game)
    - Dimensions are always rounded down to the nearest pixel to improve performance
    - Scaling uses the css `transform` function which your browser (CPU) offloads to your GPU (best performance)
- **Visibility**: Quickly known if your game needs to be paused (browser minimized or switched to new tab)
- Yarn: `yarn add @tknight-dev/gaming-canvas`

### Getting Started

```html
<div class="title"><h1>My Game Title</h1></div>
<div class="game" id="hook-for-fullscreen">
	<div class="container" id="hook-for-gaming-canvas"></div>
	<div class="overlay-1"><!-- ... --></div>
</div>
```

```typescript
import { GamingCanvas, GamingCanvasDirection, GamingCanvasOptions, GamingCanvasOrientation } from '@tknight-dev/gaming-canvas';

const container: HTMLElement = document.getElementById('hook-for-gaming-canvas') as HTMLElement;
const options: GamingCanvasOptions = {
	aspectRatio: 16 / 9,
	orientation: GamingCanvasOrientation.AUTO,
	resolutionByWidthPx: 640,
};

const canvas: HTMLCanvasElement = GamingCanvas.initialize(container, options);

// You have to set the dimensions of the canvas as modifying the dimensions also clears the canvas
// Note: dimensions only change when options.resolutionByWidthPx is null
const report: GamingCanvasReport = GamingCanvas.getReport();
canvas.height = report.canvasHeight;
canvas.width = report.canvasWidth;

// Use the canvas here or pass it to a WebWorker via the OffscreenCanvas method for multi-threading
const canvasContext: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
canvasContext.font = '48px serif';
canvasContext.fillText('Hello world', canvas.width / 3, canvas.height / 2);
```

### Models: GamingCanvasDirection (enum)

| Key      | Description                   |
| -------- | ----------------------------- |
| NORMAL   | Left-To-Right & Top-To-Bottom |
| INVERTED | Right-To-Left & Bottom-To-Top |

### Models: GamingCanvasInputKeyboardAction (interface)

See: [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
Note: Keyboard repeat events are filtered out

| Key      | Description                                                                                  |
| -------- | -------------------------------------------------------------------------------------------- |
| code     | Based `KeyboardEvent.code`                                                                   |
| key      | Based on `KeyboardEvent.key`                                                                 |
| keyCtrl  | Based `KeyboardEvent.ctrlKey`                                                                |
| keyShift | Based on `KeyboardEvent.shiftKey`                                                            |
| location | Uses `GamingCanvasInputKeyboardActionLocation` enum and is based on `KeyboardEvent.location` |

### Models: GamingCanvasInputMouseAction (enum)

| Key         | Description                   |
| ----------- | ----------------------------- |
| LEFT        | Based `mousedown` & `mouseup` |
| LEFT_CLICK  | Based on `click`              |
| RIGHT       | Based `mousedown` & `mouseup` |
| RIGHT_CLICK | Based on `click`              |
| MOVE        | Based on `mousemove`          |
| WHEEL       | Based on `wheel`              |

### Models: GamingCanvasActionTouch (enum)

| Key    | Description                                     |
| ------ | ----------------------------------------------- |
| ACTIVE | Based `touchcancel` & `touchend` & `touchstart` |
| MOVE   | Based on `touchmove`                            |

### Models: GamingCanvasOptions (interface)

| Key                          | Type                    | Default     | Description                                                                                                                                                                         |
| ---------------------------- | ----------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| aspectRatio                  | number                  | 16 / 9      | 1920x1080 (1080p) is a 16/9 aspect ratio                                                                                                                                            |
| callbackDisplayLimitPerMs    | number                  | 8ms         | Limits how often the callbackDisplay() can be called in milliseconds (0 is unlimited)                                                                                               |
| canvasOpacity                | number                  | 85%         | 0% - 100% (0% is transparent) (the browser [CPU] offloads this to your GPU)                                                                                                         |
| debug                        | boolean                 | false       | Enables colors for HTML elements involved in the rotation process (see it in action [Life](https://app.tknight.dev/game/life/index.html?debug=true&drawDead=false&seedRandom=false) |
| direction                    | GamingCanvasDirection   | `NORMAL`    | `INVERTED` rotates the canvas to left instead of the right in `PORTRAIT` mode                                                                                                       |
| elementInteractive           | HTMLElement             | canvas      | `MouseEvent.x/y` and `TouchEvent.x/y` are based on this element                                                                                                                     |
| inputKeyboardEnable          | boolean                 | true        | Enables the serialization of Keyboard based inputs                                                                                                                                  |
| inputMouseEnable             | boolean                 | true        | Enables the serialization of Mouse based inputs                                                                                                                                     |
| inputMousePreventContextMenu | boolean                 | false       | Prevents the right-click context menu from appearing inputs                                                                                                                         |
| inputTouchEnable             | boolean                 | true        | Enables the serialization of Touch based inputs                                                                                                                                     |
| inputLimitPerMs              | number                  | 8ms         | Limits how often anolog controls (gamepad-joystick and touch) are accepted (0 is unlimited)                                                                                         |
| orientation                  | GamingCanvasOrientation | `LANDSCAPE` | `AUTO` will dynamically rotate the canvas to optimize screen usage                                                                                                                  |
| resolutionByHeightPx         | number or `null`        | `null`      | `null` sets the canvas dimensions, and not `null` scales the canvas dimensions to fit                                                                                               |
| resolutionScaleToFit         | boolean                 | true        | Enables the scalling feature of `resolutionByHeightPx` when using a non-null value                                                                                                  |

### Models: GamingCanvasOrientation (enum)

| Key       | Description         |
| --------- | ------------------- |
| AUTO      | Rotate for best fit |
| LANDSCAPE | Wide                |
| PORTRAIT  | Tall                |

### Models: GamingCanvasReport (interface)

| Key                | type                    | Description                           |
| ------------------ | ----------------------- | ------------------------------------- |
| canvasHeight       | number                  | Dimension of the canvas               |
| canvasHeightScaled | number                  | Dimension of the canvas after scaling |
| canvasWidth        | number                  | Dimension of the canvas               |
| canvasWidthScaled  | number                  | Dimension of the canvas after scaling |
| orientation        | GamingCanvasOrientation | Current orientation                   |

### How To: Canvas Dimensions

Dynamic Resolution

```typescript
import { GamingCanvas, GamingCanvasOptions, GamingCanvasReport } from '@tknight-dev/gaming-canvas';

const container: HTMLElement = document.getElementById('hook-for-gaming-canvas') as HTMLElement;
const options: GamingCanvasOptions = {
	aspectRatio: 16 / 9,
	resolutionByWidthPx: 640,
};

const canvas: HTMLCanvasElement = GamingCanvas.initialize(container, options);
const canvasContext: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

// Draw
const draw = () => {
	canvasContext.font = '48px serif';
	canvasContext.fillText('Hello world', canvas.width / 3, canvas.height / 2);
};

// Updates on display changes
GamingCanvas.setCallbackReport((report: GamingCanvasReport) => {
	// Setting the height or width will clear the canvas
	canvas.height = report.canvasHeight;
	canvas.width = report.canvasWidth;
	draw();
});

// Set the initial canvas size
const report: GamingCanvasReport = GamingCanvas.getReport();
canvas.height = report.canvasHeight;
canvas.width = report.canvasWidth;
draw();
```

Fixed Resolution

```typescript
import { GamingCanvas, GamingCanvasOptions } from '@tknight-dev/gaming-canvas';

const container: HTMLElement = document.getElementById('hook-for-gaming-canvas') as HTMLElement;
const options: GamingCanvasOptions = {
	aspectRatio: 16 / 9,
	resolutionByWidthPx: 640,
};

const canvas: HTMLCanvasElement = GamingCanvas.initialize(container, options);
const canvasContext: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;

// Fixed resolution dimensions will never resize
const report: GamingCanvasReport = GamingCanvas.getReport();
canvas.height = report.canvasHeight;
canvas.width = report.canvasWidth;

// Draw
canvasContext.font = '48px serif';
canvasContext.fillText('Hello world', canvas.width / 3, canvas.height / 2);
```

### How To: Fullscreen

Here is some example code to use in your main thread (not a WebWorker)

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

### How To: Inputs

Here is some example code to use in your main thread (not a WebWorker)

```typescript
import {
	GamingCanvas,
	GamingCanvasFIFOQueue,
	GamingCanvasInput,
	GamingCanvasInputKeyboard,
	GamingCanvasInputMouse,
	GamingCanvasInputPositionDistance,
	GamingCanvasInputTouch,
	GamingCanvasInputType,
	GamingCanvasReport,
} from '../gaming-canvas/index';

let inputLimitPerMs: number = GamingCanvas.getInputLimitPerMs(),
	queue: GamingCanvasFIFOQueue<GamingCanvasInput> = GamingCanvas.getInputQueue(),
	queueInput: GamingCanvasInput | undefined,
	queueQuit: boolean,
	queueRequest: number,
	queueTimestamp: number = 0;

const processor = (timestampNow: number) => {
	// Start the request for the next frame before processing the data (faster)
	queueRequest = requestAnimationFrame(processor);

	if (timestampNow - queueTimestamp > inputLimitPerMs) {
		queueTimestamp = timestampNow;

		while (!queueQuit && (queueInput = queue.pop())) {
			// This function automatically adjusts the (x,y) coordinates based on the current rotational state of the canvas
			GamingCanvas.relativizeInput(queueInput);

			switch (queueInput.type) {
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
	}
};

const processorKeyboard = (input: GamingCanvasInputKeyboard, timestampNow: number) => {
	console.log('Input-Keyboard', input, timestampNow);

	// if(input.propriatary.down) {
	// 	switch(input.propriatary.action.code) {
	// 		case "KeyF":
	//          // Pay respect
	// 			break;
	// 	}
	// }

	// or track the state
	// state[input.propriatary.action.code] = input.propriatary.down;
};

const processorMouse = (input: GamingCanvasInputMouse, timestampNow: number) => {
	console.log('Input-Mouse', input, timestampNow);

	// if (input.propriatary.action === GamingCanvasInputMouseAction.LEFT_CLICK) {}
};

const processorTouch = (input: GamingCanvasInputTouch, timestampNow: number) => {
	console.log('Input-Touch', input, timestampNow);

	if (input.position2) {
		console.log(' >> distance between touches', GamingCanvasInputPositionDistance(input.position1, input.position2));
		console.log(' >> distance between touches relative', GamingCanvasInputPositionDistanceRelative(input.position1, input.position2));
	}
};

// Start processing inputs
queueQuit = false;
queueRequest = requestAnimationFrame(processor);

setTimeout(() => {
	// Stop processing inputs
	queueQuit = true;
	cancelAnimationFrame(queueRequest);
}, 1000);
```

### How To: Screen Dimming (Power Saving Mode)

A 3rd party library (like [NoSleep.js](https://github.com/richtr/NoSleep.js)) is required to prevent dimming (even in fullscreen mode). I may include this feature in a future release.

### How To: Visibility

Here is some example code to use in your main thread (not a WebWorker)

```typescript
import { GamingCanvas } from '@tknight-dev/gaming-canvas';

GamingCanvas.setCallbackVisibility((state: boolean) => {
	// state is false for things like the browser being minimized or switched to a new tab

	if (!state) {
		// You may want to pause your game here
	}
});
```

### Troubleshoot

- `GamingCanvas > GamingCanvasFIFOQueue: input overflow [limit=*]`
    - Make sure you are processing the inputs by removing them from the queue. See `How To: Inputs`

### Future Releases

- Add [Gamepad](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API) support
- Add `GamingCanvasFIFOQueue` binary encoder/decorder for sending input chunks between [WebWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) via [TransferableObjects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
