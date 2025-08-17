import { GamingCanvasFIFOQueue } from './fifo-queue';
import { GamingCanvasInput, GamingCanvasInputPositionCorrector, GamingCanvasInputType } from './input';
import { GamingCanvasKeyboardEngine } from './engines/keyboard.engine';
import { GamingCanvasMouseEngine } from './engines/mouse.engine';
import { GamingCanvasTouchEngine } from './engines/touch.engine';

/**
 * Canvas:
 * 	-	Dimensions are not automatically set here as the canvas could be controlled by another thread (primary vs WebWorkers(s))
 * 	-	Dimensions are rounded down to the nearest pixel for optimal canvas performance
 *
 * Debug: The green border is the the top-right of the canvas element
 *
 * @author tknight-dev
 */

/**
 * Values shown here are defaults set in the setOptions() function
 */
export class GamingCanvasOptions {
	aspectRatio?: number;
	callbackReportLimitPerMs?: number;
	canvasOpacity?: number;
	debug?: boolean;
	direction?: GamingCanvasDirection;
	elementInteractive?: HTMLElement;
	elementInject?: HTMLElement[];
	inputKeyboardEnable?: boolean;
	inputMouseEnable?: boolean;
	inputMousePreventContextMenu?: boolean;
	inputTouchEnable?: boolean;
	inputLimitPerMs?: number;
	orientation?: GamingCanvasOrientation;
	resolutionByWidthPx?: null | number;
	resolutionScaleToFit?: boolean;
}

export enum GamingCanvasDirection {
	NORMAL,
	INVERTED,
}

export enum GamingCanvasOrientation {
	AUTO,
	LANDSCAPE,
	PORTRAIT,
}

export interface GamingCanvasReport {
	canvasHeight: number;
	canvasHeightScaled: number;
	canvasWidth: number;
	canvasWidthScaled: number;
	orientation: GamingCanvasOrientation;
	scaler: number;
}

export class GamingCanvas {
	private static callbackFullscreen: (state: boolean) => void;
	private static callbackReport: (report: GamingCanvasReport) => void;
	private static callbackReportLastInMs: number = -2025;
	private static callbackReportTimeout: ReturnType<typeof setTimeout>;
	private static callbackVisibility: (state: boolean) => void;
	private static elementCanvas: HTMLCanvasElement;
	private static elementCanvasDomRect: DOMRect;
	private static elementCanvasContainer: HTMLDivElement;
	private static elementContainer: HTMLElement;
	private static elementParent: HTMLElement;
	private static elementRotator1: HTMLDivElement;
	private static elementRotator2: HTMLDivElement;
	private static inputQueue: GamingCanvasFIFOQueue<GamingCanvasInput> = new GamingCanvasFIFOQueue<GamingCanvasInput>();
	private static options: GamingCanvasOptions;
	private static regExpScale: RegExp = /(?<=scale\()(.*?)(?=\))/;
	private static stateDirection: GamingCanvasDirection;
	private static stateFullscreen: boolean;
	private static stateHeight: number;
	private static stateOrientation: GamingCanvasOrientation;
	private static stateReport: GamingCanvasReport;
	private static stateScaler: number;
	private static stateVisibility: boolean;

