import { GamingCanvasFIFOQueue } from '../fifo-queue.js';
import { GamingCanvasInput, GamingCanvasInputPosition, GamingCanvasInputType } from '../inputs.js';

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
		movementX?: number;
		movementY?: number;
		position: GamingCanvasInputPosition;
	};
}

export class GamingCanvasEngineMouse {
	public static active: boolean = true;
	private static el: HTMLElement;
	private static elInteractive: HTMLElement | undefined;
	private static locked: boolean;
	private static lockHooked: boolean;
	private static queue: GamingCanvasFIFOQueue<GamingCanvasInput>;

	/**
	 * Function forwarding: Reduce garbage collector demand be reducing temporary variables (best performance for repeating functions
	 */
	static {
		GamingCanvasEngineMouse.calc__funcForward();
	}

	private static calc(_event: MouseEvent): GamingCanvasInputPosition {
		return <GamingCanvasInputPosition>(<unknown>undefined);
	}

	private static calc__funcForward(): void {
		let domRect: DOMRect, domRectHeight: number, domRectWidth: number, xEff: number, yEff: number;

		const calc = (event: MouseEvent) => {
			domRect = GamingCanvasEngineMouse.el.getBoundingClientRect();
			domRectHeight = domRect.height | 0;
			domRectWidth = domRect.width | 0;

			xEff = Math.max(0, Math.min(domRectWidth, event.clientX - domRect.x)) | 0;
			yEff = Math.max(0, Math.min(domRectHeight, event.clientY - domRect.y)) | 0;

			return {
				out: xEff === 0 || yEff === 0 || xEff === domRectWidth || yEff === domRectHeight,
				x: xEff,
				xRelative: xEff / domRectWidth,
				y: yEff,
				yRelative: yEff / domRectHeight,
			};
		};
		GamingCanvasEngineMouse.calc = calc;
	}

	public static initialize(
		elInputs: HTMLElement,
		elInteractive: HTMLElement | undefined,
		queue: GamingCanvasFIFOQueue<GamingCanvasInput>,
		preventContextMenu: boolean,
	): void {
		GamingCanvasEngineMouse.active = true;
		GamingCanvasEngineMouse.el = elInputs;
		GamingCanvasEngineMouse.queue = queue;

		if (preventContextMenu) {
			(elInteractive || document.body).addEventListener('contextmenu', (event: MouseEvent) => {
				event.preventDefault();
				event.stopPropagation();
				return false;
			});
		}

		let clickAction: GamingCanvasInputMouseAction;
		(elInteractive || document.body).addEventListener('click', (event: MouseEvent) => {
			if (GamingCanvasEngineMouse.active && event.button < 3) {
				if (event.button === 0) {
					clickAction = GamingCanvasInputMouseAction.LEFT_CLICK;
				} else if (event.button === 1) {
					clickAction = GamingCanvasInputMouseAction.WHEEL_CLICK;
				} else {
					clickAction = GamingCanvasInputMouseAction.RIGHT_CLICK;
				}

				GamingCanvasEngineMouse.queue.push({
					propriatary: {
						action: clickAction,
						position: GamingCanvasEngineMouse.calc(event),
					},
					type: GamingCanvasInputType.MOUSE,
				});
			}
		});

		let mousedownAction: GamingCanvasInputMouseAction;
		(elInteractive || document.body).addEventListener('mousedown', (event: MouseEvent) => {
			if (GamingCanvasEngineMouse.active && event.button < 3) {
				if (event.button === 0) {
					mousedownAction = GamingCanvasInputMouseAction.LEFT;
				} else if (event.button === 1) {
					mousedownAction = GamingCanvasInputMouseAction.WHEEL;
				} else {
					mousedownAction = GamingCanvasInputMouseAction.RIGHT;
				}

				GamingCanvasEngineMouse.queue.push({
					propriatary: {
						action: mousedownAction,
						down: true,
						position: GamingCanvasEngineMouse.calc(event),
					},
					type: GamingCanvasInputType.MOUSE,
				});
			}
		});

		(elInteractive || document.body).addEventListener('mousemove', (event: MouseEvent) => {
			if (GamingCanvasEngineMouse.active) {
				GamingCanvasEngineMouse.queue.push({
					propriatary: {
						action: GamingCanvasInputMouseAction.MOVE,
						movementX: event.movementX,
						movementY: event.movementY,
						position: GamingCanvasEngineMouse.calc(event),
					},
					type: GamingCanvasInputType.MOUSE,
				});
			}
		});

		let mouseupAction: GamingCanvasInputMouseAction;
		(elInteractive || document.body).addEventListener('mouseup', (event: MouseEvent) => {
			if (GamingCanvasEngineMouse.active && event.button < 3) {
				if (event.button === 0) {
					mouseupAction = GamingCanvasInputMouseAction.LEFT;
				} else if (event.button === 1) {
					mouseupAction = GamingCanvasInputMouseAction.WHEEL;
				} else {
					mouseupAction = GamingCanvasInputMouseAction.RIGHT;
				}

				GamingCanvasEngineMouse.queue.push({
					propriatary: {
						action: mouseupAction,
						down: false,
						position: GamingCanvasEngineMouse.calc(event),
					},
					type: GamingCanvasInputType.MOUSE,
				});
			}
		});

		if (GamingCanvasEngineMouse.lockHooked !== true) {
			GamingCanvasEngineMouse.lockHooked = true;

			document.addEventListener('pointerlockchange', () => {
				GamingCanvasEngineMouse.locked = document.pointerLockElement === (GamingCanvasEngineMouse.elInteractive || document.body);
			});
		}

		(elInteractive || document.body).addEventListener('wheel', (event: any) => {
			if (GamingCanvasEngineMouse.active) {
				GamingCanvasEngineMouse.queue.push({
					propriatary: {
						action: GamingCanvasInputMouseAction.SCROLL,
						down: event.deltaY > 0,
						position: GamingCanvasEngineMouse.calc(event),
					},
					type: GamingCanvasInputType.MOUSE,
				});
			}
		});
	}

	/**
	 * @param unadjustedMovement when true, disables OS-level mouse acceleration and access raw mouse input
	 */
	public static async lock(unadjustedMovement?: boolean): Promise<boolean> {
		try {
			await (GamingCanvasEngineMouse.elInteractive || document.body).requestPointerLock({
				unadjustedMovement: unadjustedMovement,
			});
			return true;
		} catch (error) {
			console.error('GamingCanvas > GamingCanvasEngineMouse > lock: unable to aquire due to', (<any>error).name);
			return false;
		}
	}

	public static isLocked(): boolean {
		return GamingCanvasEngineMouse.locked;
	}
}
