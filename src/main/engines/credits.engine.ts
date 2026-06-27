import { GamingCanvasFIFOQueue } from '../fifo-queue.js';
import { GamingCanvasInput, GamingCanvasInputType } from '../inputs.js';
import { GamingCanvasInputGamepadInstance } from './gamepad.engine.js';
import { GamingCanvasInputKeyboardInstance } from './keyboard.engine.js';
import { GamingCanvasInputMouseInstance } from './mouse.engine.js';
import { GamingCanvasInputTouchInstance } from './touch.engine.js';

/**
 * @person tknight-dev
 */

export interface GamingCanvasCredits {
	attach?: GamingCanvasCreditsAttach;
	content: (GamingCanvasCreditsContentCollection | GamingCanvasCreditsContentSpacer | GamingCanvasCreditsContentText)[];
	cssBackgroundColor?: string;
	cssDefaultFontColor?: string;
	cssDefaultFontFamily?: string;
	cssDefaultPaddingBottom?: string;
	cssDefaultPaddingLeft?: string;
	cssDefaultPaddingRight?: string;
	cssDefaultPaddingTop?: string;
	debug?: boolean;
	durationInMs: number;
	fadeInDurationInMs?: number;
	fadeOutDurationInMs?: number;
	fps?: number;
	inputActions?: Partial<
		Record<
			GamingCanvasCreditsInputAction,
			(GamingCanvasInputGamepadInstance | GamingCanvasInputKeyboardInstance | GamingCanvasInputMouseInstance | GamingCanvasInputTouchInstance)[]
		>
	>;
	inputPassthrough?: boolean;
	scrollDirectionReverse?: boolean;
	scrollEndOnLastElement?: boolean;
	scrollEndPauseDurationInMs?: number;
	scrollOrderReverse?: boolean;
	scrollStartPauseDurationInMs?: number;
	zIndexBackground?: number;
	zIndexContent?: number;
}

export interface GamingCanvasCreditsAsset {
	description?: string;
	license: string;
	name: string;
	url: string;
}

export enum GamingCanvasCreditsAttach {
	CANVAS,
	OVERLAY,
}

interface GamingCanvasCreditsContent {
	contentType: GamingCanvasCreditsContentType;
}

export interface GamingCanvasCreditsContentCollection extends GamingCanvasCreditsContent {
	columns?: number;
	exposeWebsiteLink?: boolean;
	id: number;
	rowFillPreference?: 'center' | 'left' | 'right';
	sortPersons?: GamingCanvasCreditsContentCollectionSort;
}

export enum GamingCanvasCreditsContentCollectionSort {
	ASCENDING,
	DESCENDING,
}

export interface GamingCanvasCreditsContentSpacer extends GamingCanvasCreditsContent {
	cssHeight?: string; // 50%, 12px, defaults to 50%
}

export interface GamingCanvasCreditsContentText extends GamingCanvasCreditsContent {
	cssFontColor?: string;
	cssFontFamily?: string;
	cssFontSize?: string;
	cssFontWeight?: string;
	cssJustifyContent?: 'center' | 'flex-start' | 'flex-end';
	cssPaddingBottom?: string;
	cssPaddingLeft?: string;
	cssPaddingRight?: string;
	cssPaddingTop?: string;
	type?: GamingCanvasCreditsContentTextType;
	value: string;
}

export enum GamingCanvasCreditsContentTextType {
	BODY,
	HEADER_01,
	HEADER_02,
	HEADER_03,
	HEADER_04,
}

export enum GamingCanvasCreditsContentType {
	COLLECTION,
	SPACER,
	TEXT,
}

export enum GamingCanvasCreditsInputAction {
	END,
	PAUSE_TOGGLE,
	STOP,
}

export interface GamingCanvasCreditsPerson {
	collectionIds: number[];
	description?: string;
	id?: string;
	name: string;
	title?: string;
	url?: string;
}

export class GamingCanvasEngineCredits {
	private static active: boolean;
	private static assets: { [key: number]: { [key: string]: GamingCanvasCreditsAsset } } = {}; // <person name, <url, asset>>
	private static callbackFPS: (fps: number) => void;
	private static callbackLockout: (state: boolean) => void;
	private static callbackEnd: () => void;
	private static callbackPause: (state: boolean) => void;
	private static callbackState: (state: boolean) => void;
	private static credits: GamingCanvasCredits;
	private static creditsAnimateFading: boolean;
	private static creditsAnimateFPMS: number;
	private static creditsAnimatePause: boolean;
	private static creditsAnimateRequest: number;
	private static domBackground: HTMLElement;
	private static domContent: HTMLElement;
	private static domContentElements: HTMLElement[] = [];
	private static domContentWrapper: HTMLElement;
	private static elementContainerCanvas: HTMLElement;
	private static elementContainerOverlayWrapper: HTMLElement;
	private static queue: GamingCanvasFIFOQueue<GamingCanvasInput>;
	private static queueLockout: GamingCanvasFIFOQueue<GamingCanvasInput>;
	private static people: { [key: number]: GamingCanvasCreditsPerson } = {}; // key is person name
	private static peopleIncrement: number = 0;
	private static timeout: ReturnType<typeof setTimeout>;

