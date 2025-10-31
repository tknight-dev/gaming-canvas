import { GamingCanvasFIFOQueue } from '../fifo-queue.js';
import { GamingCanvasInput, GamingCanvasInputType } from '../inputs.js';

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

export class GamingCanvasEngineKeyboard {
	public static active: boolean = true;
	private static queue: GamingCanvasFIFOQueue<GamingCanvasInput>;

	public static initialize(
		queue: GamingCanvasFIFOQueue<GamingCanvasInput>,
		preventAlt: boolean,
		preventCntrl: boolean,
		preventMeta: boolean,
		preventShift: boolean,
		preventTab: boolean,
	): void {
		GamingCanvasEngineKeyboard.active = true;
		GamingCanvasEngineKeyboard.queue = queue;

		document.addEventListener('keydown', (event: KeyboardEvent) => {
			if (GamingCanvasEngineKeyboard.active === true) {
				if (
					(preventAlt === true && event.altKey === true) ||
					(preventCntrl === true && event.ctrlKey === true) ||
					(preventMeta === true && event.metaKey === true) ||
					(preventShift === true && event.shiftKey === true) ||
					(preventTab === true && event.code === 'Tab')
				) {
					event.preventDefault();
					event.stopPropagation();
				}

				if (event.repeat !== true) {
					GamingCanvasEngineKeyboard.queue.push({
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
			}
		});
		document.addEventListener('keyup', (event: KeyboardEvent) => {
			if (GamingCanvasEngineKeyboard.active === true) {
				if (
					(preventAlt === true && event.altKey === true) ||
					(preventCntrl === true && event.ctrlKey === true) ||
					(preventMeta === true && event.metaKey === true) ||
					(preventShift === true && event.shiftKey === true) ||
					(preventTab === true && event.code === 'Tab')
				) {
					event.preventDefault();
					event.stopPropagation();
				}

				GamingCanvasEngineKeyboard.queue.push({
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
