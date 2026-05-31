import { GamingCanvasFIFOQueue } from '../fifo-queue.js';
import { GamingCanvasInput, GamingCanvasInputType } from '../inputs.js';
import { GamingCanvasInputGamepadInstance } from './gamepad.engine.js';
import { GamingCanvasInputKeyboardInstance } from './keyboard.engine.js';
import { GamingCanvasInputMouseInstance } from './mouse.engine.js';
import { GamingCanvasInputTouchInstance } from './touch.engine.js';
import { GamingCanvasUtilTimers } from '../util.js';

/**
 * @author tknight-dev
 */

export interface GamingCanvasTransition {
	attach?: GamingCanvasTransitionAttach;
	debug?: boolean;
	defaultFrameIncoming?: GamingCanvasTransitionFrameEffect;
	defaultFrameOutgoing?: GamingCanvasTransitionFrameEffect;
	defaultFrameSkip?: GamingCanvasTransitionFrameSkip;
	inputPassthrough?: boolean;
	fps?: number;
	frames: GamingCanvasTransitionFrameGroup[];
	frameStart?: GamingCanvasTransitionFrameEffect;
	frameStop?: GamingCanvasTransitionFrameEffect;
	loop?: boolean;
	zIndexBackground?: number;
	zIndexEffect?: number;
	zIndexFrames?: number;
}

interface GamingCanvasTransitionAnimateProperty {
	active: boolean;
	cssPropertyValuePostfix?: string; // `${value}${cssPropertyValuePostfix}` like '50%'
	html: HTMLElement;
	timestamp: number;
	valueCurrent: number;
	valueFrom: number;
	valueStep: number;
	valueTo: number;
}

enum GamingCanvasTransitionAnimatePropertyType {
	OPACITY,
}

enum GamingCanvasTransitionAnimateType {
	BACKGROUND,
	EFFECT,
}
const GamingCanvasTransitionAnimateTypes: GamingCanvasTransitionAnimateType[] = [
	GamingCanvasTransitionAnimateType.BACKGROUND,
	GamingCanvasTransitionAnimateType.EFFECT,
];

export enum GamingCanvasTransitionAttach {
	CANVAS,
	OVERLAY,
}

export interface GamingCanvasTransitionAudioInstance {
	assetId: number;
	pan?: number;
	volume?: number;
}

export interface GamingCanvasTransitionFrame {
	durationInMs?: number;
	durationInMsMin?: number;
	frameType?: GamingCanvasTransitionFrameType;
	skip?: GamingCanvasTransitionFrameSkip;
}

export interface GamingCanvasTransitionFrameContent extends GamingCanvasTransitionFrame {
	type: GamingCanvasTransitionFrameContentType;
}

export interface GamingCanvasTransitionFrameContentElements extends GamingCanvasTransitionFrameContent {
	images?: GamingCanvasTransitionFrameContentElementsImage[];
	text?: GamingCanvasTransitionFrameContentElementsText[];
}

export interface GamingCanvasTransitionFrameContentElementsImage extends GamingCanvasTransitionFrameContentElementsShared {
	cssImageFilterBlurInPx?: number;
	cssImageFilterGrayscalePercentage?: number;
	cssImageFilterInvertPercentage?: number;
	cssImageFilterOpacityPercentage?: number;
	cssImageFilterSaturatePercentage?: number;
	cssImageFilterSepiaPercentage?: number;
	cssImageFlipHorizontal?: boolean;
	cssImageFlipVertical?: boolean;
	cssImagePosition?: string;
	cssImageRepeat?: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
	cssImageSize?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
	src: string;
}

export interface GamingCanvasTransitionFrameContentElementsShared {
	cssAbsoluteBottom?: 0 | string;
	cssAbsoluteLeft?: 0 | string;
	cssAbsoluteRight?: 0 | string;
	cssAbsoluteTop?: 0 | string;
	cssZIndex?: number;
	htmlId?: string;
}

export interface GamingCanvasTransitionFrameContentElementsText extends GamingCanvasTransitionFrameContentElementsShared {
	cssCenteringHorizontal?: 'center' | 'space-around' | 'space-between' | 'space-evenly' | 'start' | 'stop';
	cssCenteringVertical?: 'center' | 'start' | 'stop';
	cssFontColor?: string;
	cssFontFamily?: string;
	cssFontSize?: string;
	cssTextAlign?: 'center' | 'justify' | 'left' | 'right';
	effect?: GamingCanvasTransitionFrameContentElementsTextEffect;
	effectTypewriterAudioEffectCarriageReturn?: GamingCanvasTransitionAudioInstance;
	effectTypewriterAudioEffectKey?: GamingCanvasTransitionAudioInstance;
	effectTypewriterCarriageReturnPauseInMs?: number;
	effectTypewriterElements?: HTMLSpanElement[];
	effectTypewriterLetterPerMs?: number;
	effectOnComplete?: (frameIndex: number, frameState: GamingCanvasTransitionFrameState, frameTextIndex: number, skipped: boolean) => void;
	effectOnSkipCompleteEffect?: boolean;
	value: string;
}

export enum GamingCanvasTransitionFrameContentElementsTextEffect {
	NONE,
	TYPEWRITER,
}

export interface GamingCanvasTransitionFrameContentHTML extends GamingCanvasTransitionFrameContent {
	html: HTMLElement;
}

export enum GamingCanvasTransitionFrameContentType {
	ELEMENTS,
	HTML,
}

export interface GamingCanvasTransitionFrameEffect extends GamingCanvasTransitionFrame {
	cssEffectColor?: string;
	type: GamingCanvasTransitionFrameEffectType;
}

export enum GamingCanvasTransitionFrameEffectType {
	FADE,
	NONE,
}

export interface GamingCanvasTransitionFrameGroup {
	content: GamingCanvasTransitionFrameContentElements | GamingCanvasTransitionFrameContentHTML;
	cssBackgroundColor?: string;
	incoming?: GamingCanvasTransitionFrameEffect;
	outgoing?: GamingCanvasTransitionFrameEffect;
}

export interface GamingCanvasTransitionFrameSkip {
	enable?: boolean;
	fastForwardFixedDurationInMs?: number;
	fastForwardSpeed?: number;
	inputs?: (GamingCanvasInputGamepadInstance | GamingCanvasInputKeyboardInstance | GamingCanvasInputMouseInstance | GamingCanvasInputTouchInstance)[];
	toIndex?: number;
	toState?: GamingCanvasTransitionFrameState;
	type?: GamingCanvasTransitionFrameSkipType;
}

export enum GamingCanvasTransitionFrameSkipType {
	FAST_FORWARD_FIXED_DURATION,
	FAST_FORWARD_SPEED,
	INSTANT,
}

export enum GamingCanvasTransitionFrameState {
	CONTENT,
	INCOMING,
	OUTGOING,
}

export enum GamingCanvasTransitionFrameType {
	CONTENT,
	EFFECT,
}

interface GamingCanvasTransitionState {
	countFrames: number;
	countFrameStates: number;
	durationInMsActual: number;
	durationInMsEstimated: number;
	frameActive?: GamingCanvasTransitionFrame;
	frameActiveDOM?: HTMLElement;
	frameIndex: number;
	frameState: GamingCanvasTransitionFrameState;
	skipable: boolean;
	skipping: boolean;
	skippingInput?: GamingCanvasInput;
	skippingProperties: GamingCanvasTransitionFrameSkip;
	timestampStateStart: number;
}

export class GamingCanvasEngineTransition {
	private static active: boolean;
	private static callbackAudioEffect: (assetId: number, pan?: number, volume?: number) => void;
	private static callbackLockout: (state: boolean) => void;
	private static callbackTransitionSkipAvailable: (available: boolean) => void;
	private static callbackTransitionSkipped: () => void;
	private static callbackTransitionState: (active: boolean) => void;
	private static callbackTransitionFrame: (
		frameActive: GamingCanvasTransitionFrameContentElements | GamingCanvasTransitionFrameContentHTML,
		frameActiveIndex: number,
		frameActiveState: GamingCanvasTransitionFrameState,
		framePreviousDurationInMs: number,
		framePreviousSkipInput?: GamingCanvasInput,
	) => void;
	private static callbackTransitionFPS: (fps: number) => void;
	private static domBackground: HTMLElement;
	private static domEffect: HTMLElement;
	private static domFrameContainer: HTMLElement;
	private static domFrameContainerWrapper: HTMLElement;
	private static domFrames: HTMLElement[] = [];
	private static elementContainerCanvas: HTMLElement;
	private static elementContainerOverlayWrapper: HTMLElement;
	private static inputRequest: number; // AnimationRequestFrameId
	private static inputSuspend: boolean; // Ignore inputs
	private static nextSkipStateTimeout: ReturnType<typeof setTimeout>;
	private static nextSkipStateTimeoutActive: boolean;
	private static queue: GamingCanvasFIFOQueue<GamingCanvasInput>;
	private static queueLockout: GamingCanvasFIFOQueue<GamingCanvasInput>;
	private static transition: GamingCanvasTransition;
	private static transitionAnimate: Map<
		GamingCanvasTransitionAnimateType,
		Map<GamingCanvasTransitionAnimatePropertyType, GamingCanvasTransitionAnimateProperty>
	> = new Map();
	private static transitionAnimateFPMS: number = 16.666; // 60FPS
	private static transitionPause: boolean;
	private static transitionState: GamingCanvasTransitionState;
	private static transitionTimer: GamingCanvasUtilTimers = new GamingCanvasUtilTimers();
	private static transitionTimerFrameId: number = -1;

