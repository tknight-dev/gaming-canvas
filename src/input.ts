/**
 * @author tknight-dev
 */

export interface GamingCanvasInput {
	propriatary: any;
	type: GamingCanvasInputType;
}

export interface GamingCanvasInputPosition {
	out: boolean;
	x: number;
	xRelative: number;
	y: number;
	yRelative: number;
}

export const GamingCanvasInputPositionDistance = (a: GamingCanvasInputPosition, b: GamingCanvasInputPosition) => {
	const x = a.x - b.x,
		y = a.y - b.y;
	return Math.sqrt(x * x + y * y);
};

export const GamingCanvasInputPositionDistanceRelative = (a: GamingCanvasInputPosition, b: GamingCanvasInputPosition) => {
	const x = a.xRelative - b.xRelative,
		y = a.yRelative - b.yRelative;
	return Math.sqrt(x * x + y * y);
};

export enum GamingCanvasInputType {
	GAMEPAD,
	KEYBOARD,
	MOUSE,
	TOUCH,
}