	/**
	 * Rotate, Scale, and callbackReport() as required
	 */
	private static go(_?: any, skipCallback?: boolean): GamingCanvasReport {
		let changed: boolean;

		const initial: boolean = GamingCanvas.stateDirection === undefined,
			options: GamingCanvasOptions = GamingCanvas.options;

		/**
		 * Direction/Orientation
		 */
		if (options.orientation === GamingCanvasOrientation.LANDSCAPE) {
			changed = GamingCanvas.oLandscape();
		} else if (options.orientation === GamingCanvasOrientation.PORTRAIT) {
			changed = GamingCanvas.oPortrait();
		} else {
			if (window.innerWidth < window.innerHeight) {
				changed = GamingCanvas.oPortrait();
			} else {
				changed = GamingCanvas.oLandscape();
			}
		}

		/**
		 * Scale
		 */
		let aspectRatio: number = 1 / <number>options.aspectRatio,
			devicePixelRatioEff: number = 1 / window.devicePixelRatio,
			height: number = GamingCanvas.elementRotator2.offsetWidth * aspectRatio,
			report: GamingCanvasReport = <GamingCanvasReport>{
				orientation: GamingCanvas.stateOrientation,
			},
			scaler: number,
			styleTransform: string = GamingCanvas.elementCanvasContainer.style.transform,
			width: number = GamingCanvas.elementRotator2.offsetWidth;

		// Determine dimensions
		if (options.resolutionByWidthPx === null) {
			if (GamingCanvas.stateOrientation === GamingCanvasOrientation.LANDSCAPE) {
				report.canvasHeight = height;
				report.canvasWidth = width;
			} else {
				report.canvasHeight = width;
				report.canvasWidth = width / aspectRatio;
			}
		} else {
			report.canvasHeight = (<number>options.resolutionByWidthPx * aspectRatio) | 0;
			report.canvasWidth = <number>options.resolutionByWidthPx;
		}

		// Set the container size
		GamingCanvas.elementCanvasContainer.style.height = report.canvasHeight + 'px';
		GamingCanvas.elementCanvasContainer.style.width = report.canvasWidth + 'px';

		// Warning: Canvas cannot be reliably set from here (offscreenCanvas)
		// if (options.resolutionByWidthPx === null) {
		// 	GamingCanvas.elementCanvas.height = height;
		// 	GamingCanvas.elementCanvas.width = width;
		// } else {
		// 	GamingCanvas.elementCanvas.height = options.resolutionByWidthPx;
		// 	GamingCanvas.elementCanvas.width = (options.resolutionByWidthPx / aspectRatio) | 0;
		// }

		// Use CSS tranform to scale fixed dimensions canvas to native size
		if (options.resolutionScaleToFit === true && options.resolutionByWidthPx !== null) {
			if (GamingCanvas.stateOrientation === GamingCanvasOrientation.LANDSCAPE) {
				scaler = Math.round(((devicePixelRatioEff * width) / <number>options.resolutionByWidthPx) * 1000) / 1000;
			} else {
				scaler = Math.round(((devicePixelRatioEff * GamingCanvas.elementRotator2.offsetHeight) / <number>options.resolutionByWidthPx) * 1000) / 1000;
			}
		} else {
			scaler = devicePixelRatioEff;
		}
		GamingCanvas.stateScaler = scaler;
		report.canvasHeightScaled = report.canvasHeight * scaler;
		report.canvasWidthScaled = report.canvasWidth * scaler;
		report.scaler = scaler;
		GamingCanvas.elementCanvasContainer.style.transform = styleTransform.replace(
			`scale(${(GamingCanvas.regExpScale.exec(styleTransform) || [''])[0]})`,
			'scale(' + scaler + ')',
		);
		GamingCanvas.elementCanvasDomRect = GamingCanvas.elementCanvas.getBoundingClientRect();

		// Callback
		GamingCanvas.stateReport = report;
		if (!skipCallback && GamingCanvas.callbackReport) {
			if (changed || initial || report.canvasHeight !== GamingCanvas.stateHeight) {
				GamingCanvas.stateHeight = report.canvasHeight;

				if (GamingCanvas.options.callbackReportLimitPerMs === 0) {
					GamingCanvas.callbackReport(report);
				} else {
					let now: number = performance.now(),
						diff: number = now - GamingCanvas.callbackReportLastInMs;

					if (diff > <number>GamingCanvas.options.callbackReportLimitPerMs) {
						clearTimeout(GamingCanvas.callbackReportTimeout);
						GamingCanvas.callbackReportLastInMs = now;
						GamingCanvas.callbackReport(report);
					} else {
						GamingCanvas.stateReport = report;
						clearTimeout(GamingCanvas.callbackReportTimeout);
						GamingCanvas.callbackReportTimeout = setTimeout(
							() => {
								GamingCanvas.callbackReportLastInMs = performance.now();
								GamingCanvas.callbackReport(GamingCanvas.stateReport);
							},
							<number>GamingCanvas.options.callbackReportLimitPerMs - diff,
						);
					}
				}
			}
		}

		return report;
	}