	public static initialize(
		elementContainerCanvas: HTMLElement,
		elementContainerOverlayWrapper: HTMLElement,
		queue: GamingCanvasFIFOQueue<GamingCanvasInput>,
		queueLockout: GamingCanvasFIFOQueue<GamingCanvasInput>,
	): void {
		GamingCanvasEngineTransition.elementContainerCanvas = elementContainerCanvas;
		GamingCanvasEngineTransition.elementContainerOverlayWrapper = elementContainerOverlayWrapper;
		GamingCanvasEngineTransition.queue = queue;
		GamingCanvasEngineTransition.queueLockout = queueLockout;

		// Animations
		let map: Map<GamingCanvasTransitionAnimatePropertyType, GamingCanvasTransitionAnimateProperty> | undefined;
		for (let type of GamingCanvasTransitionAnimateTypes) {
			map = GamingCanvasEngineTransition.transitionAnimate.get(type);

			if (map === undefined) {
				map = new Map();
				GamingCanvasEngineTransition.transitionAnimate.set(type, map);
			}

			map.set(GamingCanvasTransitionAnimatePropertyType.OPACITY, {
				active: false,
				html: <any>{},
				timestamp: 0,
				valueCurrent: 0,
				valueFrom: 0,
				valueStep: 0,
				valueTo: 0,
			});
		}
	}

	public static apply(transition: GamingCanvasTransition, debug?: boolean): boolean {
		let container: HTMLElement,
			count: number = 0,
			htmlElement: HTMLElement,
			htmlElementInstance: HTMLElement,
			htmlElementWrapper: HTMLElement,
			frameGroup: GamingCanvasTransitionFrameGroup,
			string: string;

		if (GamingCanvasEngineTransition.active === true) {
			// Clear active transition if present
			GamingCanvasEngineTransition.controlStop();
		}
		GamingCanvasEngineTransition.active = true;

		/**
		 * Defaults
		 */
		GamingCanvasEngineTransition.transitionState = GamingCanvasEngineTransition.applyDefaults(transition, debug);

		/**
		 * Config
		 */
		debug = transition.debug;
		GamingCanvasEngineTransition.nextSkipState(false);
		GamingCanvasEngineTransition.transition = transition;
		GamingCanvasEngineTransition.transitionAnimateFPMS = Math.round(10000000 / <number>transition.fps) / 10000;

		/**
		 * Validation
		 */
		if (transition.frames === undefined || transition.frames.length === 0) {
			console.error('GamingCanvas > GamingCanvasEngineTransition > apply: frames cannot be null or undefined');
			GamingCanvasEngineTransition.active = false;
			return false;
		}
		for (frameGroup of transition.frames) {
			switch (frameGroup.content.type) {
				case GamingCanvasTransitionFrameContentType.HTML:
					if ((<GamingCanvasTransitionFrameContentHTML>frameGroup.content).html === undefined) {
						console.error(
							'GamingCanvas > GamingCanvasEngineTransition > apply: HTML cannot be null or undefined [frame(' + count + '), contentType=HTML]',
						);

						GamingCanvasEngineTransition.active = false;
						return false;
					}
					break;
			}
			count++;
		}

		/**
		 * DOM: Elements
		 */
		// Background
		if (GamingCanvasEngineTransition.domBackground === undefined) {
			GamingCanvasEngineTransition.domBackground = document.createElement('div');
			GamingCanvasEngineTransition.domBackground.id = 'gaming-canvas-transition-background';

			// Add reference to animation object
			(<any>GamingCanvasEngineTransition.transitionAnimate.get(GamingCanvasTransitionAnimateType.BACKGROUND)).get(
				GamingCanvasTransitionAnimatePropertyType.OPACITY,
			).html = GamingCanvasEngineTransition.domBackground;
		}
		GamingCanvasEngineTransition.domBackground.style.bottom = '0';
		GamingCanvasEngineTransition.domBackground.style.left = '0';
		GamingCanvasEngineTransition.domBackground.style.pointerEvents = 'none';
		GamingCanvasEngineTransition.domBackground.style.opacity = '0';
		GamingCanvasEngineTransition.domBackground.style.position = 'absolute';
		GamingCanvasEngineTransition.domBackground.style.right = '0';
		GamingCanvasEngineTransition.domBackground.style.top = '0';
		GamingCanvasEngineTransition.domBackground.style.touchAction = 'none';
		GamingCanvasEngineTransition.domBackground.style.zIndex = String(transition.zIndexBackground);

		// Effect
		if (GamingCanvasEngineTransition.domEffect === undefined) {
			GamingCanvasEngineTransition.domEffect = document.createElement('div');
			GamingCanvasEngineTransition.domEffect.id = 'gaming-canvas-transition-effect';

			// Add reference to animation object
			(<any>GamingCanvasEngineTransition.transitionAnimate.get(GamingCanvasTransitionAnimateType.EFFECT)).get(
				GamingCanvasTransitionAnimatePropertyType.OPACITY,
			).html = GamingCanvasEngineTransition.domEffect;
		}
		GamingCanvasEngineTransition.domEffect.style.bottom = '0';
		GamingCanvasEngineTransition.domEffect.style.left = '0';
		GamingCanvasEngineTransition.domEffect.style.opacity = '0';
		GamingCanvasEngineTransition.domEffect.style.pointerEvents = 'none';
		GamingCanvasEngineTransition.domEffect.style.position = 'absolute';
		GamingCanvasEngineTransition.domEffect.style.right = '0';
		GamingCanvasEngineTransition.domEffect.style.top = '0';
		GamingCanvasEngineTransition.domEffect.style.touchAction = 'none';
		GamingCanvasEngineTransition.domEffect.style.zIndex = String(transition.zIndexEffect);

		// Frame Container
		if (GamingCanvasEngineTransition.domFrameContainer === undefined) {
			GamingCanvasEngineTransition.domFrameContainer = document.createElement('div');
			GamingCanvasEngineTransition.domFrameContainer.id = 'gaming-canvas-transition-frame-container';

			GamingCanvasEngineTransition.domFrameContainerWrapper = document.createElement('div');
			GamingCanvasEngineTransition.domFrameContainerWrapper.id = 'gaming-canvas-transition-frame-container-wrapper';
			GamingCanvasEngineTransition.domFrameContainer.appendChild(GamingCanvasEngineTransition.domFrameContainerWrapper);
		}
		GamingCanvasEngineTransition.domFrameContainer.style.bottom = '0';
		GamingCanvasEngineTransition.domFrameContainer.style.left = '0';
		GamingCanvasEngineTransition.domFrameContainer.style.pointerEvents = 'none';
		GamingCanvasEngineTransition.domFrameContainer.style.position = 'absolute';
		GamingCanvasEngineTransition.domFrameContainer.style.right = '0';
		GamingCanvasEngineTransition.domFrameContainer.style.top = '0';
		GamingCanvasEngineTransition.domFrameContainer.style.touchAction = 'none';
		GamingCanvasEngineTransition.domFrameContainer.style.zIndex = String(transition.zIndexFrames);

		GamingCanvasEngineTransition.domFrameContainerWrapper.style.height = '100%';
		GamingCanvasEngineTransition.domFrameContainerWrapper.style.pointerEvents = 'none';
		GamingCanvasEngineTransition.domFrameContainerWrapper.style.position = 'relative';
		GamingCanvasEngineTransition.domFrameContainerWrapper.style.touchAction = 'none';
		GamingCanvasEngineTransition.domFrameContainerWrapper.style.width = '100%';

		// Frames
		for (frameGroup of transition.frames) {
			switch (frameGroup.content.type) {
				default:
				case GamingCanvasTransitionFrameContentType.ELEMENTS:
					// Elements
					htmlElement = document.createElement('div');
					htmlElement.id = 'gaming-canvas-transition-frame-' + count;
					break;
				case GamingCanvasTransitionFrameContentType.HTML:
					htmlElement = (<GamingCanvasTransitionFrameContentHTML>frameGroup.content).html;
					break;
			}

			// Style
			htmlElement.style.bottom = '0';
			htmlElement.style.display = 'none';
			htmlElement.style.left = '0';
			htmlElement.style.pointerEvents = 'none';
			htmlElement.style.position = 'absolute';
			htmlElement.style.right = '0';
			htmlElement.style.top = '0';
			htmlElement.style.touchAction = 'none';
			htmlElement.style.zIndex = String(transition.frames.length - (count + 1));

			// Render Elements
			htmlElementWrapper = document.createElement('div');
			htmlElementWrapper.style.height = '100%';
			htmlElementWrapper.style.position = 'relative';
			htmlElementWrapper.style.width = '100%';
			htmlElement.appendChild(htmlElementWrapper);

			if (frameGroup.content.type === GamingCanvasTransitionFrameContentType.ELEMENTS) {
				let image: GamingCanvasTransitionFrameContentElementsImage,
					images: GamingCanvasTransitionFrameContentElementsImage[] | undefined,
					text: GamingCanvasTransitionFrameContentElementsText,
					texts: GamingCanvasTransitionFrameContentElementsText[] | undefined;

				images = (<GamingCanvasTransitionFrameContentElements>frameGroup.content).images;
				if (images !== undefined) {
					for (image of images) {
						// Element
						htmlElementInstance = document.createElement('div');
						image.htmlId !== undefined && (htmlElementInstance.id = image.htmlId);

						// Image
						htmlElementInstance.style.background = `url('${image.src}')`;
						image.cssImagePosition !== undefined && (htmlElementInstance.style.backgroundPosition = image.cssImagePosition);
						image.cssImageRepeat !== undefined && (htmlElementInstance.style.backgroundRepeat = image.cssImageRepeat);
						image.cssImageSize !== undefined && (htmlElementInstance.style.backgroundSize = image.cssImageSize);

						// Filter
						htmlElementInstance.style.filter = `blur(${image.cssImageFilterBlurInPx}px) grayscale(${image.cssImageFilterGrayscalePercentage}%) invert(${image.cssImageFilterInvertPercentage}%) opacity(${image.cssImageFilterOpacityPercentage}%) saturate(${image.cssImageFilterSaturatePercentage}%) sepia(${image.cssImageFilterSepiaPercentage}%)`;

						// Flip
						if (image.cssImageFlipHorizontal === true && image.cssImageFlipVertical === true) {
							htmlElementInstance.style.transform = 'scale(-1, -1)';
						} else if (image.cssImageFlipHorizontal === true) {
							htmlElementInstance.style.transform = 'scaleX(-1)';
						} else if (image.cssImageFlipVertical === true) {
							htmlElementInstance.style.transform = 'scaleY(-1)';
						}

						// Style
						htmlElementInstance.style.bottom = String(image.cssAbsoluteBottom);
						htmlElementInstance.style.left = String(image.cssAbsoluteLeft);
						htmlElementInstance.style.pointerEvents = 'none';
						htmlElementInstance.style.position = 'absolute';
						htmlElementInstance.style.right = String(image.cssAbsoluteRight);
						htmlElementInstance.style.top = String(image.cssAbsoluteTop);
						htmlElementInstance.style.touchAction = 'none';
						htmlElementInstance.style.zIndex = String(image.cssZIndex);

						if (debug === true) {
							htmlElementInstance.style.border = '1px solid red';
							htmlElementInstance.style.boxShadow = 'inset 0 0 3px 3px red';
						}

						// Done
						htmlElementWrapper.appendChild(htmlElementInstance);
					}
				}

				texts = (<GamingCanvasTransitionFrameContentElements>frameGroup.content).text;
				if (texts !== undefined) {
					for (text of texts) {
						// Element
						htmlElementInstance = document.createElement('div');
						text.htmlId !== undefined && (htmlElementInstance.id = text.htmlId);

						// Style
						htmlElementInstance.style.alignItems = String(text.cssCenteringVertical);
						htmlElementInstance.style.bottom = String(text.cssAbsoluteBottom);
						htmlElementInstance.style.color = <string>text.cssFontColor;
						htmlElementInstance.style.display = 'flex';
						// htmlElementInstance.style.flexWrap = 'wrap';
						htmlElementInstance.style.fontFamily = <string>text.cssFontFamily;
						htmlElementInstance.style.fontSize = <string>text.cssFontSize;
						htmlElementInstance.style.textAlign = <string>text.cssTextAlign;
						htmlElementInstance.style.justifyContent = <string>text.cssCenteringHorizontal;
						htmlElementInstance.style.left = String(text.cssAbsoluteLeft);
						htmlElementInstance.style.pointerEvents = 'none';
						htmlElementInstance.style.position = 'absolute';
						htmlElementInstance.style.right = String(text.cssAbsoluteRight);
						htmlElementInstance.style.top = String(text.cssAbsoluteTop);
						htmlElementInstance.style.touchAction = 'none';
						htmlElementInstance.style.zIndex = String(text.cssZIndex);

						// Value
						let char: string = '',
							htmlChar: HTMLSpanElement,
							htmlText: HTMLSpanElement = document.createElement('span'),
							htmlWord: HTMLSpanElement | undefined,
							htmlChars: HTMLSpanElement[] = [];

						// Force text to wrap inside bounding box of parent element
						htmlText.style.maxWidth = '100%';
						htmlText.style.overflowWrap = 'break-word';

						// Parse string into html elements
						for (char of text.value) {
							if (char !== ' ' && char !== '\n') {
								if (htmlWord === undefined) {
									htmlWord = document.createElement('span');
									htmlWord.style.whiteSpace = 'nowrap'; // Prevent wrapping during words
								}

								htmlChar = document.createElement('span');
								htmlChar.innerText = char;
								htmlChar.style.color =
									text.effect === GamingCanvasTransitionFrameContentElementsTextEffect.TYPEWRITER ? 'transparent' : <string>text.cssFontColor;

								htmlChars.push(htmlChar);
								htmlWord.appendChild(htmlChar);
							} else {
								if (htmlWord !== undefined) {
									htmlText.appendChild(htmlWord);
									htmlWord = undefined;
								}

								// Special characters
								if (char === ' ') {
									htmlChar = document.createElement('span');
									htmlChar.innerHTML = '&nbsp;';
									htmlText.appendChild(htmlChar);
								} else {
									htmlChar = document.createElement('span');
									htmlChar.innerText = '<br>';
									htmlChars.push(htmlChar);

									// Append breaking line to html
									htmlText.appendChild(document.createElement('br'));
								}
							}
						}
						if (htmlWord !== undefined) {
							// The last word
							htmlText.appendChild(htmlWord);
						}

						// Done
						htmlElementInstance.appendChild(htmlText);
						text.effectTypewriterElements = htmlChars;

						if (debug === true) {
							htmlElementInstance.style.border = '1px solid blue';
							htmlElementInstance.style.boxShadow = 'inset 0 0 3px 3px blue';
						}

						// Done
						htmlElementWrapper.appendChild(htmlElementInstance);
					}
				}
			} else {
				// HTML
				htmlElementWrapper.appendChild((<GamingCanvasTransitionFrameContentHTML>frameGroup.content).html);
			}

			// Done
			count++;
			GamingCanvasEngineTransition.domFrames.push(htmlElement);
		}

		/**
		 * DOM: Attach
		 */
		switch (transition.attach) {
			default:
			case GamingCanvasTransitionAttach.CANVAS:
				container = GamingCanvasEngineTransition.elementContainerCanvas;
				break;
			case GamingCanvasTransitionAttach.OVERLAY:
				container = GamingCanvasEngineTransition.elementContainerOverlayWrapper;
				break;
		}
		container.appendChild(GamingCanvasEngineTransition.domBackground);
		container.appendChild(GamingCanvasEngineTransition.domEffect);
		container.appendChild(GamingCanvasEngineTransition.domFrameContainer);

		for (htmlElement of GamingCanvasEngineTransition.domFrames) {
			GamingCanvasEngineTransition.domFrameContainerWrapper.appendChild(htmlElement);
		}

		/**
		 * Start
		 */
		GamingCanvasEngineTransition.transitionPause = false;

		GamingCanvasEngineTransition.loop(transition.inputPassthrough === true);
		GamingCanvasEngineTransition.next();

		// We have lift off!
		return true;
	}

