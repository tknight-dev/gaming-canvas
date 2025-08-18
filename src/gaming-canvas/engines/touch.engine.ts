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
		positions: GamingCanvasInputPosition[]; // min length 1
	};
}

export class GamingCanvasTouchEngine {
	private static el: HTMLCanvasElement;
	private static queue: GamingCanvasFIFOQueue<GamingCanvasInput>;
	private static timeout: ReturnType<typeof setTimeout>;
	private static timestamp: number = -2025;

	private static calc(event: TouchEvent): GamingCanvasInputPosition[] {
		let domRect: DOMRect = GamingCanvasTouchEngine.el.getBoundingClientRect(),
			touch: Touch,
			touchLength: number = event.touches.length,
			touchList: TouchList = event.touches,
			touchPositions: GamingCanvasInputPosition[] = [],
			xEff: number,
			yEff: number;

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
	}

	public static initialize(
		elCanvas: HTMLCanvasElement,
		elInteractive: HTMLElement,
		inputLimitPerMs: number,
		queue: GamingCanvasFIFOQueue<GamingCanvasInput>,
	): void {
		GamingCanvasTouchEngine.el = elCanvas;
		GamingCanvasTouchEngine.queue = queue;

		elInteractive.addEventListener('touchcancel', (event: TouchEvent) => {
			event.preventDefault();
			event.stopPropagation();

			clearTimeout(GamingCanvasTouchEngine.timeout);
			GamingCanvasTouchEngine.queue.push({
				propriatary: {
					action: GamingCanvasInputTouchAction.ACTIVE,
					down: false,
					positions: GamingCanvasTouchEngine.calc(event),
				},
				type: GamingCanvasInputType.TOUCH,
			});

			return false;
		});

		elInteractive.addEventListener('touchend', (event: TouchEvent) => {
			event.preventDefault();
			event.stopPropagation();

			clearTimeout(GamingCanvasTouchEngine.timeout);
			GamingCanvasTouchEngine.queue.push({
				propriatary: {
					action: GamingCanvasInputTouchAction.ACTIVE,
					down: false,
					positions: GamingCanvasTouchEngine.calc(event),
				},
				type: GamingCanvasInputType.TOUCH,
			});

			return false;
		});

		elInteractive.addEventListener('touchmove', (event: TouchEvent) => {
			event.preventDefault();
			event.stopPropagation();

			const now: number = performance.now(),
				diff: number = now - GamingCanvasTouchEngine.timestamp;

			if (diff > inputLimitPerMs) {
				clearTimeout(GamingCanvasTouchEngine.timeout);
				GamingCanvasTouchEngine.queue.push({
					propriatary: {
						action: GamingCanvasInputTouchAction.MOVE,
						positions: GamingCanvasTouchEngine.calc(event),
					},
					type: GamingCanvasInputType.TOUCH,
				});

				GamingCanvasTouchEngine.timestamp = now;
			} else {
				clearTimeout(GamingCanvasTouchEngine.timeout);
				GamingCanvasTouchEngine.timeout = setTimeout(() => {
					GamingCanvasTouchEngine.queue.push({
						propriatary: {
							action: GamingCanvasInputTouchAction.MOVE,
							positions: GamingCanvasTouchEngine.calc(event),
						},
						type: GamingCanvasInputType.TOUCH,
					});
				}, diff - inputLimitPerMs);
			}

			return false;
		});

		elInteractive.addEventListener('touchstart', (event: TouchEvent) => {
			event.preventDefault();
			event.stopPropagation();

			clearTimeout(GamingCanvasTouchEngine.timeout);
			GamingCanvasTouchEngine.queue.push({
				propriatary: {
					action: GamingCanvasInputTouchAction.ACTIVE,
					down: true,
					positions: GamingCanvasTouchEngine.calc(event),
				},
				type: GamingCanvasInputType.TOUCH,
			});

			return false;
		});
	}
}
