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

	/**
	 * Function forwarding: Reduce garbage collector demand be reducing temporary variables (best performance for repeating functions
	 */
	static {
		GamingCanvasMouseEngine.calc__funcForward();
	}

	private static calc(_: MouseEvent): GamingCanvasInputPosition {
		return <GamingCanvasInputPosition>(<unknown>undefined);
	}

	private static calc__funcForward(): void {
		let domRect: DOMRect, xEff: number, yEff: number;

		const calc = (event: MouseEvent) => {
			domRect = GamingCanvasMouseEngine.el.getBoundingClientRect();
			xEff = Math.max(0, Math.min(domRect.width, event.clientX - domRect.x)) | 0;
			yEff = Math.max(0, Math.min(domRect.height, event.clientY - domRect.y)) | 0;

			return {
				out: xEff === 0 || yEff === 0 || xEff === domRect.width || yEff === domRect.height,
				x: xEff,
				xRelative: xEff / domRect.width,
				y: yEff,
				yRelative: yEff / domRect.height,
			};
		};
		GamingCanvasMouseEngine.calc = calc;
	}

	public static initialize(
		elCanvas: HTMLCanvasElement,
		elInteractive: HTMLElement,
		queue: GamingCanvasFIFOQueue<GamingCanvasInput>,
		preventContextMenu: boolean,
	): void {
		GamingCanvasMouseEngine.active = true;
		GamingCanvasMouseEngine.el = elCanvas;
		GamingCanvasMouseEngine.queue = queue;

		if (preventContextMenu) {
			elInteractive.addEventListener('contextmenu', (event: MouseEvent) => {
				event.preventDefault();
				event.stopPropagation();
				return false;
			});
		}

		let clickAction: GamingCanvasInputMouseAction;
		elInteractive.addEventListener('click', (event: MouseEvent) => {
			if (GamingCanvasMouseEngine.active && event.button < 3) {
				if (event.button === 0) {
					clickAction = GamingCanvasInputMouseAction.LEFT_CLICK;
				} else if (event.button === 1) {
					clickAction = GamingCanvasInputMouseAction.WHEEL_CLICK;
				} else {
					clickAction = GamingCanvasInputMouseAction.RIGHT_CLICK;
				}

				GamingCanvasMouseEngine.queue.push({
					propriatary: {
						action: clickAction,
						position: GamingCanvasMouseEngine.calc(event),
					},
					type: GamingCanvasInputType.MOUSE,
				});
			}
		});

		let mousedownAction: GamingCanvasInputMouseAction;
		elInteractive.addEventListener('mousedown', (event: MouseEvent) => {
			if (GamingCanvasMouseEngine.active && event.button < 3) {
				if (event.button === 0) {
					mousedownAction = GamingCanvasInputMouseAction.LEFT;
				} else if (event.button === 1) {
					mousedownAction = GamingCanvasInputMouseAction.WHEEL;
				} else {
					mousedownAction = GamingCanvasInputMouseAction.RIGHT;
				}

				GamingCanvasMouseEngine.queue.push({
					propriatary: {
						action: mousedownAction,
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

		let mouseupAction: GamingCanvasInputMouseAction;
		elInteractive.addEventListener('mouseup', (event: MouseEvent) => {
			if (GamingCanvasMouseEngine.active && event.button < 3) {
				if (event.button === 0) {
					mouseupAction = GamingCanvasInputMouseAction.LEFT;
				} else if (event.button === 1) {
					mouseupAction = GamingCanvasInputMouseAction.WHEEL;
				} else {
					mouseupAction = GamingCanvasInputMouseAction.RIGHT;
				}

				GamingCanvasMouseEngine.queue.push({
					propriatary: {
						action: mouseupAction,
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