	private static applyDefaults(transition: GamingCanvasTransition, debug?: boolean): GamingCanvasTransitionState {
		let defaultFrameIncoming: GamingCanvasTransitionFrameEffect | undefined,
			defaultFrameOutgoing: GamingCanvasTransitionFrameEffect | undefined,
			defaultFrameSkip: GamingCanvasTransitionFrameSkip | undefined,
			frameGroup: GamingCanvasTransitionFrameGroup,
			skip: GamingCanvasTransitionFrameSkip,
			state: GamingCanvasTransitionState = <any>{
				activeSkipable: false,
				activeSkipping: false,
				activeSkippingProperties: <any>{},
				activeTimestampStateStart: 0,
				countFrames: 0,
				countFrameStates: 0,
				durationInMsActual: 0,
				durationInMsEstimated: 0,
				frameActive: undefined,
				frameIndex: -1,
				frameState: <any>{},
			};

		// Main Properties
		transition.attach === undefined && (transition.attach = GamingCanvasTransitionAttach.CANVAS);
		transition.debug === undefined && (transition.debug = debug || false);
		transition.inputPassthrough === undefined && (transition.inputPassthrough = false);
		transition.fps === undefined && (transition.fps = 60);
		transition.loop === undefined && (transition.loop = false);
		transition.zIndexBackground === undefined && (transition.zIndexBackground = 5);
		transition.zIndexEffect === undefined && (transition.zIndexEffect = 9999);
		transition.zIndexFrames === undefined && (transition.zIndexFrames = transition.zIndexBackground + 2);

		// Frame Properties
		let defaultFrame = (frame?: GamingCanvasTransitionFrame) => {
				if (frame !== undefined) {
					frame.durationInMs === undefined && (frame.durationInMs = 2500);

					if (frame.skip === undefined) {
						frame.skip = JSON.parse(JSON.stringify(defaultFrameSkip));
					} else {
						frame.skip = defaultSkip(frame.skip);
					}
				}

				return frame;
			},
			defaultFrameContent = (frame: GamingCanvasTransitionFrameContent) => {
				let frameElements: GamingCanvasTransitionFrameContentElements = <GamingCanvasTransitionFrameContentElements>frame,
					frameElementImage: GamingCanvasTransitionFrameContentElementsImage,
					frameElementText: GamingCanvasTransitionFrameContentElementsText,
					frameHTML: GamingCanvasTransitionFrameContentElements = <GamingCanvasTransitionFrameContentElements>frame;

				defaultFrame(frame);

				frame.durationInMsMin === undefined && (frame.durationInMsMin = 1000);
				frame.frameType = GamingCanvasTransitionFrameType.CONTENT;

				// Type specific
				switch (frame.type) {
					case GamingCanvasTransitionFrameContentType.ELEMENTS:
						if (frameElements.images !== undefined) {
							if (frameElements.images.length === 0) {
								frameElements.images = undefined;
							} else {
								for (frameElementImage of frameElements.images) {
									frameElementImage.cssAbsoluteBottom === undefined && (frameElementImage.cssAbsoluteBottom = 0);
									frameElementImage.cssAbsoluteLeft === undefined && (frameElementImage.cssAbsoluteLeft = 0);
									frameElementImage.cssAbsoluteRight === undefined && (frameElementImage.cssAbsoluteRight = 0);
									frameElementImage.cssAbsoluteTop === undefined && (frameElementImage.cssAbsoluteTop = 0);
									frameElementImage.cssZIndex === undefined && (frameElementImage.cssZIndex = 1);

									frameElementImage.cssImageFilterBlurInPx === undefined && (frameElementImage.cssImageFilterBlurInPx = 0);
									frameElementImage.cssImageFilterGrayscalePercentage === undefined &&
										(frameElementImage.cssImageFilterGrayscalePercentage = 0);
									frameElementImage.cssImageFilterInvertPercentage === undefined && (frameElementImage.cssImageFilterInvertPercentage = 0);
									frameElementImage.cssImageFilterOpacityPercentage === undefined &&
										(frameElementImage.cssImageFilterOpacityPercentage = 100);
									frameElementImage.cssImageFilterSaturatePercentage === undefined &&
										(frameElementImage.cssImageFilterSaturatePercentage = 100);
									frameElementImage.cssImageFilterSepiaPercentage === undefined && (frameElementImage.cssImageFilterSepiaPercentage = 0);
									frameElementImage.cssImageFlipHorizontal === undefined && (frameElementImage.cssImageFlipHorizontal = false);
									frameElementImage.cssImageFlipVertical === undefined && (frameElementImage.cssImageFlipVertical = false);
									frameElementImage.cssImagePosition === undefined && (frameElementImage.cssImagePosition = 'center center');
									frameElementImage.cssImageRepeat === undefined && (frameElementImage.cssImageRepeat = 'no-repeat');
									frameElementImage.cssImageSize === undefined && (frameElementImage.cssImageSize = 'contain');
								}
							}
						}
						if (frameElements.text !== undefined) {
							if (frameElements.text.length === 0) {
								frameElements.text = undefined;
							} else {
								for (frameElementText of frameElements.text) {
									frameElementText.cssAbsoluteBottom === undefined && (frameElementText.cssAbsoluteBottom = 0);
									frameElementText.cssAbsoluteLeft === undefined && (frameElementText.cssAbsoluteLeft = 0);
									frameElementText.cssAbsoluteRight === undefined && (frameElementText.cssAbsoluteRight = 0);
									frameElementText.cssAbsoluteTop === undefined && (frameElementText.cssAbsoluteTop = 0);
									frameElementText.cssZIndex === undefined && (frameElementText.cssZIndex = 1);

									frameElementText.cssCenteringHorizontal === undefined && (frameElementText.cssCenteringHorizontal = 'center');
									frameElementText.cssCenteringVertical === undefined && (frameElementText.cssCenteringVertical = 'center');
									frameElementText.cssFontColor === undefined && (frameElementText.cssFontColor = '#ffffff');
									frameElementText.cssFontFamily === undefined && (frameElementText.cssFontFamily = 'Arial, Helvetica, sans-serif');
									frameElementText.cssFontSize === undefined && (frameElementText.cssFontSize = '1em');
									frameElementText.cssTextAlign === undefined && (frameElementText.cssTextAlign = 'left');
									frameElementText.effect === undefined &&
										(frameElementText.effect = GamingCanvasTransitionFrameContentElementsTextEffect.NONE);
									frameElementText.effectTypewriterCarriageReturnPauseInMs === undefined &&
										(frameElementText.effectTypewriterCarriageReturnPauseInMs = 200);
									frameElementText.effectTypewriterLetterPerMs === undefined && (frameElementText.effectTypewriterLetterPerMs = 100);
									frameElementText.effectOnSkipCompleteEffect === undefined && (frameElementText.effectOnSkipCompleteEffect = false);
								}
							}
						}

						break;
					case GamingCanvasTransitionFrameContentType.HTML:
						frame = <GamingCanvasTransitionFrameContentHTML>frame;
						break;
				}

				return frame;
			},
			defaultFrameEffect = (frame?: GamingCanvasTransitionFrameEffect) => {
				if (frame !== undefined) {
					defaultFrame(frame);

					frame.durationInMsMin === undefined && (frame.durationInMsMin = 0);
					frame.cssEffectColor === undefined && (frame.cssEffectColor = '#000000');
					frame.type === undefined && (frame.type = GamingCanvasTransitionFrameEffectType.NONE);
					frame.frameType = GamingCanvasTransitionFrameType.EFFECT;
				}

				return frame;
			},
			defaultSkip = (skip?: GamingCanvasTransitionFrameSkip) => {
				if (skip !== undefined) {
					skip.enable === undefined && (skip.enable = false);
					skip.fastForwardFixedDurationInMs === undefined && (skip.fastForwardFixedDurationInMs = 200);
					skip.fastForwardSpeed === undefined && (skip.fastForwardSpeed = 2);
					skip.type === undefined && (skip.type = GamingCanvasTransitionFrameSkipType.FAST_FORWARD_FIXED_DURATION);
				} else {
					skip = {
						enable: false,
						type: GamingCanvasTransitionFrameSkipType.FAST_FORWARD_FIXED_DURATION,
					};
				}

				return skip;
			};

		defaultFrameSkip = defaultSkip(transition.defaultFrameSkip); // Order is important
		defaultFrameIncoming = defaultFrameEffect(transition.defaultFrameIncoming); // Must come after skip
		defaultFrameOutgoing = defaultFrameEffect(transition.defaultFrameOutgoing); // Must come after skip

		// Frame transition bookends
		transition.frameStart = defaultFrameEffect(transition.frameStart);
		if (transition.frameStart !== undefined) {
			state.countFrameStates++;
			state.durationInMsEstimated += transition.frameStart.durationInMs || 0;
		}

		transition.frameStop = defaultFrameEffect(transition.frameStop);
		if (transition.frameStop !== undefined) {
			state.countFrameStates++;
			state.durationInMsEstimated += transition.frameStop.durationInMs || 0;
		}

		// Frames
		for (frameGroup of transition.frames) {
			/**
			 * General
			 */
			frameGroup.cssBackgroundColor === undefined && (frameGroup.cssBackgroundColor = '#000000');

			// Content
			frameGroup.content = defaultFrameContent(frameGroup.content);
			state.countFrameStates++;

			// Incoming
			if (frameGroup.incoming === undefined) {
				if (defaultFrameIncoming !== undefined) {
					frameGroup.incoming = JSON.parse(JSON.stringify(defaultFrameIncoming));
				} else {
					frameGroup.incoming = defaultFrameEffect(<any>{});
				}
			} else {
				frameGroup.incoming = defaultFrameEffect(frameGroup.incoming);
			}

			// Outgoing
			if (frameGroup.outgoing === undefined) {
				if (defaultFrameOutgoing !== undefined) {
					frameGroup.outgoing = JSON.parse(JSON.stringify(defaultFrameOutgoing));
				} else {
					frameGroup.outgoing = defaultFrameEffect(<any>{});
				}
			} else {
				frameGroup.outgoing = defaultFrameEffect(frameGroup.outgoing);
			}

			/**
			 * Skipping Calc
			 */
			// Content
			skip = <GamingCanvasTransitionFrameSkip>frameGroup.content.skip;
			skip.toIndex = state.countFrames;
			skip.toState = GamingCanvasTransitionFrameState.OUTGOING;
			state.durationInMsEstimated += frameGroup.content.durationInMs || 0;

			// Incoming
			if (frameGroup.incoming !== undefined) {
				skip = <GamingCanvasTransitionFrameSkip>frameGroup.incoming.skip;

				skip.toIndex = state.countFrames;
				skip.toState = GamingCanvasTransitionFrameState.CONTENT;

				state.countFrameStates++;
				state.durationInMsEstimated += frameGroup.incoming.durationInMs || 0;
			}

			// Outgoing
			if (frameGroup.outgoing !== undefined) {
				skip = <GamingCanvasTransitionFrameSkip>frameGroup.outgoing.skip;

				skip.toIndex = state.countFrames + 1;
				skip.toState = GamingCanvasTransitionFrameState.INCOMING;

				state.countFrameStates++;
				state.durationInMsEstimated += frameGroup.outgoing.durationInMs || 0;
			}

			// Done
			state.countFrames++;
		}

		return state;
	}

