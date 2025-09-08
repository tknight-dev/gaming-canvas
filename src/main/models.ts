/**
 * @author tknight-dev
 */

export class GamingCanvasOptions {
	aspectRatio?: number;
	audioBufferCount?: number;
	audioEnable?: boolean;
	callbackReportLimitPerMs?: number;
	canvasCount?: number;
	debug?: boolean;
	dpiSupportEnable?: boolean;
	elementInteractive?: HTMLElement;
	elementInjectAsCanvas?: HTMLElement[];
	elementInjectAsOverlay?: HTMLElement[];
	inputGamepadDeadbandStick?: number;
	inputGamepadEnable?: boolean;
	inputKeyboardEnable?: boolean;
	inputMouseEnable?: boolean;
	inputMousePreventContextMenu?: boolean;
	inputTouchEnable?: boolean;
	inputLimitPerMs?: number;
	orientation?: GamingCanvasOrientation;
	orientationCanvasRotateEnable?: boolean;
	orientationCanvasPortaitRotateLeft?: boolean;
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
	orientationCanvasRotated: boolean;
	scaler: number;
}

export enum GamingCanvasResolutionScaleType {
	ANTIALIAS,
	PIXELATED,
}
