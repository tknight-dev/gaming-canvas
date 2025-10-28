/**
 * @author tknight-dev
 */

export enum GamingCanvasOptionsDetectDeviceType {
	MOBILE,
	PC,
	TABLET,
}

export class GamingCanvasOptions {
	aspectRatio?: number;
	audioBufferCount?: number;
	audioEnable?: boolean;
	callbackReportLimitPerMs?: number;
	canvasCount?: number;
	canvasSplit?: number[];
	canvasSplitLandscapeVertical?: boolean;
	debug?: boolean;
	dpiSupportEnable?: boolean;
	elementInteractive?: HTMLElement;
	elementInjectAsCanvas?: HTMLElement[];
	elementInjectAsOverlay?: HTMLElement[];
	inputGamepadDeadbandStick?: number;
	inputGamepadEnable?: boolean;
	inputKeyboardEnable?: boolean;
	inputKeyboardPreventAlt?: boolean;
	inputKeyboardPreventCntrl?: boolean;
	inputKeyboardPreventMeta?: boolean;
	inputKeyboardPreventShift?: boolean;
	inputKeyboardPreventTab?: boolean;
	inputMouseEnable?: boolean;
	inputMousePreventContextMenu?: boolean;
	inputTouchEnable?: boolean;
	inputLimitPerMs?: number;
	orientation?: GamingCanvasOrientation;
	orientationCanvasRotateEnable?: boolean;
	orientationCanvasPortaitRotateLeft?: boolean;
	renderStyle?: GamingCanvasRenderStyle;
	resolutionScaleToFit?: boolean;
	resolutionWidthPx?: null | number;
}

export enum GamingCanvasOrientation {
	AUTO,
	LANDSCAPE,
	PORTRAIT,
}

export interface GamingCanvasReport {
	canvasHeight: number;
	canvasHeightSplit: number;
	canvasWidth: number;
	canvasWidthSplit: number;
	devicePixelRatio: number;
	orientation: GamingCanvasOrientation;
	orientationCanvasRotated: boolean;
	scaler: number;
}

export enum GamingCanvasRenderStyle {
	ANTIALIAS,
	PIXELATED,
}