	public static controlPause(): boolean {
		if (GamingCanvasEngineTransition.active !== true) {
			console.error('GamingCanvas > GamingCanvasEngineTransition > controlPause: transition not in progress');
			return false;
		}

		GamingCanvasEngineTransition.transitionPause = true;

		return true;
	}

	public static controlPlay(): boolean {
		if (GamingCanvasEngineTransition.active !== true) {
			console.error('GamingCanvas > GamingCanvasEngineTransition > controlPlay: transition not in progress');
			return false;
		}

		GamingCanvasEngineTransition.transitionPause = false;

		return true;
	}

	/**
	 * @return false on error or inability to skip due to 'durationInMsMin'
	 */
	public static controlSkip(): boolean {
		if (GamingCanvasEngineTransition.active !== true) {
			console.error('GamingCanvas > GamingCanvasEngineTransition > controlSkip: transition not in progress');
			return false;
		}

		let frameActive: GamingCanvasTransitionFrame | undefined = GamingCanvasEngineTransition.transitionState.frameActive;
		if (frameActive === undefined || GamingCanvasEngineTransition.inputSuspend === true) {
			return false;
		}

		let durationInMs: number,
			frameTimer: GamingCanvasUtilTimers = GamingCanvasEngineTransition.transitionTimer,
			frameTimerId: number = GamingCanvasEngineTransition.transitionTimerFrameId,
			frameTimeRemaining: number = <number>frameTimer.getTimeRemaining(frameTimerId),
			frameTimeRequested: number = <number>frameActive.durationInMs,
			i: number,
			property: GamingCanvasTransitionAnimateProperty | undefined,
			skip: GamingCanvasTransitionFrameSkip = <GamingCanvasTransitionFrameSkip>frameActive.skip;

		if (skip.enable !== true) {
			return false;
		}
		if (frameActive.durationInMs !== 0 && frameTimeRequested - frameTimeRemaining < <number>frameActive.durationInMsMin) {
			return false;
		}
		GamingCanvasEngineTransition.transitionState.skipping = true;
		GamingCanvasEngineTransition.nextSkipState(false);

		// Complete Effects Before Skipping
		if (GamingCanvasEngineTransition.transitionState.frameState === GamingCanvasTransitionFrameState.CONTENT) {
			if (GamingCanvasEngineTransition.transitionState.frameActive !== undefined) {
				if (
					(<GamingCanvasTransitionFrameContent>GamingCanvasEngineTransition.transitionState.frameActive).type ===
					GamingCanvasTransitionFrameContentType.ELEMENTS
				) {
					let frameContentElements: GamingCanvasTransitionFrameContentElements = <GamingCanvasTransitionFrameContentElements>(
							GamingCanvasEngineTransition.transitionState.frameActive
						),
						frameContentElementsText: GamingCanvasTransitionFrameContentElementsText,
						htmlElementSpan: HTMLSpanElement;

					// Text
					if (frameContentElements.text !== undefined) {
						for ([i, frameContentElementsText] of frameContentElements.text.entries()) {
							if (frameContentElementsText.effectTypewriterElements !== undefined) {
								// Reveal Text
								if (frameContentElementsText.effectOnSkipCompleteEffect === true) {
									for (htmlElementSpan of frameContentElementsText.effectTypewriterElements) {
										htmlElementSpan.style.color = <string>frameContentElementsText.cssFontColor;
									}
								}
							}
						}
					}
				}
			}
		}

		// Skip
		if (frameActive.durationInMs === 0) {
			switch (GamingCanvasEngineTransition.transitionState.frameState) {
				case GamingCanvasTransitionFrameState.CONTENT:
					GamingCanvasEngineTransition.transitionState.frameState = GamingCanvasTransitionFrameState.OUTGOING;
					break;
				case GamingCanvasTransitionFrameState.INCOMING:
					GamingCanvasEngineTransition.transitionState.frameState = GamingCanvasTransitionFrameState.CONTENT;
					break;
				case GamingCanvasTransitionFrameState.OUTGOING:
					GamingCanvasEngineTransition.transitionState.frameState = GamingCanvasTransitionFrameState.INCOMING;
					break;
			}

			GamingCanvasEngineTransition.next();
		} else {
			// Calc time remaining
			switch (skip.type) {
				case GamingCanvasTransitionFrameSkipType.FAST_FORWARD_FIXED_DURATION:
					durationInMs = Math.min(frameTimeRemaining, <number>skip.fastForwardFixedDurationInMs);
					break;
				default:
					console.error('GamingCanvas > GamingCanvasEngineTransition > controlSkip: unexpected skip type');
				case GamingCanvasTransitionFrameSkipType.FAST_FORWARD_SPEED:
					durationInMs = frameTimeRemaining / <number>skip.fastForwardSpeed;
					break;
				case GamingCanvasTransitionFrameSkipType.INSTANT:
					durationInMs = 0;
					break;
			}

			// Update state to new target
			if (skip.toIndex !== undefined) {
				GamingCanvasEngineTransition.transitionState.frameIndex = skip.toIndex;
			}
			if (skip.toState !== undefined) {
				GamingCanvasEngineTransition.transitionState.frameState = skip.toState;
			}

			// Update animation
			property = GamingCanvasEngineTransition.nextAnimateFetch(
				GamingCanvasTransitionAnimateType.EFFECT,
				GamingCanvasTransitionAnimatePropertyType.OPACITY,
			);
			if (property !== undefined) {
				GamingCanvasEngineTransition.nextAnimate(
					GamingCanvasTransitionAnimateType.EFFECT,
					GamingCanvasTransitionAnimatePropertyType.OPACITY,
					durationInMs,
					property.valueTo,
				);
			}

			// Update timer
			frameTimer.setTimeRemaining(frameTimerId, durationInMs);
		}

		// Done
		setTimeout(() => {
			if (GamingCanvasEngineTransition.callbackTransitionSkipped !== undefined) {
				GamingCanvasEngineTransition.callbackTransitionSkipped();
			}
		});

		return true;
	}

