import { GamingCanvasFIFOQueue } from '../fifo-queue.js';
import { GamingCanvasInput, GamingCanvasInputInstance, GamingCanvasInputType } from '../inputs.js';

/**
 * Repeating keys (key held down) are filtered out
 *
 * @author tknight-dev
 */

export interface GamingCanvasInputKeyboard extends GamingCanvasInput {
	propriatary: {
		action: GamingCanvasInputKeyboardAction;
		down: boolean;
	};
}

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

export interface GamingCanvasInputKeyboardInstance extends GamingCanvasInputInstance {
	code: string;
}

export class GamingCanvasEngineKeyboard {
	public static active: boolean = true;
	public static lockout: boolean;
	private static queue: GamingCanvasFIFOQueue<GamingCanvasInput>;
	private static queueLockout: GamingCanvasFIFOQueue<GamingCanvasInput>;

	public static initialize(
		queue: GamingCanvasFIFOQueue<GamingCanvasInput>,
		queueLockout: GamingCanvasFIFOQueue<GamingCanvasInput>,
		preventAlt: boolean,
		preventCntrl: boolean,
		preventMeta: boolean,
		preventShift: boolean,
		preventSpaceBarScroll: boolean,
		preventTab: boolean,
	): void {
		GamingCanvasEngineKeyboard.active = true;
		GamingCanvasEngineKeyboard.lockout = false;
		GamingCanvasEngineKeyboard.queue = queue;
		GamingCanvasEngineKeyboard.queueLockout = queueLockout;

		document.addEventListener('keydown', (event: KeyboardEvent) => {
			if (GamingCanvasEngineKeyboard.active === true || GamingCanvasEngineKeyboard.lockout === true) {
				if (
					(preventAlt === true && event.altKey === true) ||
					(preventCntrl === true && event.ctrlKey === true) ||
					(preventMeta === true && event.metaKey === true) ||
					(preventShift === true && event.shiftKey === true) ||
					(preventSpaceBarScroll === true && event.code === 'Space') ||
					(preventTab === true && event.code === 'Tab')
				) {
					event.preventDefault();
					event.stopPropagation();
				}

				if (event.repeat !== true) {
					(GamingCanvasEngineKeyboard.lockout === true ? GamingCanvasEngineKeyboard.queueLockout : GamingCanvasEngineKeyboard.queue).push({
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
			if (GamingCanvasEngineKeyboard.active === true || GamingCanvasEngineKeyboard.lockout === true) {
				if (
					(preventAlt === true && event.altKey === true) ||
					(preventCntrl === true && event.ctrlKey === true) ||
					(preventMeta === true && event.metaKey === true) ||
					(preventShift === true && event.shiftKey === true) ||
					(preventSpaceBarScroll === true && event.code === 'Space') ||
					(preventTab === true && event.code === 'Tab')
				) {
					event.preventDefault();
					event.stopPropagation();
				}

				(GamingCanvasEngineKeyboard.lockout === true ? GamingCanvasEngineKeyboard.queueLockout : GamingCanvasEngineKeyboard.queue).push({
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
