import { GamingCanvasFIFOQueue } from '../fifo-queue';
import { GamingCanvasInput, GamingCanvasInputPosition, GamingCanvasInputType } from '../input';

/**
 * @author tknight-dev
 */

export enum GamingCanvasInputTouchAction {
	ACTIVE, // A finger is touching the screen
	MOVE,
}

export interface GamingCanvasInputTouch extends GamingCanvasInput {
	propriatary: {
		action: GamingCanvasInputTouchAction;
		down?: boolean;
		positions?: GamingCanvasInputPosition[];
	};
}

export class GamingCanvasEngineTouch {
	public static active: boolean = true;
	private static el: HTMLCanvasElement;
	private static queue: GamingCanvasFIFOQueue<GamingCanvasInput>;
	private static timeout: ReturnType<typeof setTimeout>;
	private static timestamp: number = -2025;

	/**
	 * Function forwarding: Reduce garbage collector demand be reducing temporary variables (best performance for repeating functions
	 */
	static {
		GamingCanvasEngineTouch.calc__funcForward();
	}

	private static calc(_event: TouchEvent): GamingCanvasInputPosition[] {
		return <GamingCanvasInputPosition[]>(<unknown>undefined);
	}

	private static calc__funcForward(): void {
		let domRect: DOMRect, touch: Touch, touchLength: number, touchList: TouchList, touchPositions: GamingCanvasInputPosition[], xEff: number, yEff: number;

		const calc = (event: TouchEvent) => {
			domRect = GamingCanvasEngineTouch.el.getBoundingClientRect();
			touchLength = event.touches.length;
			touchList = event.touches;
			touchPositions = [];

			for (let i = 0; i < touchLength; i++) {
				touch = touchList[i];

				xEff = Math.max(0, Math.min(domRect.width, touch.clientX - domRect.x)) | 0;
				yEff = Math.max(0, Math.min(domRect.height, touch.clientY - domRect.y)) | 0;

				touchPositions.push({
					out: xEff === 0 || yEff === 0 || xEff === domRect.width || yEff === domRect.height,
					x: xEff,
					xRelative: xEff / domRect.width,
					y: yEff,
					yRelative: yEff / domRect.height,
				});
			}

			return touchPositions;
		};
		GamingCanvasEngineTouch.calc = calc;
	}

	public static initialize(
		elCanvas: HTMLCanvasElement,
		elInteractive: HTMLElement,
		inputLimitPerMs: number,
		queue: GamingCanvasFIFOQueue<GamingCanvasInput>,
	): void {
		GamingCanvasEngineTouch.active = true;
		GamingCanvasEngineTouch.el = elCanvas;
		GamingCanvasEngineTouch.queue = queue;

		const touchActive = (down: boolean, event: TouchEvent, positions?: GamingCanvasInputPosition[]): boolean => {
			event.preventDefault();
			event.stopPropagation();

			if (GamingCanvasEngineTouch.active) {
				clearTimeout(GamingCanvasEngineTouch.timeout);
				GamingCanvasEngineTouch.queue.push({
					propriatary: {
						action: GamingCanvasInputTouchAction.ACTIVE,
						down: down,
						positions: positions,
					},
					type: GamingCanvasInputType.TOUCH,
				});
			}

			return false;
		};

		elInteractive.addEventListener('touchcancel', (event: TouchEvent) => {
			return touchActive(false, event);
		});

		elInteractive.addEventListener('touchend', (event: TouchEvent) => {
			return touchActive(false, event);
		});

		let touchmoveDiff: number, touchmoveNow: number;
		elInteractive.addEventListener('touchmove', (event: TouchEvent) => {
			event.preventDefault();
			event.stopPropagation();

			if (GamingCanvasEngineTouch.active) {
				((touchmoveNow = performance.now()), (touchmoveDiff = touchmoveNow - GamingCanvasEngineTouch.timestamp));

				if (touchmoveDiff > inputLimitPerMs) {
					clearTimeout(GamingCanvasEngineTouch.timeout);
					GamingCanvasEngineTouch.queue.push({
						propriatary: {
							action: GamingCanvasInputTouchAction.MOVE,
							positions: GamingCanvasEngineTouch.calc(event),
						},
						type: GamingCanvasInputType.TOUCH,
					});

					GamingCanvasEngineTouch.timestamp = touchmoveNow;
				} else {
					clearTimeout(GamingCanvasEngineTouch.timeout);
					GamingCanvasEngineTouch.timeout = setTimeout(() => {
						GamingCanvasEngineTouch.queue.push({
							propriatary: {
								action: GamingCanvasInputTouchAction.MOVE,
								positions: GamingCanvasEngineTouch.calc(event),
							},
							type: GamingCanvasInputType.TOUCH,
						});
					}, touchmoveDiff - inputLimitPerMs);
				}
			}

			return false;
		});

		elInteractive.addEventListener('touchstart', (event: TouchEvent) => {
			return touchActive(true, event, GamingCanvasEngineTouch.calc(event));
		});
	}
}