	public static controlStop(): boolean {
		if (GamingCanvasEngineTransition.active !== true) {
			console.error('GamingCanvas > GamingCanvasEngineTransition > controlStop: transition not in progress');
			return false;
		}

		// Input
		cancelAnimationFrame(GamingCanvasEngineTransition.inputRequest);
		GamingCanvasEngineTransition.callbackLockout(false);

		// DOM
		let container: HTMLElement, htmlElement: HTMLElement;
		switch (GamingCanvasEngineTransition.transition.attach) {
			default:
			case GamingCanvasTransitionAttach.CANVAS:
				container = GamingCanvasEngineTransition.elementContainerCanvas;
				break;
			case GamingCanvasTransitionAttach.OVERLAY:
				container = GamingCanvasEngineTransition.elementContainerOverlayWrapper;
				break;
		}
		container.removeChild(GamingCanvasEngineTransition.domBackground);
		container.removeChild(GamingCanvasEngineTransition.domEffect);
		container.removeChild(GamingCanvasEngineTransition.domFrameContainer);

		for (htmlElement of GamingCanvasEngineTransition.domFrames) {
			GamingCanvasEngineTransition.domFrameContainerWrapper.removeChild(htmlElement);
		}
		GamingCanvasEngineTransition.domFrames = new Array();

		// Last
		GamingCanvasEngineTransition.active = false;
		GamingCanvasEngineTransition.nextSkipState(false);

		// Callback to notify client of stop
		if (GamingCanvasEngineTransition.callbackTransitionState !== undefined) {
			setTimeout(() => {
				GamingCanvasEngineTransition.callbackTransitionState(false);
			});
		}

		return true;
	}

