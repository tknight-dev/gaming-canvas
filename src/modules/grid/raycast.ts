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
	distanceMapEnable?: boolean; // Default to false
	rayCount?: number;
	rayEnable?: boolean;
	rayFOV?: number; // radians
	rayReuse?: Float64Array; // Previous result array
}

/**
 * @property cells each value is a Grid data index (encoded (x,y) coordinates)
 * @property rays follow the pattern [ray1-x, ray1-y, ray1-distance, ray1-cellRelative, ray1-cellSide, ..., rayN-x, rayN-y, rayN-distance, rayN-cellRelative, rayN-cellSide]
 */
export interface GamingCanvasGridRaycastResult {
	cells?: Set<number>;
	distanceMap?: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance>; // <distance, GamingCanvasGridRaycastResultDistanceMapInstance>
	distanceMapKeysSorted?: Float64Array; // distance[]
	rays?: Float64Array;
}

export interface GamingCanvasGridRaycastResultDistanceMapInstance {
	cell?: number; // GridIndex
	ray?: number; // RayIndex
}

/**
 * @param blockingMask `grid.data[index] & blockingMask === 0` is not blocked
 * @return .cells are indexes for each cell touched by a ray | .rays are the (x,y) coordinates, from the camera postion, that form a ray (line)
 */
export const GamingCanvasGridRaycast = (
	camera: GamingCanvasGridICamera,
	grid: GamingCanvasGridType,
	blockingMask: number,
	options?: GamingCanvasGridRaycastOptions,
): GamingCanvasGridRaycastResult => {
	let cells: Set<number> | undefined,
		distance: number,
		distanceMap: Map<number, GamingCanvasGridRaycastResultDistanceMapInstance> | undefined,
		distanceMapCells: Map<number, number> | undefined,
		fov: number = camera.r,
		fovStep: number = 1,
		gridData: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array = grid.data,
		gridIndex: number,
		gridSideLength: number = grid.sideLength,
		gridSize: number = gridSideLength * gridSideLength,
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

	if (options !== undefined) {
		if (options.cellEnable === true) {
			cells = new Set();
			cells.add((x | 0) * gridSideLength + (y | 0)); // Add the origin cell

			if (options.distanceMapEnable === true) {
				distanceMap = new Map();
				distanceMapCells = new Map();

				distanceMapCells.set(0, (x | 0) * gridSideLength + (y | 0)); // Add the origin cell
			}
		}

		if (options.rayEnable !== true) {
			if (options.distanceMapEnable === true && distanceMap === undefined) {
				distanceMap = new Map();
			}

			if (options.rayFOV !== undefined && options.rayCount !== undefined) {
				length = Math.max(1, options.rayCount) | 0;

				if (length !== 1) {
					fov = camera.r + options.rayFOV / 2;
					fovStep = options.rayFOV / (length - 1);
				}
			}

			if (options.rayReuse !== undefined) {
				if (options.rayReuse.length === length * 6) {
					rays = options.rayReuse;
				} else {
					console.error(
						`GamingCanvas > GamingCanvasGridRaycast: re-use array length (${options.rayReuse.length}) does not match required length ${length * 6}`,
					);
					rays = new Float64Array(length * 6);
				}
			} else {
				rays = new Float64Array(length * 6);
			}
		}

		if (cells === undefined && rays === undefined) {
			return {};
		}
	} else {
		rays = new Float64Array(length * 6);
	}

	for (; i < length; i++, fov -= fovStep, rayIndex += 6) {
		// Initial angle
		xAngle = Math.sin(fov);
		yAngle = Math.cos(fov);

		// Initial index
		xIndex = x | 0;
		yIndex = y | 0;

		// Step size to next cell
		xStep = Math.sign(xAngle);
		xStepRay = (1 + (yAngle / xAngle) * (yAngle / xAngle)) ** 0.5;
		yStep = Math.sign(yAngle);
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
			if ((gridData[gridIndex] & blockingMask) !== 0) {
				if (rays !== undefined) {
					rays[rayIndex] = x + xAngle * distance; // x
					rays[rayIndex + 1] = y + yAngle * distance; // y
					rays[rayIndex + 2] = distance; // Distance
					rays[rayIndex + 3] = gridIndex; // cellIndex
					rays[rayIndex + 4] = (rays[rayIndex] + rays[rayIndex + 1]) % 1; // cellRelative

					// cellSide
					if (rays[rayIndex] % 1 === 0) {
						if (rays[rayIndex] < x) {
							rays[rayIndex + 5] = GamingCanvasGridRaycastCellSide.EAST;
						} else {
							rays[rayIndex + 5] = GamingCanvasGridRaycastCellSide.WEST;
						}
					} else {
						if (rays[rayIndex + 1] < y) {
							rays[rayIndex + 5] = GamingCanvasGridRaycastCellSide.SOUTH;
						} else {
							rays[rayIndex + 5] = GamingCanvasGridRaycastCellSide.NORTH;
						}
					}

					// Distance Map
					if (distanceMap !== undefined) {
						distanceMap.set(distance, {
							ray: rayIndex,
						});
					}
				}
				break;
			} else if (cells !== undefined) {
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

	// distanceMapCells to <distance, { cells: gridIndex[], ... }>
	if (distanceMap !== undefined && distanceMapCells !== undefined) {
		for ([gridIndex, distance] of distanceMapCells) {
			distanceMap.set(distance, {
				cell: gridIndex,
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

/**
 * @param imageSize creates a square image with the length equal to the imageSize
 */
export const GamingCanvasGridRaycastTestImageCreate = (height: number, width?: number): OffscreenCanvas => {
	height = height | 0;
	width = width === undefined ? height : width | 0;

	const canvas: OffscreenCanvas = new OffscreenCanvas(width, height),
		context: OffscreenCanvasRenderingContext2D = <OffscreenCanvasRenderingContext2D>canvas.getContext('2d'),
		heightHalf: number = (height / 2) | 0,
		minHalf: number = (Math.min(height, width) / 2) | 0,
		widthHalf: number = (width / 2) | 0;

	canvas.height = height;
	canvas.width = width;

	context.clearRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = 'rgb(224,224,224)';
	context.fillRect(0, 0, width, height);

	context.fillStyle = 'red';
	context.fillRect(0, 0, minHalf, minHalf);

	context.fillStyle = 'blue';
	context.fillRect(width - minHalf, height - minHalf, minHalf, minHalf);

	context.fillStyle = 'green';
	context.beginPath();
	context.arc(widthHalf, heightHalf, minHalf / 2, 0, GamingCanvasConstPIDouble);
	context.closePath();
	context.fill();

	return canvas;
};
