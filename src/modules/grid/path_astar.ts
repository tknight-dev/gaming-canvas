import { GamingCanvasConstIntegerMaxSafe } from '../../main/const.js';
import { GamingCanvasUtilArrayExpand } from '../../main/util.js';
import { GamingCanvasGridType } from './grid.js';

/**
 * @author tknight-dev
 */

interface GamingCanvasGridPathAStarMeta {
	included: boolean;
	weightCombined: number;
	weightGrid: number;
	weightHeuristic: number;
	xPrevious: number;
	yPrevious: number;
}

export interface GamingCanvasGridPathAStarMemory {
	listClosed: GamingCanvasGridPathAStarMeta[];
	listOpen: Map<number, number>;
}

const GamingCanvasGridPathAStarOperations: number[][] = [
	[1, 0], // E
	[0, -1], // N
	[0, 1], // S
	[-1, 0], // W
];

// This aray order prefers non-diagonal paths
const GamingCanvasGridPathAStarOperationsDiagonals: number[][] = [
	[1, 0], // E
	[0, -1], // N
	[0, 1], // S
	[-1, 0], // W
	[1, -1], // NE
	[-1, -1], // NW
	[1, 1], // SE
	[-1, 1], // SW
];

export interface GamingCanvasGridPathAStarOptions {
	memory?: GamingCanvasGridPathAStarMemory;
	pathDiagonalsDisable?: boolean;
	pathHeuristic?: GamingCanvasGridPathAStarOptionsPathHeuristic;
}

export enum GamingCanvasGridPathAStarOptionsPathHeuristic {
	// CHEBYSHEV, // Best with diagonals
	EUCLIDIAN, // Good overall
	// MANHATTAN, // Best without diagonals
	// NONE,
}

export interface GamingCanvasGridPathAStarResult {
	error?: boolean;
	memory?: GamingCanvasGridPathAStarMemory;
	path: null | number[];
}

/**
 * @param gridIndexA is source cell
 * @param gridIndexB is destination cell
 */
