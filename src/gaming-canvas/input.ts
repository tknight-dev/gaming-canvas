/**
 * @author tknight-dev
 */

export interface GamingCanvasInput {
	propriatary: any;
	type: GamingCanvasInputType;
}

export interface GamingCanvasInputPosition {
	out?: boolean; // true if position on the very edge or outside of the canvas
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

export const GamingCanvasInputPositionCorrector = (
	height: number,
	inverted: boolean,
	position: GamingCanvasInputPosition,
	rotated: boolean,
	width: number,
) => {
	if (inverted) {
		if (rotated) {
			const a: number = position.x,
				aRelative: number = position.xRelative;

			position.x = height - position.y;
			position.xRelative = 1 - position.yRelative;
			position.y = a;
			position.yRelative = aRelative;
		} else {
			position.x = width - position.x;
			position.xRelative = 1 - position.xRelative;
			position.y = height - position.y;
			position.yRelative = 1 - position.yRelative;
		}
	} else if (rotated) {
		const a: number = position.x,
			aRelative: number = position.xRelative;

		position.x = position.y;
		position.xRelative = position.yRelative;
		position.y = width - a;
		position.yRelative = 1 - aRelative;
	}
};

export enum GamingCanvasInputType {
	GAMEPAD,
	KEYBOARD,
	MOUSE, // has position1
	TOUCH, // has position1 and potentially position2
}
