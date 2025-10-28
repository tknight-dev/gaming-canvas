import { GamingCanvasConstPI_0_500, GamingCanvasConstPI_2_000 } from '../../main/const.js';
import { GamingCanvasGridICamera } from './camera.js';
import { GamingCanvasGridType } from './grid.js';

/**
 * All (x,y) cooridnates are in terms of cells/tiles unless noted otherwise via the postfix 'px' (pixels)
 *
 * All grids are square
 *
 * @author tknight-dev
 */

export enum GamingCanvasGridRaycastCellSide {
	EAST,
	NORTH,
	SOUTH,
	WEST,
}

/**
 * If either `rayFOV` or `rayCount` is undefiend then only one ray is cast from the original camera.r value
 */
export interface GamingCanvasGridRaycastOptions {
	cellEnable?: boolean; // Defaults to true
	cellIncludeBlocked?: boolean; // Defaults to false
	cellIgnoreValue?: number;
	distanceMapEnable?: boolean; // Default to false
	rayCount?: number;
	rayEnable?: boolean;
	rayFOV?: number; // radians
	rayReuse?: Float64Array; // Previous result array
}

/**
 * @property cells each value is a Grid data index (encoded (x,y) coordinates)
 * @property rays are packed together, 7 to a ray
 */
export interface GamingCanvasGridRaycastResult {
	cells?: Set<number>;
	distanceMap?: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>; // <distance, GamingCanvasGridRaycastResultDistanceMapInstance>
	distanceMapKeysSorted?: Float64Array; // distance[]
	rays?: Float64Array;
}

export interface GamingCanvasGridRaycastResultDistanceMapInstance {
	gridIndex?: number; // GridIndex
	rayIndex?: number; // RayIndex
}

/**
 * @param blocking is either a mask where non-zero results are true, or a function which returns true on blocked
 * @return .cells are indexes for each cell touched by a ray | .rays are the (x,y) coordinates, from the camera postion, that form a ray (line)
 */