export const GamingCanvasGridPathAStar = (
	gridIndexA: number,
	gridIndexB: number,
	grid: GamingCanvasGridType,
	blockingMask: number,
	options?: GamingCanvasGridPathAStarOptions,
): GamingCanvasGridPathAStarResult => {
	let gridData: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array = grid.data,
		gridIndex: number,
		gridIndexNext: number,
		gridIndexNextX: number,
		gridIndexNextY: number,
		gridSideLength: number = grid.sideLength,
		gridSize: number = gridSideLength * gridSideLength,
		gridIndexAY: number = gridIndexA % gridSideLength,
		gridIndexAX: number = (gridIndexA - gridIndexAY) / gridSideLength,
		gridIndexBY: number = gridIndexB % gridSideLength,
		gridIndexBX: number = (gridIndexB - gridIndexBY) / gridSideLength,
		weightHeuristicNext: number,
		listClosed: GamingCanvasGridPathAStarMeta[],
		listClosedInstance: GamingCanvasGridPathAStarMeta,
		listOpen: Map<number, number>,
		memory: GamingCanvasGridPathAStarMemory | undefined = options !== undefined ? options.memory : undefined,
		optionPathDiagonals: boolean = options === undefined ? true : options.pathDiagonalsDisable !== true,
		optionPathHeuristic: GamingCanvasGridPathAStarOptionsPathHeuristic,
		path: number[],
		pathOperations: number[][] = optionPathDiagonals === true ? GamingCanvasGridPathAStarOperationsDiagonals : GamingCanvasGridPathAStarOperations,
		pathOperationsInstance: number[],
		weightCombined: number,
		weightCombinedNext: number,
		weightGridNext: number,
		x: number,
		y: number;

	/*
	 * Validation
	 */
	if (gridIndexA < 0 || gridIndexB < 0 || gridIndexA > gridSize || gridIndexB > gridSize) {
		console.error('GamingCanvasGridPathAStar: invalid initial gridIndex(s)');
		return {
			error: true,
			memory: memory,
			path: null,
		};
	} else if ((gridData[gridIndexA] & blockingMask) !== 0 || (gridData[gridIndexB] & blockingMask) !== 0) {
		console.error('GamingCanvasGridPathAStar: invalid initial gridIndex(s) [A or B blocked]');
		return {
			error: true,
			memory: memory,
			path: null,
		};
	} else if (gridIndexA === gridIndexB) {
		// Nothing to sort out
		return {
			memory: memory,
			path: [],
		};
	}

	/*
	 * Configuration
	 */

	// Memory
	if (memory !== undefined) {
		listClosed = options.memory.listClosed;
		if (listClosed.length < gridSize) {
			GamingCanvasUtilArrayExpand(listClosed, gridSize - listClosed.length);
		}
		listOpen = options.memory.listOpen;

		// Defaults
		for (listClosedInstance of listClosed) {
			listClosedInstance.weightCombined = GamingCanvasConstIntegerMaxSafe;
			listClosedInstance.weightGrid = GamingCanvasConstIntegerMaxSafe;
			listClosedInstance.weightHeuristic = GamingCanvasConstIntegerMaxSafe;
			listClosedInstance.included = false;
			listClosedInstance.xPrevious = -1;
			listClosedInstance.yPrevious = -1;
		}

		listOpen.clear();
	} else {
		listClosed = new Array(gridSize);
		listOpen = new Map();

		// Defaults
		for (x = 0; x < gridSize; x++) {
			listClosed[x] = {
				weightCombined: GamingCanvasConstIntegerMaxSafe,
				weightGrid: GamingCanvasConstIntegerMaxSafe,
				weightHeuristic: GamingCanvasConstIntegerMaxSafe,
				included: false,
				xPrevious: -1,
				yPrevious: -1,
			};
		}

		// Memory
		memory = {
			listClosed: listClosed,
			listOpen: listOpen,
		};
	}

	// Path: heuristic
	if (options !== undefined && options.pathHeuristic !== undefined) {
		optionPathHeuristic = options.pathHeuristic;
	} else {
		// if (optionPathDiagonals === true) {
		// 	optionPathHeuristic = GamingCanvasGridPathAStarOptionsPathHeuristic.CHEBYSHEV;
		// } else {
		// 	optionPathHeuristic = GamingCanvasGridPathAStarOptionsPathHeuristic.MANHATTAN;
		// }
		optionPathHeuristic = GamingCanvasGridPathAStarOptionsPathHeuristic.EUCLIDIAN;
	}

	// Node: starting position
	y = gridIndexA % gridSideLength;
	x = (gridIndexA - y) / gridSideLength;

	listClosedInstance = listClosed[gridIndexA];
	listClosedInstance.weightCombined = 0;
	listClosedInstance.weightGrid = 0;
	listClosedInstance.weightHeuristic = 0;
	listClosedInstance.xPrevious = x;
	listClosedInstance.yPrevious = y;

	listOpen.set(listClosedInstance.weightCombined, gridIndexA);

	/*
	 * Path finder
	 */
	while (listOpen.size !== 0) {
		[weightCombined, gridIndex] = listOpen.entries().next().value;

		// List Closed: Add
		y = gridIndex % gridSideLength;
		x = (gridIndex - y) / gridSideLength;
		listClosed[gridIndex].included = true;

		// List Open: Remove
		listOpen.delete(weightCombined);

		// Iterate through directional operations
		for (pathOperationsInstance of pathOperations) {
			gridIndexNextX = x + pathOperationsInstance[0];
			gridIndexNextY = y + pathOperationsInstance[1];

			// Is valid?
			if (gridIndexNextX === -1 || gridIndexNextY === -1 || gridIndexNextX === gridSideLength || gridIndexNextY === gridSideLength) {
				continue;
			}
			gridIndexNext = gridIndexNextX * gridSideLength + gridIndexNextY;
			listClosedInstance = listClosed[gridIndexNext];

			// Found
			if (gridIndexNext === gridIndexB) {
				listClosedInstance.xPrevious = x;
				listClosedInstance.yPrevious = y;

				// Path: Trace
				path = [];
				while (!(listClosed[gridIndexNext].xPrevious === gridIndexAX && listClosed[gridIndexNext].yPrevious === gridIndexAY)) {
					path.push(gridIndexNext);
					x = listClosed[gridIndexNext].xPrevious;
					y = listClosed[gridIndexNext].yPrevious;
					gridIndexNext = x * gridSideLength + y;
				}
				path.push(gridIndexNext);
				path.push(gridIndexA);

				return {
					memory: memory,
					path: path,
				};
			}

			// Not Found
			if (listClosedInstance.included === false && (gridData[gridIndexNext] & blockingMask) === 0) {
				// Calc: Next Cell
				if (pathOperationsInstance[0] !== 0 && pathOperationsInstance[1] !== 0) {
					weightGridNext = listClosed[gridIndex].weightGrid + 1.41421;
				} else {
					weightGridNext = listClosed[gridIndex].weightGrid + 1;
				}

				switch (optionPathHeuristic) {
					// case GamingCanvasGridPathAStarOptionsPathHeuristic.CHEBYSHEV:
					// 	weightHeuristicNext = Math.max(Math.abs(gridIndexNextX - gridIndexBX), Math.abs(gridIndexNextY - gridIndexBY));
					// 	break;
					case GamingCanvasGridPathAStarOptionsPathHeuristic.EUCLIDIAN:
						weightHeuristicNext = ((gridIndexNextX - gridIndexBX) ** 2 + (gridIndexNextY - gridIndexBY) ** 2) ** 0.5;
						break;
					// case GamingCanvasGridPathAStarOptionsPathHeuristic.MANHATTAN:
					// 	weightHeuristicNext = Math.abs(gridIndexNextX - gridIndexBX) + Math.abs(gridIndexNextY - gridIndexBY);
					// 	break;
					// case GamingCanvasGridPathAStarOptionsPathHeuristic.NONE:
					// 	weightHeuristicNext = 0;
					// 	break;
				}
				weightCombinedNext = weightGridNext + weightHeuristicNext;

				// Store information
				if (listClosedInstance.weightCombined === GamingCanvasConstIntegerMaxSafe || listClosedInstance.weightCombined > weightCombinedNext) {
					// List Closed: Update
					listClosedInstance.weightCombined = weightCombinedNext;
					listClosedInstance.weightGrid = weightGridNext;
					listClosedInstance.weightHeuristic = weightHeuristicNext;
					listClosedInstance.xPrevious = x;
					listClosedInstance.yPrevious = y;

					// List Open: Add
					listOpen.set(weightCombinedNext, gridIndexNext);
				}
			}
		}
	}

	return {
		memory: memory,
		path: null,
	};
};
