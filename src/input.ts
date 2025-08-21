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

export const GamingCanvasInputPositionUnrotate = (height: number, position: GamingCanvasInputPosition, rotatedLeft: boolean, width: number) => {
	if (rotatedLeft) {
		const a: number = position.x,
			aRelative: number = position.xRelative;
		position.x = width - position.y;
		position.xRelative = 1 - position.yRelative;
		position.y = a;
		position.yRelative = aRelative;
	} else {
		const a: number = position.x,
			aRelative: number = position.xRelative;
		position.x = position.y;
		position.xRelative = position.yRelative;
		position.y = height - a;
		position.yRelative = 1 - aRelative;
	}
};

export enum GamingCanvasInputType {
	GAMEPAD,
	KEYBOARD,
	MOUSE, // has position
	TOUCH, // has positions
}
