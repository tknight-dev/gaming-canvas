import { GamingCanvasGridType } from './grid.js';

/**
 * @author tknight-dev
 */

/**
 * Replace single cell and all neighboring cells that match the original cell's value (no diagonals)
 */
export const GamingCanvasGridUtilDataApplyFill = (grid: GamingCanvasGridType, gridIndex: number, value: number): void => {
	const gridData: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array = grid.data,
		modified: Set<number> = new Set(),
		modifier = (gridIndex: number) => {
			let a: number = 0,
				b: number = 0,
				check: number[] = [],
				x: number = (gridIndex / sideLength) | 0,
				y: number = gridIndex % sideLength;

			gridData[gridIndex] = value;
			modified.add(gridIndex);

			// Left
			if (x !== 0) {
				for (a = x - 1; a !== 0; a--) {
					gridIndex = a * sideLength + y;

					if (gridData[gridIndex] !== valueOriginal || modified.has(gridIndex) === true) {
						break;
					}
					gridData[gridIndex] = value;
					modified.add(gridIndex);

					// Down
					for (b = y + 1; b !== sideLength; b++) {
						gridIndex = a * sideLength + b;

						if (gridData[gridIndex] !== valueOriginal || modified.has(gridIndex) === true) {
							break;
						}
						gridData[gridIndex] = value;
						modified.add(gridIndex);

						// Left
						if (a !== 0) {
							gridIndex = (a - 1) * sideLength + b;
							gridData[gridIndex] === valueOriginal && check.push(gridIndex);
						}

						// Right
						if (a !== sideLength) {
							gridIndex = (a + 1) * sideLength + b;
							gridData[gridIndex] === valueOriginal && check.push(gridIndex);
						}
					}

					// Up
					for (b = y - 1; b !== 0; b--) {
						gridIndex = a * sideLength + b;

						if (gridData[gridIndex] !== valueOriginal || modified.has(gridIndex) === true) {
							break;
						}
						gridData[gridIndex] = value;
						modified.add(gridIndex);

						// Left
						if (a !== 0) {
							gridIndex = (a - 1) * sideLength + b;
							gridData[gridIndex] === valueOriginal && check.push(gridIndex);
						}

						// Right
						if (a !== sideLength) {
							gridIndex = (a + 1) * sideLength + b;
							gridData[gridIndex] === valueOriginal && check.push(gridIndex);
						}
					}
				}
			}

			// Right
			if (x !== sideLength) {
				for (a = x + 1; a !== sideLength; a++) {
					gridIndex = a * sideLength + y;

					if (gridData[gridIndex] !== valueOriginal || modified.has(gridIndex) === true) {
						break;
					}
					gridData[gridIndex] = value;
					modified.add(gridIndex);

					// Down
					for (b = y + 1; b !== sideLength; b++) {
						gridIndex = a * sideLength + b;

						if (gridData[gridIndex] !== valueOriginal || modified.has(gridIndex) === true) {
							break;
						}
						gridData[gridIndex] = value;
						modified.add(gridIndex);

						// Left
						if (a !== 0) {
							gridIndex = (a - 1) * sideLength + b;
							gridData[gridIndex] === valueOriginal && check.push(gridIndex);
						}

						// Right
						if (a !== sideLength) {
							gridIndex = (a + 1) * sideLength + b;
							gridData[gridIndex] === valueOriginal && check.push(gridIndex);
						}
					}

					// Up
					for (b = y - 1; b !== 0; b--) {
						gridIndex = a * sideLength + b;

						if (gridData[gridIndex] !== valueOriginal || modified.has(gridIndex) === true) {
							break;
						}
						gridData[gridIndex] = value;
						modified.add(gridIndex);

						// Left
						if (a !== 0) {
							gridIndex = (a - 1) * sideLength + b;
							gridData[gridIndex] === valueOriginal && check.push(gridIndex);
						}

						// Right
						if (a !== sideLength) {
							gridIndex = (a + 1) * sideLength + b;
							gridData[gridIndex] === valueOriginal && check.push(gridIndex);
						}
					}
				}
			}

			// Check
			for (gridIndex of check) {
				modified.has(gridIndex) !== true && modifier(gridIndex);
			}
		},
		sideLength: number = grid.sideLength,
		valueOriginal: number = gridData[gridIndex];

	modifier(gridIndex);
};

/**
 * Apply a single value to the grid
 */
export const GamingCanvasGridUtilDataApplySingle = (grid: GamingCanvasGridType, gridIndex: number, value: number): void => {
	grid.data[gridIndex] = value;
};

export const GamingCanvasGridUtilDistance = (gridIndexA: number, gridIndexB: number, grid: GamingCanvasGridType): number => {
	const y1: number = gridIndexA % grid.sideLength,
		y2: number = gridIndexB % grid.sideLength,
		x1: number = (gridIndexA - y1) / grid.sideLength,
		x2: number = (gridIndexB - y2) / grid.sideLength;

	return ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5;
};

/**
 * Sort array of grid indexes based on their distances to a source grid index
 *
 * @source number is a grid index
 * @gridIndexes number[] of grid indexes
 * @grid GamingCanvasGridType the grid that hosts these grid indexes
 * @invert boolean? option toggle to invert final sort order
 * @return number[] is farthest away from source first and closest to source last
 */
export const GamingCanvasGridUtilDistanceSort = (source: number, gridIndexes: number[], grid: GamingCanvasGridType, invert?: boolean): number[] => {
	let destinationX: number,
		destinationY: number,
		distanceByGridIndex: Map<number, number> = new Map(),
		gridIndex: number,
		sourceY: number = source % grid.sideLength,
		sourceX: number = (source - sourceY) / grid.sideLength;

	for (gridIndex of gridIndexes) {
		destinationY = gridIndex % grid.sideLength;
		destinationX = (gridIndex - destinationY) / grid.sideLength;

		distanceByGridIndex.set(gridIndex, ((destinationX - sourceX) ** 2 + (destinationY - sourceY) ** 2) ** 0.5);
	}

	return gridIndexes.sort((gridIndexA: number, gridIndexB: number) => {
		if (invert === true) {
			return distanceByGridIndex.get(gridIndexB) - distanceByGridIndex.get(gridIndexA);
		} else {
			return distanceByGridIndex.get(gridIndexA) - distanceByGridIndex.get(gridIndexB);
		}
	});
};
