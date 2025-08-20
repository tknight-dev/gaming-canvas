import { GamingCanvasFIFOQueue } from './fifo-queue';
import { GamingCanvasInput, GamingCanvasInputPositionCorrector, GamingCanvasInputPosition, GamingCanvasInputType } from './input';
import { GamingCanvasGamepadEngine, GamingCanvasInputGamepadState } from './engines/gamepad.engine';
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

export class GamingCanvasOptions {
	aspectRatio?: number;
	callbackReportLimitPerMs?: number;
	canvasCount?: number;
	debug?: boolean;
	direction?: GamingCanvasDirection;
	directionPreventLandscapeInversion?: boolean;
	elementInteractive?: HTMLElement;
	elementInject?: HTMLElement[];
	inputGamepadEnable?: boolean;
	inputGamepadDeadbandStick?: number;
	inputGamepadDeadbandTrigger?: number;
	inputKeyboardEnable?: boolean;
	inputMouseEnable?: boolean;
	inputMousePreventContextMenu?: boolean;
	inputTouchEnable?: boolean;
	inputLimitPerMs?: number;
	orientation?: GamingCanvasOrientation;
	resolutionByWidthPx?: null | number;
	resolutionScaleToFit?: boolean;
	scaleType?: GamingCanvasScaleType;
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
	devicePixelRatio: number;
	orientation: GamingCanvasOrientation;
	scaler: number;
}

export enum GamingCanvasScaleType {
	ANTIALIAS,
	CRISP,
	PIXELATED,
}

/**
 * Update the dimensions of the canvas element via the report. This will clear the canvas.
 */
export const GamingCanvasSetSize = (canvas: HTMLCanvasElement, report: GamingCanvasReport = GamingCanvas.getReport()) => {
	canvas.height = (report.canvasHeight * report.devicePixelRatio) | 0;
	canvas.width = (report.canvasWidth * report.devicePixelRatio) | 0;
};

export class GamingCanvas {
	private static callbackFullscreen: (state: boolean) => void;
	private static callbackReport: (report: GamingCanvasReport) => void;
	private static callbackReportLastInMs: number = -2025;
	private static callbackReportTimeout: ReturnType<typeof setTimeout>;
	private static callbackVisibility: (state: boolean) => void;
	private static elementCanvases: HTMLCanvasElement[];
	private static elementCanvasContainerDomRect: DOMRect;
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
	private static stateWakeLock: WakeLockSentinel | undefined;
	private static stateWakeLockState: boolean;

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
		let aspectRatio: number = <number>options.aspectRatio,
			devicePixelRatio: number = window.devicePixelRatio,
			devicePixelRatioEff: number = 1 / window.devicePixelRatio,
			deviceRotated: boolean = window.innerWidth < window.innerHeight,
			heightContainer: number = (GamingCanvas.elementRotator2.offsetWidth / aspectRatio) | 0,
			heightResoluion: number = (options.resolutionByWidthPx ? options.resolutionByWidthPx / aspectRatio : heightContainer) | 0,
			report: GamingCanvasReport = <GamingCanvasReport>{
				orientation: GamingCanvas.stateOrientation,
			},
			scaler: number,
			styleTransform: string = GamingCanvas.elementCanvasContainer.style.transform,
			widthContainer: number = GamingCanvas.elementRotator2.offsetWidth | 0,
			widthResolution: number = (options.resolutionByWidthPx || widthContainer) | 0;

		if (!deviceRotated && GamingCanvas.elementRotator2.offsetHeight < heightContainer) {
			heightContainer = GamingCanvas.elementRotator2.offsetHeight | 0;
			heightResoluion = (options.resolutionByWidthPx ? options.resolutionByWidthPx / aspectRatio : heightContainer) | 0;

			widthContainer = (GamingCanvas.elementRotator2.offsetHeight * aspectRatio) | 0;
			widthResolution = (options.resolutionByWidthPx || widthContainer) | 0;
		}

		// Determine dimensions
		report.devicePixelRatio = devicePixelRatio;
		report.devicePixelRatio = devicePixelRatio;
		if (GamingCanvas.stateOrientation === GamingCanvasOrientation.LANDSCAPE) {
			report.canvasHeight = heightResoluion;
			report.canvasWidth = widthResolution;
		} else {
			// report.canvasHeight = widthResolution;
			// report.canvasWidth = heightResoluion;
			report.canvasHeight = heightResoluion * aspectRatio;
			report.canvasWidth = widthResolution * aspectRatio;
		}