	public static initialize(elementParent: HTMLElement, options: GamingCanvasOptions): HTMLCanvasElement {
		if (!GamingCanvas.elementContainer) {
			// First time being initialized

			GamingCanvas.stateFullscreen = document.fullscreenElement !== null;
			addEventListener('fullscreenchange', () => {
				const state: boolean = document.fullscreenElement !== null;

				if (GamingCanvas.stateFullscreen !== state) {
					GamingCanvas.stateFullscreen = state;

					GamingCanvas.callbackFullscreen && GamingCanvas.callbackFullscreen(state);
				}
			});

			GamingCanvas.stateVisibility = document.visibilityState !== 'hidden';
			addEventListener('visibilitychange', () => {
				const state: boolean = document.visibilityState !== 'hidden';

				if (GamingCanvas.stateVisibility !== state) {
					GamingCanvas.stateVisibility = state;

					GamingCanvas.callbackVisibility && GamingCanvas.callbackVisibility(state);
				}
			});
		} else {
			// Exit fullscreen, if required
			GamingCanvas.stateFullscreen && GamingCanvas.setFullscreen(false);

			// Clear old elements and listeners
			GamingCanvas.elementContainer.innerText = '';
			GamingCanvas.elementParent.removeChild(GamingCanvas.elementContainer);
		}
		GamingCanvas.elementParent = elementParent;
		GamingCanvas.options = options;

		// go rotation
		screen.orientation.addEventListener('change', GamingCanvas.go);
		addEventListener('resize', GamingCanvas.go);

		// Element: Container
		GamingCanvas.elementContainer = document.createElement('div');
		GamingCanvas.elementContainer.id = 'gaming-canvas';
		GamingCanvas.elementContainer.style.alignItems = 'center';
		GamingCanvas.elementContainer.style.display = 'flex';
		GamingCanvas.elementContainer.style.height = '100%';
		GamingCanvas.elementContainer.style.justifyContent = 'center';
		GamingCanvas.elementContainer.style.position = 'relative';
		GamingCanvas.elementContainer.style.width = '100%';
		elementParent.appendChild(GamingCanvas.elementContainer);

		// Element: Rotator1
		GamingCanvas.elementRotator1 = document.createElement('div');
		GamingCanvas.elementRotator1.id = 'gaming-canvas-rotator1';
		GamingCanvas.elementRotator1.style.alignItems = 'center';
		GamingCanvas.elementRotator1.style.display = 'flex';
		GamingCanvas.elementRotator1.style.height = 'auto';
		GamingCanvas.elementRotator1.style.maxHeight = '100%';
		GamingCanvas.elementRotator1.style.justifyContent = 'center';
		GamingCanvas.elementRotator1.style.width = '100%';
		GamingCanvas.elementRotator1.style.maxWidth = 'auto';
		GamingCanvas.elementContainer.appendChild(GamingCanvas.elementRotator1);

		// Element: Rotator2
		GamingCanvas.elementRotator2 = document.createElement('div');
		GamingCanvas.elementRotator2.id = 'gaming-canvas-rotator2';
		GamingCanvas.elementRotator2.style.height = '100%';
		GamingCanvas.elementRotator2.style.maxHeight = 'auto';
		GamingCanvas.elementRotator2.style.width = 'auto';
		GamingCanvas.elementRotator2.style.maxWidth = '100%';
		GamingCanvas.elementRotator1.appendChild(GamingCanvas.elementRotator2);

		// Element: Canvas Container
		GamingCanvas.elementCanvasContainer = document.createElement('div');
		GamingCanvas.elementCanvasContainer.id = 'gaming-canvas-container';
		GamingCanvas.elementCanvasContainer.style.transformOrigin = 'top left';
		GamingCanvas.elementCanvasContainer.style.position = 'relative';
		GamingCanvas.elementRotator2.appendChild(GamingCanvas.elementCanvasContainer);

		// Element: Canvas
		GamingCanvas.elementCanvas = document.createElement('canvas');
		GamingCanvas.elementCanvas.height = 0;
		GamingCanvas.elementCanvas.id = 'gaming-canvas-canvas';
		GamingCanvas.elementCanvas.width = 0;
		GamingCanvas.elementCanvas.style.zIndex = '1';
		GamingCanvas.elementCanvasContainer.appendChild(GamingCanvas.elementCanvas);

		// Element: Injectables
		if (options.elementInject && Array.isArray(options.elementInject)) {
			for (let element of options.elementInject) {
				GamingCanvas.elementCanvasContainer.appendChild(element);
			}
		}

		// Apply
		GamingCanvas.setOptions(options);

		// Engines
		options.inputKeyboardEnable && GamingCanvasKeyboardEngine.initialize(GamingCanvas.inputQueue);
		options.inputMouseEnable &&
			GamingCanvasMouseEngine.initialize(
				GamingCanvas.elementCanvas,
				<HTMLElement>options.elementInteractive,
				GamingCanvas.inputQueue,
				<boolean>options.inputMousePreventContextMenu,
			);
		options.inputTouchEnable &&
			GamingCanvasTouchEngine.initialize(
				GamingCanvas.elementCanvas,
				<HTMLElement>options.elementInteractive,
				<number>options.inputLimitPerMs,
				GamingCanvas.inputQueue,
			);

		// Done
		return GamingCanvas.elementCanvas;
	}