	public static initialize(
		elementContainerCanvas: HTMLElement,
		elementContainerOverlayWrapper: HTMLElement,
		queue: GamingCanvasFIFOQueue<GamingCanvasInput>,
		queueLockout: GamingCanvasFIFOQueue<GamingCanvasInput>,
	): void {
		GamingCanvasEngineCredits.elementContainerCanvas = elementContainerCanvas;
		GamingCanvasEngineCredits.elementContainerOverlayWrapper = elementContainerOverlayWrapper;
		GamingCanvasEngineCredits.queue = queue;
		GamingCanvasEngineCredits.queueLockout = queueLockout;
	}

	public static apply(credits: GamingCanvasCredits, debug?: boolean): boolean {
		let assets: { [key: string]: { [key: string]: GamingCanvasCreditsAsset } } = GamingCanvasEngineCredits.assets,
			collectionId: number,
			container: HTMLElement,
			contentInstance: GamingCanvasCreditsContentCollection | GamingCanvasCreditsContentSpacer | GamingCanvasCreditsContentText,
			contentCollection: GamingCanvasCreditsContentCollection,
			contentSpacer: GamingCanvasCreditsContentSpacer,
			contentText: GamingCanvasCreditsContentText,
			count: number = 0,
			domContentElements: HTMLElement[],
			fontSize: string,
			fontWeight: string,
			htmlElement: HTMLElement,
			htmlElementTable: HTMLTableElement,
			htmlElementTd: HTMLTableCellElement,
			htmlElementTr: HTMLTableRowElement,
			i: number,
			j: number,
			people: { [key: string]: GamingCanvasCreditsPerson } = GamingCanvasEngineCredits.people,
			peopleByCollectionId: { [key: number]: GamingCanvasCreditsPerson[] } = {},
			person: GamingCanvasCreditsPerson,
			persons: GamingCanvasCreditsPerson[];

		if (GamingCanvasEngineCredits.active === true) {
			return false;
		}
		GamingCanvasEngineCredits.active = true;
		if (GamingCanvasEngineCredits.callbackState !== undefined) {
			setTimeout(() => {
				GamingCanvasEngineCredits.callbackState(true);
			});
		}

		/**
		 * Defaults
		 */
		GamingCanvasEngineCredits.credits = GamingCanvasEngineCredits.applyDefaults(credits, debug);

		/**
		 * Config
		 */
		debug = GamingCanvasEngineCredits.credits.debug;
		GamingCanvasEngineCredits.creditsAnimateFPMS = Math.round(10000000 / <number>credits.fps) / 10000;

		for (person of Object.values(people)) {
			for (collectionId of person.collectionIds) {
				if (peopleByCollectionId[collectionId] === undefined) {
					peopleByCollectionId[collectionId] = [person];
				} else {
					peopleByCollectionId[collectionId].push(person);
				}
			}
		}

		/**
		 * Validation
		 */
		if (credits.content === undefined || credits.content.length === 0) {
			console.error('GamingCanvas > GamingCanvasEngineCredits > apply: content cannot be empty');
			GamingCanvasEngineCredits.active = false;
			return false;
		}

		/**
		 * DOM: Elements
		 */
		// Background
		if (GamingCanvasEngineCredits.domBackground === undefined) {
			GamingCanvasEngineCredits.domBackground = document.createElement('div');
			GamingCanvasEngineCredits.domBackground.id = 'gaming-canvas-credits-background';
		}
		GamingCanvasEngineCredits.domBackground.style.backgroundColor = <string>credits.cssBackgroundColor;
		GamingCanvasEngineCredits.domBackground.style.bottom = '0';
		GamingCanvasEngineCredits.domBackground.style.left = '0';
		GamingCanvasEngineCredits.domBackground.style.opacity = '0';
		GamingCanvasEngineCredits.domBackground.style.pointerEvents = 'none';
		GamingCanvasEngineCredits.domBackground.style.position = 'absolute';
		GamingCanvasEngineCredits.domBackground.style.right = '0';
		GamingCanvasEngineCredits.domBackground.style.top = '0';
		GamingCanvasEngineCredits.domBackground.style.touchAction = 'none';
		GamingCanvasEngineCredits.domBackground.style.zIndex = String(credits.zIndexBackground);

		// Content
		if (GamingCanvasEngineCredits.domContent === undefined) {
			GamingCanvasEngineCredits.domContent = document.createElement('div');
			GamingCanvasEngineCredits.domContent.id = 'gaming-canvas-credits-content';
		}
		GamingCanvasEngineCredits.domContent.style.bottom = '0';
		GamingCanvasEngineCredits.domContent.style.left = '0';
		GamingCanvasEngineCredits.domContent.style.pointerEvents = 'none';
		GamingCanvasEngineCredits.domContent.style.overflow = 'hidden';
		GamingCanvasEngineCredits.domContent.style.opacity = '0';
		GamingCanvasEngineCredits.domContent.style.position = 'absolute';
		GamingCanvasEngineCredits.domContent.style.right = '0';
		GamingCanvasEngineCredits.domContent.style.top = '0';
		GamingCanvasEngineCredits.domContent.style.touchAction = 'none';
		GamingCanvasEngineCredits.domContent.style.zIndex = String(credits.zIndexContent);

		// Content: Wrapper
		if (GamingCanvasEngineCredits.domContentWrapper === undefined) {
			GamingCanvasEngineCredits.domContentWrapper = document.createElement('div');
			GamingCanvasEngineCredits.domContentWrapper.id = 'gaming-canvas-credits-content-wrapper';
		}
		// GamingCanvasEngineCredits.domContentWrapper.style.backgroundColor = 'red';
		GamingCanvasEngineCredits.domContentWrapper.style.height = '100%';
		GamingCanvasEngineCredits.domContentWrapper.style.pointerEvents = 'none';
		GamingCanvasEngineCredits.domContentWrapper.style.position = 'relative';
		GamingCanvasEngineCredits.domContentWrapper.style.touchAction = 'none';
		GamingCanvasEngineCredits.domContentWrapper.style.transform = 'translateY(200%)';
		GamingCanvasEngineCredits.domContentWrapper.style.width = '100%';

		// Content: Elements
		for (contentInstance of credits.content) {
			htmlElement = document.createElement('div');
			htmlElement.id = 'gaming-canvas-credits-content-element element-' + count;

			switch (contentInstance.contentType) {
				case GamingCanvasCreditsContentType.COLLECTION:
					contentCollection = <GamingCanvasCreditsContentCollection>contentInstance;

					// Container
					htmlElement.id += ' collection';
					if (debug === true) {
						htmlElement.style.border = '1px solid red';
						htmlElement.style.boxShadow = 'inset 0 0 3px 3px red';
					}

					// People
					switch (contentCollection.sortPersons) {
						default:
						case GamingCanvasCreditsContentCollectionSort.ASCENDING:
							persons = peopleByCollectionId[contentCollection.id].sort((a: GamingCanvasCreditsPerson, b: GamingCanvasCreditsPerson) =>
								a.name.localeCompare(b.name),
							);
							break;
						case GamingCanvasCreditsContentCollectionSort.DESCENDING:
							persons = peopleByCollectionId[contentCollection.id].sort((a: GamingCanvasCreditsPerson, b: GamingCanvasCreditsPerson) =>
								b.name.localeCompare(a.name),
							);
							break;
					}

					// Table
					htmlElementTable = document.createElement('table');
					htmlElementTable.id = 'gaming-canvas-credits-content-collection collection-' + contentCollection.id;
					htmlElementTable.style.borderCollapse = 'collapse';
					htmlElementTable.style.tableLayout = 'fixed';
					htmlElementTable.style.width = '100%';

					// Table: Content
					for (i = 0; i < persons.length; i += <number>contentCollection.columns) {
						// Row
						htmlElementTr = document.createElement('tr');

						// Cells
						for (j = 0; j < Math.min(<number>contentCollection.columns, persons.length - i); j++) {
							htmlElementTd = document.createElement('td');
							htmlElementTd.id = String(persons[i + j].id);
							htmlElementTd.innerText = persons[i + j].name;
							htmlElementTd.style.textAlign = 'center';
							htmlElementTr.appendChild(htmlElementTd);

							if (contentCollection.exposeWebsiteLink === true) {
								htmlElementTd = document.createElement('td');
								htmlElementTd.id = String(persons[i + j].id) + '-www';
								htmlElementTd.innerText = <string>persons[i + j].url;
								htmlElementTd.style.fontSize = '67.5%';
								htmlElementTd.style.textAlign = 'center';
								htmlElementTr.appendChild(htmlElementTd);
							}
						}
						htmlElementTable.appendChild(htmlElementTr);
					}

					// Done
					htmlElement.appendChild(htmlElementTable);

					break;
				case GamingCanvasCreditsContentType.SPACER:
					contentSpacer = <GamingCanvasCreditsContentSpacer>contentInstance;

					htmlElement.id += ' spacer';
					htmlElement.style.height = <string>contentSpacer.cssHeight;
					htmlElement.style.position = 'relative';
					htmlElement.style.width = '100%';

					if (debug === true) {
						htmlElement.style.border = '1px solid green';
						htmlElement.style.boxShadow = 'inset 0 0 3px 3px green';
					}
					break;
				case GamingCanvasCreditsContentType.TEXT:
					contentText = <GamingCanvasCreditsContentText>contentInstance;

					htmlElement.id += ' text';
					htmlElement.innerHTML = contentText.value;
					htmlElement.style.alignItems = 'center';
					htmlElement.style.color = <string>contentText.cssFontColor;
					htmlElement.style.display = 'flex';
					htmlElement.style.fontFamily = <string>contentText.cssFontFamily;
					htmlElement.style.justifyContent = <string>contentText.cssJustifyContent;
					htmlElement.style.paddingBottom = <string>contentText.cssPaddingBottom;
					htmlElement.style.paddingLeft = <string>contentText.cssPaddingLeft;
					htmlElement.style.paddingRight = <string>contentText.cssPaddingRight;
					htmlElement.style.paddingTop = <string>contentText.cssPaddingTop;

					if (debug === true) {
						htmlElement.style.border = '1px solid blue';
						htmlElement.style.boxShadow = 'inset 0 0 3px 3px blue';
					}

					switch (contentText.type) {
						default:
						case GamingCanvasCreditsContentTextType.BODY:
							fontSize = '1em';
							fontWeight = 'normal';
							break;
						case GamingCanvasCreditsContentTextType.HEADER_01:
							fontSize = '2em';
							fontWeight = 'bold';
							break;
						case GamingCanvasCreditsContentTextType.HEADER_02:
							fontSize = '1.75em';
							fontWeight = 'bold';
							break;
						case GamingCanvasCreditsContentTextType.HEADER_03:
							fontSize = '1.5em';
							fontWeight = 'bold';
							break;
						case GamingCanvasCreditsContentTextType.HEADER_04:
							fontSize = '1.25em';
							fontWeight = 'bold';
							break;
					}
					htmlElement.style.fontSize = contentText.cssFontSize !== undefined ? contentText.cssFontSize : fontSize;
					htmlElement.style.fontWeight = contentText.cssFontWeight !== undefined ? contentText.cssFontWeight : fontWeight;
					break;
			}

			// Done
			count++;
			GamingCanvasEngineCredits.domContentElements.push(htmlElement);
		}

		/**
		 * DOM: Attach
		 */
		switch (credits.attach) {
			default:
			case GamingCanvasCreditsAttach.CANVAS:
				container = GamingCanvasEngineCredits.elementContainerCanvas;
				break;
			case GamingCanvasCreditsAttach.OVERLAY:
				container = GamingCanvasEngineCredits.elementContainerOverlayWrapper;
				break;
		}
		container.appendChild(GamingCanvasEngineCredits.domBackground);
		container.appendChild(GamingCanvasEngineCredits.domContent);
		GamingCanvasEngineCredits.domContent.appendChild(GamingCanvasEngineCredits.domContentWrapper);

		// Content
		domContentElements = GamingCanvasEngineCredits.domContentElements;
		if (credits.scrollOrderReverse === true) {
			domContentElements = domContentElements.reverse();
		}
		for (htmlElement of domContentElements) {
			GamingCanvasEngineCredits.domContentWrapper.appendChild(htmlElement);
		}

		// Start
		GamingCanvasEngineCredits.start();

		return true;
	}

