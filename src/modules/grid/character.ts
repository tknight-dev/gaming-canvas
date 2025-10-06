import { GamingCanvasConstPI_2_000, GamingCanvasConstPI_1_000 } from '../../main/const.js';
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
 * @param blocking is either a mask where non-zero results are true, or a function which returns true on blocked
 */
export const GamingCanvasGridCharacterControl = (
	character: GamingCanvasGridCharacter,
	input: GamingCanvasGridCharacterInput,
	grid: GamingCanvasGridType,
	blocking: number | ((cell: number, gridIndex: number) => boolean),
	options?: GamingCanvasGridCharacterControlOptions,
): boolean => {
	let blockingIndex: number,
		blockingMask: boolean = typeof blocking === 'number',
		camera: GamingCanvasGridICamera = character.camera;

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
			camera.r += GamingCanvasConstPI_2_000;
		} else if (camera.r > GamingCanvasConstPI_2_000) {
			camera.r -= GamingCanvasConstPI_2_000;
		}

		changed = true;
	}

	if (input.x !== 0 || input.y !== 0) {
		// Set: X
		if (options.style === GamingCanvasGridCharacterControlStyle.STRAFE) {
			controlEff = (Math.sin(camera.r) * input.x - Math.cos(camera.r) * input.y) * <number>options.factorPosition * timestampDelta;
		} else {
			controlEff = input.x * <number>options.factorPosition * timestampDelta;
		}

		if (Math.abs(controlEff) > 0.0001) {
			if (options.clip === true) {
				index = ((camera.x + controlEff + (controlEff > 0 ? character.size : -character.size)) | 0) * grid.sideLength;

				if (blockingMask === true) {
					if ((grid.data[index + (camera.y | 0)] & (<number>blocking)) === 0) {
						camera.x += controlEff;
						changed = true;
					}
				} else {
					blockingIndex = index + (camera.y | 0);
					if ((<any>blocking)(grid.data[blockingIndex], blockingIndex) === false) {
						camera.x += controlEff;
						changed = true;
					}
				}
			} else {
				camera.x += controlEff;
				changed = true;
			}
		}

		// Set: Y
		if (options.style === GamingCanvasGridCharacterControlStyle.STRAFE) {
			controlEff = (Math.cos(camera.r) * input.x + Math.sin(camera.r) * input.y) * <number>options.factorPosition * timestampDelta;
		} else {
			controlEff = input.y * <number>options.factorPosition * timestampDelta;
		}

		if (Math.abs(controlEff) > 0.0001) {
			if (options.clip === true) {
				index = (camera.y + controlEff + (controlEff > 0 ? character.size : -character.size)) | 0;

				if (blockingMask === true) {
					if ((grid.data[(camera.x | 0) * grid.sideLength + index] & (<number>blocking)) === 0) {
						camera.y += controlEff;
						changed = true;
					}
				} else {
					blockingIndex = (camera.x | 0) * grid.sideLength + index;
					if ((<any>blocking)(grid.data[blockingIndex], blockingIndex) === false) {
						camera.y += controlEff;
						changed = true;
					}
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

/**
 * Are players within a certain distance? [distance]
 *
 * Are players within the NPCs field-of-view (FOV)? [line-of-sight (LOS)]
 *
 * Are players visually obstructed? [line-of-sight (LOS)]
 *
 * @param characters are the target of the lookers
 * @param lookers are updated based on which characters they see
 * @param grid
 * @param blocking
 */
export const GamingCanvasGridCharacterLook = (
	characters: GamingCanvasGridCharacter[] | Iterable<GamingCanvasGridCharacter>,
	lookers: GamingCanvasGridCharacter[] | Iterable<GamingCanvasGridCharacter>,
	grid: GamingCanvasGridType,
	blocking: number | ((cell: number, gridIndex: number) => boolean),
): void => {
	let angle: number,
		blockingMask: boolean = typeof blocking === 'number',
		distance: number,
		fovHalf: number,
		gridData: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array = grid.data,
		gridIndex: number,
		gridSideLength: number = grid.sideLength,
		gridSize: number = gridSideLength * gridSideLength,
		i: number,
		character: GamingCanvasGridCharacter,
		characterWatcher: GamingCanvasGridCharacter,
		x: number,
		xAngle: number,
		xIndex: number,
		xRayLength: number,
		xStep: number,
		xStepRay: number,
		y: number,
		yAngle: number,
		yIndex: number,
		yRayLength: number,
		yStep: number,
		yStepRay: number;

	if (Array.isArray(lookers) === false) {
		lookers = Array.from(lookers);
	}

	for (character of characters) {
		for (characterWatcher of lookers) {
			// Position
			x = character.camera.x - characterWatcher.camera.x;
			y = character.camera.y - characterWatcher.camera.y;

			// Angle
			angle = Math.atan2(-y, x);
			if (angle < 0) {
				angle += GamingCanvasConstPI_2_000;
			}
			characterWatcher.seenAngleById.set(character.id, angle);

			// Distance
			distance = (x ** 2 + y ** 2) ** 0.5;
			characterWatcher.seenDistanceById.set(character.id, distance);

			// Line of Sight
			characterWatcher.seenLOSById.set(character.id, false);

			// Check Distance
			if (distance < characterWatcher.fovDistanceMax) {
				angle = characterWatcher.camera.r + Math.atan2(y, x);
				fovHalf = characterWatcher.fov / 2;

				if (angle > GamingCanvasConstPI_1_000) {
					angle = GamingCanvasConstPI_2_000 - angle;
				}

				// Check FOV
				if (angle > -fovHalf && angle < fovHalf) {
					angle = GamingCanvasConstPI_2_000 - Math.atan2(-y, x);
					characterWatcher.seenLOSById.set(character.id, true);

					// Is right in front of npc?
					if (distance > 1) {
						// Position
						x = characterWatcher.camera.x;
						y = characterWatcher.camera.y;

						// Initial angle
						xAngle = Math.cos(angle);
						yAngle = Math.sin(angle);

						// Initial index
						xIndex = characterWatcher.camera.x | 0;
						yIndex = characterWatcher.camera.y | 0;

						// Step size to next cell
						xStep = Math.sign(xAngle);
						xStepRay = (1 + (yAngle / xAngle) * (yAngle / xAngle)) ** 0.5;
						yStep = Math.sign(yAngle);
						yStepRay = (1 + (xAngle / yAngle) * (xAngle / yAngle)) ** 0.5;

						// Offset ray length by current position within cell
						xRayLength = (xAngle < 0 ? x - xIndex : 1 - (x - xIndex)) * xStepRay;
						yRayLength = (yAngle < 0 ? y - yIndex : 1 - (y - yIndex)) * yStepRay;

						// Increment ray cell by cell
						characterWatcher.seenLOSById.set(character.id, true);
						for (i = 0; i < gridSideLength; i++) {
							// Next cell
							if (xRayLength < yRayLength) {
								distance = xRayLength;
								xIndex += xStep;
								xRayLength += xStepRay;
							} else {
								distance = yRayLength;
								yIndex += yStep;
								yRayLength += yStepRay;
							}

							// Convert to grid index
							gridIndex = xIndex * gridSideLength + yIndex;

							// Within grid?
							if (gridIndex < 0 || gridIndex >= gridSize) {
								characterWatcher.seenLOSById.set(character.id, false);
								break;
							}

							// Saw player
							if (gridIndex === character.gridIndex) {
								break;
							}

							// Is ray terminated at blocked cell?
							if (blockingMask === true) {
								if ((gridData[gridIndex] & (<number>blocking)) !== 0) {
									characterWatcher.seenLOSById.set(character.id, false);
									break;
								}
							} else {
								if ((<any>blocking)(gridData[gridIndex], gridIndex) === true) {
									characterWatcher.seenLOSById.set(character.id, false);
									break;
								}
							}
						}
					}
				}
			}
		}
	}
};
