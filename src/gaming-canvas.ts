import { GamingCanvasFIFOQueue } from './fifo-queue';
import { GamingCanvasInput, GamingCanvasInputPosition, GamingCanvasInputType } from './input';
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
	elementInteractive?: HTMLElement;
	elementInjectAsCanvas?: HTMLElement[];
	elementInjectAsOverlay?: HTMLElement[];
	inputGamepadEnable?: boolean;
	inputGamepadDeadbandStick?: number;
	inputGamepadDeadbandTrigger?: number;
	inputKeyboardEnable?: boolean;
	inputMouseEnable?: boolean;
	inputMousePreventContextMenu?: boolean;
	inputTouchEnable?: boolean;
	inputLimitPerMs?: number;
	orientation?: GamingCanvasOrientation;
	orientationLeftOnPortait?: boolean;
	resolutionScaleToFit?: boolean;
	resolutionScaleType?: GamingCanvasResolutionScaleType;
	resolutionWidthPx?: null | number;
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

export enum GamingCanvasResolutionScaleType {
	ANTIALIAS,
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
	private static elementContainer: HTMLElement;
	private static elementContainerCanvas: HTMLDivElement;
	private static elementContainerOverlay: HTMLDivElement;
	private static elementContainerOverlayWrapper: HTMLDivElement;
	private static elementParent: HTMLElement;
	private static elementRotator1: HTMLDivElement;
	private static elementRotator2: HTMLDivElement;
	private static inputQueue: GamingCanvasFIFOQueue<GamingCanvasInput> = new GamingCanvasFIFOQueue<GamingCanvasInput>();
	private static options: GamingCanvasOptions;
	private static regExpScale: RegExp = /(?<=scale\()(.*?)(?=\))/;
	private static stateFullscreen: boolean;
	private static stateHeight: number;
	private static stateOrientation: GamingCanvasOrientation;
	private static stateReport: GamingCanvasReport;
	private static stateVisibility: boolean;
	private static stateWakeLock: WakeLockSentinel | undefined;
	private static stateWakeLockState: boolean;
	private static vibrateInterval: ReturnType<typeof setInterval>;

	/**
	 * Function forwarding: Reduce garbage collector demand be reducing temporary variables (best performance for repeating functions
	 */
	static {
		GamingCanvas.go__funcForward();
		GamingCanvas.relativizeInputToCanvas__funcForward();
	}