	public static applyDefaults(credits: GamingCanvasCredits, debug?: boolean): GamingCanvasCredits {
		let content: GamingCanvasCreditsContentCollection | GamingCanvasCreditsContentSpacer | GamingCanvasCreditsContentText,
			contentCollection: GamingCanvasCreditsContentCollection,
			contentSpacer: GamingCanvasCreditsContentSpacer,
			contentText: GamingCanvasCreditsContentText,
			i: number;

		// Main Properties
		credits.attach === undefined && (credits.attach = GamingCanvasCreditsAttach.CANVAS);
		credits.cssBackgroundColor === undefined && (credits.cssBackgroundColor = 'black');
		credits.cssDefaultFontColor === undefined && (credits.cssDefaultFontColor = 'white');
		credits.cssDefaultFontFamily === undefined && (credits.cssDefaultFontFamily = 'Arial, Helvetica, sans-serif');
		credits.cssDefaultPaddingBottom === undefined && (credits.cssDefaultPaddingBottom = '0');
		credits.cssDefaultPaddingLeft === undefined && (credits.cssDefaultPaddingLeft = '0');
		credits.cssDefaultPaddingRight === undefined && (credits.cssDefaultPaddingRight = '0');
		credits.cssDefaultPaddingTop === undefined && (credits.cssDefaultPaddingTop = '0');
		credits.debug === undefined && (credits.debug = debug || false);
		credits.durationInMs = Math.max(credits.durationInMs, 500);
		credits.fadeInDurationInMs = Math.max(credits.fadeInDurationInMs === undefined ? 1000 : credits.fadeInDurationInMs, 0);
		credits.fadeOutDurationInMs = Math.max(credits.fadeOutDurationInMs === undefined ? 1000 : credits.fadeOutDurationInMs, 0);
		credits.fps === undefined && (credits.fps = 120);
		credits.inputPassthrough === undefined && (credits.inputPassthrough = false);
		credits.scrollDirectionReverse === undefined && (credits.scrollDirectionReverse = false);
		credits.scrollEndOnLastElement === undefined && (credits.scrollEndOnLastElement = true);
		credits.scrollEndPauseDurationInMs = Math.max(credits.scrollEndPauseDurationInMs === undefined ? 1000 : credits.scrollEndPauseDurationInMs, 100);
		credits.scrollOrderReverse === undefined && (credits.scrollOrderReverse = false);
		credits.scrollStartPauseDurationInMs = Math.max(credits.scrollStartPauseDurationInMs === undefined ? 500 : credits.scrollStartPauseDurationInMs, 100);
		credits.zIndexBackground === undefined && (credits.zIndexBackground = 5);
		credits.zIndexContent === undefined && (credits.zIndexContent = credits.zIndexBackground + 2);

		// Content
		for (content of credits.content) {
			switch (content.contentType) {
				case GamingCanvasCreditsContentType.COLLECTION:
					contentCollection = <GamingCanvasCreditsContentCollection>content;

					contentCollection.columns === undefined ? (contentCollection.columns = 2) : Math.max(3, Math.min(1, contentCollection.columns));
					contentCollection.exposeWebsiteLink === undefined && (contentCollection.exposeWebsiteLink = true);
					contentCollection.rowFillPreference === undefined && (contentCollection.rowFillPreference = 'left');
					contentCollection.sortPersons === undefined && (contentCollection.sortPersons = GamingCanvasCreditsContentCollectionSort.ASCENDING);
					break;
				case GamingCanvasCreditsContentType.SPACER:
					contentSpacer = <GamingCanvasCreditsContentSpacer>content;

					contentSpacer.cssHeight === undefined && (contentSpacer.cssHeight = '50%');
				case GamingCanvasCreditsContentType.TEXT:
					contentText = <GamingCanvasCreditsContentText>content;

					contentText.cssFontColor === undefined && (contentText.cssFontColor = credits.cssDefaultFontColor);
					contentText.cssFontFamily === undefined && (contentText.cssFontFamily = credits.cssDefaultFontFamily);
					// contentText.cssFontSize === undefined && (contentText.cssFontSize = credits.cssDefaultFontSize); // Determine in HTML creation phase
					// contentText.cssFontWeight === undefined && (contentText.cssFontWeight = credits.cssDefaultFontWeight); // Determine in HTML creation phase
					contentText.cssJustifyContent === undefined && (contentText.cssJustifyContent = 'center');
					contentText.cssPaddingBottom === undefined && (contentText.cssPaddingBottom = '0');
					contentText.cssPaddingLeft === undefined && (contentText.cssPaddingLeft = '0');
					contentText.cssPaddingRight === undefined && (contentText.cssPaddingRight = '0');
					contentText.cssPaddingTop === undefined && (contentText.cssPaddingTop = '0');
					contentText.type === undefined && (contentText.type = GamingCanvasCreditsContentTextType.BODY);
					break;
			}
		}

		return credits;
	}

