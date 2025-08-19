import { GamingCanvasFIFOQueue } from '../fifo-queue';
import { GamingCanvasInput, GamingCanvasInputPosition, GamingCanvasInputType } from '../input';

/**
 * @author tknight-dev
 */

export enum GamingCanvasInputMouseAction {
	LEFT, // GamingCanvasMousedown and GamingCanvasMouseup based triggers
	LEFT_CLICK, // click based trigger
	RIGHT, // GamingCanvasMousedown and GamingCanvasMouseup based triggers
	RIGHT_CLICK, // click based trigger
	MOVE, // GamingCanvasMousemove based trigger
	SCROLL, // SCROLL based trigger
	WHEEL, // GamingCanvasMousedown and GamingCanvasMouseup based triggers
	WHEEL_CLICK, // click based trigger
}

export interface GamingCanvasInputMouse extends GamingCanvasInput {
	propriatary: {
		action: GamingCanvasInputMouseAction;
		down?: boolean;
		position: GamingCanvasInputPosition;
	};
}

export class GamingCanvasMouseEngine {
	public static active: boolean = true;
	private static el: HTMLCanvasElement;
	private static queue: GamingCanvasFIFOQueue<GamingCanvasInput>;

	private static calc(event: MouseEvent): GamingCanvasInputPosition {
		let domRect: DOMRect = GamingCanvasMouseEngine.el.getBoundingClientRect(),
			xEff: number = Math.max(0, Math.min(domRect.width, event.clientX - domRect.x)) | 0,
			yEff: number = Math.max(0, Math.min(domRect.height, event.clientY - domRect.y)) | 0;

		return {
			out: xEff === 0 || yEff === 0 || xEff === domRect.width || yEff === domRect.height,
			x: xEff,
			xRelative: xEff / domRect.width,
			y: yEff,
			yRelative: yEff / domRect.height,
		};
	}

	public static initialize(
		elCanvas: HTMLCanvasElement,
		elInteractive: HTMLElement,
		queue: GamingCanvasFIFOQueue<GamingCanvasInput>,
		preventContextMenu: boolean,
	): void {
		GamingCanvasMouseEngine.el = elCanvas;
		GamingCanvasMouseEngine.queue = queue;

		if (preventContextMenu) {
			elInteractive.addEventListener('contextmenu', (event: MouseEvent) => {
				event.preventDefault();
				event.stopPropagation();
				return false;
			});
		}
		elInteractive.addEventListener('click', (event: MouseEvent) => {
			if (GamingCanvasMouseEngine.active && event.button < 3) {
				let action: GamingCanvasInputMouseAction;

				if (event.button === 0) {
					action = GamingCanvasInputMouseAction.LEFT_CLICK;
				} else if (event.button === 1) {
					action = GamingCanvasInputMouseAction.WHEEL_CLICK;
				} else {
					action = GamingCanvasInputMouseAction.RIGHT_CLICK;
				}

				GamingCanvasMouseEngine.queue.push({
					propriatary: {
						action: action,
						position: GamingCanvasMouseEngine.calc(event),
					},
					type: GamingCanvasInputType.MOUSE,
				});
			}
		});
		elInteractive.addEventListener('mousedown', (event: MouseEvent) => {
			if (GamingCanvasMouseEngine.active && event.button < 3) {
				let action: GamingCanvasInputMouseAction;

				if (event.button === 0) {
					action = GamingCanvasInputMouseAction.LEFT;
				} else if (event.button === 1) {
					action = GamingCanvasInputMouseAction.WHEEL;
				} else {
					action = GamingCanvasInputMouseAction.RIGHT;
				}

				GamingCanvasMouseEngine.queue.push({
					propriatary: {
						action: action,
						down: true,
						position: GamingCanvasMouseEngine.calc(event),
					},
					type: GamingCanvasInputType.MOUSE,
				});
			}
		});
		elInteractive.addEventListener('mousemove', (event: MouseEvent) => {
			if (GamingCanvasMouseEngine.active) {
				GamingCanvasMouseEngine.queue.push({
					propriatary: {
						action: GamingCanvasInputMouseAction.MOVE,
						position: GamingCanvasMouseEngine.calc(event),
					},
					type: GamingCanvasInputType.MOUSE,
				});
			}
		});
		elInteractive.addEventListener('mouseup', (event: MouseEvent) => {
			if (GamingCanvasMouseEngine.active && event.button < 3) {
				let action: GamingCanvasInputMouseAction;

				if (event.button === 0) {
					action = GamingCanvasInputMouseAction.LEFT;
				} else if (event.button === 1) {
					action = GamingCanvasInputMouseAction.WHEEL;
				} else {
					action = GamingCanvasInputMouseAction.RIGHT;
				}

				GamingCanvasMouseEngine.queue.push({
					propriatary: {
						action: action,
						down: false,
						position: GamingCanvasMouseEngine.calc(event),
					},
					type: GamingCanvasInputType.MOUSE,
				});
			}
		});
		elInteractive.addEventListener('wheel', (event: any) => {
			if (GamingCanvasMouseEngine.active) {
				GamingCanvasMouseEngine.queue.push({
					propriatary: {
						action: GamingCanvasInputMouseAction.SCROLL,
						down: event.deltaY > 0,
						position: GamingCanvasMouseEngine.calc(event),
					},
					type: GamingCanvasInputType.MOUSE,
				});
			}
		});
	}
}
