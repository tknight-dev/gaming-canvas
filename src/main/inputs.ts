/**
 * @author tknight-dev
 */

export interface GamingCanvasInput {
	propriatary: any;
	type: GamingCanvasInputType;
}

export interface GamingCanvasInputPosition extends GamingCanvasInputPositionBasic {
	out: boolean;
	xRelative: number;
	yRelative: number;
}

export interface GamingCanvasInputPositionBasic {
	x: number;
	y: number;
}

export interface GamingCanvasInputPositionOverlay {
	cellSizePx: number;
	left: number;
	top: number;
}

export const GamingCanvasInputPositionClone = (position: GamingCanvasInputPosition) => {
	return {
		out: position.out,
		x: position.x,
		xRelative: position.xRelative,
		y: position.y,
		yRelative: position.yRelative,
	};
};

export const GamingCanvasInputPositionDistance = (a: GamingCanvasInputPositionBasic, b: GamingCanvasInputPositionBasic) => {
	const x = a.x - b.x,
		y = a.y - b.y;
	return (x * x + y * y) ** 0.5;
};

export const GamingCanvasInputPositionDistanceRelative = (a: GamingCanvasInputPosition, b: GamingCanvasInputPosition) => {
	const x = a.xRelative - b.xRelative,
		y = a.yRelative - b.yRelative;
	return (x * x + y * y) ** 0.5;
};

export enum GamingCanvasInputType {
	GAMEPAD,
	KEYBOARD,
	MOUSE,
	TOUCH,
}
