import { GamingCanvasConstPIDouble } from '../../main/const.js';
import { GamingCanvasGridICamera } from './camera.js';
import { GamingCanvasGridType } from './grid.js';

/**
 * All (x,y) cooridnates are in terms of cells/tiles unless noted otherwise via the postfix 'px' (pixels)
 *
 * All grids are square
 *
 * @author tknight-dev
 */

export interface GamingCanvasGridCharacter {
	camera: GamingCanvasGridICamera;
	cameraPrevious: GamingCanvasGridICamera;
	gridIndex: number;
	size: number; // How large is the camera compared to the Grid? 1 cell, 0.5 cell, 2 cells, etc?
	timestamp: number; // Set by you at the start of a loop
	timestampPrevious: number; // Set by you at the end of a loop
}

export interface GamingCanvasGridCharacterInput {
	r: number; // -1 to 1 (-1 is increase r)
	x: number; // -1 to 1 (-1 is left)
	y: number; // -1 to 1 (-1 is up)
}

export enum GamingCanvasGridCharacterControlStyle {
	FIXED = 1, // x/y is never changed by the current r (radians) rotation
	STRAFE = 2, // x/y always is perpendicular to the current r (radians) rotation
}

export interface GamingCanvasGridCharacterControlOptions {
	clip?: boolean;
	factorPosition?: number;
	factorRotation?: number;
	style?: GamingCanvasGridCharacterControlStyle;
}

/**
 * Calculations include a time differential so no matter how accurate your loop's timing the motion is always the same
 *
 * The `z` isn't modified
 *
 * @param blockingMask `grid.data[index] & blockingMask === 0` is not blocked
 */
export const GamingCanvasGridCharacterControl = (
	character: GamingCanvasGridCharacter,
	input: GamingCanvasGridCharacterInput,
	grid: GamingCanvasGridType,
	blockingMask: number,
	options?: GamingCanvasGridCharacterControlOptions,
): boolean => {
	const camera: GamingCanvasGridICamera = character.camera;

	// Options
	if (options === undefined) {
		options = {
			clip: true,
			factorPosition: 0.00425,
			factorRotation: 0.00225,
			style: GamingCanvasGridCharacterControlStyle.STRAFE,
		};
	} else {
		options.clip = options.clip === undefined ? false : options.clip === true;
		options.factorPosition = options.factorPosition || 0.00425;
		options.factorRotation = options.factorRotation || 0.00255;
		options.style = options.style || GamingCanvasGridCharacterControlStyle.STRAFE;
	}

	// Save
	if (character.cameraPrevious === undefined) {
		character.cameraPrevious = {
			r: camera.r,
			x: camera.x,
			y: camera.y,
			z: camera.z,
		};
	} else {
		character.cameraPrevious.r = camera.r;
		character.cameraPrevious.x = camera.x;
		character.cameraPrevious.y = camera.y;
		character.cameraPrevious.z = camera.z;
	}

	// Set
	let changed: boolean = false,
		controlEff: number,
		index: number,
		timestampDelta: number = character.timestamp - character.timestampPrevious;

	// Set: Nothing as no time has passed
	if (timestampDelta === 0) {
		return false;
	}

	// Set: R
	if (input.r !== 0) {
		camera.r -= input.r * <number>options.factorRotation * timestampDelta;

		if (camera.r < 0) {
			camera.r += GamingCanvasConstPIDouble;
		} else if (camera.r > GamingCanvasConstPIDouble) {
			camera.r -= GamingCanvasConstPIDouble;
		}

		changed = true;
	}

	if (input.x !== 0 || input.y !== 0) {
		// Set: X
		if (options.style === GamingCanvasGridCharacterControlStyle.STRAFE) {
			controlEff = (Math.cos(camera.r) * -input.x + Math.sin(camera.r) * -input.y) * <number>options.factorPosition * timestampDelta;
		} else {
			controlEff = input.x * <number>options.factorPosition * timestampDelta;
		}

		if (Math.abs(controlEff) > 0.0001) {
			if (options.clip === true) {
				index = ((camera.x + controlEff + (controlEff > 0 ? character.size : -character.size)) | 0) * grid.sideLength;

				if ((grid.data[index + (camera.y | 0)] & blockingMask) === 0) {
					camera.x += controlEff;
					changed = true;
				}
			} else {
				camera.x += controlEff;
				changed = true;
			}
		}

		// Set: Y
		if (options.style === GamingCanvasGridCharacterControlStyle.STRAFE) {
			controlEff = (Math.sin(camera.r) * input.x + Math.cos(camera.r) * -input.y) * <number>options.factorPosition * timestampDelta;
		} else {
			controlEff = input.y * <number>options.factorPosition * timestampDelta;
		}

		if (Math.abs(controlEff) > 0.0001) {
			if (options.clip === true) {
				index = (camera.y + controlEff + (controlEff > 0 ? character.size : -character.size)) | 0;

				if ((grid.data[(camera.x | 0) * grid.sideLength + index] & blockingMask) === 0) {
					camera.y += controlEff;
					changed = true;
				}
			} else {
				camera.y += controlEff;
				changed = true;
			}
		}
	}

	if (changed === true) {
		character.gridIndex = (camera.x | 0) * grid.sideLength + (camera.y | 0);
	}

	// Done
	character.timestampPrevious = character.timestamp || 0;
	return changed;
};