	private static loop(passthrough: boolean): void {
		let animation: Map<
				GamingCanvasTransitionAnimateType,
				Map<GamingCanvasTransitionAnimatePropertyType, GamingCanvasTransitionAnimateProperty>
			> = GamingCanvasEngineTransition.transitionAnimate,
			animationProperty: GamingCanvasTransitionAnimateProperty,
			animationPropertyType: GamingCanvasTransitionAnimatePropertyType,
			animationProperties: Map<GamingCanvasTransitionAnimatePropertyType, GamingCanvasTransitionAnimateProperty>,
			animationType: GamingCanvasTransitionAnimateType,
			audioInstance: GamingCanvasTransitionAudioInstance,
			down: boolean,
			fpms: number = GamingCanvasEngineTransition.transitionAnimateFPMS,
			fpsCount: number = 0,
			fpsTimestamp: number = performance.now(),
			frameActiveIndex: number = -1,
			frameActiveState: GamingCanvasTransitionFrameState,
			frameActiveTimestamp: number = performance.now(),
			frameContent: GamingCanvasTransitionFrameContentElements | GamingCanvasTransitionFrameContentHTML,
			frameContentElements: GamingCanvasTransitionFrameContentElements,
			frameContentElementsText: GamingCanvasTransitionFrameContentElementsText,
			frameContentElementsTextInterval: number,
			frameContentElementsTextCounts: number[],
			frameContentElementsTextTimestamps: number[],
			htmlElementSpan: HTMLSpanElement,
			i: number,
			input: GamingCanvasInput | undefined,
			inputPropriatary: any,
			queue: GamingCanvasFIFOQueue<GamingCanvasInput> = GamingCanvasEngineTransition.queue,
			queueLockout: GamingCanvasFIFOQueue<GamingCanvasInput> = GamingCanvasEngineTransition.queueLockout,
			skipable: boolean,
			skip: boolean,
			skipInput: GamingCanvasInputGamepadInstance | GamingCanvasInputKeyboardInstance | GamingCanvasInputMouseInstance | GamingCanvasInputTouchInstance,
			skipInputs:
				| (GamingCanvasInputGamepadInstance | GamingCanvasInputKeyboardInstance | GamingCanvasInputMouseInstance | GamingCanvasInputTouchInstance)[]
				| undefined,
			timestampDelta: number,
			timestampThen: number = performance.now(),
			transition: GamingCanvasTransition = GamingCanvasEngineTransition.transition,
			transitionState: GamingCanvasTransitionState = GamingCanvasEngineTransition.transitionState; // Transition state set before this function call

		const fpsCallback = (fps: number) => {
			setTimeout(() => {
				if (GamingCanvasEngineTransition.callbackTransitionFPS !== undefined) {
					GamingCanvasEngineTransition.callbackTransitionFPS(fps);
				}
			});
		};

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			GamingCanvasEngineTransition.inputRequest = requestAnimationFrame(go);

			// Properties: Generic
			if (frameActiveIndex !== transitionState.frameIndex || frameActiveState !== transitionState.frameState) {
				frameActiveIndex = transitionState.frameIndex;
				frameActiveState = transitionState.frameState;
				frameActiveTimestamp = timestampNow;

				if (frameActiveState === GamingCanvasTransitionFrameState.CONTENT) {
					frameContent = transition.frames[frameActiveIndex].content;

					if (frameContent !== undefined) {
						if (frameContent.type === GamingCanvasTransitionFrameContentType.ELEMENTS) {
							frameContentElements = frameContent;

							if (frameContentElements.text !== undefined) {
								frameContentElementsTextCounts = new Array(frameContentElements.text.length).fill(0);
								frameContentElementsTextTimestamps = new Array(frameContentElements.text.length).fill(0);
							}
						}
					}
				}
			}

			// Properties: Skip
			if (skipable !== transitionState.skipable) {
				skipable = transitionState.skipable;

				if (
					transitionState.frameActive !== undefined &&
					transitionState.frameActive.skip !== undefined &&
					transitionState.frameActive.skip.inputs !== undefined
				) {
					skipInputs = transitionState.frameActive.skip.inputs;
				} else {
					skipInputs = undefined;
				}
			}

			// Main
			timestampDelta = timestampNow - timestampThen;
			if (GamingCanvasEngineTransition.transitionPause === true) {
				// Timer
				GamingCanvasEngineTransition.transitionTimer.clockUpdate(timestampNow);
			} else {
				// Animate: Content
				if (frameActiveState === GamingCanvasTransitionFrameState.CONTENT) {
					frameContent = transition.frames[frameActiveIndex].content;

					if (frameContent !== undefined) {
						if (frameContent.type === GamingCanvasTransitionFrameContentType.ELEMENTS) {
							frameContentElements = frameContent;

							if (frameContentElements.text !== undefined) {
								for ([i, frameContentElementsText] of frameContentElements.text.entries()) {
									if (frameContentElementsText.effect === GamingCanvasTransitionFrameContentElementsTextEffect.TYPEWRITER) {
										if (
											timestampNow - frameContentElementsTextTimestamps[i] >=
											<number>frameContentElementsText.effectTypewriterLetterPerMs
										) {
											htmlElementSpan = (<HTMLSpanElement[]>frameContentElementsText.effectTypewriterElements)[
												frameContentElementsTextCounts[i]
											];

											if (htmlElementSpan !== undefined) {
												// Audio
												if (GamingCanvasEngineTransition.callbackAudioEffect !== undefined) {
													if (htmlElementSpan.innerText === '<br>') {
														if (frameContentElementsText.effectTypewriterAudioEffectCarriageReturn !== undefined) {
															audioInstance = frameContentElementsText.effectTypewriterAudioEffectCarriageReturn;
															GamingCanvasEngineTransition.callbackAudioEffect(
																audioInstance.assetId,
																audioInstance.pan,
																audioInstance.volume,
															);
														}
													} else {
														if (frameContentElementsText.effectTypewriterAudioEffectKey !== undefined) {
															audioInstance = frameContentElementsText.effectTypewriterAudioEffectKey;
															GamingCanvasEngineTransition.callbackAudioEffect(
																audioInstance.assetId,
																audioInstance.pan,
																audioInstance.volume,
															);
														}
													}
												}

												// Text
												htmlElementSpan.style.color = <string>frameContentElementsText.cssFontColor;

												// Done
												frameContentElementsTextCounts[i]++;
												frameContentElementsTextTimestamps[i] = timestampNow;

												if (htmlElementSpan.innerText === '<br>') {
													frameContentElementsTextTimestamps[i] += <number>(
														frameContentElementsText.effectTypewriterCarriageReturnPauseInMs
													);
												}

												// Callback
												if (
													frameContentElementsTextCounts[i] ===
													(<HTMLSpanElement[]>frameContentElementsText.effectTypewriterElements).length
												) {
													if (frameContentElementsText.effectOnComplete !== undefined) {
														GamingCanvasEngineTransition.loopHTMLContentElementsTextTypewriterCallback(
															frameContentElementsText.effectOnComplete,
															frameActiveIndex,
															frameActiveState,
															i,
															false,
														);
													}
												}
											}
										}
									}
								}
							}
						}
					} else {
						// HTML
					}
				}

				// Animate: Transitions
				if (timestampDelta > fpms) {
					// More accurately calculate for more stable FPS
					timestampThen = timestampNow - (timestampDelta % fpms);

					for ([animationType, animationProperties] of animation.entries()) {
						for ([animationPropertyType, animationProperty] of animationProperties.entries()) {
							if (animationProperty.active !== true) {
								continue;
							}

							// Step
							animationProperty.valueCurrent += animationProperty.valueStep;

							// Is complete?
							if (animationProperty.valueFrom > animationProperty.valueTo) {
								if (animationProperty.valueCurrent <= animationProperty.valueTo) {
									animationProperty.active = false;
									animationProperty.valueCurrent = animationProperty.valueTo;
								}
							} else {
								if (animationProperty.valueCurrent >= animationProperty.valueTo) {
									animationProperty.active = false;
									animationProperty.valueCurrent = animationProperty.valueTo;
								}
							}

							// Update DOM
							if (animationProperty.cssPropertyValuePostfix !== undefined) {
								animationProperty.html.style.setProperty(
									GamingCanvasTransitionAnimatePropertyType[animationPropertyType],
									String(animationProperty.valueCurrent) + animationProperty.cssPropertyValuePostfix,
								);
							} else {
								animationProperty.html.style.setProperty(
									GamingCanvasTransitionAnimatePropertyType[animationPropertyType],
									String(animationProperty.valueCurrent),
								);
							}
						}
					}

					// Metrics
					fpsCount++;
					if (timestampNow - fpsTimestamp >= 1000) {
						fpsCallback(fpsCount);
						fpsCount = 0;
						fpsTimestamp = timestampNow;
					}
				}

				// Input
				if (GamingCanvasEngineTransition.inputSuspend !== true && transitionState.skipping !== true) {
					input = <GamingCanvasInput>queueLockout.pop();
					while (input !== undefined) {
						if (skipable === true) {
							inputPropriatary = input.propriatary;
							if (skipInputs !== undefined) {
								// Skip on specific inputs
								for (skipInput of skipInputs) {
									if (input.type !== skipInput.type) {
										continue;
									}
									switch (skipInput.type) {
										case GamingCanvasInputType.GAMEPAD:
											if (
												inputPropriatary.buttons !== undefined &&
												inputPropriatary.buttons[(<GamingCanvasInputGamepadInstance>skipInput).buttonKey] === true
											) {
												skip = true;
											}
											break;
										case GamingCanvasInputType.KEYBOARD:
											if (
												inputPropriatary.action.code === (<GamingCanvasInputKeyboardInstance>skipInput).code &&
												inputPropriatary.down === true
											) {
												skip = true;
											}
											break;
										case GamingCanvasInputType.MOUSE:
											if (
												inputPropriatary.action === (<GamingCanvasInputMouseInstance>skipInput).action &&
												inputPropriatary.down === (<GamingCanvasInputMouseInstance>skipInput).down
											) {
												skip = true;
											}
											break;
										case GamingCanvasInputType.TOUCH:
											if (
												inputPropriatary.action === (<GamingCanvasInputTouchInstance>skipInput).action &&
												inputPropriatary.down === (<GamingCanvasInputTouchInstance>skipInput).down
											) {
												skip = true;
											}
											break;
									}
								}
							} else {
								// Skip on any input
								switch (input.type) {
									case GamingCanvasInputType.GAMEPAD:
										if (inputPropriatary.buttons !== undefined) {
											for (down of inputPropriatary.buttons.values) {
												if (down === true) {
													skip = true;
													break;
												}
											}
										}
										break;
									case GamingCanvasInputType.KEYBOARD:
										if (inputPropriatary.down === true) {
											skip = true;
										}
										break;
									case GamingCanvasInputType.MOUSE:
										if (inputPropriatary.down === true) {
											skip = true;
										}
										break;
									case GamingCanvasInputType.TOUCH:
										if (inputPropriatary.down === true) {
											skip = true;
										}
										break;
								}
							}
							if (skip === true) {
								skip = false;
								GamingCanvasEngineTransition.transitionState.skippingInput = input;
								if (GamingCanvasEngineTransition.controlSkip() !== true) {
									GamingCanvasEngineTransition.transitionState.skippingInput = undefined;
								}
								break;
							}
						}
						if (passthrough === true) {
							queue.push(input);
						}
						input = <GamingCanvasInput>queueLockout.pop();
					}
				} else if (passthrough === true) {
					// Input: just pass through while in partial transition phases
					input = <GamingCanvasInput>queueLockout.pop();
					while (input !== undefined) {
						queue.push(input);
						input = <GamingCanvasInput>queueLockout.pop();
					}
				}

				// Timer
				GamingCanvasEngineTransition.transitionTimer.tick(timestampNow);
			}
		};

		// Start
		GamingCanvasEngineTransition.callbackLockout(true);
		GamingCanvasEngineTransition.inputSuspend = true;
		GamingCanvasEngineTransition.transitionTimer.clockUpdate();

