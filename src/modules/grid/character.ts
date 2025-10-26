import { GamingCanvasInputType } from '../../main/inputs.js';
import { GamingCanvasGridICamera } from './camera.js';

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
	fov: number; // radians
	fovDistanceMax: number;
	gridIndex: number;
	id: number;
	seenAngleById: Map<number, number>;
	seenDistanceById: Map<number, number>;
	seenLOSById: Map<number, boolean>;
	size: number; // How large is the camera compared to the Grid? 1 cell, 0.5 cell, 2 cells, etc?
	timestamp: number; // Set by you at the start of a loop
	timestampPrevious: number; // Set by you at the end of a loop
}

export interface GamingCanvasGridCharacterInput {
	r: number; // -1 to 1 (-1 is increase r)
	type?: GamingCanvasInputType;
	x: number; // -1 to 1 (-1 is left)
	y: number; // -1 to 1 (-1 is up)
}