	public static controlEnd(): boolean {
		if (GamingCanvasEngineCredits.active !== true) {
			console.error('GamingCanvas > GamingCanvasEngineCredits > controlEnd: credits not in progress');
			return false;
		}
		if (GamingCanvasEngineCredits.creditsAnimateFading === true) {
			console.error('GamingCanvas > GamingCanvasEngineCredits > controlEnd: fade in progress');
			return false;
		}
		let fadeOutDurationInMs: number = <number>GamingCanvasEngineCredits.credits.fadeOutDurationInMs;

		GamingCanvasEngineCredits.creditsAnimateFading = true;

		GamingCanvasEngineCredits.domBackground.style.transition = 'opacity ' + fadeOutDurationInMs + 'ms linear';
		GamingCanvasEngineCredits.domContent.style.transition = 'opacity ' + fadeOutDurationInMs + 'ms linear';
		GamingCanvasEngineCredits.timeout = setTimeout(() => {
			GamingCanvasEngineCredits.domBackground.style.opacity = '0';
			GamingCanvasEngineCredits.domContent.style.opacity = '0';

			GamingCanvasEngineCredits.timeout = setTimeout(() => {
				GamingCanvasEngineCredits.controlStop();
			}, fadeOutDurationInMs);
		}, GamingCanvasEngineCredits.credits.scrollEndPauseDurationInMs); // Make sure the css is set before triggering

		return true;
	}