		GamingCanvasEngineTransition.inputRequest = requestAnimationFrame(go);
	}

	private static loopHTMLContentElementsTextTypewriterCallback(
		callback: any,
		frameIndex: number,
		frameState: GamingCanvasTransitionFrameState,
		frameTextIndex: number,
		skipped: boolean,
	): void {
		setTimeout(() => {
			callback(frameIndex, frameState, frameTextIndex, skipped);
		});
	}

	private static next(): void {
		let animate = GamingCanvasEngineTransition.nextAnimate,
			debug: boolean = GamingCanvasEngineTransition.transition.debug === true,
			domBackground: HTMLElement = GamingCanvasEngineTransition.domBackground,
			domEffect: HTMLElement = GamingCanvasEngineTransition.domEffect,
			domFrames: HTMLElement[] = GamingCanvasEngineTransition.domFrames,
			frameContent: GamingCanvasTransitionFrameContent,
			frameEffect: GamingCanvasTransitionFrameEffect,
			frameGroup: GamingCanvasTransitionFrameGroup,
			transition: GamingCanvasTransition = GamingCanvasEngineTransition.transition,
			transitionAnimate: Map<
				GamingCanvasTransitionAnimateType,
				Map<GamingCanvasTransitionAnimatePropertyType, GamingCanvasTransitionAnimateProperty>
			> = GamingCanvasEngineTransition.transitionAnimate,
			transitionState: GamingCanvasTransitionState = GamingCanvasEngineTransition.transitionState,
			transitionTimer: GamingCanvasUtilTimers = GamingCanvasEngineTransition.transitionTimer,
			transitionTimerId: number = GamingCanvasEngineTransition.transitionTimerFrameId;

		if (transitionState.frameIndex === -1) {
			/*
			 * Frame: Start
			 */
			GamingCanvasEngineTransition.inputSuspend = true;
			transitionState.frameActive = transition.frameStart;

			// Prep Next Frame
			transitionState.frameActiveDOM = undefined;
			transitionState.frameIndex++;
			transitionState.frameState = GamingCanvasTransitionFrameState.INCOMING;

			// Callback to notify client of start
			setTimeout(() => {
				GamingCanvasEngineTransition.callbackTransitionState(true);
			});

			// Timestamp
			transitionState.timestampStateStart = performance.now();

			if (transition.frameStart !== undefined) {
				frameEffect = transition.frameStart;

				// Go For Main Engine Launch
				animate(GamingCanvasTransitionAnimateType.BACKGROUND, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 0);
				domEffect.style.backgroundColor = <string>frameEffect.cssEffectColor;
				animate(GamingCanvasTransitionAnimateType.EFFECT, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 0);

				// Lift Off!
				animate(GamingCanvasTransitionAnimateType.EFFECT, GamingCanvasTransitionAnimatePropertyType.OPACITY, frameEffect.durationInMs || 0, 1);
				if (frameEffect.durationInMs !== 0) {
					setTimeout(() => {
						transitionTimer.add(
							(durationInMs: number, id: number) => {
								transitionState.durationInMsActual += durationInMs;
								GamingCanvasEngineTransition.next();
							},
							frameEffect.durationInMs || 0,
							transitionTimerId,
						);
					});
				}
			} else {
				// Go For Main Engine Launch
				animate(GamingCanvasTransitionAnimateType.BACKGROUND, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 0);
				animate(GamingCanvasTransitionAnimateType.EFFECT, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 1);

				// Lift Off!
				GamingCanvasEngineTransition.next();
			}
		} else if (transitionState.frameIndex !== domFrames.length) {
			GamingCanvasEngineTransition.inputSuspend = true; // Suspend until the clock is generated (const suspend if no clock)
			transitionState.frameActiveDOM = domFrames[transitionState.frameIndex];
			transitionState.skipping = false;

			// Only display current frame
			frameGroup = transition.frames[transitionState.frameIndex];
			for (let i = 0; i < domFrames.length; i++) {
				if (i === transitionState.frameIndex) {
					domFrames[i].style.display = 'block';
				} else {
					domFrames[i].style.display = 'none';
				}
			}

			switch (transitionState.frameState) {
				case GamingCanvasTransitionFrameState.CONTENT:
					transitionState.frameActive = frameGroup.content;
					frameContent = frameGroup.content;

					// Callback
					if (GamingCanvasEngineTransition.callbackTransitionFrame !== undefined) {
						setTimeout(
							(framePreviousDurationInMs: number) => {
								GamingCanvasEngineTransition.callbackTransitionFrame(
									<any>transitionState.frameActive,
									transitionState.frameIndex,
									GamingCanvasTransitionFrameState.CONTENT,
									framePreviousDurationInMs,
									transitionState.skippingInput,
								);
								GamingCanvasEngineTransition.transitionState.skippingInput = undefined;
							},
							0,
							performance.now() - transitionState.timestampStateStart,
						);
					}

					// Timestamp
					transitionState.timestampStateStart = performance.now();

					// Go For Main Engine Launch
					domBackground.style.backgroundColor = <string>frameGroup.cssBackgroundColor;
					animate(GamingCanvasTransitionAnimateType.BACKGROUND, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 1);

					// Lift Off!
					if (frameContent.durationInMs !== 0) {
						setTimeout(() => {
							transitionTimer.add(
								(durationInMs: number, id: number) => {
									transitionState.durationInMsActual += durationInMs;
									transitionState.frameState = GamingCanvasTransitionFrameState.OUTGOING;
									GamingCanvasEngineTransition.next();
								},
								frameContent.durationInMs || 0,
								transitionTimerId,
							);
						});
					}
					GamingCanvasEngineTransition.inputSuspend = false;
					GamingCanvasEngineTransition.nextSkipState();

					break;
				case GamingCanvasTransitionFrameState.INCOMING:
					transitionState.frameActive = frameGroup.incoming;

					if (frameGroup.incoming !== undefined && frameGroup.incoming.type !== GamingCanvasTransitionFrameEffectType.NONE) {
						frameEffect = frameGroup.incoming;

						// Callback
						if (GamingCanvasEngineTransition.callbackTransitionFrame !== undefined) {
							setTimeout(
								(framePreviousDurationInMs: number) => {
									GamingCanvasEngineTransition.callbackTransitionFrame(
										<any>transitionState.frameActive,
										transitionState.frameIndex,
										GamingCanvasTransitionFrameState.INCOMING,
										framePreviousDurationInMs,
										transitionState.skippingInput,
									);
									GamingCanvasEngineTransition.transitionState.skippingInput = undefined;
								},
								0,
								performance.now() - transitionState.timestampStateStart,
							);
						}

						// Timestamp
						transitionState.timestampStateStart = performance.now();

						// Go For Main Engine Launch
						domBackground.style.backgroundColor = <string>frameGroup.cssBackgroundColor;
						animate(GamingCanvasTransitionAnimateType.BACKGROUND, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 1);
						domEffect.style.backgroundColor = <string>frameEffect.cssEffectColor;
						animate(GamingCanvasTransitionAnimateType.EFFECT, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 1);

						// Lift Off!
						// domEffect.style.backgroundColor = <string>frameEffect.cssEffectColor;
						animate(GamingCanvasTransitionAnimateType.EFFECT, GamingCanvasTransitionAnimatePropertyType.OPACITY, frameEffect.durationInMs || 0, 0);
						if (frameEffect.durationInMs !== 0) {
							setTimeout(() => {
								transitionTimer.add(
									(durationInMs: number, id: number) => {
										transitionState.durationInMsActual += durationInMs;
										transitionState.frameState = GamingCanvasTransitionFrameState.CONTENT;
										GamingCanvasEngineTransition.next();
									},
									frameEffect.durationInMs || 0,
									transitionTimerId,
								);
							});
						}
						GamingCanvasEngineTransition.inputSuspend = false;
						GamingCanvasEngineTransition.nextSkipState();
					} else {
						// Go For Main Engine Launch
						animate(GamingCanvasTransitionAnimateType.BACKGROUND, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 1);
						animate(GamingCanvasTransitionAnimateType.EFFECT, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 0);

						// Lift Off!
						transitionState.frameState = GamingCanvasTransitionFrameState.CONTENT;
						GamingCanvasEngineTransition.next();
					}
					break;
				case GamingCanvasTransitionFrameState.OUTGOING:
					transitionState.frameActive = frameGroup.outgoing;
					if (transitionState.frameIndex === domFrames.length - 1 && transition.loop === true) {
						transitionState.frameIndex = -1;
					}
					transitionState.frameIndex = ++transitionState.frameIndex;

					if (frameGroup.outgoing !== undefined && frameGroup.outgoing.type !== GamingCanvasTransitionFrameEffectType.NONE) {
						frameEffect = frameGroup.outgoing;

						// Callback
						if (GamingCanvasEngineTransition.callbackTransitionFrame !== undefined) {
							setTimeout(
								(framePreviousDurationInMs: number) => {
									GamingCanvasEngineTransition.callbackTransitionFrame(
										<any>transitionState.frameActive,
										transitionState.frameIndex - 1,
										GamingCanvasTransitionFrameState.OUTGOING,
										framePreviousDurationInMs,
										transitionState.skippingInput,
									);
									GamingCanvasEngineTransition.transitionState.skippingInput = undefined;
								},
								0,
								performance.now() - transitionState.timestampStateStart,
							);
						}

						// Timestamp
						transitionState.timestampStateStart = performance.now();

						// Go For Main Engine Launch
						domBackground.style.backgroundColor = <string>frameGroup.cssBackgroundColor;
						animate(GamingCanvasTransitionAnimateType.BACKGROUND, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 1);
						domEffect.style.backgroundColor = <string>frameEffect.cssEffectColor;
						animate(GamingCanvasTransitionAnimateType.EFFECT, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 0);

						// Lift Off!
						// domEffect.style.backgroundColor = <string>frameEffect.cssEffectColor;
						animate(GamingCanvasTransitionAnimateType.EFFECT, GamingCanvasTransitionAnimatePropertyType.OPACITY, frameEffect.durationInMs || 0, 1);
						if (frameEffect.durationInMs !== 0) {
							setTimeout(() => {
								transitionTimer.add(
									(durationInMs: number, id: number) => {
										transitionState.durationInMsActual += durationInMs;
										transitionState.frameState = GamingCanvasTransitionFrameState.INCOMING;
										GamingCanvasEngineTransition.next();
									},
									frameEffect.durationInMs || 0,
									transitionTimerId,
								);
							});
						}
						GamingCanvasEngineTransition.inputSuspend = false;
						GamingCanvasEngineTransition.nextSkipState();
					} else {
						// Go For Main Engine Launch
						animate(GamingCanvasTransitionAnimateType.BACKGROUND, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 1);
						animate(GamingCanvasTransitionAnimateType.EFFECT, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 1);

						// Lift Off!
						transitionState.frameState = GamingCanvasTransitionFrameState.INCOMING;
						GamingCanvasEngineTransition.next();
					}
					break;
			}
		} else {
			/*
			 * Frame: Stop
			 */
			GamingCanvasEngineTransition.inputSuspend = true;
			GamingCanvasEngineTransition.nextSkipState(false);
			transitionState.frameActive = transition.frameStop;
			transitionState.frameActiveDOM = undefined;

			// Timestamp
			transitionState.timestampStateStart = performance.now();

			if (transition.frameStop !== undefined) {
				frameEffect = transition.frameStop;

				// Hide frames
				for (let i = 0; i < domFrames.length; i++) {
					domFrames[i].style.display = 'none';
				}

				// Go For Main Engine Launch
				animate(GamingCanvasTransitionAnimateType.BACKGROUND, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 0);
				domEffect.style.backgroundColor = <string>frameEffect.cssEffectColor;
				animate(GamingCanvasTransitionAnimateType.EFFECT, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 1);

				// Lift Off!
				// domEffect.style.backgroundColor = <string>frameEffect.cssEffectColor;
				animate(GamingCanvasTransitionAnimateType.EFFECT, GamingCanvasTransitionAnimatePropertyType.OPACITY, frameEffect.durationInMs || 0, 0);
				if (frameEffect.durationInMs !== 0) {
					setTimeout(() => {
						transitionTimer.add(
							(durationInMs: number, id: number) => {
								transitionState.durationInMsActual += durationInMs;

								if (GamingCanvasEngineTransition.active === true) {
									GamingCanvasEngineTransition.controlStop();
								}
							},
							frameEffect.durationInMs || 0,
							transitionTimerId,
						);
					});
				}
			} else {
				// Go For Main Engine Launch
				animate(GamingCanvasTransitionAnimateType.BACKGROUND, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 0);
				animate(GamingCanvasTransitionAnimateType.EFFECT, GamingCanvasTransitionAnimatePropertyType.OPACITY, 0, 0);

				// Lift Off!
				GamingCanvasEngineTransition.controlStop();
			}
		}

		// Done
		GamingCanvasEngineTransition.transitionState.skipping = false;
	}

	private static nextAnimate(
		animateType: GamingCanvasTransitionAnimateType,
		propertyType: GamingCanvasTransitionAnimatePropertyType,
		durationInMs: number,
		value: number,
	): boolean {
		let properties: Map<GamingCanvasTransitionAnimatePropertyType, GamingCanvasTransitionAnimateProperty> | undefined =
			GamingCanvasEngineTransition.transitionAnimate.get(animateType);

		if (properties !== undefined) {
			let property: GamingCanvasTransitionAnimateProperty | undefined = properties.get(propertyType);

			if (property !== undefined && Math.round(property.valueCurrent) !== Math.round(value)) {
				let stepMin: number = 0.0001;

				// Universal values
				property.active = false;
				property.timestamp = performance.now();
				property.valueFrom = property.valueCurrent;
				property.valueTo = value;

				if (durationInMs <= stepMin) {
					property.valueCurrent = value;

					// Just updated the property if no viable duration is reqested
					if (property.cssPropertyValuePostfix !== undefined) {
						property.html.style.setProperty(
							GamingCanvasTransitionAnimatePropertyType[propertyType],
							String(value) + property.cssPropertyValuePostfix,
						);
					} else {
						property.html.style.setProperty(GamingCanvasTransitionAnimatePropertyType[propertyType], String(value));
					}
				} else {
					// Setup animation steps
					property.valueStep =
						Math.round(((value - property.valueCurrent) / (durationInMs / GamingCanvasEngineTransition.transitionAnimateFPMS)) * 10000) / 10000;

					// Min steps
					if (property.valueStep < 0) {
						property.valueStep = Math.min(property.valueStep, -stepMin);
					} else {
						property.valueStep = Math.max(property.valueStep, stepMin);
					}

					// Done
					property.active = true;
				}

				return true;
			}
		}

		return false;
	}

	private static nextAnimateFetch(
		animateType: GamingCanvasTransitionAnimateType,
		propertyType: GamingCanvasTransitionAnimatePropertyType,
	): GamingCanvasTransitionAnimateProperty | undefined {
		let properties: Map<GamingCanvasTransitionAnimatePropertyType, GamingCanvasTransitionAnimateProperty> | undefined =
			GamingCanvasEngineTransition.transitionAnimate.get(animateType);
		if (properties !== undefined) {
			let property: GamingCanvasTransitionAnimateProperty | undefined = properties.get(propertyType);

			if (property !== undefined) {
				return property;
			}
		}

		return undefined;
	}

	/**
	 * @param state if not defined will be calculated based on the currently activeFrame
	 */
	private static nextSkipState(state?: boolean): void {
		// Defaults
		if (state === undefined) {
			state =
				GamingCanvasEngineTransition.transitionState.frameActive !== undefined &&
				GamingCanvasEngineTransition.transitionState.frameActive.skip !== undefined &&
				GamingCanvasEngineTransition.transitionState.frameActive.skip.enable === true;
		}

		// Validation
		if (GamingCanvasEngineTransition.nextSkipStateTimeoutActive === true && state === true) {
			// Actively in a timeout for the durationInMsMin. Ignore calls to trigger timeout again
			return;
		} else if (GamingCanvasEngineTransition.transitionState.skipable === state) {
			return;
		}

		// Go
		clearTimeout(GamingCanvasEngineTransition.nextSkipStateTimeout);

		if (
			state === true &&
			GamingCanvasEngineTransition.transitionState.frameActive &&
			GamingCanvasEngineTransition.transitionState.frameActive.durationInMsMin !== 0
		) {
			GamingCanvasEngineTransition.nextSkipStateTimeout = setTimeout(() => {
				GamingCanvasEngineTransition.callbackTransitionSkipAvailable !== undefined &&
					GamingCanvasEngineTransition.callbackTransitionSkipAvailable(true);
				GamingCanvasEngineTransition.transitionState.skipable = true;
				GamingCanvasEngineTransition.nextSkipStateTimeoutActive = false;
			}, GamingCanvasEngineTransition.transitionState.frameActive.durationInMsMin);
			GamingCanvasEngineTransition.nextSkipStateTimeoutActive = true;
		} else {
			GamingCanvasEngineTransition.transitionState.skipable = state;
			GamingCanvasEngineTransition.callbackTransitionSkipAvailable !== undefined && GamingCanvasEngineTransition.callbackTransitionSkipAvailable(state);
		}
	}

	// Set and controlled via the gaming-canvas itself
	public static setCallbackAudioEffect(callback: (assetId: number, pan?: number, volume?: number) => void): void {
		GamingCanvasEngineTransition.callbackAudioEffect = callback;
	}

	// Set and controlled via the gaming-canvas itself
	public static setCallbackLockout(callback: (state: boolean) => void): void {
		GamingCanvasEngineTransition.callbackLockout = callback;
	}

	// Triggered on-frame
	public static setCallbackTransitionFrame(
		callback: (
			frameActive: GamingCanvasTransitionFrameContentElements | GamingCanvasTransitionFrameContentHTML,
			frameActiveIndex: number,
			frameActiveState: GamingCanvasTransitionFrameState,
			framePreviousDurationInMs: number,
			framePreviousSkipInput?: GamingCanvasInput,
		) => void,
	): void {
		GamingCanvasEngineTransition.callbackTransitionFrame = callback;
	}

	public static setCallbackTransitionFPS(callback: (fps: number) => void): void {
		GamingCanvasEngineTransition.callbackTransitionFPS = callback;
	}

	public static setTransitionCallbackSkipAvailable(callback: (available: boolean) => void): void {
		GamingCanvasEngineTransition.callbackTransitionSkipAvailable = callback;
	}

	public static setTransitionCallbackSkipped(callback: () => void): void {
		GamingCanvasEngineTransition.callbackTransitionSkipped = callback;
	}

	public static setTransitionCallbackState(callback: (active: boolean) => void): void {
		GamingCanvasEngineTransition.callbackTransitionState = callback;
	}

	public static isActive(): boolean {
		return GamingCanvasEngineTransition.active;
	}
}
