import { GamingCanvasFIFOQueue } from '../fifo-queue';
import { GamingCanvasInput, GamingCanvasInputType } from '../input';

/**
 * Repeating keys (key held down) are filtered out
 *
 * @author tknight-dev
 */

// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
export interface GamingCanvasInputKeyboardAction {
	code: string;
	key: string;
	keyCtrl: boolean;
	keyShift: boolean;
	location: GamingCanvasInputKeyboardActionLocation;
}

// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#keyboard_locations
export enum GamingCanvasInputKeyboardActionLocation {
	LEFT = 1,
	RIGHT = 2,
	STANDARD = 0,
}

export interface GamingCanvasInputKeyboard extends GamingCanvasInput {
	propriatary: {
		action: GamingCanvasInputKeyboardAction;
		down: boolean;
	};
}

export class GamingCanvasKeyboardEngine {
	public static active: boolean = true;
	private static queue: GamingCanvasFIFOQueue<GamingCanvasInput>;

	public static initialize(queue: GamingCanvasFIFOQueue<GamingCanvasInput>): void {
		GamingCanvasKeyboardEngine.queue = queue;

		document.addEventListener('keydown', (event: KeyboardEvent) => {
			if (GamingCanvasKeyboardEngine.active && !event.repeat) {
				GamingCanvasKeyboardEngine.queue.push({
					propriatary: {
						action: {
							code: event.code,
							key: event.key,
							keyCtrl: event.ctrlKey,
							keyShift: event.shiftKey,
							location: event.location,
						},
						down: true,
					},
					type: GamingCanvasInputType.KEYBOARD,
				});
			}
		});
		document.addEventListener('keyup', (event: KeyboardEvent) => {
			if (GamingCanvasKeyboardEngine.active) {
				GamingCanvasKeyboardEngine.queue.push({
					propriatary: {
						action: {
							code: event.code,
							key: event.key,
							keyCtrl: event.ctrlKey,
							keyShift: event.shiftKey,
							location: event.location,
						},
						down: false,
					},
					type: GamingCanvasInputType.KEYBOARD,
				});
			}
		});
	}
}
