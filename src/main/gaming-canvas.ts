import { GamingCanvasFIFOQueue } from './fifo-queue.js';
import { GamingCanvasInput, GamingCanvasInputPosition, GamingCanvasInputType } from './inputs.js';
import { GamingCanvasOptions, GamingCanvasOrientation, GamingCanvasReport, GamingCanvasResolutionScaleType } from './models.js';
import { GamingCanvasAudioType, GamingCanvasEngineAudio } from './engines/audio.engine.js';
import { GamingCanvasEngineGamepad, GamingCanvasInputGamepadState } from './engines/gamepad.engine.js';
import { GamingCanvasEngineKeyboard } from './engines/keyboard.engine.js';
import { GamingCanvasEngineMouse } from './engines/mouse.engine.js';
import { GamingCanvasEngineTouch } from './engines/touch.engine.js';

/**
 * Canvas:
 * 	-	Dimensions are not automatically set here as the canvas could be controlled by another thread (primary vs WebWorkers(s))
 * 	-	Dimensions are rounded down to the nearest pixel for optimal canvas performance
 *
 * Debug: The green border is the the top-right of the canvas element
 *
 * @author tknight-dev
 */

export class GamingCanvas {
	private static callbackFullscreen: (state: boolean) => void;
	private static callbackReport: (report: GamingCanvasReport) => void;
	private static callbackReportLastInMs: number = -2025;
	private static callbackReportTimeout: ReturnType<typeof setTimeout>;
	private static callbackVisibility: (state: boolean) => void;
	private static elementCanvases: HTMLCanvasElement[];
	private static elementCanvasesSplit: HTMLCanvasElement[];
	private static elementContainer: HTMLElement;
	private static elementContainerCanvas: HTMLDivElement;
	private static elementContainerCanvasInputs: HTMLDivElement;
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
	 * Function Forwarding: Reduce garbage collector demand be reducing temporary variables (best performance for repeating functions)
	 */
	static {
		GamingCanvas.go__funcForward();
		GamingCanvas.relativizeInputToCanvas__funcForward();

		// Function Forward: Engine Audio
		GamingCanvas.audioControlPan = GamingCanvasEngineAudio.controlPan;
		GamingCanvas.audioControlPause = GamingCanvasEngineAudio.controlPause;
		GamingCanvas.audioControlPlay = GamingCanvasEngineAudio.controlPlay;
		GamingCanvas.audioControlStop = GamingCanvasEngineAudio.controlStop;
		GamingCanvas.audioControlVolume = GamingCanvasEngineAudio.controlVolume;
		GamingCanvas.audioLoad = GamingCanvasEngineAudio.load;
		GamingCanvas.audioMute = GamingCanvasEngineAudio.mute;
		GamingCanvas.isAudioMuted = GamingCanvasEngineAudio.isMuted;
		GamingCanvas.isAudioPermitted = GamingCanvasEngineAudio.isPermitted;
		GamingCanvas.audioVolumeGlobal = GamingCanvasEngineAudio.volumeGlobal;
		GamingCanvas.setCallbackIsAudioPermitted = GamingCanvasEngineAudio.setCallbackIsPermitted;

		// Function Forward: Engine Gamepad
		GamingCanvas.getGamepads = GamingCanvasEngineGamepad.getGamepads;

		// Function Forward: Engine Mouse
		GamingCanvas.mouseLock = GamingCanvasEngineMouse.lock;
		GamingCanvas.isMouseLocked = GamingCanvasEngineMouse.isLocked;
	}