	public static controlPause(): boolean {
		if (GamingCanvasEngineCredits.active !== true) {
			console.error('GamingCanvas > GamingCanvasEngineCredits > controlPause: credits not in progress');
			return false;
		}

		GamingCanvasEngineCredits.creditsAnimatePause = true;

		// Callback
		if (GamingCanvasEngineCredits.callbackPause !== undefined) {
			setTimeout(() => {
				if (GamingCanvasEngineCredits.callbackPause !== undefined) {
					GamingCanvasEngineCredits.callbackPause(true);
				}
			});
		}

		return true;
	}

	public static controlPlay(): boolean {
		if (GamingCanvasEngineCredits.active !== true) {
			console.error('GamingCanvas > GamingCanvasEngineCredits > controlPlay: credits not in progress');
			return false;
		}

		GamingCanvasEngineCredits.creditsAnimatePause = false;

		// Callback
		if (GamingCanvasEngineCredits.callbackPause !== undefined) {
			setTimeout(() => {
				if (GamingCanvasEngineCredits.callbackPause !== undefined) {
					GamingCanvasEngineCredits.callbackPause(false);
				}
			});
		}

		return true;
	}

	public static controlStop(): boolean {
		if (GamingCanvasEngineCredits.active !== true) {
			console.error('GamingCanvas > GamingCanvasEngineCredits > controlStop: credits not in progress');
			return false;
		}

		// Loop
		cancelAnimationFrame(GamingCanvasEngineCredits.creditsAnimateRequest);
		GamingCanvasEngineCredits.callbackLockout(false);

		// Timeout
		clearTimeout(GamingCanvasEngineCredits.timeout);

		// DOM
		let container: HTMLElement, htmlElement: HTMLElement;
		switch (GamingCanvasEngineCredits.credits.attach) {
			default:
			case GamingCanvasCreditsAttach.CANVAS:
				container = GamingCanvasEngineCredits.elementContainerCanvas;
				break;
			case GamingCanvasCreditsAttach.OVERLAY:
				container = GamingCanvasEngineCredits.elementContainerOverlayWrapper;
				break;
		}
		container.removeChild(GamingCanvasEngineCredits.domBackground);
		container.removeChild(GamingCanvasEngineCredits.domContent);

		for (htmlElement of GamingCanvasEngineCredits.domContentElements) {
			GamingCanvasEngineCredits.domContentWrapper.removeChild(htmlElement);
		}
		GamingCanvasEngineCredits.domContentElements = new Array();

		// Last
		GamingCanvasEngineCredits.active = false;
		if (GamingCanvasEngineCredits.callbackState !== undefined) {
			setTimeout(() => {
				GamingCanvasEngineCredits.callbackState(false);
			});
		}

		return true;
	}