		// Set the container size
		GamingCanvas.elementCanvasContainer.style.height = devicePixelRatio * report.canvasHeight + 'px';
		GamingCanvas.elementCanvasContainer.style.width = devicePixelRatio * report.canvasWidth + 'px';

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
				scaler = Math.round(((devicePixelRatioEff * widthContainer) / widthResolution) * 1000) / 1000;
			} else {
				scaler = Math.round(((devicePixelRatioEff * widthContainer) / widthResolution) * 1000) / 1000;
				// scaler = Math.round(((devicePixelRatioEff * heightContainer) / heightResoluion) * 1000) / 1000;
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
		GamingCanvas.elementCanvasContainerDomRect = GamingCanvas.elementCanvasContainer.getBoundingClientRect();

		// Center on super wierd aspect ratios
		if (GamingCanvas.elementCanvasContainerDomRect.height < GamingCanvas.elementRotator2.clientHeight) {
			GamingCanvas.elementCanvasContainer.style.top =
				(GamingCanvas.elementRotator2.clientHeight - GamingCanvas.elementCanvasContainerDomRect.height) / 2 + 'px';
		} else {
			GamingCanvas.elementCanvasContainer.style.top = '0';
		}
		if (GamingCanvas.elementCanvasContainerDomRect.width < GamingCanvas.elementRotator2.clientWidth) {
			GamingCanvas.elementCanvasContainer.style.left =
				(GamingCanvas.elementRotator2.clientWidth - GamingCanvas.elementCanvasContainerDomRect.width) / 2 + 'px';
		} else {
			GamingCanvas.elementCanvasContainer.style.left = '0';
		}

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

	/**
	 * Hold onto your butts
	 *
	 * @param elementParent is document.body on undefined | null
	 * @param options are default on undefined | null
	 */
	public static initialize(elementParent: HTMLElement = document.body, options: GamingCanvasOptions = {}): HTMLCanvasElement[] {
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
			addEventListener('visibilitychange', async () => {
				const state: boolean = document.visibilityState !== 'hidden';

				if (GamingCanvas.stateVisibility !== state) {
					GamingCanvas.stateVisibility = state;

					// Automatically suspend wakeLock when not visible
					if (state && GamingCanvas.stateWakeLockState && !GamingCanvas.stateWakeLock) {
						// Re-enable after becoming visible again
						try {
							GamingCanvas.stateWakeLock = await navigator.wakeLock.request('screen');
						} catch (error) {}

						if (!GamingCanvas.stateWakeLock) {
							console.error('GamingCanvas: failed to wake lock after becoming visible');
							GamingCanvas.stateWakeLockState = false;
						}
					} else if (!state && GamingCanvas.stateWakeLockState && GamingCanvas.stateWakeLock) {
						// Disable while not visible
						GamingCanvas.stateWakeLock.release();
						GamingCanvas.stateWakeLock = undefined;
					}

					GamingCanvas.callbackVisibility && GamingCanvas.callbackVisibility(state);
				}
			});
		} else {
			// Stop active processes
			GamingCanvasGamepadEngine.shutdown();

			// Clear old elements and listeners
			GamingCanvas.elementContainer.innerText = '';
			GamingCanvas.elementParent.removeChild(GamingCanvas.elementContainer);
		}
		GamingCanvas.elementParent = elementParent;
		GamingCanvas.options = GamingCanvas.formatOptions(options || {});

		// Go() event listeners
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
		let canvas: HTMLCanvasElement,
			count: number = <number>options.canvasCount;

		GamingCanvas.elementCanvases = new Array();
		while (count--) {
			canvas = document.createElement('canvas');
			canvas.height = 0;
			canvas.id = `gaming-canvas-canvas${count + 1}`;
			canvas.width = 0;
			canvas.style.left = '0';
			canvas.style.position = 'absolute';
			canvas.style.top = '0';
			canvas.style.zIndex = String((count + 1) * 10);

			GamingCanvas.elementCanvases.push(canvas);
			GamingCanvas.elementCanvasContainer.appendChild(canvas);
		}
		options.elementInteractive = options.elementInteractive === undefined ? GamingCanvas.elementCanvases[0] : options.elementInteractive;

		// Element: Injectables
		if (options.elementInject && Array.isArray(options.elementInject)) {
			for (let element of options.elementInject) {
				GamingCanvas.elementCanvasContainer.appendChild(element);
			}
		}

		// Apply
		GamingCanvas.setOptions(options);

		// Engines
		options.inputGamepadEnable &&
			GamingCanvasGamepadEngine.initialize(
				GamingCanvas.inputQueue,
				<number>options.inputGamepadDeadbandStick,
				<number>options.inputGamepadDeadbandTrigger,
			);
		options.inputKeyboardEnable && GamingCanvasKeyboardEngine.initialize(GamingCanvas.inputQueue);
		options.inputMouseEnable &&
			GamingCanvasMouseEngine.initialize(
				GamingCanvas.elementCanvases[GamingCanvas.elementCanvases.length - 1], // Use the top most canvas
				<HTMLElement>options.elementInteractive,
				GamingCanvas.inputQueue,
				<boolean>options.inputMousePreventContextMenu,
			);
		options.inputTouchEnable &&
			GamingCanvasTouchEngine.initialize(
				GamingCanvas.elementCanvases[GamingCanvas.elementCanvases.length - 1], // Use the top most canvas
				<HTMLElement>options.elementInteractive,
				<number>options.inputLimitPerMs,
				GamingCanvas.inputQueue,
			);

		// Done
		return GamingCanvas.elementCanvases;
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

		if (!(options.directionPreventLandscapeInversion && options.direction === GamingCanvasDirection.INVERTED)) {
			if (changed || GamingCanvas.stateDirection !== options.direction) {
				changed = true;
				GamingCanvas.stateDirection = <GamingCanvasDirection>options.direction;

				GamingCanvas.elementCanvasContainer.style.transform =
					options.direction === GamingCanvasDirection.NORMAL ? 'scale(1)' : 'rotate(180deg) scale(1) translate(-100%, -100%)';
			}
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
		if (input.type === GamingCanvasInputType.GAMEPAD || input.type === GamingCanvasInputType.KEYBOARD) {
			// Nothing to do
			return input;
		}

		// Fix X & Y rotation
		const inverted: boolean = GamingCanvas.stateDirection === GamingCanvasDirection.INVERTED;
		const rotated: boolean = GamingCanvas.stateOrientation === GamingCanvasOrientation.PORTRAIT;
		if (inverted || rotated) {
			let height: number, width: number;

			if (rotated && (!inverted || rotated)) {
				height = GamingCanvas.elementCanvasContainerDomRect.height;
				width = GamingCanvas.elementCanvasContainerDomRect.width;
			} else {
				height = GamingCanvas.stateReport.canvasHeightScaled;
				width = GamingCanvas.stateReport.canvasWidthScaled;
			}

			switch (input.type) {
				case GamingCanvasInputType.MOUSE:
					GamingCanvasInputPositionCorrector(height, inverted, input.propriatary.position, rotated, width);
					break;
				case GamingCanvasInputType.TOUCH:
					const positions: GamingCanvasInputPosition[] | undefined = input.propriatary.positions;

					if (positions) {
						for (let i = 0; i < positions.length; i++) {
							GamingCanvasInputPositionCorrector(height, inverted, positions[i], rotated, width);
						}
					}
					break;
			}
		}

		// Fix X & Y scaling
		if (GamingCanvas.stateScaler !== 1) {
			switch (input.type) {
				case GamingCanvasInputType.MOUSE:
					input.propriatary.position.x /= GamingCanvas.stateScaler;
					input.propriatary.position.y /= GamingCanvas.stateScaler;
					break;
				case GamingCanvasInputType.TOUCH:
					const positions: GamingCanvasInputPosition[] | undefined = input.propriatary.positions;

					if (positions) {
						for (let i = 0; i < positions.length; i++) {
							positions[i].x /= GamingCanvas.stateScaler;
							positions[i].y /= GamingCanvas.stateScaler;
						}
					}
					break;
			}
		}

		return input;
	}

	/**
	 * Take screenshot of all canvas layers stacked as they are displayed
	 *
	 * @return null on failure
	 */
	public static async screenshot(): Promise<Blob | null> {
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > screenshot: not initialized yet');
			return null;
		}

		return new Promise<Blob | null>((resolve: any) => {
			let canvasScreenshot: HTMLCanvasElement = document.createElement('canvas'),
				canvasScreenshotContext: CanvasRenderingContext2D = <CanvasRenderingContext2D>canvasScreenshot.getContext('2d', {
					alpha: true,
					antialias: false,
				}),
				canvases: HTMLCanvasElement[] = GamingCanvas.elementCanvases;

			// Match dimensions
			canvasScreenshot.height = canvases[0].height;
			canvasScreenshot.width = canvases[0].width;

			// Draw every layer into the screenshot canvas starting with the lowest layer canvases[0]
			for (let canvas of canvases) {
				canvasScreenshotContext.drawImage(canvas, 0, 0);
			}

			// Convert screnshot canvas into PNG blob
			canvasScreenshot.toBlob(
				(blob: Blob | null) => {
					resolve(blob);

					document.removeChild(canvasScreenshot);
				},
				'image/png',
				1,
			);
		});
	}

	/**
	 * @return is false on failure
	 */
	public static async wakeLock(enable: boolean): Promise<boolean> {
		if (enable === GamingCanvas.stateWakeLockState) {
			// Already in that state
			return true;
		}

		if ('wakeLock' in navigator) {
			if (enable) {
				try {
					GamingCanvas.stateWakeLock = await navigator.wakeLock.request('screen');
				} catch (error) {}

				if (GamingCanvas.stateWakeLock) {
					GamingCanvas.stateWakeLockState = true;
				} else {
					return false;
				}
			} else {
				GamingCanvas.stateWakeLock && GamingCanvas.stateWakeLock.release();
				GamingCanvas.stateWakeLock = undefined;
				GamingCanvas.stateWakeLockState = false;
			}

			return true;
		} else {
			console.error("GamingCanvas > wakeLock: 'Wake Lock API' not supported by this browser");
			return false;
		}
	}

	/**
	 * @return is undefined if not initialized yet
	 */
	public static getCanvases(): HTMLCanvasElement[] {
		return GamingCanvas.elementCanvases;
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
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > getCurrentDirection: not initialized yet');
			return GamingCanvasDirection.NORMAL;
		}
		return GamingCanvas.stateDirection;
	}

	public static getCurrentOrientation(): GamingCanvasOrientation {
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > getCurrentOrientation: not initialized yet');
			return GamingCanvasOrientation.LANDSCAPE;
		}
		return GamingCanvas.stateOrientation;
	}

	public static setDebug(state: boolean): void {
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > setDebug: not initialized yet');
			return;
		}
		if (state) {
			GamingCanvas.elementRotator1.style.background = 'repeating-linear-gradient(45deg, #404040, #000 10px';

			GamingCanvas.elementRotator2.style.backgroundColor = 'rgba(192,192,192,0.5)';

			GamingCanvas.elementCanvases[0].style.backgroundColor = 'rgba(255,0,255,0.5)';
			GamingCanvas.elementCanvases[0].style.boxShadow = 'inset -8px 8px 4px 4px rgb(0,255,0)';
		} else {
			GamingCanvas.elementRotator1.style.background = 'unset';

			GamingCanvas.elementRotator2.style.backgroundColor = 'transparent';

			GamingCanvas.elementCanvases[0].style.backgroundColor = 'transparent';
			GamingCanvas.elementCanvases[0].style.boxShadow = 'none';
		}
	}

	public static setDirection(direction: GamingCanvasDirection) {
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > setDirection: not initialized yet');
			return;
		}
		if (direction !== GamingCanvas.stateDirection) {
			GamingCanvas.options.direction = direction === undefined ? GamingCanvasDirection.NORMAL : direction;
			GamingCanvas.stateDirection = <any>undefined;
			GamingCanvas.go();
		}
	}

	public static getInputLimitPerMs(): number {
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > getInputLimitPerMs: not initialized yet');
			return 8;
		}

		return GamingCanvas.options !== undefined ? <number>GamingCanvas.options.inputLimitPerMs : 8;
	}

	/**
	 * Remove all the inputs from the queue
	 */
	public static clearInputQueue(): void {
		GamingCanvas.inputQueue.clear();
	}

	/**
	 * Gamepad and Keyboard events are global inputs and are not limited to the canvas element
	 *
	 * @return FIFO queue of input events as they occurred (serialized)
	 */
	public static getInputQueue(): GamingCanvasFIFOQueue<GamingCanvasInput> {
		return GamingCanvas.inputQueue;
	}

	/**
	 * @param active means inputs will be put in the queue for processing
	 */
	public static setInputActive(active: boolean, clearInputQueue?: boolean): void {
		active = active === true;
		clearInputQueue && GamingCanvas.inputQueue.clear();

		GamingCanvasMouseEngine.active = active;
		GamingCanvasKeyboardEngine.active = active;
		GamingCanvasMouseEngine.active = active;
		GamingCanvasTouchEngine.active = active;

		clearInputQueue && GamingCanvas.inputQueue.clear();
	}

	/**
	 * @return key is gamepadId
	 */
	public static getGamepads(): { [key: string]: GamingCanvasInputGamepadState } {
		return GamingCanvasGamepadEngine.getGamepads();
	}

	public static isFullscreen(): boolean {
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > isFullscreen: not initialized yet');
			return false;
		}
		return GamingCanvas.stateFullscreen;
	}

	/**
	 * @param element use this to fullscreen something other than the canvas element. Not needed when exiting fullscreen.
	 */
	public static async setFullscreen(state: boolean, element?: HTMLElement): Promise<void> {
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > setFullscreen: not initialized yet');
			return;
		}
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

	private static formatOptions(options: GamingCanvasOptions): GamingCanvasOptions {
		options.aspectRatio = options.aspectRatio === undefined ? 16 / 9 : Number(options.aspectRatio) || 16 / 9;
		options.callbackReportLimitPerMs = Math.max(0, Number(options.callbackReportLimitPerMs) || 8);
		options.canvasCount = options.canvasCount === undefined ? 1 : Math.max(1, Number(options.canvasCount) || 0);
		options.debug = options.debug === undefined ? false : options.debug === true;
		options.direction = options.direction === undefined ? GamingCanvasDirection.NORMAL : options.direction;
		options.directionPreventLandscapeInversion =
			options.directionPreventLandscapeInversion === undefined ? true : options.directionPreventLandscapeInversion;

		if (GamingCanvas.elementCanvases) {
			options.elementInteractive = options.elementInteractive === undefined ? GamingCanvas.elementCanvases[0] : options.elementInteractive;
		}

		options.inputGamepadEnable = options.inputGamepadEnable === undefined ? false : options.inputGamepadEnable === true;
		options.inputGamepadDeadbandStick =
			options.inputGamepadDeadbandStick === undefined ? 0.08 : Math.max(0, Math.min(1, Number(options.inputGamepadDeadbandStick) || 0));
		options.inputGamepadDeadbandTrigger =
			options.inputGamepadDeadbandTrigger === undefined ? 0.01 : Math.max(0, Math.min(1, Number(options.inputGamepadDeadbandTrigger) || 0));
		options.inputKeyboardEnable = options.inputKeyboardEnable === undefined ? false : options.inputKeyboardEnable === true;
		options.inputMouseEnable = options.inputMouseEnable === undefined ? false : options.inputMouseEnable === true;
		options.inputMousePreventContextMenu = options.inputMousePreventContextMenu === undefined ? false : options.inputMousePreventContextMenu === true;
		options.inputTouchEnable = options.inputTouchEnable === undefined ? false : options.inputTouchEnable === true;
		options.inputLimitPerMs = options.inputLimitPerMs === undefined ? 8 : Math.max(0, Number(options.inputLimitPerMs) || 8);
		options.orientation = options.orientation === undefined ? GamingCanvasOrientation.AUTO : options.orientation;
		options.resolutionByWidthPx = options.resolutionByWidthPx === undefined ? null : Number(options.resolutionByWidthPx) | 0 || null;
		options.resolutionScaleToFit = options.resolutionScaleToFit === undefined ? true : options.resolutionScaleToFit === true;
		options.scaleType = options.scaleType === undefined ? GamingCanvasScaleType.ANTIALIAS : options.scaleType;

		return options;
	}

	public static setOptions(options: GamingCanvasOptions): void {
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > setOptions: not initialized yet');
			return;
		}
		GamingCanvas.options = GamingCanvas.formatOptions(options);

		// Apply
		GamingCanvas.setDebug(<boolean>GamingCanvas.options.debug);
		for (const canvas of GamingCanvas.elementCanvases) {
			switch (options.scaleType) {
				case GamingCanvasScaleType.ANTIALIAS:
					canvas.style.imageRendering = 'high-quality';
					break;
				case GamingCanvasScaleType.CRISP:
					canvas.style.imageRendering = 'crisp-edges';
					break;
				case GamingCanvasScaleType.PIXELATED:
					canvas.style.imageRendering = 'pixelated';
					break;
			}
		}

		// Done
		GamingCanvas.stateDirection = <any>undefined;
		GamingCanvas.stateOrientation = <any>undefined;
		GamingCanvas.go();
	}

	public static setOrientation(orientation: GamingCanvasOrientation) {
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > setOrientation: not initialized yet');
			return;
		}
		if (orientation !== GamingCanvas.stateOrientation) {
			GamingCanvas.options.orientation = orientation === undefined ? GamingCanvasOrientation.LANDSCAPE : orientation;
			GamingCanvas.stateOrientation = <any>undefined;
			GamingCanvas.go();
		}
	}

	public static getReport(): GamingCanvasReport {
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > getReport: not initialized yet');
			return <any>{};
		}
		return JSON.parse(JSON.stringify(GamingCanvas.stateReport));
	}

	public static isVisible(): boolean {
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > isVisible: not initialized yet');
			return true;
		}
		return GamingCanvas.stateVisibility;
	}

	public static isWakeLockSupported(): boolean {
		return 'wakeLock' in navigator;
	}
}