	private static oLandscape(): boolean {
		let changed: boolean = false;

		const options: GamingCanvasOptions = GamingCanvas.options;

		if (GamingCanvas.stateOrientation !== GamingCanvasOrientation.LANDSCAPE) {
			changed = true;
			GamingCanvas.stateOrientation = GamingCanvasOrientation.LANDSCAPE;

			GamingCanvas.elementRotator1.style.aspectRatio = `${options.aspectRatio}`;
			GamingCanvas.elementRotator1.style.height = 'auto';
			GamingCanvas.elementRotator1.style.maxHeight = '100%';
			GamingCanvas.elementRotator1.style.width = '100%';
			GamingCanvas.elementRotator1.style.maxWidth = 'auto';

			GamingCanvas.elementRotator2.style.aspectRatio = GamingCanvas.elementRotator1.style.aspectRatio;
			GamingCanvas.elementRotator2.style.height = '100%';
			GamingCanvas.elementRotator2.style.maxHeight = 'auto';
			GamingCanvas.elementRotator2.style.width = 'auto';
			GamingCanvas.elementRotator2.style.maxWidth = '100%';
		}

		if (changed || GamingCanvas.stateDirection !== options.direction) {
			changed = true;
			GamingCanvas.stateDirection = <GamingCanvasDirection>options.direction;

			GamingCanvas.elementCanvasContainer.style.transform =
				options.direction === GamingCanvasDirection.NORMAL ? 'scale(1)' : 'rotate(180deg) scale(1) translate(-100%, -100%)';
		}

		return changed;
	}

	private static oPortrait(): boolean {
		let changed: boolean = false;

		const options: GamingCanvasOptions = GamingCanvas.options;

		if (GamingCanvas.stateOrientation !== GamingCanvasOrientation.PORTRAIT) {
			changed = true;
			GamingCanvas.stateOrientation = GamingCanvasOrientation.PORTRAIT;

			GamingCanvas.elementRotator1.style.aspectRatio = `${1 / <number>options.aspectRatio}`;
			GamingCanvas.elementRotator1.style.height = '100%';
			GamingCanvas.elementRotator1.style.maxHeight = 'auto';
			GamingCanvas.elementRotator1.style.width = 'auto';
			GamingCanvas.elementRotator1.style.maxWidth = '100%';

			GamingCanvas.elementRotator2.style.aspectRatio = GamingCanvas.elementRotator1.style.aspectRatio;
			GamingCanvas.elementRotator2.style.height = 'auto';
			GamingCanvas.elementRotator2.style.maxHeight = '100%';
			GamingCanvas.elementRotator2.style.width = '100%';
			GamingCanvas.elementRotator2.style.maxWidth = 'auto';
		}

		if (changed || GamingCanvas.stateDirection !== options.direction) {
			changed = true;
			GamingCanvas.stateDirection = <GamingCanvasDirection>options.direction;

			GamingCanvas.elementCanvasContainer.style.transform =
				options.direction === GamingCanvasDirection.NORMAL ? 'rotate(90deg) scale(1) translateY(-100%)' : 'rotate(-90deg) scale(1) translateX(-100%)';
		}

		return changed;
	}

