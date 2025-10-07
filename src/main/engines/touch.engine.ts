import { GamingCanvasFIFOQueue } from '../fifo-queue.js';
import { GamingCanvasInput, GamingCanvasInputPosition, GamingCanvasInputType } from '../inputs.js';

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
		positions: GamingCanvasInputPosition[];
	};
}

export class GamingCanvasEngineTouch {
	public static active: boolean = true;
	private static el: HTMLElement;
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
		let domRect: DOMRect,
			domRectHeight: number,
			domRectWidth: number,
			touch: Touch,
			touchLength: number,
			touchList: TouchList,
			touchPositions: GamingCanvasInputPosition[],
			xEff: number,
			yEff: number;

		const calc = (event: TouchEvent) => {
			domRect = GamingCanvasEngineTouch.el.getBoundingClientRect();
			domRectHeight = domRect.height | 0;
			domRectWidth = domRect.width | 0;
			touchLength = event.touches.length;
			touchList = event.touches;
			touchPositions = [];

			for (let i = 0; i < touchLength; i++) {
				touch = touchList[i];

				xEff = Math.max(0, Math.min(domRectWidth, touch.clientX - domRect.x)) | 0;
				yEff = Math.max(0, Math.min(domRectHeight, touch.clientY - domRect.y)) | 0;

				touchPositions.push({
					out: xEff === 0 || yEff === 0 || xEff === domRectWidth || yEff === domRectHeight,
					x: xEff,
					xRelative: xEff / domRectWidth,
					y: yEff,
					yRelative: yEff / domRectHeight,
				});
			}

			return touchPositions;
		};
		GamingCanvasEngineTouch.calc = calc;
	}

	public static initialize(
		elInputs: HTMLElement,
		elInteractive: HTMLElement | undefined,
		inputLimitPerMs: number,
		queue: GamingCanvasFIFOQueue<GamingCanvasInput>,
	): void {
		GamingCanvasEngineTouch.active = true;
		GamingCanvasEngineTouch.el = elInputs;
		GamingCanvasEngineTouch.queue = queue;

		const touchActive = (down: boolean, event: TouchEvent, positions: GamingCanvasInputPosition[]): boolean => {
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

		(elInteractive || document.body).addEventListener('touchcancel', (event: TouchEvent) => {
			return touchActive(false, event, []);
		});

		(elInteractive || document.body).addEventListener('touchend', (event: TouchEvent) => {
			return touchActive(false, event, GamingCanvasEngineTouch.calc(event));
		});

		let touchmoveDiff: number, touchmoveNow: number;
		(elInteractive || document.body).addEventListener('touchmove', (event: TouchEvent) => {
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

		(elInteractive || document.body).addEventListener('touchstart', (event: TouchEvent) => {
			return touchActive(true, event, GamingCanvasEngineTouch.calc(event));
		});
	}
}