	/**
	 * Rotate, Scale, and callbackReport() as required
	 */
	private static go(_?: any, _skipCallback?: boolean): GamingCanvasReport {
		return <GamingCanvasReport>(<unknown>undefined);
	}
	private static go__funcForward(): void {
		let aspectRatio: number,
			canvas: HTMLCanvasElement,
			changed: boolean,
			devicePixelRatio: number,
			devicePixelRatioEff: number,
			diff: number,
			domRectContainerCanvas: DOMRect,
			domRectRotator2: DOMRect,
			heightContainer: number,
			heightResolution: number,
			initial: boolean,
			now: number,
			options: GamingCanvasOptions,
			report: GamingCanvasReport,
			scaler: number,
			splitRotateSpecial: boolean | undefined,
			styleTransform: string,
			value: number,
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
			devicePixelRatio = options.dpiSupportEnable === true ? window.devicePixelRatio : 1;
			devicePixelRatioEff = options.dpiSupportEnable === true ? 1 / window.devicePixelRatio : 1;
			heightContainer = (GamingCanvas.elementRotator2.clientWidth / aspectRatio) | 0;
			heightResolution = (options.resolutionWidthPx ? options.resolutionWidthPx / aspectRatio : heightContainer) | 0;
			report = <GamingCanvasReport>{
				orientation: GamingCanvas.stateOrientation,
				orientationCanvasRotated:
					GamingCanvas.stateOrientation !== GamingCanvasOrientation.LANDSCAPE && GamingCanvas.options.orientationCanvasRotateEnable !== false,
			};
			styleTransform = GamingCanvas.elementContainerCanvas.style.transform;
			widthContainer = GamingCanvas.elementRotator2.clientWidth | 0;
			widthResolution = (options.resolutionWidthPx || widthContainer) | 0;

			// Correction
			if (!options.resolutionWidthPx && GamingCanvas.stateOrientation !== GamingCanvasOrientation.LANDSCAPE) {
				heightContainer = GamingCanvas.elementRotator2.clientWidth | 0;
				heightResolution = heightContainer;

				widthContainer = (GamingCanvas.elementRotator2.clientWidth * aspectRatio) | 0;
				widthResolution = widthContainer;
			}

			// Determine dimensions
			report.devicePixelRatio = devicePixelRatio;
			report.canvasHeight = heightResolution;
			report.canvasWidth = widthResolution;

			// Determine scaler
			if (options.resolutionScaleToFit === true && options.resolutionWidthPx !== null) {
				if (GamingCanvas.stateOrientation === GamingCanvasOrientation.LANDSCAPE) {
					scaler = (devicePixelRatioEff * widthContainer) / widthResolution;
				} else {
					scaler = widthContainer / devicePixelRatio / heightResolution;
				}
			} else {
				scaler = devicePixelRatioEff;
			}
			report.scaler = scaler;
			GamingCanvas.elementContainerCanvas.style.transform = styleTransform.replace(
				`scale(${(GamingCanvas.regExpScale.exec(styleTransform) || [''])[0]})`,
				'scale(' + scaler + ')',
			);

			// Rotate
			if (GamingCanvas.stateOrientation !== GamingCanvasOrientation.LANDSCAPE && GamingCanvas.options.orientationCanvasRotateEnable !== true) {
				report.canvasHeight = widthResolution;
				report.canvasWidth = heightResolution;
			}

			// Set the container canvas size
			GamingCanvas.elementContainerCanvas.style.height = ((devicePixelRatio * report.canvasHeight) | 0) + 'px';
			GamingCanvas.elementContainerCanvas.style.width = ((devicePixelRatio * report.canvasWidth) | 0) + 'px';

			// Set the container overlay size
			if (GamingCanvas.stateOrientation === GamingCanvasOrientation.LANDSCAPE || options.orientationCanvasRotateEnable !== true) {
				GamingCanvas.elementContainerOverlay.style.height = ((devicePixelRatio * report.canvasHeight * scaler) | 0) + 'px';
				GamingCanvas.elementContainerOverlay.style.width = ((devicePixelRatio * report.canvasWidth * scaler) | 0) + 'px';
			} else {
				GamingCanvas.elementContainerOverlay.style.height = ((devicePixelRatio * report.canvasWidth * scaler) | 0) + 'px';
				GamingCanvas.elementContainerOverlay.style.width = ((devicePixelRatio * report.canvasHeight * scaler) | 0) + 'px';
			}

			// Set split size
			if (GamingCanvas.stateOrientation === GamingCanvasOrientation.LANDSCAPE && options.canvasSplitLandscapeVertical === true) {
				report.canvasHeightSplit = report.canvasHeight;
				report.canvasWidthSplit = (report.canvasWidth / 2) | 0;
			} else {
				report.canvasHeightSplit = (report.canvasHeight / 2) | 0;
				report.canvasWidthSplit = report.canvasWidth;
			}

			// Set split swap for specific rotation case
			if (GamingCanvas.elementCanvasesSplit !== undefined) {
				if (
					GamingCanvas.stateOrientation === GamingCanvasOrientation.PORTRAIT &&
					options.orientationCanvasRotateEnable === true &&
					options.orientationCanvasPortaitRotateLeft !== true
				) {
					if (splitRotateSpecial !== true) {
						splitRotateSpecial = true;

						for (canvas of GamingCanvas.elementCanvasesSplit) {
							if (canvas.id.endsWith('a')) {
								canvas.style.bottom = '0';
								canvas.style.left = 'auto';
								canvas.style.right = '0';
								canvas.style.top = 'auto';
							} else {
								canvas.style.bottom = 'auto';
								canvas.style.left = '0';
								canvas.style.right = 'auto';
								canvas.style.top = '0';
							}
						}
					}
				} else if (splitRotateSpecial === true) {
					splitRotateSpecial = false;

					for (canvas of GamingCanvas.elementCanvasesSplit) {
						if (canvas.id.endsWith('a')) {
							canvas.style.bottom = 'auto';
							canvas.style.left = '0';
							canvas.style.right = 'auto';
							canvas.style.top = '0';
						} else {
							canvas.style.bottom = '0';
							canvas.style.left = 'auto';
							canvas.style.right = '0';
							canvas.style.top = 'auto';
						}
					}
				}
			}

			/*
			 * Centering
			 */
			domRectContainerCanvas = GamingCanvas.elementContainerCanvas.getBoundingClientRect();
			domRectRotator2 = GamingCanvas.elementRotator2.getBoundingClientRect();
			GamingCanvas.elementContainerCanvas.style.marginLeft = (domRectRotator2.width - domRectContainerCanvas.width) / 2 + 'px';
			GamingCanvas.elementContainerCanvas.style.marginTop = (domRectRotator2.height - domRectContainerCanvas.height) / 2 + 'px';
			GamingCanvas.elementContainerOverlay.style.marginLeft = GamingCanvas.elementContainerCanvas.style.marginLeft;
			GamingCanvas.elementContainerOverlay.style.marginTop = GamingCanvas.elementContainerCanvas.style.marginTop;

			/*
			 * DPI
			 */
			report.canvasHeight = (report.canvasHeight * devicePixelRatio) | 0;
			report.canvasWidth = (report.canvasWidth * devicePixelRatio) | 0;

			/*
			 * Callback
			 */
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
		if (GamingCanvas.elementContainer === undefined) {
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
			GamingCanvasEngineGamepad.shutdown();

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

		// Element: Canvas Input Relativer
		GamingCanvas.elementContainerCanvasInputs = document.createElement('div');
		GamingCanvas.elementContainerCanvasInputs.id = 'gaming-canvas-container-canvas-inputs';
		GamingCanvas.elementContainerCanvasInputs.style.bottom = '0';
		GamingCanvas.elementContainerCanvasInputs.style.left = '0';
		GamingCanvas.elementContainerCanvasInputs.style.pointerEvents = 'none';
		GamingCanvas.elementContainerCanvasInputs.style.position = 'absolute';
		GamingCanvas.elementContainerCanvasInputs.style.right = '0';
		GamingCanvas.elementContainerCanvasInputs.style.top = '0';
		GamingCanvas.elementContainerCanvasInputs.style.touchAction = 'none';
		GamingCanvas.elementContainerCanvasInputs.style.zIndex = '0';
		GamingCanvas.elementContainerCanvas.appendChild(GamingCanvas.elementContainerCanvasInputs);

		// Element: Canvas
		let canvas: HTMLCanvasElement,
			count: number = <number>options.canvasCount;

		GamingCanvas.elementCanvases = new Array();
		GamingCanvas.elementCanvasesSplit = new Array();
		for (let i = 1; i <= count; i++) {
			if ((<number[]>options.canvasSplit).includes(i)) {
				// Split: A
				canvas = document.createElement('canvas');
				canvas.height = 0;
				canvas.id = `gaming-canvas-canvas${i}a`;
				canvas.width = 0;
				canvas.style.left = '0';
				canvas.style.position = 'absolute';
				canvas.style.top = '0';
				canvas.style.zIndex = String(i * 10);

				GamingCanvas.elementCanvases.push(canvas);
				GamingCanvas.elementCanvasesSplit.push(canvas);
				GamingCanvas.elementContainerCanvas.appendChild(canvas);

				// Split: B
				canvas = document.createElement('canvas');
				canvas.height = 0;
				canvas.id = `gaming-canvas-canvas${i}b`;
				canvas.width = 0;
				canvas.style.bottom = '0';
				canvas.style.position = 'absolute';
				canvas.style.right = '0';
				canvas.style.zIndex = String(i * 10);

				GamingCanvas.elementCanvases.push(canvas);
				GamingCanvas.elementCanvasesSplit.push(canvas);
				GamingCanvas.elementContainerCanvas.appendChild(canvas);
			} else {
				canvas = document.createElement('canvas');
				canvas.height = 0;
				canvas.id = `gaming-canvas-canvas${i}`;
				canvas.width = 0;
				canvas.style.left = '0';
				canvas.style.position = 'absolute';
				canvas.style.top = '0';
				canvas.style.zIndex = String(i * 10);

				GamingCanvas.elementCanvases.push(canvas);
				GamingCanvas.elementContainerCanvas.appendChild(canvas);
			}
		}
		options.elementInteractive = options.elementInteractive === undefined ? GamingCanvas.elementContainerOverlayWrapper : options.elementInteractive;

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
		GamingCanvasEngineAudio.initialize(
			<boolean>options.audioEnable,
			<number>options.audioBufferCount,
			GamingCanvasEngineAudio.isContext() ? undefined : new AudioContext(),
		);
		options.inputGamepadEnable && GamingCanvasEngineGamepad.initialize(GamingCanvas.inputQueue, <number>options.inputGamepadDeadbandStick);
		options.inputKeyboardEnable && GamingCanvasEngineKeyboard.initialize(GamingCanvas.inputQueue);
		options.inputMouseEnable &&
			GamingCanvasEngineMouse.initialize(
				GamingCanvas.elementContainerCanvasInputs,
				<HTMLElement>options.elementInteractive,
				GamingCanvas.inputQueue,
				<boolean>options.inputMousePreventContextMenu,
			);
		options.inputTouchEnable &&
			GamingCanvasEngineTouch.initialize(
				GamingCanvas.elementContainerCanvasInputs,
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

			if (GamingCanvas.options.orientationCanvasRotateEnable === true) {
				GamingCanvas.elementContainerCanvas.style.transform = GamingCanvas.options.orientationCanvasPortaitRotateLeft
					? 'rotate(-90deg) scale(1) translateX(-100%)'
					: 'rotate(90deg) scale(1) translateY(-100%)';
			} else {
				GamingCanvas.elementContainerCanvas.style.transform = 'scale(1)';
			}

			return true;
		} else {
			return false;
		}
	}

	/**
	 * Moves canvas elements back into GamingCanvas's canvas container
	 */
	// public static recontainerizeCanvases(): void {
	// 	let canvas: HTMLCanvasElement,
	// 		canvases: HTMLCanvasElement[] = GamingCanvas.elementCanvases,
	// 		containerCanvas: HTMLElement = GamingCanvas.elementContainerCanvas;

	// 	for (canvas of canvases) {
	// 		canvas.parentElement?.removeChild(canvas);
	// 		containerCanvas.appendChild(canvas);
	// 	}
	// }

	/**
	 * Inputs are relative to the overlay container, but this will convert it to be relative to the canvas container
	 *
	 * This has to be applied after the input is pulled from the queue as the canvas(es) may have rotated or scaled while the input was waiting in the queue
	 */
	public static relativizeInputToCanvas(_input: GamingCanvasInput): GamingCanvasInput {
		return <GamingCanvasInput>(<unknown>undefined);
	}
	private static relativizeInputToCanvas__funcForward(): void {
		let a: number,
			aRelative: number,
			height: number,
			position: GamingCanvasInputPosition,
			positions: GamingCanvasInputPosition[] | undefined,
			rotated: boolean,
			rotatedLeft: boolean,
			scaler: number,
			width: number;

		const relativizeInputToCanvas = (input: GamingCanvasInput) => {
			if (input.type === GamingCanvasInputType.GAMEPAD || input.type === GamingCanvasInputType.KEYBOARD) {
				// Nothing to do
				return input;
			}
			rotated = GamingCanvas.stateOrientation !== GamingCanvasOrientation.LANDSCAPE && GamingCanvas.options.orientationCanvasRotateEnable !== false;
			scaler = GamingCanvas.stateReport.scaler;

			if (rotated) {
				height = GamingCanvas.elementContainerCanvas.clientHeight;
				rotatedLeft = GamingCanvas.options.orientationCanvasPortaitRotateLeft === true;
				width = GamingCanvas.elementContainerCanvas.clientWidth;
			} else if (scaler === 1) {
				// Nothing to do
				return input;
			}

			// Fix it
			switch (input.type) {
				case GamingCanvasInputType.MOUSE:
					position = input.propriatary.position;

					// Rotate
					if (rotated === true) {
						a = position.x;
						aRelative = position.xRelative;
						if (rotatedLeft === true) {
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

					// Scale
					if (scaler !== 1) {
						position.x = (position.x / scaler) | 0;
						position.y = (position.y / scaler) | 0;
					}
					break;
				case GamingCanvasInputType.TOUCH:
					positions = input.propriatary.positions;

					if (positions) {
						for (let i = 0; i < positions.length; i++) {
							position = positions[i];

							if (rotated === true) {
								// Rotate
								a = position.x;
								aRelative = position.xRelative;
								if (rotatedLeft === true) {
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

							// Scale
							if (scaler !== 1) {
								position.x = (position.x / scaler) | 0;
								position.y = (position.y / scaler) | 0;
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
				canvasSplitLandscapeVertical: boolean = GamingCanvas.options.canvasSplitLandscapeVertical === true,
				canvases: HTMLCanvasElement[] = GamingCanvas.elementCanvases,
				orientationCanvasRotateEnable: boolean = GamingCanvas.options.orientationCanvasRotateEnable === true,
				orientationCanvasPortaitRotateLeft: boolean = GamingCanvas.options.orientationCanvasPortaitRotateLeft === true,
				orientationLandscape: boolean = GamingCanvas.stateOrientation === GamingCanvasOrientation.LANDSCAPE,
				report: GamingCanvasReport = GamingCanvas.stateReport;

			// Match dimensions
			canvasScreenshot.height = report.canvasHeight;
			canvasScreenshot.width = report.canvasWidth;

			// Draw every layer into the screenshot canvas starting with the lowest layer canvases[0]
			for (let canvas of canvases) {
				if (canvas.id.endsWith('a') === true || canvas.id.endsWith('b') === true) {
					// Split Screen
					if (orientationLandscape !== true && orientationCanvasRotateEnable === true && orientationCanvasPortaitRotateLeft !== true) {
						// Special case
						if (canvas.id.endsWith('a') === true) {
							canvasScreenshotContext.drawImage(canvas, 0, 0);
						} else {
							canvasScreenshotContext.drawImage(canvas, (canvasScreenshot.width / 2) | 0, 0);
						}
					} else {
						// Regular
						if (canvas.id.endsWith('b') === true) {
							if (orientationLandscape === true && canvasSplitLandscapeVertical === true) {
								canvasScreenshotContext.drawImage(canvas, (canvasScreenshot.width / 2) | 0, 0);
							} else {
								canvasScreenshotContext.drawImage(canvas, 0, (canvasScreenshot.height / 2) | 0);
							}
						}
					}
				} else {
					// Whole Screen
					canvasScreenshotContext.drawImage(canvas, 0, 0);
				}

				if (orientationLandscape !== true && orientationCanvasRotateEnable === true && orientationCanvasPortaitRotateLeft !== true) {
				} else {
					if (canvas.id.endsWith('b') === true) {
						if (orientationLandscape === true && canvasSplitLandscapeVertical === true) {
							canvasScreenshotContext.drawImage(canvas, (canvasScreenshot.width / 2) | 0, 0);
						} else {
							canvasScreenshotContext.drawImage(canvas, 0, (canvasScreenshot.height / 2) | 0);
						}
					} else {
						canvasScreenshotContext.drawImage(canvas, 0, 0);
					}
				}
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
	 * Set the specific audio instance's volume
	 *
	 * @param bufferId is the number returned by the controlPlay() function
	 * @param pan is -1 left, 0 center, 1 right
	 * @param durationInMs is how long it takes to apply the new value completely (default is 0 milliseconds)
	 * @param callback is triggered when audio or fader is complete
	 */
	public static audioControlPan(_bufferId: number, _pan: number, _durationInMs: number = 0, _callback?: (bufferId: number) => void): void {}

	/**
	 * Suspend playing the audio without ending it, or resume audio where you suspended it
	 *
	 * @param bufferId is the number returned by the controlPlay() function
	 * @param state true = pause, false = unpause
	 */
	public static audioControlPause(_bufferId: number, _state: boolean): void {}

	/**
	 * If an audio buffer is available, via the availibility FIFO queue, then the asset will be loaded into the buffer and played from that source
	 *
	 * @param effect (default is true) [false implies music]
	 * @param loop (default is false)
	 * @param pan is -1 left, 0 center, 1 right (default is 0)
	 * @param positionInS is between 0 and the duration of the audio asset in seconds (default is 0)
	 * @param volume is between 0 and 1 (default is 1)
	 * @return is bufferId, use this to modify the active audio (null on failure)
	 */
	public static async audioControlPlay(
		_assetId: number,
		_effect: boolean = true,
		_loop: boolean = false,
		_pan: number = 0,
		_positionInS: number = 0,
		_volume: number = 1,
		_callback?: (bufferId: number) => void,
	): Promise<number | null> {
		return null;
	}

	/**
	 * Stop the audio and return the buffer to the availability FIFO queue
	 *
	 * @param bufferId is the number returned by the controlPlay() function
	 */
	public static audioControlStop(_bufferId: number): void {}

	/**
	 * Set the specific audio instance's volume
	 *
	 * @param bufferId is the number returned by the controlPlay() function
	 * @param volume is between 0 and 1
	 * @param durationInMs is how long it takes to apply the new value completely (default is 0 milliseconds)
	 * @param callback is triggered when audio or fader is complete
	 */
	public static audioControlVolume(_bufferId: number, _volume: number, _durationInMs: number = 0, _callback?: (bufferId: number) => void): void {}

	/**
	 * @param assets Map<identifing number, Blob/DataURL/URL>
	 */
	public static async audioLoad(_assets: Map<number, string>): Promise<void> {}

	public static isAudioMuted(): boolean {
		return false;
	}

	/**
	 * Mute or unmute all audio
	 */
	public static audioMute(_enable: boolean): void {}

	public static isAudioPermitted(): boolean {
		return false;
	}

	/**
	 * @param volume must be between 0 and 1
	 */
	public static audioVolumeGlobal(_volume: number, _type: GamingCanvasAudioType) {}

	/**
	 * @return is undefined if not initialized yet
	 */
	public static getCanvases(): HTMLCanvasElement[] {
		return GamingCanvas.elementCanvases;
	}

	/**
	 * Get notified when the browser toggles the permission to play audio
	 */
	public static setCallbackIsAudioPermitted(callbackIsPermitted: (state: boolean) => void): void {}

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

			for (const canvas of GamingCanvas.elementCanvases) {
				canvas.style.backgroundColor = 'rgba(255,0,255,0.5)';
				canvas.style.boxShadow = 'inset -8px 8px 4px 4px rgb(0,255,0)';
			}
		} else {
			GamingCanvas.elementRotator1.style.background = 'unset';

			GamingCanvas.elementRotator2.style.backgroundColor = 'transparent';

			for (const canvas of GamingCanvas.elementCanvases) {
				canvas.style.backgroundColor = 'transparent';
				canvas.style.boxShadow = 'none';
			}
		}
	}

	public static isInitialized(): boolean {
		return GamingCanvas.elementContainer !== undefined;
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

		GamingCanvasEngineMouse.active = active;
		GamingCanvasEngineKeyboard.active = active;
		GamingCanvasEngineMouse.active = active;
		GamingCanvasEngineTouch.active = active;

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
	public static async setFullscreen(state: boolean, element?: HTMLElement): Promise<boolean> {
		if (!GamingCanvas.elementParent) {
			console.error('GamingCanvas > setFullscreen: not initialized yet');
			return true;
		} else if (GamingCanvas.stateFullscreen === state) {
			return true;
		}

		if (state) {
			try {
				await (element || GamingCanvas.elementContainer).requestFullscreen();
				return true;
			} catch (error) {
				return false;
			}
		} else {
			await document.exitFullscreen();
			return true;
		}
	}

	// detectmobilebrowsers.com | unlicense | 'This is free and unencumbered software released into the public domain.' [08/23/25]
	public static isMobileOrTablet(): boolean {
		let check = false;
		(function (a) {
			if (
				/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
					a,
				) ||
				/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
					a.substr(0, 4),
				)
			)
				check = true;
		})(navigator.userAgent || (<any>window).vendor || (<any>window).opera);
		return check;
	}

	/**
	 * @param unadjustedMovement when true, disables OS-level mouse acceleration and access raw mouse input
	 */
	public static async mouseLock(_unadjustedMovement?: boolean): Promise<boolean> {
		return false;
	}

	public static isMouseLocked(): boolean {
		return false;
	}

	private static formatOptions(options: GamingCanvasOptions): GamingCanvasOptions {
		options.aspectRatio = options.aspectRatio === undefined ? 16 / 9 : Number(options.aspectRatio) || 16 / 9;
		options.audioBufferCount = options.audioBufferCount === undefined ? 20 : Math.max(5, Math.min(50, Number(options.audioBufferCount)));
		options.audioEnable = options.audioEnable === undefined ? false : options.audioEnable === true;
		options.callbackReportLimitPerMs = Math.max(0, Number(options.callbackReportLimitPerMs) || 8);
		options.canvasCount = options.canvasCount === undefined ? 1 : Math.max(1, Number(options.canvasCount) || 0);
		options.canvasSplit = options.canvasSplit === undefined ? [] : options.canvasSplit;
		options.canvasSplitLandscapeVertical = options.canvasSplitLandscapeVertical === undefined ? true : options.canvasSplitLandscapeVertical === true;
		options.debug = options.debug === undefined ? false : options.debug === true;
		options.dpiSupportEnable = options.dpiSupportEnable === undefined ? false : options.dpiSupportEnable === true;
		options.inputGamepadDeadbandStick =
			options.inputGamepadDeadbandStick === undefined ? 0.08 : Math.max(0, Math.min(1, Number(options.inputGamepadDeadbandStick) || 0));
		options.inputGamepadEnable = options.inputGamepadEnable === undefined ? false : options.inputGamepadEnable === true;
		options.inputKeyboardEnable = options.inputKeyboardEnable === undefined ? false : options.inputKeyboardEnable === true;
		options.inputMouseEnable = options.inputMouseEnable === undefined ? false : options.inputMouseEnable === true;
		options.inputMousePreventContextMenu = options.inputMousePreventContextMenu === undefined ? false : options.inputMousePreventContextMenu === true;
		options.inputTouchEnable = options.inputTouchEnable === undefined ? false : options.inputTouchEnable === true;
		options.inputLimitPerMs = options.inputLimitPerMs === undefined ? 8 : Math.max(0, Number(options.inputLimitPerMs) || 8);
		options.orientation = options.orientation === undefined ? GamingCanvasOrientation.AUTO : options.orientation;
		options.orientationCanvasRotateEnable = options.orientationCanvasRotateEnable === undefined ? true : options.orientationCanvasRotateEnable === true;
		options.orientationCanvasPortaitRotateLeft =
			options.orientationCanvasPortaitRotateLeft === undefined ? false : options.orientationCanvasPortaitRotateLeft === true;
		options.resolutionScaleToFit = options.resolutionScaleToFit === undefined ? true : options.resolutionScaleToFit === true;
		options.resolutionScaleType = options.resolutionScaleType === undefined ? GamingCanvasResolutionScaleType.ANTIALIAS : options.resolutionScaleType;
		options.resolutionWidthPx = options.resolutionWidthPx === undefined ? null : Number(options.resolutionWidthPx) | 0 || null;

		return options;
	}

	public static getOptions(): GamingCanvasOptions {
		return JSON.parse(JSON.stringify(GamingCanvas.options || {}));
	}

	/**
	 * Options not mutabile after initialization:
	 * 	- audio*
	 *  - canvasCount
	 * 	- elementInjectAsCanvas
	 * 	- elementInjectAsOverlay
	 *  - input*
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

	public static isLandscape(): boolean {
		return GamingCanvas.stateOrientation === GamingCanvasOrientation.LANDSCAPE;
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
		return <{ [key: string]: GamingCanvasInputGamepadState }>(<unknown>undefined);
	}
}