	/**
	 * If the canvas is rotated then x is y and vice versa. This corrects that.
	 */
	public static relativizeInput(input: GamingCanvasInput): GamingCanvasInput {
		if (input.type === GamingCanvasInputType.KEYBOARD) {
			// Nothing to do
			return input;
		}

		// Fix X & Y rotation
		const inverted: boolean = GamingCanvas.stateDirection === GamingCanvasDirection.INVERTED;
		const rotated: boolean = GamingCanvas.stateOrientation === GamingCanvasOrientation.PORTRAIT;
		if (inverted || rotated) {
			let height: number, width: number;

			if (rotated && (!inverted || rotated)) {
				height = GamingCanvas.elementCanvasDomRect.height;
				width = GamingCanvas.elementCanvasDomRect.width;

				// Height is 0 on init to prevent flickers during sizing
				if (height === 0) {
					GamingCanvas.elementCanvasDomRect = GamingCanvas.elementCanvas.getBoundingClientRect();
					height = GamingCanvas.elementCanvasDomRect.height;
					width = GamingCanvas.elementCanvasDomRect.width;
				}
			} else {
				height = GamingCanvas.stateReport.canvasHeightScaled;
				width = GamingCanvas.stateReport.canvasWidthScaled;
			}

			switch (input.type) {
				case GamingCanvasInputType.GAMEPAD:
					break;
				case GamingCanvasInputType.MOUSE:
					GamingCanvasInputPositionCorrector(height, inverted, input.propriatary.position, rotated, width);
					break;
				case GamingCanvasInputType.TOUCH:
					for (let i = 0; i < input.propriatary.positions.length; i++) {
						GamingCanvasInputPositionCorrector(height, inverted, input.propriatary.positions[i], rotated, width);
					}
					break;
			}
		}

		// Fix X & Y scaling
		if (GamingCanvas.stateScaler !== 1) {
			switch (input.type) {
				case GamingCanvasInputType.GAMEPAD:
					break;
				case GamingCanvasInputType.MOUSE:
					input.propriatary.position.x /= GamingCanvas.stateScaler;
					input.propriatary.position.y /= GamingCanvas.stateScaler;
					break;
				case GamingCanvasInputType.TOUCH:
					for (let i = 0; i < input.propriatary.positions.length; i++) {
						input.propriatary.positions[i].x /= GamingCanvas.stateScaler;
						input.propriatary.positions[i].y /= GamingCanvas.stateScaler;
					}
					break;
			}
		}

		return input;
	}

	/**
	 * @return is undefined if not initialized yet
	 */
	public static getCanvas(): HTMLCanvasElement {
		return GamingCanvas.elementCanvas;
	}

	/**
	 * gos if the browser is in fullscreen mode or not
	 */
	public static setCallbackFullscreen(callbackFullscreen: (state: boolean) => void): void {
		GamingCanvas.callbackFullscreen = callbackFullscreen;
	}

	/**
	 * Is called on display changes
	 */
	public static setCallbackReport(callbackReport: (report: GamingCanvasReport) => void): void {
		GamingCanvas.callbackReport = callbackReport;
	}

	/**
	 * State false indicates events like the browser being minified to the taskbar or an app being backgrounded
	 */
	public static setCallbackVisibility(callbackVisibility: (state: boolean) => void): void {
		GamingCanvas.callbackVisibility = callbackVisibility;
	}

	public static getCurrentDirection(): GamingCanvasDirection {
		return GamingCanvas.stateDirection;
	}

	public static getCurrentOrientation(): GamingCanvasOrientation {
		return GamingCanvas.stateOrientation;
	}

	public static setDebug(state: boolean): void {
		if (GamingCanvas.elementCanvas) {
			if (state) {
				GamingCanvas.elementRotator1.style.background = 'repeating-linear-gradient(45deg, #404040, #000 10px';

				GamingCanvas.elementRotator2.style.backgroundColor = 'rgba(192,192,192,0.5)';

				GamingCanvas.elementCanvas.style.backgroundColor = 'rgba(255,0,255,0.5)';
				GamingCanvas.elementCanvas.style.boxShadow = 'inset -8px 8px 4px 4px rgb(0,255,0)';
			} else {
				GamingCanvas.elementRotator1.style.background = 'unset';

				GamingCanvas.elementRotator2.style.backgroundColor = 'transparent';

				GamingCanvas.elementCanvas.style.backgroundColor = 'transparent';
				GamingCanvas.elementCanvas.style.boxShadow = 'none';
			}
		}
	}