	private static loop(passthrough: boolean): void {
		let domContent: HTMLElement = GamingCanvasEngineCredits.domContent,
			domContentHeight: number = -1,
			domContentWrapper: HTMLElement = GamingCanvasEngineCredits.domContentWrapper,
			domContentWrapperHeight: number = 0,
			durationInMsActual: number = 0,
			durationInMsTarget: number = GamingCanvasEngineCredits.credits.durationInMs,
			durationCompeletePercentage: number,
			element: Element | null,
			elementLastHeight: number,
			fpms: number = GamingCanvasEngineCredits.creditsAnimateFPMS,
			fpsCount: number = 0,
			fpsTimestamp: number = performance.now(),
			input: GamingCanvasInput,
			inputActionString: string,
			inputActionInstance:
				| GamingCanvasInputGamepadInstance
				| GamingCanvasInputKeyboardInstance
				| GamingCanvasInputMouseInstance
				| GamingCanvasInputTouchInstance,
			inputActionInstances: (
				| GamingCanvasInputGamepadInstance
				| GamingCanvasInputKeyboardInstance
				| GamingCanvasInputMouseInstance
				| GamingCanvasInputTouchInstance
			)[],
			inputActions: [
				string,
				(GamingCanvasInputGamepadInstance | GamingCanvasInputKeyboardInstance | GamingCanvasInputMouseInstance | GamingCanvasInputTouchInstance)[],
			][] = Object.entries(GamingCanvasEngineCredits.credits.inputActions || <any>{}),
			inputApply: boolean,
			inputPropriatary: any,
			queue: GamingCanvasFIFOQueue<GamingCanvasInput> = GamingCanvasEngineCredits.queue,
			queueLockout: GamingCanvasFIFOQueue<GamingCanvasInput> = GamingCanvasEngineCredits.queueLockout,
			scrollDirectionReverse: boolean = <boolean>GamingCanvasEngineCredits.credits.scrollDirectionReverse,
			scrollEndOnLastElement: boolean = <boolean>GamingCanvasEngineCredits.credits.scrollEndOnLastElement,
			timestampDelta: number,
			timestampThen: number = performance.now(),
			translate: number;

		const fpsCallback = (fps: number) => {
			setTimeout(() => {
				if (GamingCanvasEngineCredits.callbackFPS !== undefined) {
					GamingCanvasEngineCredits.callbackFPS(fps);
				}
			});
		};

		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			GamingCanvasEngineCredits.creditsAnimateRequest = requestAnimationFrame(go);
			timestampDelta = timestampNow - timestampThen;

			// Scale
			if (domContent.clientHeight !== domContentHeight) {
				domContentHeight = domContent.clientHeight;
				domContentWrapper.style.fontSize = Math.round(domContentHeight * 0.06 * 1000) / 1000 + 'px';

				// Scroll Height
				domContentWrapperHeight = 0;
				element = domContentWrapper.firstElementChild;
				while (element !== null) {
					domContentWrapperHeight += element.clientHeight;
					elementLastHeight = element.clientHeight;

					element = element.nextElementSibling;
				}
			}

			// Not paused
			if (GamingCanvasEngineCredits.creditsAnimatePause !== true && GamingCanvasEngineCredits.creditsAnimateFading !== true) {
				durationInMsActual += timestampDelta;
			}

			// Animate
			if (timestampDelta > fpms) {
				// More accurately calculate for more stable FPS
				timestampThen = timestampNow - (timestampDelta % fpms);

				// Calc: Dynamic Offset
				durationCompeletePercentage = Math.min(1, durationInMsActual / durationInMsTarget);
				if (scrollEndOnLastElement === true) {
					translate = (domContentWrapperHeight + domContentHeight / 2) * durationCompeletePercentage;
				} else {
					translate = (domContentWrapperHeight + domContentHeight + elementLastHeight) * durationCompeletePercentage;
				}

				// Calc: Static Offset
				// Apply
				if (scrollDirectionReverse === true) {
					translate -= domContentWrapperHeight;

					domContentWrapper.style.transform = 'translateY(' + translate + 'px)';
				} else {
					translate -= domContentHeight;

					domContentWrapper.style.transform = 'translateY(' + -translate + 'px)';
				}

				if (durationCompeletePercentage >= 1 && GamingCanvasEngineCredits.creditsAnimateFading !== true) {
					GamingCanvasEngineCredits.controlEnd();
				}

				// Done
				fpsCount++;
				if (timestampNow - fpsTimestamp >= 1000) {
					fpsCallback(fpsCount);
					fpsCount = 0;
					fpsTimestamp = timestampNow;
				}
			}

			// Input
			input = <GamingCanvasInput>queueLockout.pop();
			while (input !== undefined) {
				if (GamingCanvasEngineCredits.creditsAnimateFading !== true) {
					inputPropriatary = input.propriatary;

					for ([inputActionString, inputActionInstances] of inputActions) {
						for (inputActionInstance of inputActionInstances) {
							if (input.type !== inputActionInstance.type) {
								continue;
							}

							// Key: Verify
							inputApply = false;
							switch (input.type) {
								case GamingCanvasInputType.GAMEPAD:
									if (
										inputPropriatary.buttons !== undefined &&
										inputPropriatary.buttons[(<GamingCanvasInputGamepadInstance>inputActionInstance).buttonKey] === true
									) {
										inputApply = true;
									}
									break;
								case GamingCanvasInputType.KEYBOARD:
									if (
										inputPropriatary.action.code === (<GamingCanvasInputKeyboardInstance>inputActionInstance).code &&
										inputPropriatary.down === true
									) {
										inputApply = true;
									}
									break;
								case GamingCanvasInputType.MOUSE:
									if (
										inputPropriatary.action === (<GamingCanvasInputMouseInstance>inputActionInstance).action &&
										inputPropriatary.down === (<GamingCanvasInputMouseInstance>inputActionInstance).down
									) {
										inputApply = true;
									}
									break;
								case GamingCanvasInputType.TOUCH:
									if (
										inputPropriatary.action === (<GamingCanvasInputTouchInstance>inputActionInstance).action &&
										inputPropriatary.down === (<GamingCanvasInputTouchInstance>inputActionInstance).down
									) {
										inputApply = true;
									}
									break;
							}

							// Key: Apply
							if (inputApply === true) {
								switch (Number(inputActionString)) {
									case GamingCanvasCreditsInputAction.END:
										GamingCanvasEngineCredits.controlEnd();
										break;
									case GamingCanvasCreditsInputAction.PAUSE_TOGGLE:
										if (GamingCanvasEngineCredits.creditsAnimatePause === true) {
											GamingCanvasEngineCredits.controlPlay();
										} else {
											GamingCanvasEngineCredits.controlPause();
										}
										break;
									case GamingCanvasCreditsInputAction.STOP:
										GamingCanvasEngineCredits.controlStop();
										break;
								}
							}
						}
					}
				}

				// Done
				if (passthrough === true) {
					queue.push(input);
				}
				input = <GamingCanvasInput>queueLockout.pop();
			}
		};