	/**
	 * Rotate, Scale, and callbackReport() as required
	 */
	private static go(_?: any, __?: boolean): GamingCanvasReport {
		return <GamingCanvasReport>(<unknown>undefined);
	}
	private static go__funcForward(): void {
		let changed: boolean,
			diff: number,
			aspectRatio: number,
			devicePixelRatio: number,
			devicePixelRatioEff: number,
			heightContainer: number,
			heightResoluion: number,
			initial: boolean,
			now: number,
			options: GamingCanvasOptions,
			report: GamingCanvasReport,
			scaler: number,
			styleTransform: string,
			widthContainer: number,
			widthResolution: number;

		const go = (_?: any, skipCallback?: boolean) => {
			changed = false;
			initial = GamingCanvas.stateOrientation === undefined;
			options = GamingCanvas.options;

			/**
			 * Orientation
			 */
			if (options.orientation === GamingCanvasOrientation.LANDSCAPE) {
				changed = GamingCanvas.oLandscape();
			} else if (options.orientation === GamingCanvasOrientation.PORTRAIT) {
				changed = GamingCanvas.oPortrait();
			} else {
				// Auto
				if (window.innerWidth < window.innerHeight) {
					changed = GamingCanvas.oPortrait();
				} else {
					changed = GamingCanvas.oLandscape();
				}
			}

			/**
			 * Size and Scale
			 */
			aspectRatio = <number>options.aspectRatio;
			devicePixelRatio = window.devicePixelRatio;
			devicePixelRatioEff = 1 / window.devicePixelRatio;
			heightContainer = (GamingCanvas.elementRotator2.clientWidth / aspectRatio) | 0;
			heightResoluion = (options.resolutionWidthPx ? options.resolutionWidthPx / aspectRatio : heightContainer) | 0;
			report = <GamingCanvasReport>{
				orientation: GamingCanvas.stateOrientation,
			};
			styleTransform = GamingCanvas.elementContainerCanvas.style.transform;
			widthContainer = GamingCanvas.elementRotator2.clientWidth | 0;
			widthResolution = (options.resolutionWidthPx || widthContainer) | 0;

			// Offset by magic factor, idk
			if (options.resolutionWidthPx === null && GamingCanvas.stateOrientation !== GamingCanvasOrientation.LANDSCAPE) {
				heightResoluion = (heightResoluion * 1.78) | 0;
				widthResolution = (widthResolution * 1.78) | 0;
			}

			// Determine dimensions
			report.devicePixelRatio = devicePixelRatio;
			report.canvasHeight = heightResoluion;
			report.canvasWidth = widthResolution;

			// Determine scaler
			if (options.resolutionScaleToFit === true && options.resolutionWidthPx !== null) {
				if (GamingCanvas.stateOrientation === GamingCanvasOrientation.LANDSCAPE) {
					scaler = (devicePixelRatioEff * widthContainer) / widthResolution;
				} else {
					scaler = widthContainer / devicePixelRatio / heightResoluion;
				}
			} else {
				scaler = devicePixelRatioEff;
			}
			report.canvasHeightScaled = (report.canvasHeight * scaler) | 0;
			report.canvasWidthScaled = (report.canvasWidth * scaler) | 0;
			report.scaler = scaler;
			GamingCanvas.elementContainerCanvas.style.transform = styleTransform.replace(
				`scale(${(GamingCanvas.regExpScale.exec(styleTransform) || [''])[0]})`,
				'scale(' + scaler + ')',
			);

			// Set the container canvas size
			GamingCanvas.elementContainerCanvas.style.height = ((devicePixelRatio * report.canvasHeight) | 0) + 'px';
			GamingCanvas.elementContainerCanvas.style.width = ((devicePixelRatio * report.canvasWidth) | 0) + 'px';

			// Set the container overlay size
			if (GamingCanvas.stateOrientation === GamingCanvasOrientation.LANDSCAPE) {
				GamingCanvas.elementContainerOverlay.style.height = ((devicePixelRatio * report.canvasHeight * scaler) | 0) + 'px';
				GamingCanvas.elementContainerOverlay.style.width = ((devicePixelRatio * report.canvasWidth * scaler) | 0) + 'px';
			} else {
				GamingCanvas.elementContainerOverlay.style.height = ((devicePixelRatio * report.canvasWidth * scaler) | 0) + 'px';
				GamingCanvas.elementContainerOverlay.style.width = ((devicePixelRatio * report.canvasHeight * scaler) | 0) + 'px';
			}

			// Callback
			GamingCanvas.stateReport = report;
			if (!skipCallback && GamingCanvas.callbackReport) {
				if (changed || initial || report.canvasHeight !== GamingCanvas.stateHeight) {
					GamingCanvas.stateHeight = report.canvasHeight;

					if (GamingCanvas.options.callbackReportLimitPerMs === 0) {
						GamingCanvas.callbackReport(report);
					} else {
						now = performance.now();
						diff = now - GamingCanvas.callbackReportLastInMs;

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
		};
		GamingCanvas.go = go;
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
		GamingCanvas.elementRotator2.style.position = 'relative';
		GamingCanvas.elementRotator2.style.width = 'auto';
		GamingCanvas.elementRotator2.style.maxWidth = '100%';
		GamingCanvas.elementRotator1.appendChild(GamingCanvas.elementRotator2);

		// Element: Container Canvas
		GamingCanvas.elementContainerCanvas = document.createElement('div');
		GamingCanvas.elementContainerCanvas.id = 'gaming-canvas-container-canvas';
		GamingCanvas.elementContainerCanvas.style.transformOrigin = 'top left';
		GamingCanvas.elementContainerCanvas.style.position = 'relative';
		GamingCanvas.elementContainerCanvas.style.zIndex = '1';
		GamingCanvas.elementRotator2.appendChild(GamingCanvas.elementContainerCanvas);

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
			GamingCanvas.elementContainerCanvas.appendChild(canvas);
		}
		options.elementInteractive = options.elementInteractive === undefined ? GamingCanvas.elementCanvases[0] : options.elementInteractive;

		// Element: Canvas Injectables
		if (options.elementInjectAsCanvas && Array.isArray(options.elementInjectAsCanvas)) {
			for (let element of options.elementInjectAsCanvas) {
				GamingCanvas.elementContainerCanvas.appendChild(element);
			}
		}

		// Element: Container Overlays
		GamingCanvas.elementContainerOverlay = document.createElement('div');
		GamingCanvas.elementContainerOverlay.id = 'gaming-canvas-container-overlay';
		GamingCanvas.elementContainerOverlay.style.left = '0';
		GamingCanvas.elementContainerOverlay.style.position = 'absolute';
		GamingCanvas.elementContainerOverlay.style.top = '0';
		GamingCanvas.elementContainerOverlay.style.transformOrigin = 'top left';
		GamingCanvas.elementContainerOverlay.style.zIndex = '2';
		GamingCanvas.elementRotator2.appendChild(GamingCanvas.elementContainerOverlay);

		// Element: Container Overlays Wrapper
		GamingCanvas.elementContainerOverlayWrapper = document.createElement('div');
		GamingCanvas.elementContainerOverlayWrapper.id = 'gaming-canvas-container-overlay-wrapper';
		GamingCanvas.elementContainerOverlayWrapper.style.height = '100%';
		GamingCanvas.elementContainerOverlayWrapper.style.position = 'relative';
		GamingCanvas.elementContainerOverlayWrapper.style.width = '100%';
		GamingCanvas.elementContainerOverlay.appendChild(GamingCanvas.elementContainerOverlayWrapper);

		// Element: Overlay Injectables
		if (options.elementInjectAsOverlay && Array.isArray(options.elementInjectAsOverlay)) {
			for (let element of options.elementInjectAsOverlay) {
				GamingCanvas.elementContainerOverlayWrapper.appendChild(element);
			}
		}

		// Initialize sizing: fixes browser issues between desktop and mobile (idk why)
		GamingCanvas.stateOrientation = <any>undefined;
		GamingCanvas.oPortrait();
		GamingCanvas.stateOrientation = <any>undefined;
		GamingCanvas.oLandscape();

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
		if (GamingCanvas.stateOrientation !== GamingCanvasOrientation.LANDSCAPE) {
			GamingCanvas.stateOrientation = GamingCanvasOrientation.LANDSCAPE;

			GamingCanvas.elementRotator1.style.aspectRatio = `${GamingCanvas.options.aspectRatio}`;
			GamingCanvas.elementRotator1.style.height = 'auto';
			GamingCanvas.elementRotator1.style.maxHeight = '100%';
			GamingCanvas.elementRotator1.style.width = '100%';
			GamingCanvas.elementRotator1.style.maxWidth = 'auto';

			GamingCanvas.elementRotator2.style.aspectRatio = GamingCanvas.elementRotator1.style.aspectRatio;
			GamingCanvas.elementRotator2.style.height = '100%';
			GamingCanvas.elementRotator2.style.maxHeight = 'auto';
			GamingCanvas.elementRotator2.style.width = 'auto';
			GamingCanvas.elementRotator2.style.maxWidth = '100%';

			GamingCanvas.elementContainerCanvas.style.transform = 'scale(1)';

			return true;
		} else {
			return false;
		}
	}

	private static oPortrait(): boolean {
		if (GamingCanvas.stateOrientation !== GamingCanvasOrientation.PORTRAIT) {
			GamingCanvas.stateOrientation = GamingCanvasOrientation.PORTRAIT;

			GamingCanvas.elementRotator1.style.aspectRatio = `${1 / <number>GamingCanvas.options.aspectRatio}`;
			GamingCanvas.elementRotator1.style.height = '100%';
			GamingCanvas.elementRotator1.style.maxHeight = 'auto';
			GamingCanvas.elementRotator1.style.width = 'auto';
			GamingCanvas.elementRotator1.style.maxWidth = '100%';

			GamingCanvas.elementRotator2.style.aspectRatio = GamingCanvas.elementRotator1.style.aspectRatio;
			GamingCanvas.elementRotator2.style.height = 'auto';
			GamingCanvas.elementRotator2.style.maxHeight = '100%';
			GamingCanvas.elementRotator2.style.width = '100%';
			GamingCanvas.elementRotator2.style.maxWidth = 'auto';

			GamingCanvas.elementContainerCanvas.style.transform = GamingCanvas.options.orientationLeftOnPortait
				? 'rotate(-90deg) scale(1) translateX(-100%)'
				: 'rotate(90deg) scale(1) translateY(-100%)';

			return true;
		} else {
			return false;
		}
	}

	/**
	 * Inputs are relative to the overlay container, but this will convert it to be relative to the canvas container
	 */
	public static relativizeInputToCanvas(_: GamingCanvasInput): GamingCanvasInput {
		return <GamingCanvasInput>(<unknown>undefined);
	}
	private static relativizeInputToCanvas__funcForward(): void {
		let a: number,
			aRelative: number,
			height: number,
			position: GamingCanvasInputPosition,
			positions: GamingCanvasInputPosition[] | undefined,
			rotatedLeft: boolean,
			width: number;

		const relativizeInputToCanvas = (input: GamingCanvasInput) => {
			if (
				input.type === GamingCanvasInputType.GAMEPAD ||
				input.type === GamingCanvasInputType.KEYBOARD ||
				GamingCanvas.stateOrientation !== GamingCanvasOrientation.PORTRAIT
			) {
				// Nothing to do
				return input;
			}

			height = GamingCanvas.elementContainerCanvas.clientHeight;
			width = GamingCanvas.elementContainerCanvas.clientWidth;
			rotatedLeft = <boolean>GamingCanvas.options.orientationLeftOnPortait;

			// Fix it
			switch (input.type) {
				case GamingCanvasInputType.MOUSE:
					position = input.propriatary.position;

					// Rotate
					a = position.x;
					aRelative = position.xRelative;
					if (rotatedLeft) {
						position.x = width - position.y;
						position.xRelative = 1 - position.yRelative;
						position.y = a;
						position.yRelative = aRelative;
					} else {
						position.x = position.y;
						position.xRelative = position.yRelative;
						position.y = height - a;
						position.yRelative = 1 - aRelative;
					}
					break;
				case GamingCanvasInputType.TOUCH:
					positions = input.propriatary.positions;

					if (positions) {
						for (let i = 0; i < positions.length; i++) {
							position = positions[i];

							// Rotate
							a = position.x;
							aRelative = position.xRelative;
							if (rotatedLeft) {
								position.x = width - position.y;
								position.xRelative = 1 - position.yRelative;
								position.y = a;
								position.yRelative = aRelative;
							} else {
								position.x = position.y;
								position.xRelative = position.yRelative;
								position.y = height - a;
								position.yRelative = 1 - aRelative;
							}
						}
					}
					break;
			}

			return input;
		};

		GamingCanvas.relativizeInputToCanvas = relativizeInputToCanvas;
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
	 * Not supported by all browsers: https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
	 *
	 * @param pattern [200, 100, 300] is 200ms on, 100ms off, 300ms on
	 * @param repeat if true will loop the pattern
	 * @param repeatOffsetInMs delay in milliseconds before repeating
	 * @param returns true if supported and valid
	 */
	public static vibrate(pattern: number[], repeat?: boolean, repeatOffsetInMs?: number): boolean {
		if ('vibrate' in navigator) {
			let durationInMs: number = 0;

			if (!Array.isArray(pattern) || pattern.length === 0) {
				console.error('GamingCanvas > vibrate: pattern is invalid');
				return false;
			}

			for (let i = 0; i < pattern.length; i++) {
				if (pattern[i] < 1) {
					console.error('GamingCanvas > vibrate: pattern cannot contain a value less than 1');
					return false;
				} else {
					durationInMs += pattern[i];
				}
			}

			// Vibrate
			clearInterval(GamingCanvas.vibrateInterval);
			navigator.vibrate(pattern);

			if (repeat) {
				repeatOffsetInMs = Math.max(0, repeatOffsetInMs || 0);
				GamingCanvas.vibrateInterval = setInterval(() => {
					navigator.vibrate(pattern);
				}, durationInMs + repeatOffsetInMs);
			}

			return true;
		} else {
			return false;
		}
	}

	public static vibrateCancel(): void {
		clearInterval(GamingCanvas.vibrateInterval);
		if ('vibrate' in navigator) {
			navigator.vibrate(0);
		}
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
			await (element || GamingCanvas.elementContainerCanvas).requestFullscreen();
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
		options.orientationLeftOnPortait = options.orientationLeftOnPortait === undefined ? false : options.orientationLeftOnPortait === true;
		options.resolutionScaleToFit = options.resolutionScaleToFit === undefined ? true : options.resolutionScaleToFit === true;
		options.resolutionScaleType = options.resolutionScaleType === undefined ? GamingCanvasResolutionScaleType.ANTIALIAS : options.resolutionScaleType;
		options.resolutionWidthPx = options.resolutionWidthPx === undefined ? null : Number(options.resolutionWidthPx) | 0 || null;

		return options;
	}

	public static getOptions(): GamingCanvasOptions {
		return JSON.parse(JSON.stringify(GamingCanvas.options || {}));
	}

	/**
	 * This cannot update inject requests that were set during initialization. You have to re-initialize for that.
	 */
	public static setOptions(options: GamingCanvasOptions): void {
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > setOptions: not initialized yet');
			return;
		}
		GamingCanvas.options = GamingCanvas.formatOptions(options);

		// Apply
		GamingCanvas.setDebug(<boolean>GamingCanvas.options.debug);

		// Apply: Scale Type
		switch (<GamingCanvasResolutionScaleType>options.resolutionScaleType) {
			case GamingCanvasResolutionScaleType.ANTIALIAS:
				GamingCanvas.elementContainerCanvas.style.imageRendering = 'smooth';
				break;
			case GamingCanvasResolutionScaleType.PIXELATED:
				GamingCanvas.elementContainerCanvas.style.imageRendering = 'pixelated';
				break;
		}

		// Done
		GamingCanvas.stateOrientation = <any>undefined;
		GamingCanvas.go();
	}

	public static setOrientation(orientation: GamingCanvasOrientation) {
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > setOrientation: not initialized yet');
			return;
		}
		if (orientation !== GamingCanvas.stateOrientation) {
			GamingCanvas.options.orientation = orientation === undefined ? GamingCanvasOrientation.AUTO : orientation;
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

	public static isVibrateSupported(): boolean {
		return 'vibrate' in navigator;
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

	/**
	 * @return object key is gamepadId
	 */
	public static getGamepads(): { [key: string]: GamingCanvasInputGamepadState } {
		return GamingCanvasGamepadEngine.getGamepads();
	}
}