	public static setDirection(direction: GamingCanvasDirection) {
		if (direction !== GamingCanvas.stateDirection) {
			GamingCanvas.options.direction = direction === undefined ? GamingCanvasDirection.NORMAL : direction;
			GamingCanvas.stateDirection = <any>undefined;
			GamingCanvas.go();
		}
	}

	public static getInputLimitPerMs(): number {
		return GamingCanvas.options !== undefined ? <number>GamingCanvas.options.inputLimitPerMs : 8;
	}

	/**
	 * Gamepad and Keyboard events are global inputs and are not limited to the canvas element
	 *
	 * @return FIFO queue of input events as they occurred (serialized)
	 */
	public static getInputQueue(): GamingCanvasFIFOQueue<GamingCanvasInput> {
		return GamingCanvas.inputQueue;
	}

	public static isFullscreen(): boolean {
		return GamingCanvas.stateFullscreen;
	}

	/**
	 * @param element use this to fullscreen something other than the canvas element. Not needed when exiting fullscreen.
	 */
	public static async setFullscreen(state: boolean, element?: HTMLElement): Promise<void> {
		if (GamingCanvas.stateFullscreen === state) {
			return;
		}

		if (state) {
			await (element || GamingCanvas.elementCanvasContainer).requestFullscreen();
		} else {
			await document.exitFullscreen();
		}

		GamingCanvas.stateFullscreen = state;
	}

	private static setOptions(options: GamingCanvasOptions): void {
		GamingCanvas.options = options;

		// Defaults
		options.aspectRatio = options.aspectRatio === undefined ? 16 / 9 : Number(options.aspectRatio) || 16 / 9;
		options.callbackReportLimitPerMs = Math.max(0, Number(options.callbackReportLimitPerMs) || 8);
		options.canvasOpacity = options.canvasOpacity === undefined ? 85 : Math.max(0, Math.min(100, Number(options.canvasOpacity) || 0));
		options.debug = options.debug === undefined ? false : options.debug === true;
		options.direction = options.direction === undefined ? GamingCanvasDirection.NORMAL : options.direction;
		options.elementInteractive = options.elementInteractive === undefined ? GamingCanvas.elementCanvas : options.elementInteractive;
		options.inputKeyboardEnable = options.inputKeyboardEnable === undefined ? true : options.inputKeyboardEnable === true;
		options.inputMouseEnable = options.inputMouseEnable === undefined ? true : options.inputMouseEnable === true;
		options.inputMousePreventContextMenu = options.inputMousePreventContextMenu === undefined ? false : options.inputMousePreventContextMenu === true;
		options.inputTouchEnable = options.inputTouchEnable === undefined ? true : options.inputTouchEnable === true;
		options.inputLimitPerMs = options.inputLimitPerMs === undefined ? 8 : Math.max(0, Number(options.inputLimitPerMs) || 8);
		options.orientation = options.orientation === undefined ? GamingCanvasOrientation.LANDSCAPE : options.orientation;
		options.resolutionByWidthPx = options.resolutionByWidthPx === undefined ? null : Number(options.resolutionByWidthPx) | 0 || null;
		options.resolutionScaleToFit = options.resolutionScaleToFit === undefined ? true : options.resolutionScaleToFit === true;

		// Apply
		GamingCanvas.elementCanvas.style.opacity = `${options.canvasOpacity}%`;
		GamingCanvas.setDebug(options.debug);

		// Done
		GamingCanvas.stateDirection = <any>undefined;
		GamingCanvas.stateOrientation = <any>undefined;
		GamingCanvas.go();
	}

	public static setOrientation(orientation: GamingCanvasOrientation) {
		if (orientation !== GamingCanvas.stateOrientation) {
			GamingCanvas.options.orientation = orientation === undefined ? GamingCanvasOrientation.LANDSCAPE : orientation;
			GamingCanvas.stateOrientation = <any>undefined;
			GamingCanvas.go();
		}
	}

	public static getReport(): GamingCanvasReport {
		return JSON.parse(JSON.stringify(GamingCanvas.stateReport));
	}

	public static isVisible(): boolean {
		return GamingCanvas.stateVisibility;
	}
}