		// Start
		GamingCanvasEngineCredits.creditsAnimateRequest = requestAnimationFrame(go);
	}

	/**
	 * @param personId is the numeric ID returned by `registerPerson()`
	 */
	public static registerAsset(personId: number, asset: GamingCanvasCreditsAsset | GamingCanvasCreditsAsset[]): boolean {
		let assets: { [key: number]: { [key: string]: GamingCanvasCreditsAsset } } = GamingCanvasEngineCredits.assets;

		// Validation
		if (GamingCanvasEngineCredits.people[personId] === undefined) {
			console.error('GamingCanvas > GamingCanvasEngineCredits > registerAsset: unknown person id=' + personId);
			return false;
		}

		// Apply
		if (assets[personId] === undefined) {
			assets[personId] = {};
		}
		if (Array.isArray(asset) === true) {
			for (let i = 0; i < asset.length; i++) {
				assets[personId][asset[i].url] = asset[i];
			}
		} else {
			assets[personId][asset.url] = asset;
		}

		return true;
	}

	/**
	 * @return is number[] representing the numerical ID of that registered person
	 */
	public static registerPerson(person: GamingCanvasCreditsPerson | GamingCanvasCreditsPerson[]): number[] {
		let id: number,
			ids: number[] = [];

		if (Array.isArray(person) === true) {
			for (let i = 0; i < person.length; i++) {
				id = GamingCanvasEngineCredits.peopleIncrement++;
				ids.push(id);
				GamingCanvasEngineCredits.people[id] = person[i];
			}
		} else {
			id = GamingCanvasEngineCredits.peopleIncrement++;
			ids.push(id);
			GamingCanvasEngineCredits.people[id] = person;
		}

		return ids;
	}

	private static start(): void {
		let fadeInDurationInMs: number = <number>GamingCanvasEngineCredits.credits.fadeInDurationInMs;

		GamingCanvasEngineCredits.callbackLockout(true);
		GamingCanvasEngineCredits.creditsAnimateFading = true;
		GamingCanvasEngineCredits.creditsAnimatePause = false;

		GamingCanvasEngineCredits.domBackground.style.transition = 'opacity ' + fadeInDurationInMs + 'ms linear';
		GamingCanvasEngineCredits.domContent.style.transition = 'opacity ' + fadeInDurationInMs + 'ms linear';
		GamingCanvasEngineCredits.timeout = setTimeout(() => {
			GamingCanvasEngineCredits.domBackground.style.opacity = '1';
			GamingCanvasEngineCredits.domContent.style.opacity = '1';

			GamingCanvasEngineCredits.timeout = setTimeout(() => {
				GamingCanvasEngineCredits.timeout = setTimeout(() => {
					GamingCanvasEngineCredits.creditsAnimateFading = false;
					GamingCanvasEngineCredits.loop(GamingCanvasEngineCredits.credits.inputPassthrough === true);
				}, GamingCanvasEngineCredits.credits.scrollStartPauseDurationInMs);
			}, fadeInDurationInMs);
		}, 100); // Make sure the css is set before triggering
	}

	public static setCallbackFPS(callback: (fps: number) => void): void {
		GamingCanvasEngineCredits.callbackFPS = callback;
	}

	// Set and controlled via the gaming-canvas itself
	public static setCallbackLockout(callback: (state: boolean) => void): void {
		GamingCanvasEngineCredits.callbackLockout = callback;
	}

	public static setCallbackEnd(callback: () => void): void {
		GamingCanvasEngineCredits.callbackEnd = callback;
	}

	public static setCallbackPause(callback: (state: boolean) => void): void {
		GamingCanvasEngineCredits.callbackPause = callback;
	}

	public static setCallbackState(callback: (state: boolean) => void): void {
		GamingCanvasEngineCredits.callbackState = callback;
	}

	public static isActive(): boolean {
		return GamingCanvasEngineCredits.active;
	}
}