export const GamingCanvasGridRaycast = (
	camera: GamingCanvasGridICamera,
	grid: GamingCanvasGridType,
	blocking: number | ((cell: number, gridIndex: number) => boolean),
	options?: GamingCanvasGridRaycastOptions,
): GamingCanvasGridRaycastResult => {
	let angle: number,
		blockingMask: boolean = typeof blocking === 'number',
		cellIncludeBlocked: boolean | undefined,
		cellIgnoreValue: number | undefined,
		cells: Set<number> | undefined,
		distance: number,
		distanceMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance> | undefined,
		distanceMapCells: Map<number, number> | undefined,
		fisheyeCorrection: number,
		fov: number = camera.r,
		fovStep: number = 1,
		gridData: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array = grid.data,
		gridIndex: number,
		gridSideLength: number = grid.sideLength,
		gridSize: number = grid.size,
		i: number = 0,
		j: number,
		length: number = 1, // Iterate once by default
		rayIndex: number = 0,
		rays: Float64Array | undefined,
		x: number = camera.x,
		xAngle: number,
		xIndex: number,
		xRayLength: number,
		xStep: number,
		xStepRay: number,
		y: number = camera.y,
		yAngle: number,
		yIndex: number,
		yRayLength: number,
		yStep: number,
		yStepRay: number;

	// Correct original camera angle
	angle = camera.r + GamingCanvasConstPI_0_500;
	if (angle > GamingCanvasConstPI_2_000) {
		angle -= GamingCanvasConstPI_2_000;
	}

	if (options !== undefined) {
		// Cells
		if (options.cellEnable === true) {
			cells = new Set();
			cells.add((x | 0) * gridSideLength + (y | 0)); // Add the origin cell

			if (options.distanceMapEnable === true) {
				distanceMap = new Map();
				distanceMapCells = new Map();

				distanceMapCells.set(0, (x | 0) * gridSideLength + (y | 0)); // Add the origin cell
			}
		}
		cellIncludeBlocked = options.cellIncludeBlocked;
		cellIgnoreValue = options.cellIgnoreValue;

		// Rays
		if (options.rayFOV !== undefined && options.rayCount !== undefined) {
			length = Math.max(1, options.rayCount) | 0;

			if (length !== 1) {
				fov = angle + options.rayFOV / 2;
				fovStep = options.rayFOV / (length - 1);
			}
		}

		if (options.rayEnable !== false) {
			if (options.distanceMapEnable === true && distanceMap === undefined) {
				distanceMap = new Map();
			}

			if (options.rayReuse !== undefined) {
				if (options.rayReuse.length === length * 7) {
					rays = options.rayReuse;
				} else {
					console.error(
						`GamingCanvas > GamingCanvasGridRaycast: re-use array length (${options.rayReuse.length}) does not match required length ${length * 7}`,
					);
					rays = new Float64Array(length * 7);
				}
			} else {
				rays = new Float64Array(length * 7);
			}
		}

		if (cells === undefined && rays === undefined) {
			return {};
		}
	} else {
		rays = new Float64Array(length * 7);
	}

	for (; i < length; i++, fov -= fovStep, rayIndex += 7) {
		// Initial angle
		fisheyeCorrection = Math.cos(angle - fov);
		xAngle = Math.sin(fov);
		yAngle = Math.cos(fov);

		// Initial index
		xIndex = x | 0;
		yIndex = y | 0;

		// Step size to next cell
		xStep = xAngle === 0 ? 0 : xAngle > 0 ? 1 : -1;
		xStepRay = (1 + (yAngle / xAngle) * (yAngle / xAngle)) ** 0.5;
		yStep = yAngle === 0 ? 0 : yAngle > 0 ? 1 : -1;
		yStepRay = (1 + (xAngle / yAngle) * (xAngle / yAngle)) ** 0.5;

		// Offset ray length by current position within cell
		xRayLength = (xAngle < 0 ? x - xIndex : 1 - (x - xIndex)) * xStepRay;
		yRayLength = (yAngle < 0 ? y - yIndex : 1 - (y - yIndex)) * yStepRay;

		// Increment ray cell by cell
		for (j = 0; j < gridSideLength; j++) {
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
				break;
			}

			// Is ray terminated at blocked cell?
			if (
				(blockingMask === true && (gridData[gridIndex] & (<number>blocking)) !== 0) ||
				(blockingMask === false && (<any>blocking)(gridData[gridIndex], gridIndex) === true)
			) {
				if (rays !== undefined) {
					rays[rayIndex] = x + xAngle * distance; // x
					rays[rayIndex + 1] = y + yAngle * distance; // y
					rays[rayIndex + 2] = distance; // Distance
					rays[rayIndex + 3] = distance * fisheyeCorrection; // Range
					rays[rayIndex + 4] = gridIndex; // cellIndex
					rays[rayIndex + 5] = (rays[rayIndex] + rays[rayIndex + 1]) % 1; // cellRelative

					// cellSide
					if (rays[rayIndex] % 1 < 0.0001 || rays[rayIndex] % 1 > 0.9999) {
						if (rays[rayIndex] < x) {
							rays[rayIndex + 6] = GamingCanvasGridRaycastCellSide.EAST;
						} else {
							rays[rayIndex + 6] = GamingCanvasGridRaycastCellSide.WEST;
						}
					} else {
						if (rays[rayIndex + 1] < y) {
							rays[rayIndex + 6] = GamingCanvasGridRaycastCellSide.SOUTH;
						} else {
							rays[rayIndex + 6] = GamingCanvasGridRaycastCellSide.NORTH;
						}
					}

					// Distance Map
					if (distanceMap !== undefined) {
						distanceMap.set(distance, {
							rayIndex: rayIndex,
						});
					}
				}

				if (cellIncludeBlocked === true && cells !== undefined) {
					if (cellIgnoreValue === undefined || gridData[gridIndex] !== cellIgnoreValue) {
						cells.add(gridIndex);

						// Distance Map
						if (distanceMapCells !== undefined) {
							if (distanceMapCells.has(gridIndex)) {
								if (distance > (distanceMapCells.get(gridIndex) || 0)) {
									distanceMapCells.set(gridIndex, distance);
								}
							} else {
								distanceMapCells.set(gridIndex, distance);
							}
						}
					}
				}
				break;
			} else if (cells !== undefined) {
				if (cellIgnoreValue === undefined || gridData[gridIndex] !== cellIgnoreValue) {
					cells.add(gridIndex);

					// Distance Map
					if (distanceMapCells !== undefined) {
						if (distanceMapCells.has(gridIndex)) {
							if (distance > (distanceMapCells.get(gridIndex) || 0)) {
								distanceMapCells.set(gridIndex, distance);
							}
						} else {
							distanceMapCells.set(gridIndex, distance);
						}
					}
				}
			}
		}
	}

	// distanceMapCells to <distance, { cells: gridIndex[], ... }>
	if (distanceMap !== undefined && distanceMapCells !== undefined) {
		for ([gridIndex, distance] of distanceMapCells) {
			distanceMap.set(distance, {
				gridIndex: gridIndex,
			});
		}
	}

	// Done
	return {
		cells: cells,
		distanceMap: distanceMap,
		distanceMapKeysSorted: distanceMap === undefined ? undefined : Float64Array.from(distanceMap.keys()).sort().reverse(),
		rays: rays,
	};
};
